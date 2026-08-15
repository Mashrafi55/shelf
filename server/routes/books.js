const express = require('express')
const router = express.Router()
const {
  getBooks,
  getPopularBooks,
  getTopRatedBooks,
  getRecommendedBooks,
  getBook,
  getBookReviews,
  addReview,
  purchaseBook
} = require('../controllers/bookController')
const { protect, optionalProtect } = require('../middleware/auth')

router.get('/', getBooks)
router.get('/popular', getPopularBooks)
router.get('/toprated', getTopRatedBooks)
router.get('/recommended', protect, getRecommendedBooks)
router.get('/:id', optionalProtect, getBook)
router.get('/:id/reviews', getBookReviews)
router.post('/:id/reviews', protect, addReview)
router.post('/:id/purchase', protect, purchaseBook)

module.exports = router