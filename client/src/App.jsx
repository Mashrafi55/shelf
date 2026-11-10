import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import BookDetail from './pages/BookDetail'
import Reader from './pages/Reader'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Browse from './pages/Browse'
import Profile from './pages/Profile'
import RequireAuth from './components/RequireAuth'
import VerifyBanner from './components/VerifyBanner'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'

function App() {

  return (
    <>
      <Navbar />
      <VerifyBanner />
      <main style={{ paddingTop: '64px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/read/:id" element={<Reader />} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth role="admin"><Admin /></RequireAuth>} />
        </Routes>
      </main>
    </>
  )
}

export default App