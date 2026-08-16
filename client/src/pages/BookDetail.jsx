import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, ArrowLeft, Lock } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { API, ACCENT, ACCENT_DARK, COLORS } from '../constants'
import useWindowSize from '../hooks/useWindowSize'

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

  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const headers = user ? { Authorization: `Bearer ${user.token}` } : {}
        const [bookRes, reviewsRes] = await Promise.all([
          axios.get(`${API}/books/${id}`, { headers }),
          axios.get(`${API}/books/${id}/reviews`),
        ])
        setBook(bookRes.data)
        setReviews(reviewsRes.data)
      } catch {
        toast.error('Book not found')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchBook()
  }, [id, user, navigate])

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

  if (loading) return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: colors.muted, fontStyle: 'italic' }}>Loading...</p>
    </div>
  )

  if (!book) return null

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>

        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          fontFamily: 'Manrope, sans-serif', fontSize: '13px',
          color: colors.muted, textDecoration: 'none', marginBottom: '40px',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <ArrowLeft size={16} /> Back
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', gap: isMobile ? '32px' : '64px', marginBottom: '64px' }}>

          <div>
            <div style={{
              aspectRatio: '2/3', borderRadius: '12px', overflow: 'hidden',
              backgroundColor: colors.border, marginBottom: '24px',
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
              <div>
                <div style={{
                  textAlign: 'center', marginBottom: '12px',
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
              </div>
            )}
          </div>

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
              fontFamily: 'Newsreader, serif', fontSize: '48px',
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
              color: colors.muted, lineHeight: '1.8', marginBottom: '40px',
            }}>{book.description}</p>

            {book.pages && book.pages.length > 0 && (
              <div>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '11px',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: accent, fontWeight: '600', display: 'block', marginBottom: '16px',
                }}>Preview</span>

                <div style={{ position: 'relative' }}>
                  <div style={{
                    backgroundColor: colors.card, borderRadius: '12px',
                    padding: '32px', border: `1px solid ${colors.border}`,
                    maxHeight: '300px', overflow: 'hidden',
                  }}>
                    <p style={{
                      fontFamily: 'Newsreader, serif', fontSize: '18px',
                      color: colors.text, lineHeight: '1.9',
                    }}>{book.pages[0]?.content}</p>
                  </div>

                  {!book.owned && !book.isFree && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px',
                      background: `linear-gradient(to top, ${colors.card}, transparent)`,
                      borderRadius: '0 0 12px 12px',
                      display: 'flex', alignItems: 'flex-end',
                      justifyContent: 'center', paddingBottom: '24px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.muted }}>
                        <Lock size={16} />
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px' }}>
                          Buy to read full book
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {reviews.length > 0 && (
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '48px' }}>
            <h2 style={{
              fontFamily: 'Newsreader, serif', fontSize: '32px',
              color: colors.text, marginBottom: '32px', fontWeight: '400',
            }}>Reviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {reviews.map(review => (
                <div key={review._id} style={{
                  backgroundColor: colors.card, borderRadius: '12px',
                  padding: '24px', border: `1px solid ${colors.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: accent, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: colors.bg, fontFamily: 'Manrope, sans-serif',
                      fontSize: '14px', fontWeight: '700',
                    }}>{review.user?.name?.[0]?.toUpperCase()}</div>
                    <div>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', color: colors.text, fontWeight: '600' }}>
                        {review.user?.name}
                      </p>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={12}
                            fill={s <= review.rating ? accent : 'none'}
                            color={accent} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', color: colors.muted, lineHeight: '1.7' }}>
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookDetail