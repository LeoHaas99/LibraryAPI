// route writings URI to function
const express = require('express')
const router = express.Router()
const auth = require('../services/auth')

// Get current user from session
router.get('/', async (req, res, next) => {
    try {
        const response = await auth.getCurrentUser(auth.getAccessToken(req))
        res.status(response.status).send(response.body)
    } catch (err) {
        res.status(err.status).send(err.body)
    }
})

// refresh token
router.post('/token', async (req, res, next) => {
    try {
        const refreshToken = req.body.refreshToken

        const response = await auth.refreshAccessToken(refreshToken)
        res.status(response.status).send(response.body)
    } catch (err) {
        res.status(err.status).send(err.body)
    }
})

// Login
router.post('/login', async (req, res, next) => {
    try {
        // validate the credentials and respond
        const response = await auth.login(req.body.email, req.body.password)
        res.status(response.status).send(response.body)
    } catch (err) {
        res.status(err.status).send(err.body)
    }
})

// Logout
router.get('/logout', async (req, res, next) => {
    try {
        const response = await auth.logout(req.accessToken, req.body.refreshToken)
        res.status(response.status).send(response.body)
    } catch (err) {
        res.status(err.status).send(err.body)
    }
})

module.exports = router