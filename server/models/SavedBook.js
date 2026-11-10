const mongoose = require('mongoose')

// A free book a user added to their library (paid books come from Purchase)
const savedBookSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
}, { timestamps: true })

savedBookSchema.index({ user: 1, book: 1 }, { unique: true })

module.exports = mongoose.model('SavedBook', savedBookSchema)
