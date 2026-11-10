import { useState } from 'react'
import { X, Lock, Bookmark } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import { ACCENT, ACCENT_DARK, COLORS } from '../constants'

// Contents drawer for the reader: jump to any chapter, or type a page number.
// chapters: [{ page, label, title, locked }] (page is 1-based). currentPage is 1-based too.
export default function ChapterPanel({ chapters, currentPage, totalPages, isMobile, onGo, onClose }) {
  const { darkMode } = useTheme()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT
  const [pageInput, setPageInput] = useState('')

  // the chapter you are in = the last one that starts on or before this page
  const currentIndex = chapters.reduce((found, c, i) => (c.page <= currentPage ? i : found), -1)

  const goToPage = (e) => {
    e.preventDefault()
    const n = parseInt(pageInput, 10)
    if (!n || n < 1 || n > totalPages) return toast.error(`Enter a page from 1 to ${totalPages}`)
    onGo(n)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 80, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'flex-end', alignItems: isMobile ? 'flex-end' : 'stretch',
    }}>
      <aside onClick={e => e.stopPropagation()} style={{
        backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
        width: isMobile ? '100%' : '380px', maxHeight: isMobile ? '80vh' : 'none',
        borderRadius: isMobile ? '16px 16px 0 0' : 0,
        display: 'flex', flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '22px', fontWeight: 400, color: colors.text }}>Contents</h2>
          <button onClick={onClose} aria-label="Close contents" style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.muted, minWidth: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={goToPage} style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <input value={pageInput} onChange={e => setPageInput(e.target.value)} inputMode="numeric"
            placeholder={`Go to page (1-${totalPages})`}
            style={{
              flex: 1, border: `1px solid ${colors.border}`, borderRadius: '999px', padding: '10px 16px',
              backgroundColor: colors.card, color: colors.text, outline: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '14px',
            }} />
          <button type="submit" style={{
            backgroundColor: accent, color: colors.bg, border: 'none', borderRadius: '999px', padding: '10px 18px',
            cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>Go</button>
        </form>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {chapters.length === 0 && (
            <p style={{ padding: '24px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: colors.muted }}>
              This book has no chapter headings. Use the page box above.
            </p>
          )}
          {chapters.map((c, i) => (
            <button key={`${c.page}-${i}`} onClick={() => (c.locked ? toast('Buy this book to read this chapter') : onGo(c.page))} style={{
              width: '100%', textAlign: 'left', background: i === currentIndex ? colors.card : 'none',
              border: 'none', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer',
              padding: '14px 20px', minHeight: '52px', display: 'flex', alignItems: 'center', gap: '12px',
              opacity: c.locked ? 0.55 : 1,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: i === currentIndex ? accent : colors.text }}>{c.label || `Chapter ${i + 1}`}</div>
                {c.title && (
                  <div style={{ fontFamily: 'Newsreader, serif', fontSize: '15px', color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                )}
              </div>
              {i === currentIndex && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Manrope, sans-serif', fontSize: '11px', fontWeight: 700, color: accent, whiteSpace: 'nowrap' }}>
                  <Bookmark size={14} fill={accent} /> You are here
                </span>
              )}
              {c.locked ? <Lock size={14} color={colors.muted} /> : (
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: colors.muted }}>p. {c.page}</span>
              )}
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
