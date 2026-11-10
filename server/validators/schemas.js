const { z } = require('zod')

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id')
const text = (max) => z.string().trim().max(max)

const register = z.object({
  name: text(60).min(1, 'Name is required'),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('Invalid email')),
  // bcrypt only uses the first 72 bytes
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password is too long'),
})

// login does not enforce the length rule so older, shorter passwords still work
const login = z.object({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().min(1, 'Password is required').max(200),
})

const review = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: text(2000).optional(),
})

const bookmark = z.object({
  bookId: objectId,
  pageNumber: z.coerce.number().int().min(1),
  note: text(500).optional(),
})

const progress = z.object({
  bookId: objectId,
  lastPage: z.coerce.number().int().min(1),
})

const profile = z.object({
  name: text(60).min(1).optional(),
  readingMode: z.enum(['auto', 'light', 'dark']).optional(),
})

const genres = z.object({
  genres: z.array(text(40).min(1)).max(30),
})

const pageSchema = z.object({
  pageNumber: z.coerce.number().int().optional(),
  chapterTitle: text(200).optional(),
  chapterNumber: text(50).optional(),
  content: z.string().max(200000).optional(),
})

// Only these fields can be set on a book — stats like purchaseCount are not editable
const bookFields = z.object({
  title: text(200).min(1),
  author: text(200).min(1),
  description: z.string().trim().min(1).max(5000),
  coverImage: text(1000).min(1),
  genre: text(60).min(1),
  price: z.coerce.number().min(0).max(100000),
  isFree: z.boolean().optional(),
  freePreviewPages: z.coerce.number().int().min(0).max(1000).optional(),
  bookType: z.enum(['custom', 'gutenberg']).optional(),
  gutenbergId: z.coerce.string().regex(/^\d*$/, 'Invalid Gutenberg id').optional(),
  totalPages: z.coerce.number().int().min(0).optional(),
  frontPages: z.coerce.number().int().min(0).optional(),
  pages: z.array(pageSchema).max(5000).optional(),
  isPublished: z.boolean().optional(),
})

const addBook = bookFields
const editBook = bookFields.partial()

module.exports = { register, login, review, bookmark, progress, profile, genres, addBook, editBook }
