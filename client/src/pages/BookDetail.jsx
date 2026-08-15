import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, ArrowLeft, Lock } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { API, ACCENT } from '../constants'

function BookDetail() {
  const { darkMode } = useTheme()
  const { user } = useAuthStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  const bg = darkMode ? '#1a1917' : '#f5f0e8'
  const card = darkMode ? '#2d2b29' : '#ffffff'
  const text = darkMode ? '#f5f0e8' : '#1a1917'
  const muted = darkMode ? '#9a9490' : '#6b6860'
  const border = darkMode ? '#3d3b39' : '#e8e0d0'

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
    <div style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: muted, fontStyle: 'italic' }}>Loading...</p>
    </div>
  )

  if (!book) return null

  return (
    <div style={{ backgroundColor: bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Back */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          fontFamily: 'Manrope, sans-serif', fontSize: '13px',
          color: muted, textDecoration: 'none', marginBottom: '40px',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <ArrowLeft size={16} /> Back
        </Link>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '64px', marginBottom: '64px' }}>

          {/* Cover */}
          <div>
            <div style={{
              aspectRatio: '2/3', borderRadius: '12px', overflow: 'hidden',
              backgroundColor: border, marginBottom: '24px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
            }}>
              <img src={book.coverImage} alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* CTA */}
            {book.owned ? (
              <Link to={`/read/${book._id}`} style={{
                display: 'block', width: '100%', backgroundColor: ACCENT,
                color: '#f5f0e8', textDecoration: 'none', padding: '14px',
                borderRadius: '999px', fontFamily: 'Manrope, sans-serif',
                fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em',
                fontWeight: '700', textAlign: 'center',
              }}>Read Now</Link>
            ) : book.isFree ? (
              <Link to={`/read/${book._id}`} style={{
                display: 'block', width: '100%', backgroundColor: ACCENT,
                color: '#f5f0e8', textDecoration: 'none', padding: '14px',
                borderRadius: '999px', fontFamily: 'Manrope, sans-serif',
                fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em',
                fontWeight: '700', textAlign: 'center',
              }}>Read Free</Link>
            ) : (
              <div>
                <div style={{
                  textAlign: 'center', marginBottom: '12px',
                  fontFamily: 'Newsreader, serif', fontSize: '28px', color: text,
                }}>${book.price}</div>
                <button onClick={handleBuy} disabled={purchasing} style={{
                  width: '100%', backgroundColor: ACCENT, color: '#f5f0e8',
                  border: 'none', padding: '14px', borderRadius: '999px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontWeight: '700', cursor: 'pointer',
                  opacity: purchasing ? 0.7 : 1,
                }}>
                  {purchasing ? 'Processing...' : 'Buy & Read'}
                </button>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '10px',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: ACCENT, fontWeight: '600',
                border: `1px solid ${ACCENT}`, padding: '4px 10px', borderRadius: '999px',
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
              color: text, lineHeight: '1.1', letterSpacing: '-0.02em',
              marginBottom: '8px', fontWeight: '400',
            }}>{book.title}</h1>

            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '18px',
              color: muted, marginBottom: '24px', fontStyle: 'italic',
            }}>{book.author}</p>

            {book.averageRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={16}
                    fill={s <= book.averageRating ? ACCENT : 'none'}
                    color={ACCENT} />
                ))}
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', color: muted }}>
                  {book.averageRating.toFixed(1)} ({book.totalRatings} reviews)
                </span>
              </div>
            )}

            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '16px',
              color: muted, lineHeight: '1.8', marginBottom: '40px',
            }}>{book.description}</p>

            {/* Preview */}
            {book.pages && book.pages.length > 0 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '16px',
                }}>
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '11px',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: ACCENT, fontWeight: '600',
                  }}>Preview</span>
                </div>

                <div style={{ position: 'relative' }}>
                  <div style={{
                    backgroundColor: card, borderRadius: '12px',
                    padding: '32px', border: `1px solid ${border}`,
                    maxHeight: '300px', overflow: 'hidden',
                  }}>
                    <p style={{
                      fontFamily: 'Newsreader, serif', fontSize: '18px',
                      color: text, lineHeight: '1.9',
                    }}>{book.pages[0]?.content}</p>
                  </div>

                  {!book.owned && !book.isFree && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: '180px',
                      background: `linear-gradient(to top, ${card}, transparent)`,
                      borderRadius: '0 0 12px 12px',
                      display: 'flex', alignItems: 'flex-end',
                      justifyContent: 'center', paddingBottom: '24px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: muted }}>
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

        {/* Reviews */}
        {reviews.length > 0 && (
          <div style={{ borderTop: `1px solid ${border}`, paddingTop: '48px' }}>
            <h2 style={{
              fontFamily: 'Newsreader, serif', fontSize: '32px',
              color: text, marginBottom: '32px', fontWeight: '400',
            }}>Reviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {reviews.map(review => (
                <div key={review._id} style={{
                  backgroundColor: card, borderRadius: '12px',
                  padding: '24px', border: `1px solid ${border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: ACCENT, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: '#f5f0e8', fontFamily: 'Manrope, sans-serif',
                      fontSize: '14px', fontWeight: '700',
                    }}>{review.user?.name?.[0]?.toUpperCase()}</div>
                    <div>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', color: text, fontWeight: '600' }}>
                        {review.user?.name}
                      </p>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={12}
                            fill={s <= review.rating ? ACCENT : 'none'}
                            color={ACCENT} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', color: muted, lineHeight: '1.7' }}>
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