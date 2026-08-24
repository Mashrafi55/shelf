import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import BookDetail from './pages/BookDetail'
import Reader from './pages/Reader'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

function App() {

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '64px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/read/:id" element={<Reader />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </>
  )
}

export default App