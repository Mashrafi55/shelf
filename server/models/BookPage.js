const mongoose = require('mongoose')

// Pages of uploaded books (PDF / EPUB / TXT) — kept out of the Book document so big books
// stay under MongoDB's 16 MB document limit and book lists stay small.
const bookPageSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  pageNumber: { type: Number, required: true },
  chapterNumber: { type: String, default: '' },
  chapterTitle: { type: String, default: '' },
  content: { type: String, default: '' },
})

bookPageSchema.index({ book: 1, pageNumber: 1 }, { unique: true })

module.exports = mongoose.model('BookPage', bookPageSchema)
