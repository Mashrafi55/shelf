import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Sun, Moon, BookOpen, Bookmark } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { API, ACCENT, ACCENT_DARK, COLORS } from '../constants'

function Reader() {
  const { darkMode, toggleDarkMode } = useTheme()
  const { user } = useAuthStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [fontSize, setFontSize] = useState(18)
  const [loading, setLoading] = useState(true)
  const [pageData, setPageData] = useState(null)
  const [totalPages, setTotalPages] = useState(0)

  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const headers = user ? { Authorization: `Bearer ${user.token}` } : {}
        const { data } = await axios.get(`${API}/books/${id}`, { headers })
        setBook(data)
        setTotalPages(data.totalPages || data.pages?.length || 0)
        if (user && data.owned) {
          const progressRes = await axios.get(`${API}/user/profile`, { headers })
          const progress = progressRes.data.readingProgress?.find(
            p => p.book === id || p.book?._id === id
          )
          if (progress) setCurrentPage(progress.lastPage - 1)
        }
      } catch {
        toast.error('Could not load book')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchBook()
  }, [id, user, navigate])

  // the page on screen is "loading" until the fetched page matches the one asked for
  const pageLoading = pageData?.pageNumber !== currentPage + 1

  useEffect(() => {
    if (!book || !totalPages) return
    const isLocked = !book.owned && !book.isFree && currentPage >= book.freePreviewPages
    if (isLocked) return

    let cancelled = false // ignore answers for pages we've already flipped past
    const pageNumber = currentPage + 1
    const headers = user ? { Authorization: `Bearer ${user.token}` } : {}

    axios.get(`${API}/books/${id}/pages/${pageNumber}`, { headers })
      .then(({ data }) => {
        if (cancelled) return
        setPageData(data)
        if (data.totalPages && pageNumber < data.totalPages) {
          // pre-fetch next page silently — no loading state
          axios.get(`${API}/books/${id}/pages/${pageNumber + 1}`, { headers }).catch(() => {})
        }
      })
      .catch(error => {
        if (cancelled) return
        toast.error(error.response?.data?.message || 'Could not load page')
        navigate(`/book/${id}`)
      })

    return () => { cancelled = true }
  }, [book, totalPages, currentPage, id, user, navigate])

  useEffect(() => {
    if (!book || !user) return
    const timeout = setTimeout(async () => {
      try {
        await axios.put(`${API}/user/progress`, {
          bookId: id, lastPage: currentPage + 1
        }, { headers: { Authorization: `Bearer ${user.token}` } })
      } catch (error) {
        console.error(error)
      }
    }, 2000)
    return () => clearTimeout(timeout)
  }, [currentPage, book, id, user])

  const handleBookmark = async () => {
    if (!user) return toast.error('Login to bookmark pages')
    try {
      await axios.post(`${API}/user/bookmarks`, {
        bookId: id, pageNumber: currentPage + 1,
      }, { headers: { Authorization: `Bearer ${user.token}` } })
      toast.success(`Page ${currentPage + 1} bookmarked!`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Already bookmarked')
    }
  }

  const nextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(p => p + 1) }
  const prevPage = () => { if (currentPage > 0) setCurrentPage(p => p - 1) }

  if (loading) return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: colors.muted, fontStyle: 'italic' }}>Opening book...</p>
    </div>
  )

  if (!book || totalPages === 0) return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: colors.muted, fontStyle: 'italic' }}>No pages available yet.</p>
      <Link to="/" style={{ color: accent, fontFamily: 'Manrope, sans-serif', fontSize: '13px' }}>Go back home</Link>
    </div>
  )

  const isLocked = !book.owned && !book.isFree && currentPage >= book.freePreviewPages
  const progress = ((currentPage + 1) / totalPages) * 100

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        backgroundColor: darkMode ? 'rgba(18,10,2,0.9)' : 'rgba(247,240,230,0.9)',
        backdropFilter: 'blur(12px)', borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{
          maxWidth: '800px', margin: '0 auto', padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link to={`/book/${id}`} style={{
            color: colors.muted, display: 'flex', alignItems: 'center', gap: '6px',
            textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '13px',
          }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'Newsreader, serif', fontSize: '14px', color: colors.text, fontStyle: 'italic' }}>{book.title}</p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '11px', color: colors.muted }}>{book.author}</p>
          </div>
          <button onClick={handleBookmark} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: colors.muted, display: 'flex', alignItems: 'center',
          }}>
            <Bookmark size={18} />
          </button>
        </div>
        <div style={{ height: '2px', backgroundColor: colors.border }}>
          <div style={{ height: '100%', backgroundColor: accent, width: `${progress}%`, transition: 'width 0.3s ease' }} />
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '680px', margin: '0 auto', padding: '100px 24px 120px', width: '100%' }}>
        {isLocked ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <BookOpen size={48} color={colors.muted} style={{ marginBottom: '24px' }} />
            <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '32px', color: colors.text, marginBottom: '16px' }}>
              Enjoying the book?
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: colors.muted, marginBottom: '32px' }}>
              You've reached the end of the free preview.
            </p>
            <Link to={`/book/${id}`} style={{
              backgroundColor: accent, color: colors.bg, textDecoration: 'none',
              padding: '14px 32px', borderRadius: '999px', fontFamily: 'Manrope, sans-serif',
              fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700',
            }}>Buy Full Book — ${book.price}</Link>
          </div>
        ) : pageLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px', gap: '16px' }}>
            <p style={{ fontFamily: 'Newsreader, serif', fontSize: '22px', color: accent, fontStyle: 'italic' }}>Turning the page...</p>
          </div>
        ) : (
          <>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '11px', textTransform: 'uppercase',
              letterSpacing: '0.1em', color: accent, marginBottom: '32px', fontWeight: '600',
            }}>Page {currentPage + 1} of {totalPages}</p>
            {(pageData?.chapterNumber || pageData?.chapterTitle) && (
              <div style={{ textAlign: 'center', margin: '48px 0' }}>
                {pageData.chapterNumber && (
                  <p style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '12px', textTransform: 'uppercase',
                    letterSpacing: '0.15em', color: accent, fontWeight: '600', marginBottom: '12px',
                  }}>{/^[ivxlcdm\d]+$/i.test(pageData.chapterNumber) ? `Chapter ${pageData.chapterNumber}` : pageData.chapterNumber}</p>
                )}
                {pageData.chapterTitle && (
                  <h2 style={{
                    fontFamily: 'Newsreader, serif', fontSize: `${fontSize + 8}px`,
                    color: colors.text, fontWeight: '400', margin: 0,
                  }}>{pageData.chapterTitle}</h2>
                )}
              </div>
            )}
            <div style={{ fontFamily: 'Newsreader, serif', fontSize: `${fontSize}px`, color: colors.text, lineHeight: '1.9', textAlign: 'justify' }}>
              {(pageData?.content || '').split(/\n\n+/).filter(Boolean).map((para, i) => (
                <p key={i} style={{ margin: '0 0 1.1em', textIndent: i === 0 && !pageData?.chapterTitle ? 0 : '1.5em' }}>
                  {para.replace(/_/g, '')}
                </p>
              ))}
            </div>
          </>
        )}
      </main>

      {!isLocked && (
        <>
          <button onClick={prevPage} disabled={currentPage === 0} style={{
            position: 'fixed', left: '24px', top: '50%', transform: 'translateY(-50%)',
            background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '50%',
            width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 0 ? 0.3 : 1, color: colors.text,
          }}>
            <ArrowLeft size={18} />
          </button>
          <button onClick={nextPage} disabled={currentPage === totalPages - 1} style={{
            position: 'fixed', right: '24px', top: '50%', transform: 'translateY(-50%)',
            background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '50%',
            width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages - 1 ? 0.3 : 1, color: colors.text,
          }}>
            <ArrowRight size={18} />
          </button>
        </>
      )}

      <div style={{
        position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: colors.card, border: `1px solid ${colors.border}`,
        borderRadius: '999px', padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <button onClick={() => setFontSize(s => Math.max(14, s - 2))} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: colors.muted,
          fontFamily: 'Newsreader, serif', fontSize: '16px',
        }}>A-</button>
        <button onClick={() => setFontSize(s => Math.min(28, s + 2))} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: colors.muted,
          fontFamily: 'Newsreader, serif', fontSize: '22px',
        }}>A+</button>
        <div style={{ width: '1px', height: '20px', backgroundColor: colors.border }} />
        <button onClick={toggleDarkMode} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: colors.muted,
          display: 'flex', alignItems: 'center',
        }}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  )
}

export default Reader