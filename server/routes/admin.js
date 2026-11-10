const express = require('express')
const multer = require('multer')
const router = express.Router()
const {
  addBook,
  editBook,
  deleteBook,
  getAllBooks,
  getAllUsers,
  getSales,
  searchGutenberg,
  importGutenberg,
  deleteReview,
  uploadBook,
  addGutenbergBook,
  uploadCover
} = require('../controllers/adminController')
const { protect } = require('../middleware/auth')
const { isAdmin } = require('../middleware/isAdmin')
const { validate, validateIds } = require('../middleware/validate')
const { adminLimiter } = require('../middleware/rateLimiters')
const schemas = require('../validators/schemas')

router.use(adminLimiter, protect, isAdmin)

// uploads are held in memory (max 25 MB) and only PDF / EPUB / TXT are accepted
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(/\.(pdf|epub|txt)$/i.test(file.originalname) ? null : Object.assign(new Error('Only PDF, EPUB and TXT files are supported'), { status: 400 }), true),
}).single('file')
const handleUpload = (req, res, next) => upload(req, res, (error) => {
  if (!error) return next()
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'File is too large (max 25 MB)' })
  res.status(error.status || 400).json({ message: error.status ? error.message : 'Upload failed' })
})

router.get('/books', getAllBooks)
const coverUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } }).single('image')
const handleCoverUpload = (req, res, next) => coverUpload(req, res, (error) => {
  if (!error) return next()
  res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 2 MB)' : 'Upload failed' })
})
router.post('/covers', handleCoverUpload, uploadCover)
router.post('/books/upload', handleUpload, uploadBook)
router.post('/books', validate(schemas.addBook), addBook)
router.put('/books/:id', validateIds('id'), validate(schemas.editBook), editBook)
router.delete('/books/:id', validateIds('id'), deleteBook)
router.delete('/reviews/:id', validateIds('id'), deleteReview)
router.get('/users', getAllUsers)
router.get('/sales', getSales)
router.get('/gutenberg/search', searchGutenberg)
router.post('/gutenberg/import/:id', importGutenberg)
router.post('/gutenberg/add/:id', addGutenbergBook)

module.exports = router