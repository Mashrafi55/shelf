const Book = require('../models/Book')
const Purchase = require('../models/Purchase')
const Review = require('../models/Review')
const SavedBook = require('../models/SavedBook')
const Favourite = require('../models/Favourite')
const fetchGutenbergPage = require('../utils/fetchGutenbergPage')
const { fetchGutenbergChapters } = fetchGutenbergPage
const { recalcBookRating } = require('../utils/ratings')

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

    // paginated: ?page=1&limit=12 (limit is capped so one request can't pull the whole catalogue)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 48)
    const total = await Book.countDocuments(query)
    const pages = Math.max(Math.ceil(total / limit), 1)
    const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), pages)

    const books = await Book.find(query)
      .select('-pages')
      .sort({ ...sortOption, _id: -1 }) // _id breaks ties so pages never overlap
      .skip((page - 1) * limit)
      .limit(limit)
    res.json({ books, total, page, pages })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/books/genres - Genres that have at least one published book
const getGenres = async (req, res) => {
  try {
    const genres = await Book.distinct('genre', { isPublished: true })
    res.json(genres.filter(Boolean).sort())
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
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
    let inLibrary = false
    let libraryStatus = null
    let favourited = false
    if (req.user) {
      const [purchase, saved, fav] = await Promise.all([
        Purchase.findOne({ user: req.user._id, book: book._id }),
        SavedBook.findOne({ user: req.user._id, book: book._id }).select('status'),
        Favourite.exists({ user: req.user._id, book: book._id }),
      ])
      owned = !!purchase || book.isFree
      inLibrary = !!purchase || !!saved
      libraryStatus = saved?.status || null
      favourited = !!fav
    }

    // Only send free preview pages if not owned
    const bookData = book.toObject()
    if (!owned) {
      bookData.pages = book.pages.slice(0, book.freePreviewPages)
      bookData.isPreview = true
      bookData.totalPages = Math.max(0, (book.totalPages || 0) - (book.frontPages || 0))
    }

    res.json({ ...bookData, owned, inLibrary, libraryStatus, favourited })
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

// "12" -> "Chapter 12"; labels like "Letter 3" or "Book the First · Chapter I" are kept as they are
const chapterLabel = (number) => (/^[ivxlcdm\d]+$/i.test(number) ? `Chapter ${number}` : number)

// @GET /api/books/:id/chapters - Chapter list: [{ page, label, title, locked }]
// Non-owners of a paid book see page numbers as the preview reader numbers them (story from page 1)
// and chapters past the free preview are marked locked.
const getBookChapters = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    if (!book) return res.status(404).json({ message: 'Book not found' })

    let owned = false
    if (req.user) {
      const purchase = await Purchase.findOne({ user: req.user._id, book: book._id })
      owned = !!purchase || book.isFree
    }
    const previewOnly = !owned && !book.isFree

    let raw = []
    let totalPages = 0
    let frontPages = 0
    if (book.bookType === 'gutenberg') {
      try {
        ({ chapters: raw, totalPages, frontPages } = await fetchGutenbergChapters(book.gutenbergId))
      } catch (error) {
        return res.status(error.status || 502).json({ message: error.message })
      }
    } else {
      totalPages = book.pages.length
      raw = book.pages
        .map((p, i) => ({ page: i + 1, number: p.chapterNumber || '', title: p.chapterTitle || '', front: false }))
        .filter(c => c.number || c.title)
    }

    const offset = previewOnly ? frontPages : 0
    const chapters = raw
      .filter(c => !(previewOnly && c.front))
      .map(c => {
        const page = c.page - offset
        return {
          page,
          label: chapterLabel(c.number),
          title: c.title,
          locked: previewOnly && page > book.freePreviewPages,
        }
      })
    res.json({ chapters, totalPages: totalPages - offset })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
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

    await recalcBookRating(book._id)

    res.status(201).json(review)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/books/:id/reviews - Edit your own review
const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body
    const review = await Review.findOneAndUpdate(
      { user: req.user._id, book: req.params.id },
      { rating, comment },
      { new: true, runValidators: true }
    )
    if (!review) return res.status(404).json({ message: 'You have not reviewed this book' })
    await recalcBookRating(review.book)
    res.json(review)
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
}

// @DELETE /api/books/:id/reviews - Delete your own review
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ user: req.user._id, book: req.params.id })
    if (!review) return res.status(404).json({ message: 'You have not reviewed this book' })
    await recalcBookRating(review.book)
    res.json({ message: 'Review deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
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
}