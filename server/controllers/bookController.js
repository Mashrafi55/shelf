const Book = require('../models/Book')
const Purchase = require('../models/Purchase')
const Review = require('../models/Review')
const fetchGutenbergPage = require('../utils/fetchGutenbergPage')

// @GET /api/books - Get all published books
const getBooks = async (req, res) => {
  try {
    const { genre, search, sort } = req.query

    let query = { isPublished: true }

    if (typeof genre === 'string' && genre) query.genre = genre
    const term = typeof search === 'string' ? search.trim().slice(0, 100) : ''
    if (term) {
      const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { author: { $regex: safe, $options: 'i' } }
      ]
    }

    let sortOption = { createdAt: -1 }
    if (sort === 'popular') sortOption = { purchaseCount: -1 }
    if (sort === 'rating') sortOption = { averageRating: -1 }
    if (sort === 'price_low') sortOption = { price: 1 }
    if (sort === 'price_high') sortOption = { price: -1 }

    const books = await Book.find(query).sort(sortOption)
    res.json(books)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/books/popular - Get popular books
const getPopularBooks = async (req, res) => {
  try {
    const books = await Book.find({ isPublished: true })
      .sort({ purchaseCount: -1 })
      .limit(6)
    res.json(books)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/books/toprated - Get top rated books
const getTopRatedBooks = async (req, res) => {
  try {
    const books = await Book.find({ isPublished: true, totalRatings: { $gt: 0 } })
      .sort({ averageRating: -1 })
      .limit(6)
    res.json(books)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/books/recommended - Get recommended books based on user genres
const getRecommendedBooks = async (req, res) => {
  try {
    const books = await Book.find({
      isPublished: true,
      genre: { $in: req.user.genres }
    }).limit(6)
    res.json(books)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/books/:id - Get single book
const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    if (!book) return res.status(404).json({ message: 'Book not found' })

    // Check if user owns the book
    let owned = false
    if (req.user) {
      const purchase = await Purchase.findOne({ user: req.user._id, book: book._id })
      owned = !!purchase || book.isFree
    }

    // Only send free preview pages if not owned
    const bookData = book.toObject()
    if (!owned) {
      bookData.pages = book.pages.slice(0, book.freePreviewPages)
      bookData.isPreview = true
      bookData.totalPages = Math.max(0, (book.totalPages || 0) - (book.frontPages || 0))
    }

    res.json({ ...bookData, owned })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/books/:id/pages/:pageNumber - Get a single page (custom or gutenberg)
const getBookPage = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    if (!book) return res.status(404).json({ message: 'Book not found' })

    const pageNumber = parseInt(req.params.pageNumber, 10)
    if (!pageNumber || pageNumber < 1) {
      return res.status(400).json({ message: 'Invalid page number' })
    }

    // ownership check
    let owned = false
    if (req.user) {
      const purchase = await Purchase.findOne({ user: req.user._id, book: book._id })
      owned = !!purchase || book.isFree
    }

    // Non-owners of a paid book preview the story from Chapter 1; the author's preface
    // pages are for readers who own the book.
    const previewOnly = !owned && !book.isFree

    if (previewOnly && pageNumber > book.freePreviewPages) {
      return res.status(403).json({ message: 'Purchase required to read beyond the free preview' })
    }

    if (book.bookType === 'gutenberg') {
      try {
        let page = await fetchGutenbergPage(book.gutenbergId, previewOnly ? 1 : pageNumber)
        if (previewOnly) {
          const skip = page.frontPages
          if (skip || pageNumber > 1) page = await fetchGutenbergPage(book.gutenbergId, pageNumber + skip)
          return res.json({ ...page, pageNumber, totalPages: page.totalPages - skip })
        }
        return res.json(page)
      } catch (error) {
        const status = error.status || 502
        return res.status(status).json({ message: error.message })
      }
    }

    // custom book — pages live in MongoDB
    if (book.pages.length && pageNumber > book.pages.length) {
      return res.status(404).json({ message: 'Page not found' })
    }
    const page = book.pages[pageNumber - 1]
    res.json({
      pageNumber,
      content: page?.content || '',
      chapterTitle: page?.chapterTitle || '',
      chapterNumber: page?.chapterNumber || '',
      totalPages: book.pages.length,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/books/:id/reviews - Get reviews for a book
const getBookReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ book: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/books/:id/reviews - Add a review
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body
    const book = await Book.findById(req.params.id)
    if (!book) return res.status(404).json({ message: 'Book not found' })

    const existingReview = await Review.findOne({ user: req.user._id, book: book._id })
    if (existingReview) return res.status(400).json({ message: 'You already reviewed this book' })

    const review = await Review.create({
      user: req.user._id,
      book: book._id,
      rating,
      comment
    })

    // Update book average rating
    const reviews = await Review.find({ book: book._id })
    book.totalRatings = reviews.length
    book.averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    await book.save()

    res.status(201).json(review)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/books/:id/purchase - Mock purchase (real payment later)
const purchaseBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    if (!book) return res.status(404).json({ message: 'Book not found' })

    const alreadyPurchased = await Purchase.findOne({
      user: req.user._id,
      book: book._id
    })
    if (alreadyPurchased) return res.status(400).json({ message: 'Book already purchased' })

    const purchase = await Purchase.create({
      user: req.user._id,
      book: book._id,
      amountPaid: book.price,
      paymentStatus: 'completed'
    })

    // Increment purchase count
    book.purchaseCount += 1
    await book.save()

    res.status(201).json({ message: 'Purchase successful', purchase })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getBooks,
  getPopularBooks,
  getTopRatedBooks,
  getRecommendedBooks,
  getBook,
  getBookPage,
  getBookReviews,
  addReview,
  purchaseBook
}