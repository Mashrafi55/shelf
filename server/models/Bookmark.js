const mongoose = require('mongoose')

const bookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  pageNumber: { type: Number, required: true },
  note: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Bookmark', bookmarkSchema)
