const mongoose = require('mongoose')

// A book on a user's shelf, with the folder it is in (Reading, Completed, ...)
const savedBookSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  status: { type: String, enum: ['reading', 'completed', 'on_hold', 'plan_to_read', 'dropped'], default: 'plan_to_read' },
}, { timestamps: true })

savedBookSchema.index({ user: 1, book: 1 }, { unique: true })

module.exports = mongoose.model('SavedBook', savedBookSchema)
