const Review = require('../models/Review')
const Book = require('../models/Book')

// Recompute a book's average rating and review count from its reviews
const recalcBookRating = async (bookId) => {
  const [stats] = await Review.aggregate([
    { $match: { book: bookId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ])
  await Book.findByIdAndUpdate(bookId, {
    averageRating: stats ? stats.avg : 0,
    totalRatings: stats ? stats.count : 0
  })
}

module.exports = { recalcBookRating }
