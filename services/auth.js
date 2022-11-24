const db = require('./db')
const helper = require('../helper')
const user = require('./user')
const userValidator = require('../validators/user')
const jwt = require('jsonwebtoken')

// Store refresh tokens (better solution: store in a database or Redis cache)
let refreshTokens = []

/**
 * The body inside an oohoo API reponse.
 * @typedef {Object} APIResponseBody
 * @property {String} message Response message, contains information about the operation.
 * @property {String} data (optional) reponse data.
 */

/**
 * A response of the oohoo API.
 * @typedef {Object} APIResponse
 * @property {Number} status Response status code.
 * @property {APIResponseBody} body Response body (message and response data) .
 */

/** 
* Check if a user's login credentials are valid.
* @param {String} email The user's email address.
* @param {String} password The user's password in cleartext.
* @return {Promise<APIResponse>} Returns an API response.
*/
async function validateLogin(email, password) {
    // for security reasons, the error message will always be the same
    const message = 'Incorrect email or password.'

    // validate email
    if (!email) return helper.respond(400, message)
    if (typeof (email) != 'string') return helper.respond(400, message)

    // validate password
    if (!password) return helper.respond(400, message)
    if (typeof (password) != 'string' || password.length == 0) return helper.respond(400, message)

    // hash the password
    password = helper.hashPassword(password)

    // look up the user. Deleted users can't log in
    const rows = await db.query(
        `SELECT id, username, email, admin, apprentice FROM user WHERE email = ? AND password = ? AND DELETED = 0`,
        [email, password]
    )

    // return
    if (rows.length == 0) return helper.respond(400, message)
    else return helper.respond(200, 'Valid credentials.', rows[0])
}

/** 
* Login the user.
* @param {Session} session Express session from request.session.
* @param {String} email The user's email address.
* @param {String} password The user's password in cleartext.
* @return {Promise<APIResponse>} Returns user in data on success.
*/
async function login(email, password) {
    const response = await validateLogin(email, password)

    // create access token if valid
    if (response.status == 200) {
        // save user id in accessToken
        const accessToken = generateAccessToken(response.body.data.id)
        const refreshToken = jwt.sign({ id: response.body.data.id }, process.env.REFRESH_TOKEN_SECRET)

        refreshTokens.push(refreshToken)

        response.body.data = { accessToken, refreshToken }
    }

    return response
}

/**
 * Refreshes an access token.
 * @param {refreshToken} refreshToken The refresh token.
 * @returns {Promise<APIResponse>} The response with the new accessToken in data.
 */
async function refreshAccessToken(refreshToken) {
    if (!refreshToken) return helper.respond(401, 'Invalid refresh token. Try logging in again.')
    if (!refreshTokens.includes(refreshToken)) return helper.respond(403, 'Invalid refresh token. Try logging in again.')

    return new Promise((resolve, reject) => {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, result) => {
            if (err) reject(helper.respond(403, 'Invalid refresh token. Try logging in again.'))
            else {
                // generate accessToken and new refreshToken
                const accessToken = generateAccessToken(result.id)
                const newRefreshToken = jwt.sign({ id: result.id }, process.env.REFRESH_TOKEN_SECRET)

                // remove old refreshToken
                let idx = refreshTokens.findIndex(token => token === refreshToken)
                refreshTokens.splice(idx, 1)

                // push new refreshToken
                refreshTokens.push(newRefreshToken)

                resolve(helper.respond(200, 'Token refreshed.', { accessToken, refreshToken: newRefreshToken }))
            }
        })
    })
}

/**
 * Generates an access token for a given user.
 * @param {Number} userId The users id.
 * @returns {String} The access token for the given user id.
 */
function generateAccessToken(userId) {
    return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION })
}

/** 
* Logout the user.
* @param {String} accessToken The access token.
* @param {String} refreshToken The refresh token.
* @return {Promise<APIResponse>} Returns an APIResponse with no data.
*/
async function logout(accessToken, refreshToken) {
    // invalidates a refresh token
    if (accessToken) {
        // remove old refreshToken
        let idx = refreshTokens.findIndex(token => token === refreshToken)
        refreshTokens.splice(idx, 1)
    }

    return helper.respond(200, 'User has been logged out.')
}

/** 
* Get a users permission level.
* @param {Number} id User id.
* @return {Promise<Number>} Returns permission level in data — 0: no permission, 1: normal user, 2: admin.
*/
async function getUserPermissions(id) {
    const userIdValid = await userValidator.validateUserId(id)
    if (userIdValid.valid == false) return helper.respond(200, userIdValid.reason)

    const result = await user.getById(id)
    if (result.status = 200 && !result.body.data.deleted) {
        let permission = result.body.data.admin ? 2 : 1
        return helper.respond(200, `Current user permission: ${permission == 2 ? 'Admin.' : 'User.'}`, { permission }) // valid existing user
    }
    else return helper.respond(200, 'Current user permissions: None.', { permission: 0 }) // invalid or non-existant user
}

/** 
* Middleware for setting the current users permission in req.permission.
* @param {Express.Request} req Express request.
* @param {Express.Response} res Express response.
* @param {import('express').NextFunction} next Express next function.
* @return {void}
*/
async function getCurrentPermission(req, res, next) {
    // if somehow req.permission is already set (with malicious intent), delete key
    delete req.permission

    const accessToken = getAccessToken(req)

    if (accessToken) {
        // verify the access token
        jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, async (err, result) => {
            // failed
            if (err) {
                if (err.expiredAt)
                    res.status(401).json({ message: 'Token Expired.' })
                else
                    res.status(401).json({ message: 'Invalid Access Token.' })
            } else {
                // get user permissions from id
                const permissionResult = await getUserPermissions(result.id)
                req.permission = permissionResult.body.data.permission
                next()
            }
        })
    } else {
        next()
    }
}

/** 
* Get the currently logged in user from a session.
* @param {Session} session Express session from request.session.
* @return {Promise<Number>} Returns user in data.
*/
async function getCurrentUser(accessToken) {
    if (!accessToken) return helper.respond(403, 'Access token unspecified. Try logging in again.')
    else {
        return await new Promise((resolve, reject) => {
            // verify the token
            jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, async (err, result) => {
                // invalid token
                if (err) {
                    if (err.expiredAt) reject(helper.respond(401, 'Access Token expired. Request a refresh token.'))
                    else reject(helper.respond(403, `Authentication failed: ${err.message}. Try logging in again.`))
                } else {

                    // get user from id
                    const response = await user.getById(result.id)

                    if (response.status == 200)
                        resolve(helper.respond(200, 'Authentication valid', response.body.data))
                    else
                        reject(helper.respond(response.status, response.body))
                }
            })
        })
    }
}

/**
 * Function that gets accessToken from a request.
 * @param {Express.Request} req The express request.
 * @returns {String} The accessToken.
 */
function getAccessToken(req) {
    const authHeader = req.headers['authorization']
    const accessToken = authHeader && authHeader.split(' ')[1] || undefined
    return accessToken
}

module.exports = {
    validateLogin,
    login,
    logout,
    getUserPermissions,
    getCurrentPermission,
    getCurrentUser,
    refreshAccessToken,
    getAccessToken
}