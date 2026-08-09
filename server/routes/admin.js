const express = require('express')
const router = express.Router()
const {
  addBook,
  editBook,
  deleteBook,
  getAllBooks,
  getAllUsers,
  getSales
} = require('../controllers/adminController')
const { protect } = require('../middleware/auth')
const { isAdmin } = require('../middleware/isAdmin')

router.use(protect, isAdmin)

router.get('/books', getAllBooks)
router.post('/books', addBook)
router.put('/books/:id', editBook)
router.delete('/books/:id', deleteBook)
router.get('/users', getAllUsers)
router.get('/sales', getSales)

module.exports = router