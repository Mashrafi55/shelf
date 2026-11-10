// Usage: node scripts/warmCache.js — downloads and splits every Gutenberg book in the DB
// so the first read of each one is instant (results saved to server/cache/books).
require('dotenv').config()
const mongoose = require('mongoose')
const Book = require('../models/Book')
const fetchGutenbergPage = require('../utils/fetchGutenbergPage')

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  const books = await Book.find({ bookType: 'gutenberg' }).select('title gutenbergId').lean()

  for (const book of books) {
    try {
      const page = await fetchGutenbergPage(book.gutenbergId, 1)
      await Book.updateOne({ _id: book._id }, { totalPages: page.totalPages, frontPages: page.frontPages })
      console.log(`warm ${book.gutenbergId}: ${book.title}`)
    } catch (error) {
      console.error(`failed ${book.gutenbergId}: ${error.message}`)
    }
    await new Promise(r => setTimeout(r, 1000))
  }
  await mongoose.disconnect()
}

run().catch(error => {
  console.error(error.message)
  process.exit(1)
})
