import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Minus, Plus, Sun, Moon, BookOpen, Bookmark } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = 'http://localhost:5000/api'
const ACCENT = '#c4502e'

function Reader({ darkMode, toggleDarkMode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [fontSize, setFontSize] = useState(18)
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const bg = darkMode ? '#1a1917' : '#f5f0e8'
  const text = darkMode ? '#f0ece4' : '#1a1917'
  const muted = darkMode ? '#9a9490' : '#6b6860'
  const toolbar = darkMode ? '#2d2b29' : '#ffffff'
  const border = darkMode ? '#3d3b39' : '#e8e0d0'

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const headers = user ? { Authorization: `Bearer ${user.token}` } : {}
        const { data } = await axios.get(`${API}/books/${id}`, { headers })
        setBook(data)

        // Restore reading progress
        if (user && data.owned) {
          const progressRes = await axios.get(`${API}/user/profile`, { headers })
          const progress = progressRes.data.readingProgress?.find(
            p => p.book === id || p.book?._id === id
          )
          if (progress) setCurrentPage(progress.lastPage - 1)
        }
      } catch (error) {
        toast.error('Could not load book')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchBook()
  }, [id])

  // Save progress
  useEffect(() => {
    if (!book || !user) return
    const timeout = setTimeout(async () => {
      try {
        await axios.put(`${API}/user/progress`, {
          bookId: id,
          lastPage: currentPage + 1
        }, { headers: { Authorization: `Bearer ${user.token}` } })
      } catch (error) {
        console.error(error)
      }
    }, 2000)
    return () => clearTimeout(timeout)
  }, [currentPage, book])

  const handleBookmark = async () => {
    if (!user) return toast.error('Login to bookmark pages')
    try {
      await axios.post(`${API}/user/bookmarks`, {
        bookId: id,
        pageNumber: currentPage + 1,
      }, { headers: { Authorization: `Bearer ${user.token}` } })
      toast.success(`Page ${currentPage + 1} bookmarked!`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Already bookmarked')
    }
  }

  const nextPage = () => {
    if (currentPage < book.pages.length - 1) setCurrentPage(p => p + 1)
  }

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1)
  }

  if (loading) return (
    <div style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: muted, fontStyle: 'italic' }}>Opening book...</p>
    </div>
  )

  if (!book || !book.pages || book.pages.length === 0) return (
    <div style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: muted, fontStyle: 'italic' }}>No pages available yet.</p>
      <Link to="/" style={{ color: ACCENT, fontFamily: 'Manrope, sans-serif', fontSize: '13px' }}>Go back home</Link>
    </div>
  )

  const page = book.pages[currentPage]
  const progress = ((currentPage + 1) / book.pages.length) * 100
  const isLocked = !book.owned && !book.isFree && currentPage >= book.freePreviewPages

  return (
    <div style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        backgroundColor: darkMode ? 'rgba(26,25,23,0.9)' : 'rgba(245,240,232,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{
          maxWidth: '800px', margin: '0 auto', padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link to={`/book/${id}`} style={{
            color: muted, display: 'flex', alignItems: 'center', gap: '6px',
            textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '13px',
          }}>
            <ArrowLeft size={16} /> Back
          </Link>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'Newsreader, serif', fontSize: '14px', color: text, fontStyle: 'italic' }}>
              {book.title}
            </p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '11px', color: muted }}>
              {book.author}
            </p>
          </div>

          <button onClick={handleBookmark} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: muted, display: 'flex', alignItems: 'center',
          }}>
            <Bookmark size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: '2px', backgroundColor: border }}>
          <div style={{
            height: '100%', backgroundColor: ACCENT,
            width: `${progress}%`, transition: 'width 0.3s ease',
          }} />
        </div>
      </header>

      {/* Content */}
      <main style={{
        flex: 1, maxWidth: '680px', margin: '0 auto',
        padding: '100px 24px 120px', width: '100%',
      }}>
        {isLocked ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <BookOpen size={48} color={muted} style={{ marginBottom: '24px' }} />
            <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '32px', color: text, marginBottom: '16px' }}>
              Enjoying the book?
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: muted, marginBottom: '32px' }}>
              You've reached the end of the free preview.
            </p>
            <Link to={`/book/${id}`} style={{
              backgroundColor: ACCENT, color: '#f5f0e8', textDecoration: 'none',
              padding: '14px 32px', borderRadius: '999px',
              fontFamily: 'Manrope, sans-serif', fontSize: '13px',
              textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700',
            }}>Buy Full Book — ${book.price}</Link>
          </div>
        ) : (
          <>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: ACCENT, marginBottom: '32px', fontWeight: '600',
            }}>Page {currentPage + 1} of {book.pages.length}</p>

            <div style={{
              fontFamily: 'Newsreader, serif',
              fontSize: `${fontSize}px`,
              color: text,
              lineHeight: '1.9',
              textAlign: 'justify',
            }}>
              {page?.content}
            </div>
          </>
        )}
      </main>

      {/* Navigation arrows */}
      {!isLocked && (
        <>
          <button onClick={prevPage} disabled={currentPage === 0} style={{
            position: 'fixed', left: '24px', top: '50%', transform: 'translateY(-50%)',
            background: toolbar, border: `1px solid ${border}`, borderRadius: '50%',
            width: '44px', height: '44px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 0 ? 0.3 : 1, color: text,
          }}>
            <ArrowLeft size={18} />
          </button>

          <button onClick={nextPage} disabled={currentPage === book.pages.length - 1} style={{
            position: 'fixed', right: '24px', top: '50%', transform: 'translateY(-50%)',
            background: toolbar, border: `1px solid ${border}`, borderRadius: '50%',
            width: '44px', height: '44px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: currentPage === book.pages.length - 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === book.pages.length - 1 ? 0.3 : 1, color: text,
          }}>
            <ArrowRight size={18} />
          </button>
        </>
      )}

      {/* Floating toolbar */}
      <div style={{
        position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: toolbar, border: `1px solid ${border}`,
        borderRadius: '999px', padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <button onClick={() => setFontSize(s => Math.max(14, s - 2))} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: muted,
          fontFamily: 'Newsreader, serif', fontSize: '16px',
        }}>A-</button>

        <button onClick={() => setFontSize(s => Math.min(28, s + 2))} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: muted,
          fontFamily: 'Newsreader, serif', fontSize: '22px',
        }}>A+</button>

        <div style={{ width: '1px', height: '20px', backgroundColor: border }} />

        <button onClick={toggleDarkMode} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: muted,
          display: 'flex', alignItems: 'center',
        }}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  )
}

export default Reader