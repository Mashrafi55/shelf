export const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const ACCENT = '#5c3317'
export const ACCENT_DARK = '#b8845a'

export const COLORS = {
  light: {
    bg: '#f7f0e6',
    card: '#ffffff',
    text: '#1a0a00',
    muted: '#8b6b50',
    border: '#e0ceb4',
  },
dark: {
  bg: '#1c1410',
  card: '#251a12',
  text: '#e8ddd0',
  muted: '#8b7060',
  border: '#3a2a1e',
}
}

export const GENRES = [
  'Fiction', 'Non-Fiction', 'Philosophy', 'Science', 'History',
  'Biography', 'Self-Help', 'Technology', 'Poetry', 'Mystery',
  'Romance', 'Fantasy', 'Thriller', 'Classic', 'Psychology',
  'Business', 'Travel', 'Art', 'Religion', 'Politics',
]
// folders a book can be filed in on the user's shelf
export const LIBRARY_STATUSES = [
  { id: 'reading', label: 'Reading' },
  { id: 'completed', label: 'Completed' },
  { id: 'on_hold', label: 'On-Hold' },
  { id: 'plan_to_read', label: 'Plan to Read' },
  { id: 'dropped', label: 'Dropped' },
]
