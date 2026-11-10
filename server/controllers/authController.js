const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { cookieOptions, sessionCookie } = require('../utils/cookieOptions')
const { createToken, hashToken } = require('../utils/tokens')
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer')

const HOUR = 60 * 60 * 1000

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

const userPayload = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  onboardingComplete: user.onboardingComplete,
  emailVerified: user.emailVerified,
  token
})

// issue a fresh verification link; mail problems must never break the request that triggered them
const sendVerification = async (user) => {
  try {
    const { raw, hash } = createToken()
    user.emailVerifyToken = hash
    user.emailVerifyExpires = new Date(Date.now() + 24 * HOUR)
    await user.save()
    await sendVerificationEmail(user, raw)
  } catch (error) {
    console.error('Could not send verification email:', error.message)
  }
}

// @POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const userExists = await User.findOne({ email })
    if (userExists) return res.status(400).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, password })
    await sendVerification(user)

    const token = generateToken(user._id)
    res.cookie('token', token, sessionCookie)
    res.status(201).json(userPayload(user, token))
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
}

// @POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })

    const isMatch = await user.matchPassword(password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' })

    const token = generateToken(user._id)
    res.cookie('token', token, sessionCookie)
    res.json(userPayload(user, token))
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
}

// @POST /api/auth/logout
const logout = async (req, res) => {
  res.clearCookie('token', cookieOptions)
  res.json({ message: 'Logged out successfully' })
}

// @POST /api/auth/verify-email  { token }
const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      emailVerifyToken: hashToken(req.body.token),
      emailVerifyExpires: { $gt: new Date() }
    }).select('+emailVerifyToken +emailVerifyExpires')
    if (!user) return res.status(400).json({ message: 'This verification link is invalid or has expired' })

    user.emailVerified = true
    user.emailVerifyToken = undefined
    user.emailVerifyExpires = undefined
    await user.save()
    res.json({ message: 'Email verified' })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
}

// @POST /api/auth/resend-verification  (logged in)
const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (user.emailVerified) return res.json({ message: 'Email already verified' })
    await sendVerification(user)
    res.json({ message: 'Verification email sent' })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
}

// @POST /api/auth/forgot-password  { email }
// Always answers the same way so it can't be used to discover which emails have accounts.
const forgotPassword = async (req, res) => {
  const reply = { message: 'If an account exists for that email, a reset link is on its way' }
  try {
    const user = await User.findOne({ email: req.body.email })
    if (user) {
      const { raw, hash } = createToken()
      user.passwordResetToken = hash
      user.passwordResetExpires = new Date(Date.now() + HOUR)
      await user.save()
      await sendPasswordResetEmail(user, raw)
    }
  } catch (error) {
    console.error('Could not send password reset email:', error.message)
  }
  res.json(reply)
}

// @POST /api/auth/reset-password  { token, password }
const resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      passwordResetToken: hashToken(req.body.token),
      passwordResetExpires: { $gt: new Date() }
    }).select('+passwordResetToken +passwordResetExpires')
    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired' })

    user.password = req.body.password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()
    res.json({ message: 'Password updated. You can log in now.' })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
}

module.exports = { register, login, logout, verifyEmail, resendVerification, forgotPassword, resetPassword }
