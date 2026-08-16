import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Heart, Bookmark, ArrowRight } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { API, ACCENT, ACCENT_DARK, COLORS } from '../constants'

function Dashboard() {
  const { darkMode } = useTheme()
  const { user } = useAuthStore()
  const [tab, setTab] = useState('library')
  const [library, setLibrary] = useState([])
  const [favourites, setFavourites] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [currentlyReading, setCurrentlyReading] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    const fetchData = async () => {
      const headers = { Authorization: `Bearer ${user.token}` }
      try {
        const [libRes, favRes, bookRes, currentRes] = await Promise.all([
          axios.get(`${API}/user/library`, { headers }),
          axios.get(`${API}/user/favourites`, { headers }),
          axios.get(`${API}/user/bookmarks`, { headers }),
          axios.get(`${API}/user/currentlyreading`, { headers }),
        ])
        setLibrary(libRes.data)
        setFavourites(favRes.data)
        setBookmarks(bookRes.data)
        setCurrentlyReading(currentRes.data)
      } catch {
        toast.error('Could not load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, navigate])

  const deleteBookmark = async (id) => {
    try {
      await axios.delete(`${API}/user/bookmarks/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      setBookmarks(prev => prev.filter(b => b._id !== id))
      toast.success('Bookmark removed')
    } catch {
      toast.error('Could not remove bookmark')
    }
  }

  const TABS = [
    { id: 'library', label: 'My Library', icon: <BookOpen size={16} /> },
    { id: 'favourites', label: 'Favourites', icon: <Heart size={16} /> },
    { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark size={16} /> },
  ]

  if (loading) return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: colors.muted, fontStyle: 'italic' }}>Loading your shelf...</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ marginBottom: '48px' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: accent, fontWeight: '600', marginBottom: '8px',
          }}>My Account</p>
          <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: '40px', color: colors.text, fontWeight: '400' }}>
            Welcome back, {user?.name?.split(' ')[0]}.
          </h1>
        </div>

        {currentlyReading?.book && (
          <div style={{
            backgroundColor: colors.card, borderRadius: '16px', padding: '24px',
            border: `1px solid ${colors.border}`, marginBottom: '48px',
            display: 'flex', alignItems: 'center', gap: '24px',
          }}>
            <div style={{
              width: '60px', height: '90px', borderRadius: '8px',
              overflow: 'hidden', backgroundColor: colors.border, flexShrink: 0,
            }}>
              <img src={currentlyReading.book.coverImage} alt={currentlyReading.book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '11px', textTransform: 'uppercase',
                letterSpacing: '0.08em', color: accent, fontWeight: '600', marginBottom: '4px',
              }}>Continue Reading</p>
              <h3 style={{ fontFamily: 'Newsreader, serif', fontSize: '22px', color: colors.text, marginBottom: '4px' }}>
                {currentlyReading.book.title}
              </h3>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: colors.muted, marginBottom: '12px' }}>
                Page {currentlyReading.lastPage}
              </p>
              <div style={{ height: '3px', backgroundColor: colors.border, borderRadius: '999px', marginBottom: '12px' }}>
                <div style={{
                  height: '100%', backgroundColor: accent, borderRadius: '999px',
                  width: `${(currentlyReading.lastPage / (currentlyReading.book.pages?.length || 1)) * 100}%`
                }} />
              </div>
            </div>
            <Link to={`/read/${currentlyReading.book._id}`} style={{
              backgroundColor: accent, color: colors.bg, textDecoration: 'none',
              padding: '10px 20px', borderRadius: '999px', fontFamily: 'Manrope, sans-serif',
              fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
            }}>Continue <ArrowRight size={14} /></Link>
          </div>
        )}

        <div style={{ display: 'flex', gap: '4px', marginBottom: '40px', borderBottom: `1px solid ${colors.border}` }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px', background: 'none', border: 'none',
              borderBottom: tab === t.id ? `2px solid ${accent}` : '2px solid transparent',
              marginBottom: '-1px', cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '13px',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: tab === t.id ? accent : colors.muted,
              fontWeight: tab === t.id ? '700' : '400',
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {tab === 'library' && (
          library.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px' }}>
              <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: colors.muted, fontStyle: 'italic', marginBottom: '16px' }}>
                Your library is empty.
              </p>
              <Link to="/" style={{ color: accent, fontFamily: 'Manrope, sans-serif', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Browse Books →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
              {library.map(({ book }) => (
                <Link key={book._id} to={`/read/${book._id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: colors.card, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                    <div style={{ aspectRatio: '2/3', overflow: 'hidden', backgroundColor: colors.border }}>
                      <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontFamily: 'Newsreader, serif', fontSize: '18px', color: colors.text, marginBottom: '4px' }}>{book.title}</h3>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: colors.muted, fontStyle: 'italic' }}>{book.author}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {tab === 'favourites' && (
          favourites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px' }}>
              <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: colors.muted, fontStyle: 'italic', marginBottom: '16px' }}>
                No favourites yet.
              </p>
              <Link to="/" style={{ color: accent, fontFamily: 'Manrope, sans-serif', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Discover Books →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
              {favourites.map(({ book }) => (
                <Link key={book._id} to={`/book/${book._id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: colors.card, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                    <div style={{ aspectRatio: '2/3', overflow: 'hidden', backgroundColor: colors.border }}>
                      <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontFamily: 'Newsreader, serif', fontSize: '18px', color: colors.text, marginBottom: '4px' }}>{book.title}</h3>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: colors.muted, fontStyle: 'italic' }}>{book.author}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {tab === 'bookmarks' && (
          bookmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px' }}>
              <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: colors.muted, fontStyle: 'italic' }}>
                No bookmarks yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bookmarks.map(bookmark => (
                <div key={bookmark._id} style={{
                  backgroundColor: colors.card, borderRadius: '12px', padding: '20px 24px',
                  border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Bookmark size={18} color={accent} />
                    <div>
                      <p style={{ fontFamily: 'Newsreader, serif', fontSize: '18px', color: colors.text }}>{bookmark.book?.title}</p>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: colors.muted }}>Page {bookmark.pageNumber}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link to={`/read/${bookmark.book?._id}`} style={{
                      color: accent, fontFamily: 'Manrope, sans-serif', fontSize: '12px',
                      textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none', fontWeight: '600',
                    }}>Go to page</Link>
                    <button onClick={() => deleteBookmark(bookmark._id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: colors.muted, fontFamily: 'Manrope, sans-serif', fontSize: '12px',
                    }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default Dashboard