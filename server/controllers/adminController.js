const Book = require('../models/Book')
const User = require('../models/User')
const Purchase = require('../models/Purchase')
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

module.exports = { addBook, editBook, deleteBook, getAllBooks, getAllUsers, getSales, searchGutenberg, importGutenberg }