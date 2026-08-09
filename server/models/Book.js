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
  pages: [{ pageNumber: Number, content: String }],
  isPublished: { type: Boolean, default: true },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  purchaseCount: { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.model('Book', bookSchema)