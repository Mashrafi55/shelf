import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { API, ACCENT, ACCENT_DARK, COLORS } from '../constants'
import BookCard from '../components/BookCard'

function Section({ title, books }) {
  const { darkMode } = useTheme()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT

  return (
    <section style={{ marginBottom: '64px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '32px', color: colors.text, fontWeight: '400' }}>{title}</h2>
        <Link to="/browse" style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '12px', textTransform: 'uppercase',
          letterSpacing: '0.05em', color: accent, textDecoration: 'none', fontWeight: '600',
        }}>View all →</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '24px' }}>
        {books.map(book => <BookCard key={book._id} book={book} />)}
      </div>
    </section>
  )
}

function ContinueReading({ item }) {
  const { darkMode } = useTheme()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT
  const book = item.book

  return (
    <section style={{ marginBottom: '64px' }}>
      <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '32px', color: colors.text, fontWeight: '400', marginBottom: '24px' }}>
        Continue reading
      </h2>
      <Link to={`/read/${book._id}`} style={{
        display: 'flex', gap: '20px', alignItems: 'center', textDecoration: 'none',
        backgroundColor: colors.card, border: `1px solid ${colors.border}`,
        borderRadius: '12px', padding: '16px', maxWidth: '520px',
      }}>
        <div style={{ width: '64px', aspectRatio: '2/3', borderRadius: '6px', overflow: 'hidden', backgroundColor: colors.border, flexShrink: 0 }}>
          {book.coverImage && <img src={book.coverImage} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Newsreader, serif', fontSize: '20px', color: colors.text, marginBottom: '4px' }}>{book.title}</div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: colors.muted, fontStyle: 'italic', marginBottom: '10px' }}>{book.author}</div>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: accent }}>
            Resume at page {item.lastPage} →
          </span>
        </div>
      </Link>
    </section>
  )
}

function GenreChips({ genres }) {
  const { darkMode } = useTheme()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  if (!genres.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '56px' }}>
      {genres.map(g => (
        <Link key={g} to={`/browse?genre=${encodeURIComponent(g)}`} style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: '600',
          color: colors.text, textDecoration: 'none', padding: '8px 16px',
          border: `1px solid ${colors.border}`, borderRadius: '999px',
        }}>{g}</Link>
      ))}
    </div>
  )
}

function Skeletons() {
  const { darkMode } = useTheme()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  return (
    <div aria-label="Loading books" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '24px' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{ borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden', backgroundColor: colors.card }}>
          <div style={{ aspectRatio: '2/3', backgroundColor: colors.border, opacity: 0.5 }} />
          <div style={{ padding: '16px' }}>
            <div style={{ height: '10px', width: '40%', backgroundColor: colors.border, opacity: 0.5, marginBottom: '10px', borderRadius: '4px' }} />
            <div style={{ height: '16px', width: '80%', backgroundColor: colors.border, opacity: 0.5, borderRadius: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Home() {
  const { darkMode } = useTheme()
  const { user } = useAuthStore()
  const [popular, setPopular] = useState([])
  const [topRated, setTopRated] = useState([])
  const [allBooks, setAllBooks] = useState([])
  const [recommended, setRecommended] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [genres, setGenres] = useState([])
  const [reading, setReading] = useState(null)

  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const headers = user ? { Authorization: `Bearer ${user.token}` } : {}
        const requests = [
          axios.get(`${API}/books/popular`),
          axios.get(`${API}/books/toprated`),
          axios.get(`${API}/books?limit=12`),
          axios.get(`${API}/books/genres`),
        ]
        if (user) {
          requests.push(axios.get(`${API}/books/recommended`, { headers }))
          requests.push(axios.get(`${API}/user/currentlyreading`, { headers }).catch(() => ({ data: null })))
        }

        const results = await Promise.all(requests)
        setPopular(results[0].data)
        setTopRated(results[1].data)
        setAllBooks(results[2].data.books)
        setGenres(results[3].data)
        if (user) {
          setRecommended(results[4].data)
          setReading(results[5].data?.book ? results[5].data : null)
        }
      } catch (error) {
        console.error(error)
        setFailed(true)
      } finally {
        setLoading(false)
      }
    }
    fetchBooks()
  }, [user])

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto', padding: '80px 24px 48px',
        borderBottom: `1px solid ${colors.border}`, marginBottom: '64px',
      }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '11px', textTransform: 'uppercase',
          letterSpacing: '0.1em', color: accent, marginBottom: '16px', fontWeight: '600',
        }}>The Digital Library</p>
        <h1 style={{
          fontFamily: 'Newsreader, serif', fontSize: 'clamp(40px, 6vw, 80px)',
          color: colors.text, lineHeight: '1.1', letterSpacing: '-0.02em',
          maxWidth: '700px', fontWeight: '400', marginBottom: '24px',
        }}>
          Your next great<br />
          <span style={{ fontStyle: 'italic', color: accent }}>read awaits.</span>
        </h1>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: colors.muted,
          maxWidth: '480px', lineHeight: '1.7', marginBottom: '32px',
        }}>
          Browse thousands of books, preview before you buy, and read instantly in your browser.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to={user ? '/dashboard' : '/register'} style={{
            backgroundColor: accent, color: colors.bg, textDecoration: 'none',
            padding: '12px 28px', borderRadius: '999px', fontFamily: 'Manrope, sans-serif',
            fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700',
          }}>{user ? 'My Library' : 'Start Reading'}</Link>
          <Link to="/browse" style={{
            backgroundColor: 'transparent', color: colors.text, textDecoration: 'none',
            padding: '12px 28px', borderRadius: '999px', fontFamily: 'Manrope, sans-serif',
            fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700',
            border: `1px solid ${colors.border}`,
          }}>Browse Books</Link>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {loading ? (
          <Skeletons />
        ) : (
          <>
            {reading && <ContinueReading item={reading} />}
            <GenreChips genres={genres} />
            {user && recommended.length > 0 && <Section title="Recommended for You" books={recommended} />}
            {popular.length > 0 && <Section title="Popular Now" books={popular} />}
            {topRated.length > 0 && <Section title="Top Rated" books={topRated} />}
            {allBooks.length > 0 && <Section title="All Books" books={allBooks} />}
            {allBooks.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '80px', fontFamily: 'Newsreader, serif',
                fontSize: '24px', color: colors.muted, fontStyle: 'italic',
              }}>{failed ? 'Could not load books. Please refresh in a moment.' : 'No books yet. Check back soon.'}</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Home