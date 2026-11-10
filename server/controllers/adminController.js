const Book = require('../models/Book')
const User = require('../models/User')
const Purchase = require('../models/Purchase')
const Review = require('../models/Review')
const BookPage = require('../models/BookPage')
const { parseUpload } = require('../utils/importFile')
const { generateCover } = require('../utils/gutenberg')
const { recalcBookRating } = require('../utils/ratings')
const { searchGutenbergBooks, getGutenbergBook } = require('../utils/gutenberg')

// @POST /api/admin/books - Add a book
const addBook = async (req, res) => {
  try {
    const {
      title, author, description, coverImage, genre, price,
      isFree, freePreviewPages, pages, bookType, gutenbergId, totalPages, frontPages
    } = req.body
    // gutenberg text is fetched on demand — never persist it (keeps the DB tiny)
    const isGutenberg = bookType === 'gutenberg'
    const book = await Book.create({
      title, author, description, coverImage, genre, price,
      isFree, freePreviewPages, pages: isGutenberg ? [] : pages,
      bookType: bookType || 'custom',
      gutenbergId: gutenbergId || '',
      totalPages: totalPages || 0,
      frontPages: frontPages || 0
    })
    res.status(201).json(book)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/admin/books/:id - Edit a book
const editBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!book) return res.status(404).json({ message: 'Book not found' })
    res.json(book)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @DELETE /api/admin/books/:id - Delete a book
const deleteBook = async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id)
    await BookPage.deleteMany({ book: req.params.id })
    res.json({ message: 'Book deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/admin/books - Get all books
const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 })
    res.json(books)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/admin/users - Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/admin/sales - Get all purchases
const getSales = async (req, res) => {
  try {
    const sales = await Purchase.find()
      .populate('user', 'name email')
      .populate('book', 'title price')
      .sort({ createdAt: -1 })
    res.json(sales)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/admin/gutenberg/search?q= - Search Project Gutenberg
const searchGutenberg = async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q) return res.status(400).json({ message: 'Search query required' })
    res.json(await searchGutenbergBooks(q))
  } catch {
    res.status(502).json({ message: 'Could not reach Gutendex. Try again shortly.' })
  }
}

// @POST /api/admin/gutenberg/import/:id - Fetch and parse a Gutenberg book
const importGutenberg = async (req, res) => {
  try {
    res.json(await getGutenbergBook(req.params.id))
  } catch (error) {
    const notFound = /not found/i.test(error.message)
    res.status(notFound ? 404 : 502).json({ message: error.message })
  }
}

// @POST /api/admin/books/upload - Turn an uploaded PDF / EPUB / TXT into a draft book
// The book is saved unpublished with a generated cover: the admin finishes the details in the edit form.
const uploadBook = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose a PDF, EPUB or TXT file' })
  let book
  try {
    const parsed = await parseUpload({ buffer: req.file.buffer, filename: req.file.originalname })
    book = await Book.create({
      title: parsed.title.slice(0, 200),
      author: parsed.author.slice(0, 200),
      description: 'Uploaded book. Edit this description before publishing.',
      coverImage: generateCover(parsed.title, parsed.author),
      genre: 'Fiction',
      price: 0,
      isFree: true,
      freePreviewPages: Math.min(4, parsed.pages.length),
      bookType: 'uploaded',
      totalPages: parsed.pages.length,
      isPublished: false,
    })
    for (let i = 0; i < parsed.pages.length; i += 200) {
      await BookPage.insertMany(parsed.pages.slice(i, i + 200).map(p => ({ ...p, book: book._id })))
    }
    const chapters = parsed.pages.filter(p => p.chapterNumber || p.chapterTitle).length
    res.status(201).json({ book, pages: parsed.pages.length, chapters })
  } catch (error) {
    if (book) { // don't leave a half-saved book behind
      await BookPage.deleteMany({ book: book._id }).catch(() => {})
      await Book.findByIdAndDelete(book._id).catch(() => {})
    }
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Could not import this file' })
  }
}

// @DELETE /api/admin/reviews/:id - Remove any review (moderation)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id)
    if (!review) return res.status(404).json({ message: 'Review not found' })
    await recalcBookRating(review.book)
    res.json({ message: 'Review deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
}

module.exports = { addBook, editBook, deleteBook, getAllBooks, getAllUsers, getSales, searchGutenberg, importGutenberg, deleteReview, uploadBook }
