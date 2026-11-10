import { Link } from 'react-router-dom'
import useAuthStyles from '../hooks/useAuthStyles'

// Shared centred card for the login-style pages (forgot / reset / verify)
function AuthCard({ title, children }) {
  const { colors, accent } = useAuthStyles()
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: colors.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        backgroundColor: colors.card, borderRadius: '16px', padding: 'clamp(24px, 6vw, 48px)',
        width: '100%', maxWidth: '440px', boxShadow: '0 40px 80px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{
            fontFamily: 'Newsreader, serif', fontSize: '42px', fontStyle: 'italic',
            color: accent, textDecoration: 'none', letterSpacing: '-0.02em',
          }}>Shelf</Link>
          <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', fontWeight: 400, color: colors.text, marginTop: '16px' }}>{title}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}

export default AuthCard
