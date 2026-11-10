import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import useWindowSize from '../hooks/useWindowSize'
import { ACCENT, ACCENT_DARK, COLORS } from '../constants'

export default function Footer() {
  const { darkMode } = useTheme()
  const { user } = useAuthStore()
  const { isMobile } = useWindowSize()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT

  const link = {
    fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: colors.muted,
    textDecoration: 'none',
  }
  const heading = {
    fontFamily: 'Manrope, sans-serif', fontSize: '11px', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.text, marginBottom: '14px',
  }
  const column = { display: 'flex', flexDirection: 'column', gap: '10px' }

  return (
    <footer style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bg, marginTop: '48px' }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '32px 16px 24px' : '48px 24px 32px',
        display: 'grid', gap: '40px',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr',
      }}>
        <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
          <Link to="/" style={{
            fontFamily: 'Newsreader, serif', fontSize: '28px', fontStyle: 'italic',
            color: accent, textDecoration: 'none', letterSpacing: '-0.02em',
          }}>Shelf</Link>
          <p style={{ ...link, marginTop: '12px', maxWidth: '320px', lineHeight: '1.7' }}>
            A quiet digital library. Preview before you buy, and read in your browser.
          </p>
        </div>

        <div>
          <div style={heading}>Explore</div>
          <div style={column}>
            <Link to="/browse" style={link}>Browse books</Link>
            <Link to="/browse?sort=rating" style={link}>Top rated</Link>
            <Link to="/browse?sort=popular" style={link}>Popular</Link>
          </div>
        </div>

        <div>
          <div style={heading}>Account</div>
          <div style={column}>
            {user ? (
              <>
                <Link to="/dashboard" style={link}>My library</Link>
                <Link to="/profile" style={link}>Settings</Link>
              </>
            ) : (
              <>
                <Link to="/login" style={link}>Sign in</Link>
                <Link to="/register" style={link}>Create account</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${colors.border}` }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '16px' : '20px 24px',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
        }}>
          <span style={{ ...link, fontSize: '12px' }}>© {new Date().getFullYear()} Shelf</span>
        </div>
      </div>
    </footer>
  )
}
