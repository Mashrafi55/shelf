const express = require('express')
const router = express.Router()
const {
  getProfile,
  updateProfile,
  updateGenres,
  getLibrary,
  getFavourites,
  toggleFavourite,
  getBookmarks,
  addBookmark,
  deleteBookmark,
  updateProgress,
  getCurrentlyReading
} = require('../controllers/userController')
const { protect } = require('../middleware/auth')

router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)
router.put('/genres', protect, updateGenres)
router.get('/library', protect, getLibrary)
router.get('/favourites', protect, getFavourites)
router.post('/favourites/:bookId', protect, toggleFavourite)
router.get('/bookmarks', protect, getBookmarks)
router.post('/bookmarks', protect, addBookmark)
router.delete('/bookmarks/:id', protect, deleteBookmark)
router.put('/progress', protect, updateProgress)
router.get('/currentlyreading', protect, getCurrentlyReading)

module.exports = router