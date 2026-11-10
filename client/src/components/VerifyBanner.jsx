import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import useAuthStyles from '../hooks/useAuthStyles'
import { API } from '../constants'

// Shown only when the server explicitly says the email is unverified (older sessions have no flag)
function VerifyBanner() {
  const { user } = useAuthStore()
  const { colors, accent } = useAuthStyles()
  const [sending, setSending] = useState(false)

  if (!user || user.emailVerified !== false) return null

  const resend = async () => {
    setSending(true)
    try {
      const { data } = await axios.post(`${API}/auth/resend-verification`, {},
        { headers: { Authorization: `Bearer ${user.token}` }, withCredentials: true })
      toast.success(data.message)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      textAlign: 'center', padding: '8px 16px', backgroundColor: colors.card, borderBottom: `1px solid ${colors.border}`,
      fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: colors.text,
    }}>
      Please verify your email address — check your inbox.{' '}
      <button onClick={resend} disabled={sending} style={{
        background: 'none', border: 'none', cursor: 'pointer', color: accent,
        fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 700, textDecoration: 'underline',
      }}>{sending ? 'Sending...' : 'Resend link'}</button>
    </div>
  )
}

export default VerifyBanner
