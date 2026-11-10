const express = require('express')
const router = express.Router()
const {
  register, login, logout, verifyEmail, resendVerification, forgotPassword, resetPassword
} = require('../controllers/authController')
const { protect } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const schemas = require('../validators/schemas')

router.post('/register', validate(schemas.register), register)
router.post('/login', validate(schemas.login), login)
router.post('/logout', logout)
router.post('/verify-email', validate(schemas.tokenOnly), verifyEmail)
router.post('/resend-verification', protect, resendVerification)
router.post('/forgot-password', validate(schemas.forgotPassword), forgotPassword)
router.post('/reset-password', validate(schemas.resetPassword), resetPassword)

module.exports = router
