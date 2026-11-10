// Simple in-memory LRU cache for fetched pages
// Key format: `${gutenbergId}_${pageNumber}` or `${bookId}_${pageNumber}`

const MAX_ENTRIES = 500

const cache = new Map()

const has = (key) => cache.has(key)

const get = (key) => cache.get(key)

const set = (key, value) => {
  if (!cache.has(key) && cache.size >= MAX_ENTRIES) {
    // evict the oldest entry
    cache.delete(cache.keys().next().value)
  }
  cache.set(key, value)
}

module.exports = { get, set, has }
