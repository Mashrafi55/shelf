const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  coverImage: { type: String, required: true },
  genre: { type: String, required: true },
  price: { type: Number, required: true },
  isFree: { type: Boolean, default: false },
  freePreviewPages: { type: Number, default: 3 },
  bookType: { type: String, enum: ['custom', 'gutenberg', 'uploaded'], default: 'custom' },
  gutenbergId: { type: String, default: '' },
  totalPages: { type: Number, default: 0 },
  frontPages: { type: Number, default: 0 }, // author's preface pages at the start (gutenberg books)
  // pages array used by custom books only — gutenberg pages are fetched on demand,
  // uploaded books keep their pages in the BookPage collection
  pages: [{
    pageNumber: Number,
    chapterTitle: { type: String, default: '' },
    chapterNumber: { type: String, default: '' },
    content: String
  }],
  isPublished: { type: Boolean, default: true },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  purchaseCount: { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.model('Book', bookSchema)