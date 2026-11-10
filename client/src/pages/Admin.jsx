import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Users, BookOpen, DollarSign, X, Download, Search, Loader2, Upload } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'
import { API, ACCENT, ACCENT_DARK, COLORS, GENRES, coverSrc } from '../constants'
import useWindowSize from '../hooks/useWindowSize'

// fetches everything the admin dashboard shows (no React state in here)
const requestAdminData = async (token) => {
  const headers = { Authorization: `Bearer ${token}` }
  const [books, users, sales] = await Promise.all([
    axios.get(`${API}/admin/books`, { headers }),
    axios.get(`${API}/admin/users`, { headers }),
    axios.get(`${API}/admin/sales`, { headers }),
  ])
  return { books: books.data, users: users.data, sales: sales.data }
}

function Admin() {
  const { darkMode } = useTheme()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const [tab, setTab] = useState('books')
  const [books, setBooks] = useState([])
  const [users, setUsers] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [genreOpen, setGenreOpen] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInputRef = useRef(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkResults, setBulkResults] = useState([])
  const fileInputRef = useRef(null)
  const [importQuery, setImportQuery] = useState('')
  const [importResults, setImportResults] = useState([])
  const [importLoading, setImportLoading] = useState(false)
  const [importingId, setImportingId] = useState(null)
  const [form, setForm] = useState({
    title: '', author: '', description: '', coverImage: '',
    genre: 'Fiction', price: '', isFree: false, freePreviewPages: 4, isPublished: true,
    bookType: 'custom', gutenbergId: '', totalPages: 0, frontPages: 0,
    pages: [{ pageNumber: 1, chapterNumber: '', chapterTitle: '', content: '' }]
  })

  const colors = COLORS[darkMode ? 'dark' : 'light']
  const accent = darkMode ? ACCENT_DARK : ACCENT
  const headers = { Authorization: `Bearer ${user?.token}` }

  const token = user?.token

  const applyData = useCallback(({ books, users, sales }) => {
    setBooks(books)
    setUsers(users)
    setSales(sales)
  }, [])

  // re-load after saving / deleting something
  const fetchAll = useCallback(async () => {
    try {
      applyData(await requestAdminData(token))
    } catch {
      toast.error('Could not load admin data')
    } finally {
      setLoading(false)
    }
  }, [token, applyData])

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return }
    let cancelled = false
    requestAdminData(token)
      .then(data => { if (!cancelled) applyData(data) })
      .catch(() => { if (!cancelled) toast.error('Could not load admin data') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user, token, navigate, applyData])

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handlePageChange = (index, field, value) => {
    const newPages = form.pages.map((p, i) => i === index ? { ...p, [field]: value } : p)
    setForm(prev => ({ ...prev, pages: newPages }))
  }

  const addPage = () => {
    setForm(prev => ({
      ...prev,
      pages: [...prev.pages, { pageNumber: prev.pages.length + 1, chapterNumber: '', chapterTitle: '', content: '' }]
    }))
  }

  const removePage = (index) => {
    const newPages = form.pages.filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, pageNumber: i + 1 }))
    setForm(prev => ({ ...prev, pages: newPages }))
  }

  const openAdd = () => {
    setEditingBook(null)
    setForm({
      title: '', author: '', description: '', coverImage: '',
      genre: 'Fiction', price: '', isFree: false, freePreviewPages: 4, isPublished: true,
      bookType: 'custom', gutenbergId: '', totalPages: 0, frontPages: 0,
      pages: [{ pageNumber: 1, chapterNumber: '', chapterTitle: '', content: '' }]
    })
    setShowForm(true)
  }

  const openEdit = (book) => {
    setEditingBook(book)
    setForm({
      title: book.title, author: book.author, description: book.description,
      coverImage: book.coverImage, genre: book.genre, price: book.price,
      isFree: book.isFree, freePreviewPages: book.freePreviewPages, isPublished: book.isPublished !== false,
      bookType: book.bookType || 'custom',
      gutenbergId: book.gutenbergId || '',
      frontPages: book.frontPages || 0,
      totalPages: book.totalPages || (book.pages?.length || 0),
      pages: (book.pages?.length || 0) > 0
        ? book.pages.map(p => ({ chapterNumber: '', chapterTitle: '', ...p }))
        : [{ pageNumber: 1, chapterNumber: '', chapterTitle: '', content: '' }]
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.title || !form.author || !form.description || !form.coverImage) {
      return toast.error('Please fill all required fields')
    }
    try {
      const payload = {
        ...form,
        price: form.isFree ? 0 : Number(form.price),
        // only hand-written books carry their pages in the form; gutenberg pages are fetched on demand
        // and uploaded books keep theirs in the BookPage collection
        ...(form.bookType === 'custom' ? { pages: form.pages } : {}),
      }
      if (editingBook) {
        await axios.put(`${API}/admin/books/${editingBook._id}`, payload, { headers })
        toast.success('Book updated!')
      } else {
        await axios.post(`${API}/admin/books`, payload, { headers })
        toast.success('Book added!')
      }
      setShowForm(false)
      fetchAll()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    }
  }

  // make a draft visible to readers (the details can still be edited afterwards)
  const handlePublish = async (book) => {
    try {
      await axios.put(`${API}/admin/books/${book._id}`, { isPublished: true }, { headers })
      toast.success(`"${book.title}" is now published`)
      fetchAll()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not publish')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this book?')) return
    try {
      await axios.delete(`${API}/admin/books/${id}`, { headers })
      toast.success('Book deleted')
      setBooks(prev => prev.filter(b => b._id !== id))
    } catch {
      toast.error('Could not delete book')
    }
  }

  // upload your own cover image (JPEG / PNG / WebP, max 2 MB) and use it for this book
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast.error('Image is too large (max 2 MB)')
    setCoverUploading(true)
    try {
      const body = new FormData()
      body.append('image', file)
      const { data } = await axios.post(`${API}/admin/covers`, body, { headers })
      setForm(prev => ({ ...prev, coverImage: data.url }))
      toast.success('Cover uploaded. Save the book to keep it.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not upload the image')
    } finally {
      setCoverUploading(false)
    }
  }

  // PDF / EPUB / TXT -> draft book, then open its edit form so the details can be finished
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again
    if (!file) return
    if (file.size > 25 * 1024 * 1024) return toast.error('File is too large (max 25 MB)')
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const { data } = await axios.post(`${API}/admin/books/upload`, body, { headers })
      toast.success(`${data.pages} pages and ${data.chapters} chapters found. Finish the details, then publish.`)
      await fetchAll()
      openEdit(data.book)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not import this file')
    } finally {
      setUploading(false)
    }
  }

  // paste Gutenberg ids or links (one per line / comma separated) and add them one after another
  const handleBulkImport = async () => {
    const ids = [...new Set((bulkText.match(/\d+/g) || []).filter(n => n.length <= 8))].slice(0, 50)
    if (!ids.length) return toast.error('Paste at least one Gutenberg id or link')
    setBulkRunning(true)
    setBulkResults([])
    for (const id of ids) {
      let result
      try {
        const { data } = await axios.post(`${API}/admin/gutenberg/add/${id}`, {}, { headers })
        result = { id, ok: true, text: `Added: ${data.title}` }
      } catch (error) {
        const data = error.response?.data
        result = { id, ok: error.response?.status === 409, text: error.response?.status === 409 ? `Already have: ${data?.title}` : data?.message || 'Failed' }
      }
      setBulkResults(list => [...list, result])
    }
    setBulkRunning(false)
    fetchAll()
  }

  const openImport = () => {
    setImportQuery('')
    setImportResults([])
    setShowImport(true)
  }

  const handleGutenbergSearch = async (e) => {
    e.preventDefault()
    if (!importQuery.trim()) return
    setImportLoading(true)
    try {
      const { data } = await axios.get(`${API}/admin/gutenberg/search`, {
        params: { q: importQuery }, headers,
      })
      setImportResults(data)
      if (data.length === 0) toast.error('No books found')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Search failed')
    } finally {
      setImportLoading(false)
    }
  }

  const handleGutenbergImport = async (id) => {
    setImportingId(id)
    try {
      const { data } = await axios.post(`${API}/admin/gutenberg/import/${id}`, {}, { headers })
      setEditingBook(null)
      setForm({
        title: data.title, author: data.author, description: data.description,
        coverImage: data.coverImage, genre: GENRES.includes(data.genre) ? data.genre : 'Fiction',
        price: '', isFree: false, freePreviewPages: data.freePreviewPages,
        // gutenberg books store metadata only — pages are fetched on demand at read time
        bookType: 'gutenberg', gutenbergId: data.gutenbergId, totalPages: data.totalPages, frontPages: data.frontPages || 0,
        pages: [],
      })
      setShowImport(false)
      setShowForm(true)
      toast.success(`Imported ${data.totalPages} pages — review and save!`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Import failed')
    } finally {
      setImportingId(null)
    }
  }

  const totalRevenue = sales.reduce((acc, s) => acc + s.amountPaid, 0)

  const inputStyle = {
    width: '100%', background: 'none', border: 'none',
    borderBottom: `1px solid ${colors.border}`, padding: '8px 0',
    fontFamily: 'Manrope, sans-serif', fontSize: '15px',
    color: colors.text, outline: 'none', backgroundColor: 'transparent',
  }

  const labelStyle = {
    fontFamily: 'Manrope, sans-serif', fontSize: '11px',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: colors.muted, display: 'block', marginBottom: '6px',
  }

  const chapterInputStyle = {
    width: '100%', border: `1px solid ${colors.border}`, borderRadius: '8px',
    padding: '8px 12px', backgroundColor: colors.card,
    fontFamily: 'Manrope, sans-serif', fontSize: '13px',
    color: colors.text, outline: 'none',
  }

  if (loading) return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Newsreader, serif', fontSize: '24px', color: colors.muted, fontStyle: 'italic' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 24px' }}>

        <div style={{ marginBottom: isMobile ? '28px' : '48px' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: accent, fontWeight: '600', marginBottom: '8px',
          }}>Admin Panel</p>
          <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: isMobile ? '30px' : '40px', color: colors.text, fontWeight: '400' }}>
            Shelf Dashboard
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? '12px' : '24px', marginBottom: isMobile ? '28px' : '48px' }}>
          {[
            { label: 'Total Books', value: books.length, icon: <BookOpen size={20} /> },
            { label: 'Total Users', value: users.length, icon: <Users size={20} /> },
            { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: <DollarSign size={20} /> },
          ].map(stat => (
            <div key={stat.label} style={{
              backgroundColor: colors.card, borderRadius: '12px',
              padding: isMobile ? '16px' : '24px', border: `1px solid ${colors.border}`,
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <div style={{ color: accent }}>{stat.icon}</div>
              <div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.muted }}>{stat.label}</p>
                <p style={{ fontFamily: 'Newsreader, serif', fontSize: '28px', color: colors.text }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none' }}>
          {['books', 'users', 'sales'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '12px 20px', minHeight: '44px', background: 'none', border: 'none',
              borderBottom: tab === t ? `2px solid ${accent}` : '2px solid transparent',
              marginBottom: '-1px', cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '13px',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: tab === t ? accent : colors.muted,
              fontWeight: tab === t ? '700' : '400',
            }}>{t}</button>
          ))}
        </div>

        {tab === 'books' && (
          <div>
            <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
              <input ref={fileInputRef} type="file" accept=".pdf,.epub,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{
                backgroundColor: 'transparent', color: accent, border: `1px solid ${accent}`,
                padding: '12px 20px', borderRadius: '999px', cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1,
                fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: isMobile ? '1 1 100%' : 'none',
              }}>
                <Upload size={16} /> {uploading ? 'Reading file...' : 'Upload PDF / EPUB / TXT'}
              </button>
              <button onClick={openImport} style={{
                backgroundColor: 'transparent', color: accent, border: `1px solid ${accent}`,
                padding: '12px 20px', borderRadius: '999px', cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: isMobile ? '1 1 100%' : 'none',
              }}>
                <Download size={16} /> Import from Gutenberg
              </button>
              <button onClick={openAdd} style={{
                backgroundColor: accent, color: colors.bg, border: 'none',
                padding: '12px 20px', borderRadius: '999px', cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: isMobile ? '1 1 100%' : 'none',
              }}>
                <Plus size={16} /> Add Book
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {books.map(book => (
                <div key={book._id} style={{
                  backgroundColor: colors.card, borderRadius: '12px',
                  padding: '16px', border: `1px solid ${colors.border}`,
                  display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                }}>
                  <div style={{ width: '40px', height: '60px', borderRadius: '4px', overflow: 'hidden', backgroundColor: colors.border, flexShrink: 0 }}>
                    <img src={coverSrc(book.coverImage)} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                    <p style={{ fontFamily: 'Newsreader, serif', fontSize: '18px', color: colors.text }}>{book.title}{book.isPublished === false && (
                      <span style={{ marginLeft: '10px', fontFamily: 'Manrope, sans-serif', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b8845a', border: '1px solid #b8845a', borderRadius: '999px', padding: '2px 8px', verticalAlign: '3px' }}>Draft</span>
                    )}</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: colors.muted }}>{book.author} · {book.genre} · {book.isFree ? 'Free' : `$${book.price}`} · {book.bookType === 'gutenberg' ? '⚡ on-demand' : book.bookType === 'uploaded' ? 'uploaded' : ''} {book.totalPages || book.pages.length} pages</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {book.isPublished === false && (
                      <button onClick={() => handlePublish(book)} style={{
                        backgroundColor: accent, color: colors.bg, border: 'none', borderRadius: '8px',
                        padding: '0 14px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '11px',
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>Publish</button>
                    )}
                    <button onClick={() => openEdit(book)} style={{
                      background: 'none', border: `1px solid ${colors.border}`, borderRadius: '8px',
                      padding: '12px', cursor: 'pointer', color: colors.muted, display: 'flex', alignItems: 'center',
                    }}><Edit size={14} /></button>
                    <button onClick={() => handleDelete(book._id)} style={{
                      background: 'none', border: '1px solid #8b3a3a', borderRadius: '8px',
                      padding: '12px', cursor: 'pointer', color: '#8b3a3a', display: 'flex', alignItems: 'center',
                    }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {books.length === 0 && (
                <p style={{ textAlign: 'center', padding: '48px', fontFamily: 'Newsreader, serif', fontSize: '20px', color: colors.muted, fontStyle: 'italic' }}>
                  No books yet. Add your first book.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.map(u => (
              <div key={u._id} style={{
                backgroundColor: colors.card, borderRadius: '12px',
                padding: '16px', border: `1px solid ${colors.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: accent, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: colors.bg,
                    fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: '700',
                  }}>{u.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', color: colors.text, fontWeight: '600' }}>{u.name}</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: colors.muted, overflowWrap: 'anywhere' }}>{u.email}</p>
                  </div>
                </div>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '11px', textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: u.role === 'admin' ? accent : colors.muted, fontWeight: '600',
                }}>{u.role}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'sales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sales.map(sale => (
              <div key={sale._id} style={{
                backgroundColor: colors.card, borderRadius: '12px',
                padding: '16px', border: `1px solid ${colors.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px 16px',
              }}>
                <div>
                  <p style={{ fontFamily: 'Newsreader, serif', fontSize: '18px', color: colors.text }}>{sale.book?.title}</p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: colors.muted }}>{sale.user?.name} · {sale.user?.email}</p>
                </div>
                <p style={{ fontFamily: 'Newsreader, serif', fontSize: '20px', color: accent }}>${sale.amountPaid}</p>
              </div>
            ))}
            {sales.length === 0 && (
              <p style={{ textAlign: 'center', padding: '48px', fontFamily: 'Newsreader, serif', fontSize: '20px', color: colors.muted, fontStyle: 'italic' }}>
                No sales yet.
              </p>
            )}
          </div>
        )}
      </div>

      {showImport && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 100, display: 'flex', alignItems: 'flex-start',
          justifyContent: 'center', padding: isMobile ? '12px' : '24px', overflowY: 'auto',
        }}>
          <div style={{
            backgroundColor: colors.bg, borderRadius: '16px', padding: isMobile ? '24px 18px' : '40px',
            width: '100%', maxWidth: '560px', border: `1px solid ${colors.border}`, margin: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '28px', color: colors.text, fontWeight: '400' }}>
                Import from Gutenberg
              </h2>
              <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.muted }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: colors.muted, marginBottom: '24px' }}>
              Search 70,000+ public-domain classics. Pick one and we'll split it into pages for you.
            </p>

            <form onSubmit={handleGutenbergSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input
                value={importQuery}
                onChange={e => setImportQuery(e.target.value)}
                placeholder='Try "sherlock holmes" or "frankenstein"...'
                autoFocus
                style={{
                  flex: 1, border: `1px solid ${colors.border}`, borderRadius: '999px',
                  padding: '12px 18px', backgroundColor: colors.card,
                  fontFamily: 'Manrope, sans-serif', fontSize: '14px',
                  color: colors.text, outline: 'none',
                }}
              />
              <button type="submit" disabled={importLoading} style={{
                backgroundColor: accent, color: colors.bg, border: 'none',
                padding: '12px 18px', borderRadius: '999px', cursor: importLoading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: '700',
              }}>
                {importLoading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                {importLoading ? '' : 'Search'}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {importResults.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  backgroundColor: colors.card, border: `1px solid ${colors.border}`,
                  borderRadius: '12px', padding: '12px 14px',
                }}>
                  <div style={{
                    width: '44px', height: '66px', borderRadius: '4px', overflow: 'hidden',
                    backgroundColor: colors.border, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {r.cover
                      ? <img src={r.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <BookOpen size={16} color={colors.muted} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'Newsreader, serif', fontSize: '16px', color: colors.text,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{r.title}</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: colors.muted }}>
                      {r.author} · {r.downloads.toLocaleString()} downloads
                    </p>
                  </div>
                  <button onClick={() => handleGutenbergImport(r.id)} disabled={importingId === r.id} style={{
                    backgroundColor: importingId === r.id ? colors.border : accent, color: colors.bg,
                    border: 'none', padding: '8px 16px', borderRadius: '999px', cursor: 'pointer',
                    fontFamily: 'Manrope, sans-serif', fontSize: '11px',
                    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700',
                    
                    display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                  }}>
                    {importingId === r.id
                      ? <><Loader2 size={13} className="spin" /> Fetching</>
                      : 'Import'}
                  </button>
                </div>
              ))}
              {!importLoading && importResults.length === 0 && (
                <p style={{ textAlign: 'center', padding: '32px', fontFamily: 'Newsreader, serif', fontSize: '17px', color: colors.muted, fontStyle: 'italic' }}>
                  Search for a classic to get started.
                </p>
              )}
              {importLoading && (
                <p style={{ textAlign: 'center', padding: '32px', fontFamily: 'Newsreader, serif', fontSize: '17px', color: colors.muted, fontStyle: 'italic' }}>
                  Searching Gutenberg...
                </p>
              )}
            </div>

            <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: '24px', paddingTop: '20px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: '8px' }}>
                Add many at once
              </p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: colors.muted, marginBottom: '10px', lineHeight: 1.6 }}>
                Paste Gutenberg book numbers or links (up to 50). They are added as free, published books.
              </p>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={3} disabled={bulkRunning}
                placeholder={'84\n1342\nhttps://www.gutenberg.org/ebooks/11'}
                style={{
                  width: '100%', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '10px 12px',
                  backgroundColor: colors.card, color: colors.text, fontFamily: 'Manrope, sans-serif', fontSize: '14px', outline: 'none', resize: 'vertical',
                }} />
              <button onClick={handleBulkImport} disabled={bulkRunning} style={{
                marginTop: '10px', backgroundColor: accent, color: colors.bg, border: 'none', borderRadius: '999px',
                padding: '12px 20px', cursor: bulkRunning ? 'wait' : 'pointer', opacity: bulkRunning ? 0.7 : 1,
                fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{bulkRunning ? `Adding... (${bulkResults.length})` : 'Add these books'}</button>
              {bulkResults.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {bulkResults.map(r => (
                    <p key={r.id} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: r.ok ? '#4a7a4a' : '#b05a5a' }}>
                      #{r.id} — {r.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 100, display: 'flex', alignItems: 'flex-start',
          justifyContent: 'center', padding: isMobile ? '12px' : '24px', overflowY: 'auto',
        }}>
          <div style={{
            backgroundColor: colors.bg, borderRadius: '16px', padding: isMobile ? '24px 18px' : '40px',
            width: '100%', maxWidth: '680px', border: `1px solid ${colors.border}`, margin: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '28px', color: colors.text, fontWeight: '400' }}>
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.muted }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input name="title" value={form.title} onChange={handleFormChange} style={inputStyle} placeholder="Book title" />
              </div>
              <div>
                <label style={labelStyle}>Author *</label>
                <input name="author" value={form.author} onChange={handleFormChange} style={inputStyle} placeholder="Author name" />
              </div>
              <div>
                <label style={labelStyle}>Description *</label>
                <textarea name="description" value={form.description} onChange={handleFormChange}
                  rows={4} style={{ ...inputStyle, resize: 'vertical', borderBottom: 'none', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px' }}
                  placeholder="Book description" />
              </div>
              <div>
                <label style={labelStyle}>Cover Image *</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <input name="coverImage" value={form.coverImage?.startsWith('data:') ? '' : form.coverImage}
                    onChange={handleFormChange} style={{ ...inputStyle, flex: '1 1 180px', minWidth: 0 }}
                    placeholder={form.coverImage?.startsWith('data:') ? 'Generated cover in use. Paste a link or upload to replace it' : 'Paste an image link, or upload one'} />
                  <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} style={{ display: 'none' }} />
                  <button type="button" onClick={() => coverInputRef.current?.click()} disabled={coverUploading} style={{
                    flexShrink: 0, background: 'none', border: `1px solid ${accent}`, color: accent, borderRadius: '999px',
                    padding: '10px 16px', cursor: coverUploading ? 'wait' : 'pointer', fontFamily: 'Manrope, sans-serif',
                    fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px',
                  }}><Upload size={14} /> {coverUploading ? 'Uploading...' : 'Upload'}</button>
                </div>
                {form.coverImage && (
                  <img src={coverSrc(form.coverImage)} alt="Cover preview" style={{ marginTop: '12px', height: '120px', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '6px', border: `1px solid ${colors.border}` }} />
                )}
              </div>

              {/* Custom Genre Dropdown */}
              <div style={{ position: 'relative' }}>
                <label style={labelStyle}>Genre</label>
                <div onClick={() => setGenreOpen(!genreOpen)} style={{
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: colors.card, padding: '10px 14px', borderRadius: '8px',
                  border: `1px solid ${colors.border}`, fontFamily: 'Manrope, sans-serif',
                  fontSize: '15px', color: colors.text,
                }}>
                  <span>{form.genre}</span>
                  <span style={{ fontSize: '12px', color: colors.muted }}>▾</span>
                </div>
                {genreOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                    backgroundColor: colors.card, border: `1px solid ${colors.border}`,
                    borderRadius: '8px', maxHeight: '200px', overflowY: 'auto',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)', marginTop: '4px',
                  }}>
                    {GENRES.map(g => (
                      <div key={g} onClick={() => { setForm(prev => ({ ...prev, genre: g })); setGenreOpen(false) }}
                        style={{
                          padding: '10px 16px', cursor: 'pointer',
                          fontFamily: 'Manrope, sans-serif', fontSize: '14px',
                          color: form.genre === g ? accent : colors.text,
                          backgroundColor: form.genre === g ? colors.border : 'transparent',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.border}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = form.genre === g ? colors.border : 'transparent'}
                      >{g}</div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" name="isFree" checked={form.isFree} onChange={handleFormChange} />
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: colors.text }}>Free book</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" name="isPublished" checked={form.isPublished !== false} onChange={handleFormChange} />
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: colors.text }}>Published (visible to readers)</span>
                </label>
              </div>
              {form.bookType === 'uploaded' && (
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: colors.muted, lineHeight: 1.6 }}>
                  Uploaded book: {form.totalPages} pages. The title, author and cover were guessed from the file. Check them,
                  add a description, pick a genre, then tick Published. The page text can't be edited here.
                </p>
              )}

              {!form.isFree && (
                <div>
                  <label style={labelStyle}>Price ($)</label>
                  <input name="price" type="number" value={form.price} onChange={handleFormChange} style={inputStyle} placeholder="0.00" />
                </div>
              )}

              <div>
                <label style={labelStyle}>Free Preview Pages</label>
                <input name="freePreviewPages" type="number" value={form.freePreviewPages} onChange={handleFormChange} style={inputStyle} />
              </div>

              {form.bookType === 'custom' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Pages ({form.pages.length})</label>
                  <button onClick={addPage} style={{
                    background: 'none', border: `1px solid ${accent}`, borderRadius: '999px',
                    padding: '4px 12px', cursor: 'pointer', color: accent,
                    fontFamily: 'Manrope, sans-serif', fontSize: '11px',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>+ Add Page</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                  {form.pages.map((page, index) => (
                    <div key={index}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Page {index + 1}</label>
                        {form.pages.length > 1 && (
                          <button onClick={() => removePage(index)} style={{
                            background: 'none', border: 'none', cursor: 'pointer', color: '#8b3a3a', padding: '2px',
                          }}><X size={14} /></button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : '110px minmax(0, 1fr)', gap: '12px', marginBottom: '10px' }}>
                        <input value={page.chapterNumber || ''} onChange={e => handlePageChange(index, 'chapterNumber', e.target.value)}
                          style={chapterInputStyle} placeholder="Ch. # (I, 1...)" />
                        <input value={page.chapterTitle || ''} onChange={e => handlePageChange(index, 'chapterTitle', e.target.value)}
                          style={chapterInputStyle} placeholder="Chapter title (optional)" />
                      </div>
                      <textarea value={page.content} onChange={e => handlePageChange(index, 'content', e.target.value)}
                        rows={6} style={{
                          width: '100%', border: `1px solid ${colors.border}`, borderRadius: '8px',
                          padding: '12px', background: 'none', fontFamily: 'Newsreader, serif',
                          fontSize: '15px', color: colors.text, outline: 'none', resize: 'vertical',
                          backgroundColor: colors.card,
                        }}
                        placeholder={`Content for page ${index + 1}...`} />
                    </div>
                  ))}
                </div>
              </div>
              )}

              <button onClick={handleSubmit} style={{
                width: '100%', backgroundColor: accent, color: colors.bg, border: 'none',
                padding: '14px', borderRadius: '999px', fontFamily: 'Manrope, sans-serif',
                fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em',
                fontWeight: '700', cursor: 'pointer', marginTop: '8px',
              }}>
                {editingBook ? 'Save Changes' : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin