import { useTheme } from '../context/ThemeContext'
import { ACCENT, ACCENT_DARK, COLORS } from '../constants'

// Shared form styles for the login-style pages (forgot / reset / verify)
export default function useAuthStyles() {
  const { darkMode } = useTheme()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT
  const label = {
    fontFamily: 'Manrope, sans-serif', fontSize: '12px', textTransform: 'uppercase',
    letterSpacing: '0.05em', color: colors.muted, display: 'block', marginBottom: '8px',
  }
  const input = {
    width: '100%', background: 'none', border: 'none',
    borderBottom: `1px solid ${colors.border}`, padding: '8px 0',
    fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: colors.text, outline: 'none',
  }
  const button = (loading) => ({
    width: '100%', backgroundColor: accent, color: colors.bg, border: 'none',
    borderRadius: '999px', padding: '14px', fontFamily: 'Manrope, sans-serif',
    fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em',
    fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
  })
  const text = { fontFamily: 'Manrope, sans-serif', fontSize: '14px', color: colors.muted, lineHeight: 1.6 }
  return { colors, accent, label, input, button, text }
}

