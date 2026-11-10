import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import AuthCard from '../components/AuthCard'
import useAuthStyles from '../hooks/useAuthStyles'
import { API } from '../constants'

function ForgotPassword() {
  const { accent, label, input, button, text } = useAuthStyles()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post(`${API}/auth/forgot-password`, { email })
      setSent(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Forgot your password?">
      {sent ? (
        <p style={text}>If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires in 1 hour.</p>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p style={text}>Enter your email and we'll send you a link to choose a new password.</p>
          <div>
            <label style={label}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" style={input} />
          </div>
          <button type="submit" disabled={loading} style={button(loading)}>
            {loading ? 'Please wait...' : 'Send reset link'}
          </button>
        </form>
      )}
      <p style={{ ...text, textAlign: 'center', marginTop: '24px' }}>
        <Link to="/login" style={{ color: accent }}>Back to login</Link>
      </p>
    </AuthCard>
  )
}

export default ForgotPassword
