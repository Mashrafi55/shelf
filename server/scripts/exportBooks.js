// Usage: node scripts/exportBooks.js — dumps users and books to backups/<timestamp>.json
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const Book = require('../models/Book')
const User = require('../models/User')

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  const [books, users] = await Promise.all([Book.find().lean(), User.find().lean()])

  const dir = path.join(__dirname, '..', 'backups')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(file, JSON.stringify({ books, users }, null, 2))

  console.log(`Saved ${books.length} books and ${users.length} users to ${file}`)
  await mongoose.disconnect()
}

run().catch(error => {
  console.error(error.message)
  process.exit(1)
})
