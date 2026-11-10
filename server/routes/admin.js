const express = require('express')
const router = express.Router()
const {
  addBook,
  editBook,
  deleteBook,
  getAllBooks,
  getAllUsers,
  getSales,
  searchGutenberg,
  importGutenberg
} = require('../controllers/adminController')
const { protect } = require('../middleware/auth')
const { isAdmin } = require('../middleware/isAdmin')
const { validate, validateIds } = require('../middleware/validate')
const { adminLimiter } = require('../middleware/rateLimiters')
const schemas = require('../validators/schemas')

router.use(adminLimiter, protect, isAdmin)

router.get('/books', getAllBooks)
router.post('/books', validate(schemas.addBook), addBook)
router.put('/books/:id', validateIds('id'), validate(schemas.editBook), editBook)
router.delete('/books/:id', validateIds('id'), deleteBook)
router.get('/users', getAllUsers)
router.get('/sales', getSales)
router.get('/gutenberg/search', searchGutenberg)
router.post('/gutenberg/import/:id', importGutenberg)

module.exports = router