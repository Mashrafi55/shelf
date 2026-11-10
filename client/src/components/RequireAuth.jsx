import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

// Route guard: send visitors to /login (remembering where they were going),
// and non-admins away from admin-only pages. The server enforces the same
// rules on every API call; this just avoids rendering pages that cannot work.
function RequireAuth({ role, children }) {
  const { user } = useAuthStore()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default RequireAuth
