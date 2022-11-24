// route writings URI to function
const express = require('express')
const router = express.Router()
const user = require('../services/user')
const auth = require('../services/auth')

// Get all users
router.get('/', auth.getCurrentPermission, async (req, res, next) => {
    try {
        if (req.permission > 0) {
            const response = await user.getAll()
            res.status(response.status).json(response.body)
        } else
            res.status(401).json({ message: `You don't have sufficient permissions to view users.` })
    } catch (err) {
        res.status(err.status).send(err.body)
    }
})

// Get user by id
router.get('/:id', auth.getCurrentPermission, async (req, res, next) => {
    try {
        if (req.permission > 0) {
            const response = await user.getById(req.params.id)
            res.status(response.status).json(response.body)
        } else
            res.status(401).json({ message: `You don't have sufficient permissions to view users.` })
    } catch (err) {
        res.status(err.status).send(err.body)
    }
})

// Create new user
router.post('/', auth.getCurrentPermission, async (req, res, next) => {
    try {
        if (req.permission === 2) {
            const response = await user.create(req.body.username, req.body.email, req.body.password, req.body.admin, req.body.apprentice, req.body.deleted)
            res.status(response.status).json(response.body)
        } else {
            res.status(401).json({ message: `You don't have sufficient permissions to create a user.` })
        }
    } catch (err) {
        res.status(err.status).send(err.body)
    }
})

// Update a user
router.put('/:id', auth.getCurrentPermission, async (req, res, next) => {
    try {
        if (req.permission === 2) {
            const response = await user.update(
                req.params.id,
                req.body.username,
                req.body.email,
                req.body.password,
                req.body.admin,
                req.body.apprentice,
                req.body.deleted
            )
            res.status(response.status).json(response.body)
        } else if (req.permission === 1) {
            // if not admin, check if user is updating self
            // get current user
            const currentUserId = await auth.getCurrentUser(auth.getAccessToken(req))

            if (currentUserId != req.params.id) res.status(401).json({ message: `Only admins can update other users.` })
            else {
                const response = await user.update(
                    req.params.id,
                    req.body.username,
                    req.body.email,
                    req.body.password,
                    req.body.admin,
                    req.body.apprentice,
                    req.body.deleted
                )
                res.status(response.status).json(response.body)
            }
        } else {
            res.status(401).json({ message: `You don't have sufficient permissions to update a user.` })
        }
    } catch (err) {
        res.status(err.status).send(err.body)
    }
})

// Delete a user
router.delete('/:id', auth.getCurrentPermission, async (req, res, next) => {
    try {
        if (req.permission === 2) {
            const response = await user.remove(req.params.id)
            res.status(response.status).json(response.body)
        } else if (req.permission === 1) {
            // if not admin, check if user is deleting self
            // get current user
            const currentUserId = await auth.getCurrentUser(auth.getAccessToken(req))

            if (currentUserId != req.params.id) res.status(401).json({ message: `Only admins can delete other users.` })
            else {
                const response = await user.remove(req.params.id)
                res.status(response.status).json(response.body)
            }
        } else {
            res.status(401).json({ message: `You don't have sufficient permissions to delete a user.` })
        }
    } catch (err) {
        res.status(err.status).send(err.body)
    }
})

module.exports = router