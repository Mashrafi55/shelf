import { useState, useEffect, useRef } from 'react'
import { Bookmark, Plus, Check, ChevronDown, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { ACCENT, ACCENT_DARK, COLORS, LIBRARY_STATUSES } from '../constants'

// "Reading v" button with a folder menu: Reading / Completed / On-Hold / Plan to Read / Dropped / Unfollow.
// status: current folder id or null. onChange(statusId | null) - null means unfollow.
export default function LibraryStatusMenu({ status, onChange }) {
  const { darkMode } = useTheme()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // close when clicking anywhere else or pressing Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const current = LIBRARY_STATUSES.find(s => s.id === status)
  const pick = (value) => { setOpen(false); onChange(value) }

  const item = (selected) => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left',
    background: 'none', border: 'none', cursor: 'pointer', padding: '12px 16px', minHeight: '44px',
    fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: selected ? 700 : 500,
    color: selected ? accent : colors.text,
  })

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <button onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        backgroundColor: current ? (darkMode ? 'rgba(184,132,90,0.15)' : 'rgba(92,51,23,0.07)') : 'transparent',
        color: accent, border: `1px solid ${accent}`, padding: '14px', borderRadius: '999px', cursor: 'pointer',
        minHeight: '48px', fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {current ? <Bookmark size={16} fill={accent} /> : <Plus size={16} />}
        {current ? current.label : 'Add to library'}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div role="menu" style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 30, minWidth: '200px',
          backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px 4px', fontFamily: 'Manrope, sans-serif', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em', color: colors.muted,
          }}>Move to folder</div>
          {LIBRARY_STATUSES.map(s => (
            <button key={s.id} role="menuitem" onClick={() => pick(s.id)} style={item(s.id === status)}>
              <span style={{ width: '16px', display: 'flex' }}>{s.id === status && <Check size={16} />}</span>
              {s.label}
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${colors.border}` }} />
          <button role="menuitem" disabled={!status} onClick={() => pick(null)} style={{ ...item(false), color: colors.muted, opacity: status ? 1 : 0.5, cursor: status ? 'pointer' : 'not-allowed' }}>
            <span style={{ width: '16px', display: 'flex' }}><X size={16} /></span>
            Unfollow
          </button>
        </div>
      )}
    </div>
  )
}
