const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { cookieOptions, sessionCookie } = require('../utils/cookieOptions')

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

// @POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const userExists = await User.findOne({ email })
    if (userExists) return res.status(400).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, password })

    const token = generateToken(user._id)

    res.cookie('token', token, sessionCookie)

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      onboardingComplete: user.onboardingComplete,
      token
    })
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

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      onboardingComplete: user.onboardingComplete,
      token
    })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
}

// @POST /api/auth/logout
const logout = async (req, res) => {
  res.clearCookie('token', cookieOptions)
  res.json({ message: 'Logged out successfully' })
}

module.exports = { register, login, logout }