import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'
import { useTheme } from '../context/ThemeContext'
import { API, ACCENT, ACCENT_DARK, COLORS } from '../constants'
import BookCard from '../components/BookCard'
import useWindowSize from '../hooks/useWindowSize'

const font = 'Manrope, sans-serif'
const SORTS = [
  ['', 'Newest'],
  ['popular', 'Most popular'],
  ['rating', 'Top rated'],
  ['price_low', 'Price: low to high'],
  ['price_high', 'Price: high to low'],
]

// Search, filter, sort and paginate the whole catalogue. State lives in the URL,
// so the back button and shared links keep working.
function Browse() {
  const { darkMode } = useTheme()
  const { isMobile } = useWindowSize()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT
  const [params, setParams] = useSearchParams()

  const search = params.get('search') || ''
  const genre = params.get('genre') || ''
  const sort = params.get('sort') || ''
  const page = Number(params.get('page')) || 1

  const [searchText, setSearchText] = useState(search)
  const [genres, setGenres] = useState([])
  const [data, setData] = useState({ books: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)

  const update = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    setParams(next, { replace: true })
  }

  // wait for a pause in typing before searching
  useEffect(() => {
    if (searchText === search) return
    const timer = setTimeout(() => update({ search: searchText.trim(), page: '' }), 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText])

  useEffect(() => {
    axios.get(`${API}/books/genres`).then(res => setGenres(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    axios.get(`${API}/books`, { params: { search, genre, sort, page, limit: 12 } })
      .then(res => { if (!cancelled) setData(res.data) })
      .catch(() => { if (!cancelled) setData({ books: [], total: 0, page: 1, pages: 1 }) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, genre, sort, page])

  const control = {
    backgroundColor: colors.card, color: colors.text, border: `1px solid ${colors.border}`,
    borderRadius: '999px', padding: '10px 16px', fontFamily: font, fontSize: '14px', outline: 'none',
  }
  const pageButton = (disabled) => ({
    ...control, display: 'flex', alignItems: 'center', gap: '4px', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  })

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', padding: isMobile ? '32px 16px' : '48px 32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: isMobile ? '32px' : '44px', fontWeight: 400, color: colors.text, marginBottom: '24px' }}>
          Browse
        </h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
          <div style={{ ...control, display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px' }}>
            <Search size={16} color={colors.muted} />
            <input value={searchText} onChange={e => setSearchText(e.target.value)}
              placeholder="Search title or author"
              style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontFamily: font, fontSize: '14px', color: colors.text }} />
          </div>
          <select value={genre} onChange={e => update({ genre: e.target.value, page: '' })} style={control}>
            <option value="">All genres</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={sort} onChange={e => update({ sort: e.target.value, page: '' })} style={control}>
            {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        {!loading && (
          <p style={{ fontFamily: font, fontSize: '13px', color: colors.muted, marginBottom: '24px' }}>
            {data.total} {data.total === 1 ? 'book' : 'books'}
          </p>
        )}

        {loading ? (
          <p style={{ fontFamily: font, color: colors.muted }}>Loading...</p>
        ) : data.books.length === 0 ? (
          <p style={{ fontFamily: font, color: colors.muted }}>No books match your search.</p>
        ) : (
          <div style={{
            display: 'grid', gap: isMobile ? '16px' : '24px',
            gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '130px' : '200px'}, 1fr))`,
          }}>
            {data.books.map(book => <BookCard key={book._id} book={book} />)}
          </div>
        )}

        {data.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
            <button disabled={data.page <= 1} onClick={() => update({ page: String(data.page - 1) })} style={pageButton(data.page <= 1)}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontFamily: font, fontSize: '14px', color: accent }}>Page {data.page} of {data.pages}</span>
            <button disabled={data.page >= data.pages} onClick={() => update({ page: String(data.page + 1) })} style={pageButton(data.page >= data.pages)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Browse
