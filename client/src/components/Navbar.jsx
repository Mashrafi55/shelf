import { Link } from 'react-router-dom'
import { Search, Sun, Moon, Menu, X } from 'lucide-react'
import { useState } from 'react'

function Navbar({ darkMode, toggleDarkMode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header style={{
      backgroundColor: darkMode ? '#1a1917' : '#f5f0e8',
      borderBottom: `1px solid ${darkMode ? '#2d2b29' : '#e8e0d0'}`,
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 50,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <Link to="/" style={{
          fontFamily: 'Newsreader, serif',
          fontSize: '28px',
          fontStyle: 'italic',
          color: '#3d6b5a',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
        }}>
          Shelf
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link to="/" style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: darkMode ? '#f5f0e8' : '#1a1917',
            textDecoration: 'none',
            opacity: 1,
            fontWeight: '600',
            }}>Browse</Link>

            <Link to="/login" style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: darkMode ? '#f5f0e8' : '#1a1917',
            textDecoration: 'none',
            opacity: 1,
            fontWeight: '600',
            }}>Login</Link>

            <Link to="/register" style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: '#3d6b5a',
            color: '#f5f0e8',
            textDecoration: 'none',
            padding: '8px 20px',
            borderRadius: '999px',
            opacity: 1,
            fontWeight: '600',
            }}>Join</Link>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: darkMode ? '#f5f0e8' : '#1a1917',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Navbar