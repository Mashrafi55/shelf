import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, User, LogOut } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'

function Navbar() {
  const { darkMode, toggleDarkMode } = useTheme()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header style={{
      backgroundColor: darkMode ? '#1a1917' : '#f5f0e8',
      borderBottom: `1px solid ${darkMode ? '#2d2b29' : '#e8e0d0'}`,
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
          fontStyle: 'italic', color: '#c4502e',
          textDecoration: 'none', letterSpacing: '-0.02em',
        }}>Shelf</Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '13px',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            color: darkMode ? '#f5f0e8' : '#1a1917',
            textDecoration: 'none', fontWeight: '600',
          }}>Browse</Link>

          {user ? (
            <>
              <Link to="/dashboard" style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                color: darkMode ? '#f5f0e8' : '#1a1917',
                textDecoration: 'none', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <User size={15} /> {user.name?.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: darkMode ? '#9a9490' : '#6b6860',
                display: 'flex', alignItems: 'center',
              }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                color: darkMode ? '#f5f0e8' : '#1a1917',
                textDecoration: 'none', fontWeight: '600',
              }}>Login</Link>
              <Link to="/register" style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                backgroundColor: '#c4502e', color: '#f5f0e8',
                textDecoration: 'none', padding: '8px 20px',
                borderRadius: '999px', fontWeight: '600',
              }}>Join</Link>
            </>
          )}

          <button onClick={toggleDarkMode} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: darkMode ? '#f5f0e8' : '#1a1917',
            display: 'flex', alignItems: 'center', padding: '4px',
          }}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Navbar