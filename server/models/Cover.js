const mongoose = require('mongoose')

// Cover images uploaded by an admin. Stored in MongoDB so they survive redeploys (no file disk needed)
// and served by GET /api/covers/:id.
const coverSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
}, { timestamps: true })

module.exports = mongoose.model('Cover', coverSchema)
