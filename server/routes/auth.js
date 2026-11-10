const express = require('express')
const router = express.Router()
const { register, login, logout } = require('../controllers/authController')
const { validate } = require('../middleware/validate')
const schemas = require('../validators/schemas')

router.post('/register', validate(schemas.register), register)
router.post('/login', validate(schemas.login), login)
router.post('/logout', logout)

module.exports = router