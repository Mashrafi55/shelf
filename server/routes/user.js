const express = require('express')
const router = express.Router()
const {
  getProfile,
  changePassword,
  updateProfile,
  updateGenres,
  getLibrary,
  addToLibrary,
  removeFromLibrary,
  getFavourites,
  toggleFavourite,
  getBookmarks,
  addBookmark,
  deleteBookmark,
  updateProgress,
  getCurrentlyReading
} = require('../controllers/userController')
const { protect } = require('../middleware/auth')
const { validate, validateIds } = require('../middleware/validate')
const { authLimiter: authWriteLimit } = require('../middleware/rateLimiters')
const schemas = require('../validators/schemas')

router.get('/profile', protect, getProfile)
router.put('/profile', protect, validate(schemas.profile), updateProfile)
router.put('/password', authWriteLimit, protect, validate(schemas.changePassword), changePassword)
router.put('/genres', protect, validate(schemas.genres), updateGenres)
router.get('/library', protect, getLibrary)
router.post('/library/:bookId', validateIds('bookId'), protect, addToLibrary)
router.delete('/library/:bookId', validateIds('bookId'), protect, removeFromLibrary)
router.get('/favourites', protect, getFavourites)
router.post('/favourites/:bookId', validateIds('bookId'), protect, toggleFavourite)
router.get('/bookmarks', protect, getBookmarks)
router.post('/bookmarks', protect, validate(schemas.bookmark), addBookmark)
router.delete('/bookmarks/:id', validateIds('id'), protect, deleteBookmark)
router.put('/progress', protect, validate(schemas.progress), updateProgress)
router.get('/currentlyreading', protect, getCurrentlyReading)

module.exports = router