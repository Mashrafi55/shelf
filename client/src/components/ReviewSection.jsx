import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { API, ACCENT, ACCENT_DARK, COLORS } from '../constants'

const font = 'Manrope, sans-serif'

function Stars({ value, onChange, size = 12, accent }) {
  return (
    <div style={{ display: 'flex', gap: onChange ? '6px' : '2px' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size} fill={s <= value ? accent : 'none'} color={accent}
          style={onChange ? { cursor: 'pointer' } : undefined}
          onClick={onChange ? () => onChange(s) : undefined} />
      ))}
    </div>
  )
}

// Lists reviews, lets a signed-in user write / edit / delete their own, and lets admins remove any
function ReviewSection({ bookId, reviews, onChange }) {
  const { darkMode } = useTheme()
  const { user } = useAuthStore()
  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT

  const mine = user ? reviews.find(r => r.user?._id === user._id) : null
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const headers = { Authorization: `Bearer ${user?.token}` }
  const showForm = user && (!mine || editing)

  const run = async (request, success) => {
    setBusy(true)
    try {
      await request()
      toast.success(success)
      setEditing(false)
      setRating(0)
      setComment('')
      onChange()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const submit = () => {
    if (!rating) return toast.error('Pick a star rating first')
    const body = { rating, comment }
    run(
      () => mine
        ? axios.put(`${API}/books/${bookId}/reviews`, body, { headers })
        : axios.post(`${API}/books/${bookId}/reviews`, body, { headers }),
      mine ? 'Review updated' : 'Thanks for your review!'
    )
  }

  const startEdit = () => {
    setRating(mine.rating)
    setComment(mine.comment || '')
    setEditing(true)
  }

  const removeMine = () => {
    if (confirm('Delete your review?')) {
      run(() => axios.delete(`${API}/books/${bookId}/reviews`, { headers }), 'Review deleted')
    }
  }

  const removeAsAdmin = (id) => {
    if (confirm('Remove this review?')) {
      run(() => axios.delete(`${API}/admin/reviews/${id}`, { headers }), 'Review removed')
    }
  }

  const linkButton = {
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
    fontFamily: font, fontSize: '12px', color: accent, textDecoration: 'underline',
  }

  return (
    <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '48px' }}>
      <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '32px', color: colors.text, marginBottom: '32px', fontWeight: '400' }}>
        Reviews
      </h2>

      {!user && (
        <p style={{ fontFamily: font, fontSize: '14px', color: colors.muted, marginBottom: '32px' }}>
          <Link to="/login" style={{ color: accent }}>Log in</Link> to write a review.
        </p>
      )}

      {showForm && (
        <div style={{
          backgroundColor: colors.card, borderRadius: '12px', padding: '24px',
          border: `1px solid ${colors.border}`, marginBottom: '32px',
        }}>
          <p style={{ fontFamily: font, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.muted, marginBottom: '12px' }}>
            {mine ? 'Edit your review' : 'Write a review'}
          </p>
          <Stars value={rating} onChange={setRating} size={22} accent={accent} />
          <textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={2000} rows={3}
            placeholder="What did you think? (optional)"
            style={{
              width: '100%', marginTop: '16px', background: 'none', resize: 'vertical',
              border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px',
              fontFamily: font, fontSize: '14px', color: colors.text, outline: 'none',
            }} />
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
            <button onClick={submit} disabled={busy} style={{
              backgroundColor: accent, color: colors.bg, border: 'none', borderRadius: '999px',
              padding: '10px 24px', fontFamily: font, fontSize: '12px', textTransform: 'uppercase',
              letterSpacing: '0.08em', fontWeight: '700', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
            }}>{mine ? 'Save changes' : 'Submit'}</button>
            {editing && <button onClick={() => setEditing(false)} style={linkButton}>Cancel</button>}
          </div>
        </div>
      )}

      {reviews.length === 0 && (
        <p style={{ fontFamily: font, fontSize: '14px', color: colors.muted }}>No reviews yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {reviews.map(review => {
          const isMine = mine && review._id === mine._id
          return (
            <div key={review._id} style={{
              backgroundColor: colors.card, borderRadius: '12px',
              padding: '24px', border: `1px solid ${colors.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', backgroundColor: accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: colors.bg, fontFamily: font, fontSize: '14px', fontWeight: '700',
                }}>{review.user?.name?.[0]?.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: font, fontSize: '14px', color: colors.text, fontWeight: '600' }}>
                    {review.user?.name}{isMine && ' (you)'}
                  </p>
                  <Stars value={review.rating} accent={accent} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {isMine && <>
                    <button onClick={startEdit} style={linkButton}>Edit</button>
                    <button onClick={removeMine} style={linkButton}>Delete</button>
                  </>}
                  {!isMine && user?.role === 'admin' && (
                    <button onClick={() => removeAsAdmin(review._id)} style={linkButton}>Remove</button>
                  )}
                </div>
              </div>
              {review.comment && (
                <p style={{ fontFamily: font, fontSize: '14px', color: colors.muted, lineHeight: '1.7' }}>{review.comment}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ReviewSection
