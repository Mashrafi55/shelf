const User = require('../models/User')
const Book = require('../models/Book')
const Purchase = require('../models/Purchase')
const Bookmark = require('../models/Bookmark')
const Favourite = require('../models/Favourite')
const SavedBook = require('../models/SavedBook')

// @GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const { name, readingMode } = req.body
    const user = await User.findById(req.user._id)
    if (name) user.name = name
    if (readingMode) user.readingMode = readingMode
    await user.save()
    const { password, ...safeUser } = user.toObject()
    res.json({ message: 'Profile updated', user: safeUser })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/user/password - Change password (requires the current one)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }
    user.password = newPassword
    await user.save()
    res.json({ message: 'Password updated' })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
}

// @PUT /api/user/genres - Save genre preferences
const updateGenres = async (req, res) => {
  try {
    const { genres } = req.body
    const user = await User.findById(req.user._id)
    user.genres = genres
    user.onboardingComplete = true
    await user.save()
    res.json({ message: 'Genres updated', genres: user.genres })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/user/library - Purchased books plus free books the user added
const getLibrary = async (req, res) => {
  try {
    const [purchases, saved] = await Promise.all([
      Purchase.find({ user: req.user._id }).populate('book'),
      SavedBook.find({ user: req.user._id }).populate('book'),
    ])
    const seen = new Set()
    const items = [...purchases, ...saved]
      .filter(item => item.book && !seen.has(String(item.book._id)) && seen.add(String(item.book._id)))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(item => ({ _id: item._id, book: item.book, createdAt: item.createdAt }))
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/user/library/:bookId - Add a free book to the library
const addToLibrary = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId)
    if (!book) return res.status(404).json({ message: 'Book not found' })
    if (!book.isFree) return res.status(400).json({ message: 'Buy this book to add it to your library' })
    await SavedBook.updateOne(
      { user: req.user._id, book: book._id },
      { $setOnInsert: { user: req.user._id, book: book._id } },
      { upsert: true }
    )
    res.status(201).json({ message: 'Added to your library', inLibrary: true })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
}

// @DELETE /api/user/library/:bookId - Remove a saved free book (purchases stay)
const removeFromLibrary = async (req, res) => {
  try {
    await SavedBook.deleteOne({ user: req.user._id, book: req.params.bookId })
    res.json({ message: 'Removed from your library', inLibrary: false })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' })
  }
}

// @GET /api/user/favourites
const getFavourites = async (req, res) => {
  try {
    const favourites = await Favourite.find({ user: req.user._id })
      .populate('book')
      .sort({ createdAt: -1 })
    res.json(favourites)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/user/favourites/:bookId - Toggle favourite
const toggleFavourite = async (req, res) => {
  try {
    const existing = await Favourite.findOne({
      user: req.user._id,
      book: req.params.bookId
    })

    if (existing) {
      await existing.deleteOne()
      return res.json({ message: 'Removed from favourites', favourited: false })
    }

    await Favourite.create({ user: req.user._id, book: req.params.bookId })
    res.json({ message: 'Added to favourites', favourited: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @GET /api/user/bookmarks
const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate('book', 'title coverImage')
      .sort({ createdAt: -1 })
    res.json(bookmarks)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @POST /api/user/bookmarks - Add bookmark
const addBookmark = async (req, res) => {
  try {
    const { bookId, pageNumber, note } = req.body
    const existing = await Bookmark.findOne({
      user: req.user._id,
      book: bookId,
      pageNumber
    })
    if (existing) return res.status(400).json({ message: 'Page already bookmarked' })

    const bookmark = await Bookmark.create({
      user: req.user._id,
      book: bookId,
      pageNumber,
      note
    })
    res.status(201).json(bookmark)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @DELETE /api/user/bookmarks/:id
const deleteBookmark = async (req, res) => {
  try {
    const deleted = await Bookmark.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!deleted) return res.status(404).json({ message: 'Bookmark not found' })
    res.json({ message: 'Bookmark removed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @PUT /api/user/progress - Save reading progress
const updateProgress = async (req, res) => {
  try {
    const { bookId, lastPage } = req.body
    const user = await User.findById(req.user._id)

    const progressIndex = user.readingProgress.findIndex(
      p => p.book.toString() === bookId
    )

    if (progressIndex > -1) {
      user.readingProgress[progressIndex].lastPage = lastPage
      user.readingProgress[progressIndex].updatedAt = Date.now()
    } else {
      user.readingProgress.push({ book: bookId, lastPage })
    }

    await user.save()

    // reading a free book puts it on the user's shelf automatically
    const book = await Book.findById(bookId).select('isFree')
    if (book?.isFree) {
      await SavedBook.updateOne(
        { user: req.user._id, book: bookId },
        { $setOnInsert: { user: req.user._id, book: bookId } },
        { upsert: true }
      )
    }
    res.json({ message: 'Progress saved' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
// @GET /api/user/currentlyreading
const getCurrentlyReading = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('readingProgress.book')

    if (!user.readingProgress.length) return res.json(null)

    const latest = user.readingProgress.sort(
      (a, b) => b.updatedAt - a.updatedAt
    )[0]

    res.json(latest)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
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
}