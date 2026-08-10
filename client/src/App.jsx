import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import BookDetail from './pages/BookDetail'
import Reader from './pages/Reader'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return JSON.parse(saved)
    const hour = new Date().getHours()
    return hour < 7 || hour >= 19
  })

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(prev => !prev)

  return (
    <>
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <main style={{ paddingTop: '64px' }}>
<Routes>
  <Route path="/" element={<Home darkMode={darkMode} />} />
  <Route path="/login" element={<Login darkMode={darkMode} />} />
  <Route path="/register" element={<Register darkMode={darkMode} />} />
  <Route path="/book/:id" element={<BookDetail darkMode={darkMode} />} />
  <Route path="/read/:id" element={<Reader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
</Routes>
      </main>
    </>
  )
}

export default App