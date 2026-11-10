// Usage: node scripts/seedGutenberg.js [id id ...]   (defaults to a list of popular classics)
// Stores metadata only — page text is fetched on demand at read time.
require('dotenv').config()
const mongoose = require('mongoose')
const Book = require('../models/Book')
const { getGutenbergBook } = require('../utils/gutenberg')

const DEFAULT_IDS = [
  1342, 11, 84, 1661, 2701, 98, 1952, 74, 345, 1080,
  174, 2554, 1260, 768, 76, 5200, 2600, 1400, 120, 43,
  64317, 205, 16328, 1232, 30254, 219, 2814, 844, 158, 145,
]

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log(`Connected: ${mongoose.connection.host}`)

  const ids = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_IDS
  let added = 0

  for (const id of ids) {
    try {
      if (await Book.exists({ gutenbergId: String(id) })) {
        console.log(`skip ${id} (already stored)`)
        continue
      }
      const { pages, ...book } = await getGutenbergBook(id)
      // public-domain books: free to read
      await Book.create({ ...book, price: 0, isFree: true, pages: [] })
      added++
      console.log(`added ${id}: ${book.title} (${book.totalPages} pages)`)
    } catch (error) {
      console.error(`failed ${id}: ${error.message}`)
    }
    await sleep(1500)
  }

  console.log(`Done — ${added} added`)
  await mongoose.disconnect()
}

run().catch(error => {
  console.error(error.message)
  process.exit(1)
})
