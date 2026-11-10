// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-password' [ADMIN_NAME='Your Name'] npm run create-admin
// Creates an admin account, or promotes the existing account with that email.
// Credentials come from the environment only — never hardcode them or commit them.
require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')

const run = async () => {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || ''
  if (!email) throw new Error('Set ADMIN_EMAIL')

  await mongoose.connect(process.env.MONGO_URI)
  const existing = await User.findOne({ email })

  if (existing) {
    existing.role = 'admin'
    await existing.save()
    console.log(`Promoted ${email} to admin`)
  } else {
    if (password.length < 8) throw new Error('Set ADMIN_PASSWORD (at least 8 characters) to create a new admin')
    await User.create({
      name: process.env.ADMIN_NAME || 'Admin',
      email,
      password,
      role: 'admin',
      onboardingComplete: true,
    })
    console.log(`Created admin ${email}`)
  }
  await mongoose.disconnect()
}

run().catch(error => {
  console.error(error.message)
  process.exit(1)
})
