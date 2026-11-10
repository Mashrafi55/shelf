// Usage: node scripts/seedByGenre.js [perGenre=5]
// Adds popular public-domain books for every genre in the app, using Gutendex topic search.
// Metadata only (page text is fetched on demand). Skips books already stored.
require('dotenv').config()
const mongoose = require('mongoose')
const Book = require('../models/Book')
const { getGutenbergBook } = require('../utils/gutenberg')

const TOPICS = {
  'Fiction': 'fiction', 'Non-Fiction': 'essays', 'Philosophy': 'philosophy',
  'Science': 'science', 'History': 'history', 'Biography': 'biography',
  'Self-Help': 'conduct of life', 'Technology': 'engineering', 'Poetry': 'poetry',
  'Mystery': 'detective', 'Romance': 'love stories', 'Fantasy': 'fantasy',
  'Thriller': 'horror', 'Classic': 'literature', 'Psychology': 'psychology',
  'Business': 'economics', 'Travel': 'description and travel', 'Art': 'art',
  'Religion': 'religion', 'Politics': 'political science',
}

const perGenre = Number(process.argv[2]) || 5
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  let added = 0

  for (const [genre, topic] of Object.entries(TOPICS)) {
    let got = 0
    try {
      const res = await fetch(`https://gutendex.com/books?languages=en&topic=${encodeURIComponent(topic)}`)
      if (!res.ok) throw new Error(`Gutendex ${res.status}`)
      const { results } = await res.json()
      for (const r of results) {
        if (got >= perGenre) break
        const id = String(r.id)
        if (await Book.exists({ gutenbergId: id })) continue
        try {
          const { pages, ...book } = await getGutenbergBook(id)
          await Book.create({ ...book, genre, price: 0, isFree: true, pages: [] })
          got++; added++
          console.log(`added [${genre}] ${id}: ${book.title}`)
        } catch (error) {
          console.error(`failed ${id}: ${error.message}`)
        }
        await sleep(1500)
      }
    } catch (error) {
      console.error(`topic "${topic}" failed: ${error.message}`)
    }
    console.log(`-- ${genre}: ${got} added`)
  }

  console.log(`Done — ${added} added`)
  await mongoose.disconnect()
}

run().catch(error => { console.error(error.message); process.exit(1) })
