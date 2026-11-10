import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { ACCENT, ACCENT_DARK, COLORS } from '../constants'

export default function BookCard({ book }) {
  const { darkMode } = useTheme()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT

  return (
    <Link to={`/book/${book._id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        backgroundColor: colors.card, borderRadius: '12px', overflow: 'hidden',
        border: `1px solid ${colors.border}`, transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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
        <div style={{ aspectRatio: '2/3', overflow: 'hidden', backgroundColor: colors.border, flexShrink: 0 }}>
          <img src={book.coverImage} alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => e.target.style.display = 'none'} />
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
