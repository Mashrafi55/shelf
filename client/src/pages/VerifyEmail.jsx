import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import AuthCard from '../components/AuthCard'
import useAuthStyles from '../hooks/useAuthStyles'
import useAuthStore from '../store/authStore'
import { API } from '../constants'

function VerifyEmail() {
  const { accent, text } = useAuthStyles()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { user, setUser } = useAuthStore()
  const [status, setStatus] = useState(token ? 'working' : 'error')
  const [message, setMessage] = useState(token ? '' : 'This link is incomplete.')

  useEffect(() => {
    if (!token) return
    axios.post(`${API}/auth/verify-email`, { token })
      .then(() => {
        setStatus('done')
        if (user) setUser({ ...user, emailVerified: true })
      })
      .catch(error => {
        setStatus('error')
        setMessage(error.response?.data?.message || 'Something went wrong')
      })
    // run once per token
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <AuthCard title="Email verification">
      {status === 'working' && <p style={text}>Verifying your email...</p>}
      {status === 'done' && (
        <p style={text}>Your email is verified. <Link to="/" style={{ color: accent }}>Continue to Shelf</Link></p>
      )}
      {status === 'error' && (
        <p style={text}>{message} {user
          ? 'Use the banner at the top of the site to request a new link.'
          : <Link to="/login" style={{ color: accent }}>Log in to request a new one.</Link>}
        </p>
      )}
    </AuthCard>
  )
}

export default VerifyEmail
