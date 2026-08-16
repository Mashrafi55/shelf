import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { API, ACCENT, ACCENT_DARK, COLORS, GENRES } from '../constants'

function Onboarding() {
  const { darkMode } = useTheme()
  const { user, setUser } = useAuthStore()
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT

  const toggleGenre = (genre) => {
    setSelected(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    )
  }

  const selectAll = () => setSelected(GENRES)
  const clearAll = () => setSelected([])

  const handleSubmit = async () => {
    if (selected.length === 0) return toast.error('Pick at least one genre')
    setLoading(true)
    try {
      await axios.put(`${API}/user/genres`, { genres: selected }, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      setUser({ ...user, onboardingComplete: true })
      toast.success('Your shelf is ready!')
      navigate('/')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      backgroundColor: colors.bg, minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ maxWidth: '640px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: accent, fontWeight: '600', marginBottom: '16px',
          }}>Welcome to Shelf</p>
          <h1 style={{
            fontFamily: 'Newsreader, serif', fontSize: '40px',
            color: colors.text, fontWeight: '400', lineHeight: '1.2', marginBottom: '12px',
          }}>What do you love to read?</h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', color: colors.muted, lineHeight: '1.7' }}>
            Pick your favourite genres and we'll recommend books you'll love.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px' }}>
          <button onClick={selectAll} style={{
            background: 'none', border: `1px solid ${colors.border}`, borderRadius: '999px',
            padding: '6px 16px', fontFamily: 'Manrope, sans-serif', fontSize: '12px',
            color: colors.muted, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>Select All</button>
          <button onClick={clearAll} style={{
            background: 'none', border: `1px solid ${colors.border}`, borderRadius: '999px',
            padding: '6px 16px', fontFamily: 'Manrope, sans-serif', fontSize: '12px',
            color: colors.muted, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>Clear</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '48px' }}>
          {GENRES.map(genre => {
            const isSelected = selected.includes(genre)
            return (
              <button key={genre} onClick={() => toggleGenre(genre)} style={{
                padding: '10px 20px', borderRadius: '999px',
                fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                fontWeight: isSelected ? '700' : '400',
                cursor: 'pointer', transition: 'all 0.2s ease',
                backgroundColor: isSelected ? accent : 'transparent',
                color: isSelected ? colors.bg : colors.text,
                border: isSelected ? `1px solid ${accent}` : `1px solid ${colors.border}`,
              }}>{genre}</button>
            )
          })}
        </div>

        {selected.length > 0 && (
          <p style={{
            textAlign: 'center', fontFamily: 'Manrope, sans-serif',
            fontSize: '13px', color: colors.muted, marginBottom: '24px',
          }}>{selected.length} genre{selected.length > 1 ? 's' : ''} selected</p>
        )}

        <button onClick={handleSubmit} disabled={loading || selected.length === 0} style={{
          width: '100%', backgroundColor: accent, color: colors.bg,
          border: 'none', padding: '16px', borderRadius: '999px',
          fontFamily: 'Manrope, sans-serif', fontSize: '13px',
          textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700',
          cursor: loading || selected.length === 0 ? 'not-allowed' : 'pointer',
          opacity: loading || selected.length === 0 ? 0.5 : 1,
        }}>
          {loading ? 'Setting up your shelf...' : 'Build My Shelf →'}
        </button>

        <button onClick={() => navigate('/')} style={{
          display: 'block', width: '100%', textAlign: 'center', marginTop: '16px',
          background: 'none', border: 'none', fontFamily: 'Manrope, sans-serif',
          fontSize: '13px', color: colors.muted, cursor: 'pointer', textDecoration: 'underline',
        }}>Skip for now</button>
      </div>
    </div>
  )
}

export default Onboarding