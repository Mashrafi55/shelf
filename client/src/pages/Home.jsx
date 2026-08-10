import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, Heart, ShoppingBag } from 'lucide-react'
import axios from 'axios'

const ACCENT = '#c4502e'
const API = 'http://localhost:5000/api'

function BookCard({ book, darkMode }) {
  const card = darkMode ? '#2d2b29' : '#ffffff'
  const text = darkMode ? '#f5f0e8' : '#1a1917'
  const muted = darkMode ? '#9a9490' : '#6b6860'
  const border = darkMode ? '#3d3b39' : '#e8e0d0'

  return (
    <Link to={`/book/${book._id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        backgroundColor: card,
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${border}`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Cover */}
        <div style={{ aspectRatio: '2/3', overflow: 'hidden', backgroundColor: border }}>
          <img
            src={book.coverImage}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => e.target.style.display = 'none'}
          />
        </div>

        {/* Info */}
        <div style={{ padding: '16px' }}>
          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: ACCENT,
            fontFamily: 'Manrope, sans-serif',
            marginBottom: '6px',
            fontWeight: '600',
          }}>{book.genre}</div>

          <h3 style={{
            fontFamily: 'Newsreader, serif',
            fontSize: '18px',
            color: text,
            marginBottom: '4px',
            lineHeight: '1.3',
          }}>{book.title}</h3>

          <p style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '12px',
            color: muted,
            marginBottom: '12px',
            fontStyle: 'italic',
          }}>{book.author}</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={12} fill={ACCENT} color={ACCENT} />
              <span style={{ fontSize: '12px', color: muted, fontFamily: 'Manrope, sans-serif' }}>
                {book.averageRating ? book.averageRating.toFixed(1) : 'New'}
              </span>
            </div>
            <span style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '14px',
              fontWeight: '700',
              color: book.isFree ? '#4a7a4a' : text,
            }}>
              {book.isFree ? 'Free' : `$${book.price}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function Section({ title, books, darkMode }) {
  const text = darkMode ? '#f5f0e8' : '#1a1917'
  const muted = darkMode ? '#9a9490' : '#6b6860'

  return (
    <section style={{ marginBottom: '64px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{
          fontFamily: 'Newsreader, serif',
          fontSize: '32px',
          color: text,
          fontWeight: '400',
        }}>{title}</h2>
        <Link to="/browse" style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: ACCENT,
          textDecoration: 'none',
          fontWeight: '600',
        }}>View all →</Link>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '24px',
      }}>
        {books.map(book => (
          <BookCard key={book._id} book={book} darkMode={darkMode} />
        ))}
      </div>
    </section>
  )
}

function Home({ darkMode }) {
  const [popular, setPopular] = useState([])
  const [topRated, setTopRated] = useState([])
  const [allBooks, setAllBooks] = useState([])
  const [loading, setLoading] = useState(true)

  const bg = darkMode ? '#1a1917' : '#f5f0e8'
  const text = darkMode ? '#f5f0e8' : '#1a1917'
  const muted = darkMode ? '#9a9490' : '#6b6860'

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const [popularRes, topRatedRes, allRes] = await Promise.all([
          axios.get(`${API}/books/popular`),
          axios.get(`${API}/books/toprated`),
          axios.get(`${API}/books`),
        ])
        setPopular(popularRes.data)
        setTopRated(topRatedRes.data)
        setAllBooks(allRes.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchBooks()
  }, [])

  return (
    <div style={{ backgroundColor: bg, minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '80px 24px 48px',
        borderBottom: `1px solid ${darkMode ? '#2d2b29' : '#e8e0d0'}`,
        marginBottom: '64px',
      }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: ACCENT,
          marginBottom: '16px',
          fontWeight: '600',
        }}>The Digital Library</p>
        <h1 style={{
          fontFamily: 'Newsreader, serif',
          fontSize: 'clamp(40px, 6vw, 80px)',
          color: text,
          lineHeight: '1.1',
          letterSpacing: '-0.02em',
          maxWidth: '700px',
          fontWeight: '400',
          marginBottom: '24px',
        }}>
          Your next great<br />
          <span style={{ fontStyle: 'italic', color: ACCENT }}>read awaits.</span>
        </h1>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '16px',
          color: muted,
          maxWidth: '480px',
          lineHeight: '1.7',
          marginBottom: '32px',
        }}>
          Browse thousands of books, preview before you buy, and read instantly in your browser.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/register" style={{
            backgroundColor: ACCENT,
            color: '#f5f0e8',
            textDecoration: 'none',
            padding: '12px 28px',
            borderRadius: '999px',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '700',
          }}>Start Reading</Link>
          <Link to="/browse" style={{
            backgroundColor: 'transparent',
            color: text,
            textDecoration: 'none',
            padding: '12px 28px',
            borderRadius: '999px',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '700',
            border: `1px solid ${darkMode ? '#3d3b39' : '#e8e0d0'}`,
          }}>Browse Books</Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '80px',
            fontFamily: 'Manrope, sans-serif',
            color: muted,
          }}>Loading books...</div>
        ) : (
          <>
            {popular.length > 0 && <Section title="Popular Now" books={popular} darkMode={darkMode} />}
            {topRated.length > 0 && <Section title="Top Rated" books={topRated} darkMode={darkMode} />}
            {allBooks.length > 0 && <Section title="All Books" books={allBooks} darkMode={darkMode} />}
            {allBooks.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '80px',
                fontFamily: 'Newsreader, serif',
                fontSize: '24px',
                color: muted,
                fontStyle: 'italic',
              }}>
                No books yet. Check back soon.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Home