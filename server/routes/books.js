const express = require('express')
const router = express.Router()
const {
  getBooks,
  getGenres,
  getPopularBooks,
  getTopRatedBooks,
  getRecommendedBooks,
  getBook,
  getBookPage,
  getBookChapters,
  getBookReviews,
  addReview,
  updateReview,
  deleteReview,
  purchaseBook
} = require('../controllers/bookController')
const { protect, optionalProtect } = require('../middleware/auth')
const { validate, validateIds } = require('../middleware/validate')
const { pageLimiter, writeLimiter } = require('../middleware/rateLimiters')
const schemas = require('../validators/schemas')

router.get('/', getBooks)
router.get('/genres', getGenres)
router.get('/popular', getPopularBooks)
router.get('/toprated', getTopRatedBooks)
router.get('/recommended', protect, getRecommendedBooks)
router.get('/:id', validateIds('id'), optionalProtect, getBook)
router.get('/:id/chapters', pageLimiter, validateIds('id'), optionalProtect, getBookChapters)
router.get('/:id/pages/:pageNumber', pageLimiter, validateIds('id'), optionalProtect, getBookPage)
router.get('/:id/reviews', validateIds('id'), getBookReviews)
router.post('/:id/reviews', writeLimiter, validateIds('id'), protect, validate(schemas.review), addReview)
router.put('/:id/reviews', writeLimiter, validateIds('id'), protect, validate(schemas.review), updateReview)
router.delete('/:id/reviews', writeLimiter, validateIds('id'), protect, deleteReview)
router.post('/:id/purchase', writeLimiter, validateIds('id'), protect, purchaseBook)

module.exports = router