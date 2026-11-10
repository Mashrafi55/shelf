import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowDown, ArrowUp, Bookmark, Lock } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { ACCENT, ACCENT_DARK, COLORS } from '../constants'

// Chapter list for the book page.
//  - chapters you have finished are dimmed, unread ones stand out, the one you stopped in is marked
//  - the bookmark at the end of each row saves that chapter (filled = bookmarked)
//  - the sort button flips the order (first-to-last / last-to-first)
export default function ChapterList({ bookId, chapters, lastPage, bookmarkedPages, onToggleBookmark }) {
  const { darkMode } = useTheme()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT
  const [query, setQuery] = useState('')
  const [newestFirst, setNewestFirst] = useState(false)

  // the chapter you stopped in = last one starting on or before your saved page
  const lastReadIndex = lastPage
    ? chapters.reduce((found, c, i) => (c.page <= lastPage && !c.locked ? i : found), -1)
    : -1

  const q = query.trim().toLowerCase()
  let rows = chapters
    .map((chapter, index) => ({ chapter, index }))
    .filter(({ chapter }) => !q || `${chapter.label} ${chapter.title}`.toLowerCase().includes(q))
  if (newestFirst) rows = [...rows].reverse()

  const SortIcon = newestFirst ? ArrowUp : ArrowDown

  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '11px', textTransform: 'uppercase',
          letterSpacing: '0.1em', color: accent, fontWeight: 600,
        }}>Chapters ({chapters.length})</span>
        <button onClick={() => setNewestFirst(v => !v)} aria-label="Reverse chapter order" style={{
          display: 'flex', alignItems: 'center', gap: '6px', background: colors.card, color: colors.text,
          border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 700,
        }}>
          <SortIcon size={14} /> Chapter
        </button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', marginBottom: '8px',
        backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: '8px',
      }}>
        <Search size={14} color={colors.muted} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search chapter..."
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none', color: colors.text,
            fontFamily: 'Manrope, sans-serif', fontSize: '13px',
          }} />
      </div>

      <div className="chapter-scroll" style={{
        border: `1px solid ${colors.border}`, borderRadius: '8px', overflowY: 'auto', maxHeight: '360px',
        backgroundColor: colors.card, overscrollBehavior: 'contain',
      }}>
        {rows.length === 0 && (
          <p style={{ padding: '16px', fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: colors.muted }}>No chapter matches.</p>
        )}
        {rows.map(({ chapter: c, index: i }, n) => {
          const isRead = lastReadIndex !== -1 && i < lastReadIndex
          const isHere = i === lastReadIndex
          const bookmarked = bookmarkedPages.has(c.page)
          const labelColor = c.locked ? colors.muted : isRead ? colors.muted : accent

          const text = (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: labelColor,
                fontWeight: isRead ? 500 : 700,
              }}>{c.label || c.title}</div>
              {c.label && c.title && (
                <div style={{
                  fontFamily: 'Newsreader, serif', fontSize: '14px', color: colors.muted,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{c.title}</div>
              )}
            </div>
          )
          const rowStyle = {
            display: 'flex', alignItems: 'center', gap: '8px', minHeight: '48px',
            borderBottom: n < rows.length - 1 ? `1px solid ${colors.border}` : 'none',
            borderLeft: `3px solid ${isHere ? accent : 'transparent'}`,
            backgroundColor: isHere ? (darkMode ? 'rgba(184,132,90,0.12)' : 'rgba(92,51,23,0.06)') : 'transparent',
          }

          return (
            <div key={`${c.page}-${i}`} style={rowStyle}>
              {c.locked ? (
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 8px 10px 13px', opacity: 0.6 }}>
                  {text}
                  <Lock size={14} color={colors.muted} />
                </div>
              ) : (
                <Link to={`/read/${bookId}?page=${isHere ? lastPage : c.page}`} style={{
                  flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 0 10px 13px', textDecoration: 'none',
                }}>
                  {text}
                  {isHere && (
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '11px', fontWeight: 700, color: accent, whiteSpace: 'nowrap' }}>
                      Reading · p. {lastPage}
                    </span>
                  )}
                </Link>
              )}
              {!c.locked && (
                <button onClick={() => onToggleBookmark(c)} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this chapter'} style={{
                  background: 'none', border: 'none', cursor: 'pointer', minWidth: '44px', height: '44px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Bookmark size={16} color={bookmarked ? accent : colors.muted} fill={bookmarked ? accent : 'none'} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
