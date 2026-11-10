import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { API, ACCENT, ACCENT_DARK, COLORS } from '../constants'

const font = 'Manrope, sans-serif'

function Profile() {
  const { darkMode } = useTheme()
  const { user, setUser } = useAuthStore()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT
  const headers = { Authorization: `Bearer ${user.token}` }

  const [name, setName] = useState(user.name)
  const [savingName, setSavingName] = useState(false)
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)

  const card = { backgroundColor: colors.card, borderRadius: '16px', padding: '32px', border: `1px solid ${colors.border}`, marginBottom: '24px' }
  const label = { fontFamily: font, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.muted, display: 'block', marginBottom: '8px' }
  const input = {
    width: '100%', background: 'none', border: 'none', borderBottom: `1px solid ${colors.border}`,
    padding: '8px 0', fontFamily: font, fontSize: '16px', color: colors.text, outline: 'none',
  }
  const button = (busy) => ({
    backgroundColor: accent, color: colors.bg, border: 'none', borderRadius: '999px', padding: '12px 28px',
    fontFamily: font, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em',
    fontWeight: '700', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
  })

  const saveName = async (e) => {
    e.preventDefault()
    setSavingName(true)
    try {
      await axios.put(`${API}/user/profile`, { name }, { headers })
      setUser({ ...user, name: name.trim() })
      toast.success('Name updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setSavingName(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match')
    setSavingPw(true)
    try {
      await axios.put(`${API}/user/password`,
        { currentPassword: pw.currentPassword, newPassword: pw.newPassword }, { headers })
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      toast.success('Password updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', padding: '48px 16px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <p style={{ fontFamily: font, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, fontWeight: '600', marginBottom: '8px' }}>
          Account
        </p>
        <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: '36px', fontWeight: 400, color: colors.text, marginBottom: '32px' }}>
          Profile settings
        </h1>

        <form onSubmit={saveName} style={card}>
          <div style={{ marginBottom: '24px' }}>
            <label style={label}>Email</label>
            <p style={{ fontFamily: font, fontSize: '16px', color: colors.text }}>
              {user.email}{' '}
              <span style={{ fontSize: '12px', color: user.emailVerified === false ? colors.muted : '#4a7a4a' }}>
                {user.emailVerified === false ? '(not verified)' : user.emailVerified ? '(verified)' : ''}
              </span>
            </p>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={label}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required maxLength={60} style={input} />
          </div>
          <button type="submit" disabled={savingName || !name.trim() || name.trim() === user.name} style={button(savingName)}>
            {savingName ? 'Saving...' : 'Save name'}
          </button>
        </form>

        <form onSubmit={savePassword} style={card}>
          <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '22px', fontWeight: 400, color: colors.text, marginBottom: '24px' }}>
            Change password
          </h2>
          {[
            ['currentPassword', 'Current password'],
            ['newPassword', 'New password'],
            ['confirm', 'Confirm new password'],
          ].map(([field, text]) => (
            <div key={field} style={{ marginBottom: '24px' }}>
              <label style={label}>{text}</label>
              <input type="password" required minLength={field === 'currentPassword' ? 1 : 8}
                value={pw[field]} onChange={e => setPw({ ...pw, [field]: e.target.value })}
                autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'} style={input} />
            </div>
          ))}
          <button type="submit" disabled={savingPw} style={button(savingPw)}>
            {savingPw ? 'Saving...' : 'Update password'}
          </button>
        </form>

        <p style={{ fontFamily: font, fontSize: '14px', color: colors.muted }}>
          <Link to="/onboarding" style={{ color: accent }}>Change favourite genres</Link>
          {' · '}
          <Link to="/dashboard" style={{ color: accent }}>Back to my library</Link>
        </p>
      </div>
    </div>
  )
}

export default Profile
