import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, User, LogOut, Menu, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { ACCENT, ACCENT_DARK, COLORS } from '../constants'
import useWindowSize from '../hooks/useWindowSize'

function Navbar() {
  const { darkMode, toggleDarkMode } = useTheme()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const [menuOpen, setMenuOpen] = useState(false)

  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <header style={{
      backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}`,
      position: 'fixed', top: 0, width: '100%', zIndex: 50,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto', padding: '0 24px',
        height: '64px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link to="/" style={{
          fontFamily: 'Newsreader, serif', fontSize: '28px',
          fontStyle: 'italic', color: accent,
          textDecoration: 'none', letterSpacing: '-0.02em',
        }}>Shelf</Link>

        {/* Desktop Nav */}
        {!isMobile && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link to="/" style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '13px',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: colors.text, textDecoration: 'none', fontWeight: '600',
            }}>Browse</Link>

            {user ? (
              <>
                <Link to="/dashboard" style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: colors.text, textDecoration: 'none', fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <User size={15} /> {user.name?.split(' ')[0]}
                </Link>
                <button onClick={handleLogout} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: colors.muted, display: 'flex', alignItems: 'center',
                }}>
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: colors.text, textDecoration: 'none', fontWeight: '600',
                }}>Login</Link>
                <Link to="/register" style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  backgroundColor: accent, color: colors.bg,
                  textDecoration: 'none', padding: '8px 20px',
                  borderRadius: '999px', fontWeight: '600',
                }}>Join</Link>
              </>
            )}

            <button onClick={toggleDarkMode} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: colors.text, display: 'flex', alignItems: 'center', padding: '4px',
            }}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </nav>
        )}

        {/* Mobile right side */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={toggleDarkMode} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: colors.text, display: 'flex', alignItems: 'center',
            }}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: colors.text, display: 'flex', alignItems: 'center',
            }}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobile && menuOpen && (
        <div style={{
          backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}`,
          padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
          <Link to="/" onClick={() => setMenuOpen(false)} style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '14px',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            color: colors.text, textDecoration: 'none', fontWeight: '600',
          }}>Browse</Link>

          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '14px',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                color: colors.text, textDecoration: 'none', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <User size={16} /> {user.name?.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: colors.muted, fontFamily: 'Manrope, sans-serif',
                fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '14px',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                color: colors.text, textDecoration: 'none', fontWeight: '600',
              }}>Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '14px',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                backgroundColor: accent, color: colors.bg,
                textDecoration: 'none', padding: '12px 20px',
                borderRadius: '999px', fontWeight: '600', textAlign: 'center',
              }}>Join</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}

export default Navbar