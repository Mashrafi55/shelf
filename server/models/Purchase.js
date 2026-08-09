const mongoose = require('mongoose')

const purchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  amountPaid: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'completed' },
}, { timestamps: true })

module.exports = mongoose.model('Purchase', purchaseSchema)