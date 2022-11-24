const db = require('./db')
const helper = require('../helper')
const userValidator = require('../validators/user')

/**
 * The body inside an oohoo API reponse.
 * @typedef {Object} APIResponseBody
 * @property {String} message Response message, contains information about the operation
 * @property {String} data (optional) reponse data
 */

/**
 * A response of the oohoo API.
 * @typedef {Object} APIResponse
 * @property {Number} status Response status code
 * @property {APIResponseBody} body Response body (message and response data) 
 */

/** 
* Get all users.
* @return {Promise<APIResponse>} Returns all users in data.
*/
async function getAll() {
    const rows = await db.query(
        `SELECT username, email, admin, deleted, apprentice FROM user`
    )

    return helper.respond(200, 'Got all users.', rows)
}

/** 
* Get a user by user id.
* @param {Number} id User id.
* @return {Promise<APIResponse>} Returns the user in data.
*/
async function getById(id) {
    if (!id) return helper.respond(400, 'No user ID specified.')

    const rows = await db.query(
        `SELECT username, email, admin, deleted, apprentice FROM user WHERE id = ?`,
        [id]
    )

    if (rows.length == 0) return helper.respond(404, 'User not found')
    else return helper.respond(200, 'User found', rows[0])
}

/** 
* Creates a user in the database.
* @param {String} username Must be unique and between 1 and 100 characters in length.
* @param {String} email Must be unique and between 6 and 100 characters in length.
* @param {String} password Must be between 8 and 128 characters in length and contain at least one special character and number.
* @param {Boolean} admin Whether or not to give admin privileges.
* @param {Boolean} apprentice Is this user an apprentice?
* @param {Boolean} [deleted=false] Set the user to deleted on creation (for future backup functionality).
* @return {Promise<APIResponse>} Data contains the new user's id.
*/
async function create(username, email, password, admin, apprentice, deleted = false) {
    let errors = []

    // validate username
    const usernameValid = await userValidator.validateUsername(username)
    if (!usernameValid.valid) errors.push(usernameValid.reason)

    // validate email
    const emailValid = await userValidator.validateEmail(email)
    if (!emailValid.valid) errors.push(emailValid.reason)

    // validate password
    const passwordValid = await userValidator.validatePassword(password)
    if (!passwordValid.valid) errors.push(passwordValid.reason)

    // validate admin bool
    if (typeof (admin) != 'boolean') errors.push('Invalid admin setting.')

    // validate apprentice bool
    if (typeof (apprentice) != 'boolean') errors.push('Invalid apprentice setting.')

    // validate deleted bool
    if (typeof (deleted) != 'boolean') errors.push('Invalid deleted setting.')

    if (errors.length > 0) return helper.respond(400, 'There were some errors.', errors)
    else {
        // hash the password
        password = helper.hashPassword(password)

        // create user
        const result = await db.query(`
        INSERT INTO user
        (username, email, password, admin, deleted, apprentice)
        VALUES
        (?, ?, ?, ?, ?, ?)`,
            [username, email, password, admin, deleted, apprentice]
        )

        if (!result.affectedRows) return helper.respond(500, 'Error creating user.', result)
        else return helper.respond(200, 'User created successfully.', { id: result.insertId })
    }
}

/**
 * Updates the user with given id in the database. 
 * @param {Number} id The user id.
 * @param {String} username Must be unique and between 1 and 100 characters in length.
 * @param {String} email Must be unique and between 6 and 100 characters in length.
 * @param {String} password Must be between 8 and 128 characters in length and contain at least one special character and number.
 * @param {Boolean} admin Whether or not to give admin privileges.
 * @param {Boolean} apprentice Is this user an apprentice?
 * @param {Boolean} [deleted=false] Set the user to deleted on creation (for future backup functionality).
 * @return {Promise<APIResponse>} No API Response data.
 */
async function update(id, username, email, password, admin, apprentice, deleted = false) {
    // validate user id
    const userIdValid = await userValidator.validateUserId(id)
    if (!userIdValid.valid) return helper.respond(userIdValid.code || 400, userIdValid.reason)

    let newUser = {}, errors = []

    // validate username
    if (username) {
        const usernameValid = await userValidator.validateUsername(username)
        if (!usernameValid.valid) errors.push(usernameValid.reason)
        else newUser.username = username
    }

    // validate email
    if (email) {
        const emailValid = await userValidator.validateEmail(email)
        if (!emailValid.valid) errors.push(emailValid.reason)
        else newUser.email = email
    }

    // validate password
    if (password) {
        const passwordValid = await userValidator.validatePassword(password)
        if (!passwordValid.valid) errors.push(passwordValid.reason)
        else {
            // hash the password
            password = helper.hashPassword(password)
            newUser.password = password
        }
    }

    // validate admin bool
    if (admin !== undefined && admin !== null) {
        if (typeof (admin) != 'boolean') errors.push('Invalid admin setting.')
        else newUser.admin = admin
    }

    // validate apprentice bool
    if (apprentice !== undefined && apprentice !== null) {
        if (typeof (apprentice) != 'boolean') errors.push('Invalid apprentice setting.')
        else newUser.apprentice = apprentice
    }

    // validate deleted bool
    if (deleted !== undefined && deleted !== null) {
        if (typeof (deleted) != 'boolean') helper.push('Invalid deleted setting.')
        else newUser.deleted = deleted
    }

    if (errors.length > 0) return helper.respond(400, 'There were some errors updating the user.', errors)
    else {
        // get old user data
        let oldUser = await db.query(`SELECT * FROM user WHERE id=?`, [id])
        oldUser = oldUser[0]

        let user = helper.objectFallback(newUser, oldUser)

        // update the user
        const result = await db.query(
            `UPDATE user
        SET username=?, email=?, password=?, admin=?, deleted=?, apprentice=?
        WHERE id=?`,
            [user.username, user.email, user.password, user.admin, user.deleted, user.apprentice, id]
        )

        if (!result.affectedRows) return helper.respond(500, 'Error updating user.', result)
        else return helper.respond(200, 'User updated successfully.')
    }
}

/** 
* Remove a user.
* @param {number} id User id.
* @return {Promise<APIResponse>} No API Response data.
*/
async function remove(id) {
    // validate id
    const userIdValid = await userValidator.validateUserId(id)
    if (!userIdValid.valid) return helper.respond(userIdValid.code || 400, userIdValid.reason)

    // set deleted to true instead of removing
    const result = await db.query(
        `UPDATE user SET deleted = 1
        WHERE id=?`,
        [id]
    )

    if (!result.affectedRows) return helper.respond(500, 'Error removing user.', result)
    else return helper.respond(200, 'Successfully removed user.')
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
}