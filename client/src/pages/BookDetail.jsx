import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, ArrowLeft, Lock, Heart, Plus, Check, ChevronRight } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { API, ACCENT, ACCENT_DARK, COLORS } from '../constants'
import useWindowSize from '../hooks/useWindowSize'
import ReviewSection from '../components/ReviewSection'
import useFavouritesStore from '../store/favouritesStore'

function BookDetail() {
  
  const { darkMode } = useTheme()
  const { user } = useAuthStore()
  const { isMobile } = useWindowSize()
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [previewPage, setPreviewPage] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [chapters, setChapters] = useState([])

  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const headers = user ? { Authorization: `Bearer ${user.token}` } : {}
        const [bookRes, reviewsRes, pageRes, chaptersRes] = await Promise.all([
          axios.get(`${API}/books/${id}`, { headers }),
          axios.get(`${API}/books/${id}/reviews`),
          // preview page — works for both custom and gutenberg books
          axios.get(`${API}/books/${id}/pages/1`).catch(() => ({ data: null })),
          axios.get(`${API}/books/${id}/chapters`, { headers }).catch(() => ({ data: { chapters: [] } })),
        ])
        setChapters(chaptersRes.data.chapters || [])
        setBook(bookRes.data)
        setReviews(reviewsRes.data)
        setPreviewPage(pageRes.data)
      } catch {
        toast.error('Book not found')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchBook()
  }, [id, user, navigate, reloadKey])

  const handleBuy = async () => {
    if (!user) return navigate('/login')
    setPurchasing(true)
    try {
      await axios.post(`${API}/books/${id}/purchase`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      toast.success('Purchase successful! Enjoy reading.')
      window.location.reload()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Purchase failed')
    } finally {
      setPurchasing(false)
    }
  }

  // add/remove a free book from "My Library", and the heart (favourites)
  const authHeaders = { Authorization: `Bearer ${user?.token}` }
  const toggleLibrary = async () => {
    if (!user) return navigate('/login')
    try {
      if (book.inLibrary) {
        await axios.delete(`${API}/user/library/${id}`, { headers: authHeaders })
        setBook(b => ({ ...b, inLibrary: false }))
        toast.success('Removed from your library')
      } else {
        await axios.post(`${API}/user/library/${id}`, {}, { headers: authHeaders })
        setBook(b => ({ ...b, inLibrary: true }))
        toast.success('Added to your library')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    }
  }
  const favourited = useFavouritesStore(st => st.ids.includes(id))
  const toggleFav = useFavouritesStore(st => st.toggle)
  const toggleFavourite = async () => {
    if (!user) return navigate('/login')
    const result = await toggleFav(id, user.token)
    if (result === null) toast.error('Could not update favourites')
    else toast.success(result ? 'Added to favourites' : 'Removed from favourites')
  }

  if (loading) return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: colors.muted, fontStyle: 'italic' }}>Loading...</p>
    </div>
  )

  if (!book) return null

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 24px' }}>

        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          fontFamily: 'Manrope, sans-serif', fontSize: '13px',
          color: colors.muted, textDecoration: 'none', marginBottom: isMobile ? '20px' : '40px',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <ArrowLeft size={16} /> Back
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', gap: isMobile ? '32px' : '64px', marginBottom: isMobile ? '40px' : '64px' }}>

          {/* Left — Cover + CTA */}
          <div>
            <div style={{
              aspectRatio: '2/3', borderRadius: '12px', overflow: 'hidden',
              backgroundColor: colors.border, marginBottom: '24px',
              maxWidth: isMobile ? '240px' : 'none', marginLeft: isMobile ? 'auto' : 0, marginRight: isMobile ? 'auto' : 0,
              boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
            }}>
              <img src={book.coverImage} alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {book.owned ? (
              <Link to={`/read/${book._id}`} style={{
                display: 'block', width: '100%', backgroundColor: accent,
                color: colors.bg, textDecoration: 'none', padding: '14px',
                borderRadius: '999px', fontFamily: 'Manrope, sans-serif',
                fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em',
                fontWeight: '700', textAlign: 'center',
              }}>Read Now</Link>
            ) : book.isFree ? (
              <Link to={`/read/${book._id}`} style={{
                display: 'block', width: '100%', backgroundColor: accent,
                color: colors.bg, textDecoration: 'none', padding: '14px',
                borderRadius: '999px', fontFamily: 'Manrope, sans-serif',
                fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em',
                fontWeight: '700', textAlign: 'center',
              }}>Read Free</Link>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  textAlign: 'center', marginBottom: '4px',
                  fontFamily: 'Newsreader, serif', fontSize: '28px', color: colors.text,
                }}>${book.price}</div>
                <button onClick={handleBuy} disabled={purchasing} style={{
                  width: '100%', backgroundColor: accent, color: colors.bg,
                  border: 'none', padding: '14px', borderRadius: '999px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontWeight: '700', cursor: 'pointer', opacity: purchasing ? 0.7 : 1,
                }}>
                  {purchasing ? 'Processing...' : 'Buy & Read'}
                </button>
                <Link to={`/read/${book._id}`} style={{
                  display: 'block', width: '100%', backgroundColor: 'transparent',
                  color: accent, textDecoration: 'none', padding: '14px',
                  borderRadius: '999px', fontFamily: 'Manrope, sans-serif',
                  fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontWeight: '700', textAlign: 'center', border: `1px solid ${accent}`,
                }}>Read Preview</Link>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              {book.isFree && (
                <button onClick={toggleLibrary} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  backgroundColor: 'transparent', color: accent, border: `1px solid ${accent}`,
                  padding: '14px', borderRadius: '999px', cursor: 'pointer', minHeight: '44px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {book.inLibrary ? <><Check size={16} /> In my library</> : <><Plus size={16} /> Add to my library</>}
                </button>
              )}
              <button onClick={toggleFavourite} aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'} style={{
                width: '48px', height: '48px', flexShrink: 0, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'transparent', border: `1px solid ${accent}`, color: accent,
              }}>
                <Heart size={18} fill={favourited ? accent : 'none'} />
              </button>
            </div>
          </div>

          {/* Right — Info */}
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '10px',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: accent, fontWeight: '600',
                border: `1px solid ${accent}`, padding: '4px 10px', borderRadius: '999px',
              }}>{book.genre}</span>
              {book.isFree && (
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '10px',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: '#4a7a4a', fontWeight: '600',
                  border: '1px solid #4a7a4a', padding: '4px 10px', borderRadius: '999px',
                }}>Free</span>
              )}
            </div>

            <h1 style={{
              fontFamily: 'Newsreader, serif', fontSize: isMobile ? '36px' : '48px',
              color: colors.text, lineHeight: '1.1', letterSpacing: '-0.02em',
              marginBottom: '8px', fontWeight: '400',
            }}>{book.title}</h1>

            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '18px',
              color: colors.muted, marginBottom: '24px', fontStyle: 'italic',
            }}>{book.author}</p>

            {book.averageRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={16}
                    fill={s <= book.averageRating ? accent : 'none'}
                    color={accent} />
                ))}
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', color: colors.muted }}>
                  {book.averageRating.toFixed(1)} ({book.totalRatings} reviews)
                </span>
              </div>
            )}

            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '16px',
              color: colors.text, lineHeight: '1.8', marginBottom: '40px',
            }}>{book.description}</p>

            {/* Preview Section */}

            {(book.pages?.length > 0 || book.totalPages > 0) && (
              <div>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '11px',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: accent, fontWeight: '600', display: 'block', marginBottom: '16px',
                }}>Preview</span>

                <div style={{ position: 'relative' }}>
                  <div style={{
                    borderRadius: '12px', padding: isMobile ? '24px 20px' : '40px 56px',
                    border: `1px solid ${colors.border}`,
                    maxHeight: '420px', overflow: 'hidden',
                    backgroundColor: darkMode ? colors.card : '#fffdf9',
                  }}>
                    {(previewPage?.chapterNumber || previewPage?.chapterTitle) && (
                      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        {previewPage.chapterNumber && (
                          <div style={{
                            fontFamily: 'Manrope, sans-serif', fontSize: '11px', fontWeight: '600',
                            textTransform: 'uppercase', letterSpacing: '0.2em', color: accent, marginBottom: '8px',
                          }}>{/^[ivxlcdm\d]+$/i.test(previewPage.chapterNumber) ? `Chapter ${previewPage.chapterNumber}` : previewPage.chapterNumber}</div>
                        )}
                        {previewPage.chapterTitle && (
                          <h3 style={{
                            fontFamily: 'Newsreader, serif', fontSize: '28px', fontWeight: '400',
                            color: colors.text, lineHeight: '1.3',
                          }}>{previewPage.chapterTitle}</h3>
                        )}
                      </div>
                    )}
                    {(previewPage?.content || '').split(/\n\n+/).filter(Boolean).slice(0, 8).map((para, i) => (
                      <p key={i} style={{
                        fontFamily: 'Newsreader, serif', fontSize: '18px',
                        color: colors.text, lineHeight: '1.85',
                        textIndent: i === 0 ? '0' : '1.5em', marginBottom: '14px',
                      }}>{para.replace(/_/g, '')}</p>
                    ))}
                  </div>

                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px',
                    background: `linear-gradient(to top, ${darkMode ? colors.card : '#fffdf9'} 20%, transparent)`,
                    borderRadius: '0 0 12px 12px', pointerEvents: 'none',
                  }} />

                  {!book.owned && !book.isFree && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px',
                      background: `linear-gradient(to top, ${darkMode ? colors.card : '#fffdf9'} 30%, transparent)`,
                      borderRadius: '0 0 12px 12px',
                      display: 'flex', alignItems: 'flex-end',
                      justifyContent: 'center', paddingBottom: '20px',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        backgroundColor: colors.card, padding: '8px 16px',
                        borderRadius: '999px', border: `1px solid ${colors.border}`,
                      }}>
                        <Lock size={14} color={accent} />
                        <span style={{
                          fontFamily: 'Manrope, sans-serif', fontSize: '12px',
                          color: colors.text, fontWeight: '600',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          Buy to read full book
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chapters */}
            {chapters.length > 0 && (
              <div style={{ marginTop: '40px' }}>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '11px', textTransform: 'uppercase',
                  letterSpacing: '0.1em', color: accent, fontWeight: '600', display: 'block', marginBottom: '16px',
                }}>Chapters ({chapters.length})</span>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', overflowY: 'auto', maxHeight: '360px', backgroundColor: colors.card, overscrollBehavior: 'contain' }}>
                  {chapters.map((c, i, list) => {
                    const row = {
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', minHeight: '52px',
                      borderBottom: i < list.length - 1 ? `1px solid ${colors.border}` : 'none',
                      textDecoration: 'none', opacity: c.locked ? 0.55 : 1,
                    }
                    const inner = (
                      <>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: colors.text }}>{c.label || c.title}</div>
                          {c.label && c.title && (
                            <div style={{ fontFamily: 'Newsreader, serif', fontSize: '15px', color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                          )}
                        </div>
                        {c.locked ? <Lock size={14} color={colors.muted} /> : <ChevronRight size={16} color={colors.muted} />}
                      </>
                    )
                    return c.locked
                      ? <div key={`${c.page}-${i}`} style={row}>{inner}</div>
                      : <Link key={`${c.page}-${i}`} to={`/read/${book._id}?page=${c.page}`} style={row}>{inner}</Link>
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <ReviewSection bookId={id} reviews={reviews} onChange={() => setReloadKey(k => k + 1)} />
      </div>
    </div>
  )
}
export default BookDetail

