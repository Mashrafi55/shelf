import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import useFavouritesStore from '../store/favouritesStore'
import { useTheme } from '../context/ThemeContext'
import { ACCENT, ACCENT_DARK, COLORS } from '../constants'

export default function BookCard({ book }) {
  const { darkMode } = useTheme()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT
  const [coverFailed, setCoverFailed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const favourited = useFavouritesStore(s => s.ids.includes(book._id))
  const toggleFavourite = useFavouritesStore(s => s.toggle)

  const onHeart = async (e) => {
    e.preventDefault() // the card is a link; don't open the book
    e.stopPropagation()
    if (!user) return navigate('/login')
    const result = await toggleFavourite(book._id, user.token)
    if (result === null) toast.error('Could not update favourites')
  }
  const showCover = book.coverImage && !coverFailed

  return (
    <Link to={`/book/${book._id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        backgroundColor: colors.card, borderRadius: '12px', overflow: 'hidden',
        border: `1px solid ${colors.border}`, transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          setHovered(true)
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'
        }}
        onMouseLeave={e => {
          setHovered(false)
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{ aspectRatio: '2/3', overflow: 'hidden', backgroundColor: colors.border, flexShrink: 0, position: 'relative' }}>
          {/* heart appears on hover, top-right of the cover */}
          <button onClick={onHeart} aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'} tabIndex={hovered ? 0 : -1} style={{
            position: 'absolute', top: '8px', right: '8px', zIndex: 1, width: '36px', height: '36px',
            borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)', transition: 'opacity 0.2s ease',
            opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none',
          }}>
            <Heart size={16} fill={favourited ? '#e06666' : 'none'} color={favourited ? '#e06666' : '#fff'} />
          </button>
          {showCover ? (
            <img src={book.coverImage} alt={book.title} loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setCoverFailed(true)} />
          ) : (
            // no cover (or it failed to load): show the title on a plain tile
            <div style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center',
              border: `1px solid ${accent}`, boxSizing: 'border-box', gap: '8px',
            }}>
              <span style={{ fontFamily: 'Newsreader, serif', fontSize: '18px', fontStyle: 'italic', color: colors.text, lineHeight: 1.3 }}>
                {book.title}
              </span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '11px', color: colors.muted }}>{book.author}</span>
            </div>
          )}
        </div>
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em',
            color: accent, fontFamily: 'Manrope, sans-serif', marginBottom: '6px', fontWeight: '600',
          }}>{book.genre}</div>
          <h3 style={{
            fontFamily: 'Newsreader, serif', fontSize: '18px',
            color: colors.text, marginBottom: '4px', lineHeight: '1.3',
            // long titles ("A Modest Proposal: For preventing…") must not stretch the row
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', minHeight: '2.6em',
          }} title={book.title}>{book.title}</h3>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '12px',
            color: colors.muted, marginBottom: '12px', fontStyle: 'italic',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{book.author}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={12} fill={accent} color={accent} />
              <span style={{ fontSize: '12px', color: colors.muted, fontFamily: 'Manrope, sans-serif' }}>
                {book.averageRating ? book.averageRating.toFixed(1) : 'New'}
              </span>
            </div>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: '700',
              color: book.isFree ? '#4a7a4a' : colors.text,
            }}>{book.isFree ? 'Free' : `$${book.price}`}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
