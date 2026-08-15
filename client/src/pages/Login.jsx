import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { API, ACCENT } from '../constants'

function Login() {
  const { darkMode } = useTheme()
  const { setUser } = useAuthStore()
  const [tab, setTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const navigate = useNavigate()

  const bg = darkMode ? '#1a1917' : '#f5f0e8'
  const card = darkMode ? '#2d2b29' : '#ffffff'
  const text = darkMode ? '#f5f0e8' : '#1a1917'
  const muted = darkMode ? '#9a9490' : '#6b6860'
  const border = darkMode ? '#3d3b39' : '#e8e0d0'

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const url = tab === 'login' ? '/auth/login' : '/auth/register'
      const payload = tab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }

      const { data } = await axios.post(`${API}${url}`, payload, { withCredentials: true })
      setUser(data)
      toast.success(tab === 'login' ? 'Welcome back!' : 'Account created!')

      if (tab === 'register' && !data.onboardingComplete) {
        navigate('/onboarding')
      } else {
        navigate('/')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        backgroundColor: card, borderRadius: '16px', padding: '48px',
        width: '100%', maxWidth: '440px', boxShadow: '0 40px 80px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link to="/" style={{
            fontFamily: 'Newsreader, serif', fontSize: '42px', fontStyle: 'italic',
            color: ACCENT, textDecoration: 'none', letterSpacing: '-0.02em',
          }}>Shelf</Link>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: muted, marginTop: '6px',
          }}>The Digital Library</p>
        </div>

        <div style={{ display: 'flex', gap: '32px', borderBottom: `1px solid ${border}`, marginBottom: '36px' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontFamily: 'Newsreader, serif', fontSize: '22px', background: 'none',
              border: 'none', cursor: 'pointer',
              color: tab === t ? ACCENT : muted,
              paddingBottom: '12px',
              borderBottom: tab === t ? `2px solid ${ACCENT}` : '2px solid transparent',
              marginBottom: '-1px', textTransform: 'capitalize',
              fontWeight: tab === t ? '600' : '400',
            }}>{t === 'login' ? 'Login' : 'Register'}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {tab === 'register' && (
            <div>
              <label style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '12px', textTransform: 'uppercase',
                letterSpacing: '0.05em', color: muted, display: 'block', marginBottom: '8px',
              }}>Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your name"
                style={{
                  width: '100%', background: 'none', border: 'none',
                  borderBottom: `1px solid ${border}`, padding: '8px 0',
                  fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: text, outline: 'none',
                }} />
            </div>
          )}

          <div>
            <label style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '12px', textTransform: 'uppercase',
              letterSpacing: '0.05em', color: muted, display: 'block', marginBottom: '8px',
            }}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="your@email.com" style={{
                width: '100%', background: 'none', border: 'none',
                borderBottom: `1px solid ${border}`, padding: '8px 0',
                fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: text, outline: 'none',
              }} />
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '12px', textTransform: 'uppercase',
              letterSpacing: '0.05em', color: muted, display: 'block', marginBottom: '8px',
            }}>Password</label>
            <input name="password" type={showPassword ? 'text' : 'password'}
              value={form.password} onChange={handleChange} placeholder="••••••••"
              style={{
                width: '100%', background: 'none', border: 'none',
                borderBottom: `1px solid ${border}`, padding: '8px 0',
                fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: text,
                outline: 'none', paddingRight: '32px',
              }} />
            <button onClick={() => setShowPassword(!showPassword)} style={{
              position: 'absolute', right: 0, bottom: '8px', background: 'none',
              border: 'none', cursor: 'pointer', color: muted,
            }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', backgroundColor: ACCENT, color: '#f5f0e8', border: 'none',
            borderRadius: '999px', padding: '14px', fontFamily: 'Manrope, sans-serif',
            fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em',
            fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: '8px',
          }}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login