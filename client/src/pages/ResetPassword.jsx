import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import AuthCard from '../components/AuthCard'
import useAuthStyles from '../hooks/useAuthStyles'
import { API } from '../constants'

function ResetPassword() {
  const { accent, label, input, button, text } = useAuthStyles()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/auth/reset-password`, { token, password })
      toast.success(data.message)
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthCard title="Reset link missing">
        <p style={text}>This link is incomplete. <Link to="/forgot-password" style={{ color: accent }}>Request a new one.</Link></p>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={label}>New password</label>
          <input type="password" required minLength={8} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" style={input} />
        </div>
        <div>
          <label style={label}>Confirm password</label>
          <input type="password" required minLength={8} value={confirm}
            onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" style={input} />
        </div>
        <button type="submit" disabled={loading} style={button(loading)}>
          {loading ? 'Please wait...' : 'Update password'}
        </button>
      </form>
    </AuthCard>
  )
}

export default ResetPassword
