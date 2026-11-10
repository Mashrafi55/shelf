// On-demand Gutenberg page fetching — books are never stored in MongoDB.
// Full text is downloaded once per process, split with the same
// chapter-aware logic as the import, and individual pages served from cache.

const fs = require('fs')
const path = require('path')
const pageCache = require('./pageCache')
const { fetchMeta, pickTextUrl, fetchBookText, cleanText, buildPages } = require('./gutenberg')

// memoize the split result per book so one download serves many page requests
const MAX_BOOKS_IN_MEMORY = 25
const textCache = new Map() // gutenbergId -> { pages, totalPages }

// split books are also saved to disk so restarts and repeat reads are instant
const DISK_DIR = path.join(__dirname, '..', 'cache', 'books')
const diskFile = (gutenbergId, wordsPerPage) =>
  path.join(DISK_DIR, `${String(gutenbergId).replace(/\D/g, '')}-${wordsPerPage}.json`)

const readDisk = (file) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return null }
}

const writeDisk = (file, result) => {
  try {
    fs.mkdirSync(DISK_DIR, { recursive: true })
    fs.writeFileSync(file, JSON.stringify(result))
  } catch { /* cache is best-effort */ }
}

// Fast path: the canonical gutenberg.org text URL. Gutendex (metadata) can take
// 15s+, so it is only consulted if the direct download fails.
const downloadText = async (gutenbergId) => {
  const id = String(gutenbergId).replace(/\D/g, '')
  try {
    return await fetchBookText(`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`)
  } catch {
    const meta = await fetchMeta(gutenbergId)
    const textUrl = pickTextUrl(meta.formats)
    if (!textUrl) throw new Error('No plain text version available for this book')
    return fetchBookText(textUrl)
  }
}

const inFlight = new Map() // gutenbergId -> Promise, so concurrent requests share one download

const loadSplitBook = async (gutenbergId, wordsPerPage) => {
  if (textCache.has(gutenbergId)) return textCache.get(gutenbergId)
  const key = `${gutenbergId}-${wordsPerPage}`
  if (inFlight.has(key)) return inFlight.get(key)

  const job = (async () => {
    const file = diskFile(gutenbergId, wordsPerPage)
    let result = readDisk(file)
    if (!result) {
      const raw = await downloadText(gutenbergId)
      const pages = buildPages(cleanText(raw), wordsPerPage)
      if (!pages.length) throw new Error('No readable content found in this book')
      result = { pages, totalPages: pages.length }
      writeDisk(file, result)
    }
    remember(gutenbergId, result)
    return result
  })().finally(() => inFlight.delete(key))

  inFlight.set(key, job)
  return job
}

const remember = (gutenbergId, result) => {
  if (textCache.size >= MAX_BOOKS_IN_MEMORY) {
    textCache.delete(textCache.keys().next().value)
  }
  textCache.set(gutenbergId, result)
}

const fetchGutenbergPage = async (gutenbergId, pageNumber, wordsPerPage = 800) => {
  const key = `${gutenbergId}_${pageNumber}`
  if (pageCache.has(key)) return pageCache.get(key)

  const { pages } = await loadSplitBook(gutenbergId, wordsPerPage)
  const page = pages[pageNumber - 1]
  if (!page) {
    throw Object.assign(new Error('Page not found'), { status: 404 })
  }

  const result = {
    pageNumber,
    content: page.content,
    chapterTitle: page.chapterTitle || '',
    chapterNumber: page.chapterNumber || '',
    totalPages: pages.length,
    // author's preface/foreword pages come first; they are for readers who own the book
    front: !!page.front,
    frontPages: pages.filter(p => p.front).length,
  }
  pageCache.set(key, result)
  return result
}

module.exports = fetchGutenbergPage
