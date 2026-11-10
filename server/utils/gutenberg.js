// Gutenberg import engine — metadata via Gutendex, text via gutenberg.org

const WORDS_PER_PAGE = 800
const GENRES = [
  'Fiction', 'Non-Fiction', 'Philosophy', 'Science', 'History',
  'Biography', 'Self-Help', 'Technology', 'Poetry', 'Mystery',
  'Romance', 'Fantasy', 'Thriller', 'Classic', 'Psychology',
  'Business', 'Travel', 'Art', 'Religion', 'Politics',
]

const GENRE_ALIASES = {
  Mystery: ['detective', 'crime', 'murder'],
  Romance: ['love', 'courtship'],
  Fantasy: ['fairy', 'folklore', 'legend', 'myth', 'magic'],
  Thriller: ['horror', 'gothic', 'suspense'],
  History: ['historical', 'history'],
  Biography: ['biography', 'autobiography', 'memoir'],
  Poetry: ['poetry', 'poems'],
  Religion: ['religion', 'christianity', 'bibl'],
  Politics: ['politic'],
  Travel: ['travel', 'voyage'],
  Business: ['econom'],
}

// ---------- Metadata ----------

const searchGutenbergBooks = async (query) => {
  const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Gutendex unreachable')
  const data = await res.json()
  return (data.results || []).slice(0, 12).map(b => ({
    id: b.id,
    title: b.title,
    author: b.authors?.map(a => a.name).join(', ') || 'Unknown',
    cover: b.formats?.['image/jpeg'] || null,
    downloads: b.download_count || 0,
  }))
}

const fetchMeta = async (id) => {
  const res = await fetch(`https://gutendex.com/books/${id}`)
  if (res.status === 404) throw new Error('Book not found on Gutendex')
  if (!res.ok) throw new Error('Gutendex unreachable')
  const data = await res.json()
  return { ...data, id }
}

// ---------- Text fetching & cleaning ----------

// Gutendex formats keys, in order of preference
const TEXT_FORMAT_KEYS = [
  'text/plain; charset=utf-8',
  'text/plain; charset=us-ascii',
  'text/plain',
]

const pickTextUrl = (formats = {}) => {
  for (const key of TEXT_FORMAT_KEYS) {
    if (formats[key]) return formats[key]
  }
  const anyPlain = Object.keys(formats).find(k => k.includes('text/plain'))
  return anyPlain ? formats[anyPlain] : null
}

const fetchBookText = async (url) => {
  // Gutenberg blocks direct requests — try proxies first, direct as last resort
  const id = url.match(/\/ebooks\/(\d+)|\/files\/(\d+)\/|\/epub\/(\d+)\//)?.slice(1).find(Boolean)
  const attempts = [
    url,
    ...(id ? [`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`] : []),
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    `https://r.jina.ai/${url}`,
  ]
  let lastError
  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt, { signal: AbortSignal.timeout(20_000) })
      if (!res.ok) { lastError = new Error(`HTTP ${res.status}`); continue }
      const text = await res.text()
      // guard against proxy error pages served with HTTP 200
      if (text.length < 10_000) { lastError = new Error('Proxy returned no usable text'); continue }
      return text
    } catch (e) {
      lastError = e
    }
  }
  throw lastError || new Error('Could not download book text')
}

const fetchText = async (meta) => {
  const textUrl = pickTextUrl(meta.formats)
  if (!textUrl) throw new Error('No plain text version available for this book')
  return fetchBookText(textUrl)
}

const cleanText = (raw) => {
  let text = raw.replace(/\r\n/g, '\n')
  const start = text.match(/\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*?\*\*\*/i)
  const end = text.match(/\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i)
  if (start) text = text.slice(start.index + start[0].length)
  if (end) text = text.slice(0, end.index)
  // scanned-edition artwork markers, e.g. "[Illustration: ...]" (can span lines)
  // (captions may contain one level of nested brackets, e.g. "[Copyright 1894 by George Allen.]")
  text = text.replace(/\[Illustration(?:[^\[\]]|\[[^\[\]]*\])*\]/gi, '')
  text = text.replace(/^[ \t]*\][ \t]*$/gm, '') // orphaned closing brackets
  return text.trim()
}

// ---------- Chapter-aware page splitting ----------

const CHAPTER_RE = /^chapter\s+(?:([ivxlcdm]+|\d+)|([a-z]+))\b[\s.,:'"\u2014-]*(.*)$/i
const SECTION_RE = /^(prologue|epilogue|preface|foreword|introduction)\b[\s.:—-]*(.*)$/i
// "Book the Second--The Golden Thread", "Part II", "Letter 1" — groups of chapters
const ORDINALS = 'first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|one|two|three|four|five|six|seven|eight|nine|ten'
const GROUP_RE = new RegExp(`^(book|part|volume)\\s+(?:the\\s+)?(${ORDINALS}|[ivxlcdm]+|\\d+)\\b[\\s.,:'"\u2014-]*(.*)$`, 'i')
const LETTER_RE = /^letter\s+(\d+|[ivxlcdm]+)\.?$/i
const BARE_ROMAN_RE = /^[ivxlcdm]{1,7}\.?$/i

const toTitleCase = (s) =>
  s !== s.toUpperCase() ? s : s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase())

const capsRatio = (s) => {
  const letters = s.replace(/[^A-Za-z]/g, '')
  if (!letters.length) return 0
  return (s.replace(/[^A-Z]/g, '').length / letters.length)
}

// "I. A SCANDAL IN BOHEMIA" — roman numeral + ALL-CAPS title on one line
const NUMBERED_TITLE_RE = /^([ivxlcdm]+)\.\s+(.{2,70})$/i

const normalizeHeading = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// Drop the title page + table of contents so page 1 is real story text.
// The TOC ends where its first entry reappears as an actual heading.
const stripFrontMatter = (lines) => {
  const tocAt = lines.slice(0, 250).findIndex(l => /^\s*(table of )?contents\.?\s*$/i.test(l))
  if (tocAt === -1) return lines

  let first = tocAt + 1
  while (first < lines.length && !lines[first].trim()) first++
  const firstKey = normalizeHeading(lines[first] || '')
  if (!firstKey) return lines

  const bodyAt = lines.findIndex((l, i) => {
    if (i <= first + 2) return false
    const key = normalizeHeading(l)
    return key === firstKey || (key.length >= 3 && (firstKey.startsWith(`${key} `) || key.startsWith(`${firstKey} `)))
  })
  return bodyAt === -1 ? lines : lines.slice(bodyAt)
}

// Drop a short title page (title/author/publisher lines) ahead of the first prose paragraph.
const dropTitlePage = (lines) => {
  let i = 0
  const limit = Math.min(lines.length, 250)
  while (i < limit) {
    if (!lines[i].trim()) { i++; continue }
    const start = i
    while (i < lines.length && lines[i].trim()) i++
    const para = lines.slice(start, i).join(' ').trim()
    const words = para.split(/\s+/).length
    if (words >= 25) {
      if (start === 0) return lines
      const skipped = lines.slice(0, start).join(' ').split(/\s+/).length
      if (skipped >= 120) return lines
      // keep a heading that introduces the first real text (chapter / preface)
      let keepFrom = start
      for (let j = 0; j < start; j++) {
        if (lines[j].trim() && matchHeading(lines, j)) { keepFrom = j; break }
      }
      return lines.slice(keepFrom)
    }
  }
  return lines
}

// cheap check used to avoid swallowing a real heading as a group title
const matchHeadingShallow = (line) => CHAPTER_RE.test(line) || GROUP_RE.test(line) || BARE_ROMAN_RE.test(line)

const matchHeading = (lines, idx) => {
  const line = lines[idx].trim()
  if (!line || line.length > 80) return null
  if (/\.\s*\.\s*\.|\s\d+$/.test(line)) return null // contents entry: "Title . . . . 41"

  let number = ''
  let title = ''
  let bareRoman = false
  let front = false // preface / foreword / introduction — not part of the story
  let consumedThrough = idx

  const letter = line.match(LETTER_RE)
  if (letter) return { number: `Letter ${letter[1].toUpperCase()}`, title: '', consumedThrough }

  const group = line.match(GROUP_RE)
  if (group && !/[.!?]$/.test(group[3] || '') ) {
    const label = `${toTitleCase(group[1])} ${/^the\s/i.test(line.slice(group[1].length).trim()) ? 'the ' : ''}${toTitleCase(group[2])}`
    let groupTitle = (group[3] || '').trim()
    if (!groupTitle) {
      let next = idx + 1
      while (next < lines.length && !lines[next].trim()) next++
      const candidate = next < lines.length ? lines[next].trim() : ''
      if (candidate && candidate.length <= 60 && (!/[.!?]$/.test(candidate) || capsRatio(candidate) > 0.85) && !matchHeadingShallow(candidate)) {
        groupTitle = candidate
        consumedThrough = next
      }
    }
    return { number: label, title: toTitleCase(groupTitle.replace(/[.,;:]+$/, '')), consumedThrough, group: true }
  }

  const ch = line.match(CHAPTER_RE)
  if (ch) {
    number = (ch[1] || ch[2] || '').toUpperCase()
    title = (ch[3] || '').replace(/[.,;:]+$/, '').trim()
  } else if (BARE_ROMAN_RE.test(line)) {
    bareRoman = true
    number = line.replace('.', '').toUpperCase()
  } else if (NUMBERED_TITLE_RE.test(line) && capsRatio(line.replace(/^[ivxlcdm]+\./i, '')) > 0.85) {
    const m = line.match(NUMBERED_TITLE_RE)
    number = m[1].toUpperCase()
    title = m[2].trim()
  } else {
    const sec = line.match(SECTION_RE)
    if (!sec) return null
    title = sec[1].toUpperCase()
    front = /^(PREFACE|FOREWORD|INTRODUCTION)$/.test(title)
  }

  // Title on its own following line (common Gutenberg style: ALL CAPS)
  if (!title) {
    let next = idx + 1
    while (next < lines.length && !lines[next].trim()) next++
    const candidate = next < lines.length ? lines[next].trim() : ''
    if (candidate && candidate.length <= 80 && !CHAPTER_RE.test(candidate) && capsRatio(candidate) > 0.85) {
      title = candidate
      consumedThrough = next
    } else if (candidate && next === idx + 1 && (ch || bareRoman) && candidate.length <= 60 &&
      candidate.split(/\s+/).length <= 8 && !/[.,;:]$/.test(candidate) && !CHAPTER_RE.test(candidate)) {
      // "CHAPTER I." followed directly by a title-case line
      title = candidate
      consumedThrough = next
    }
  }

  return { number, title: toTitleCase(title), consumedThrough, front }
}

// Split the book into the author's own front matter (preface / foreword / introduction —
// kept, as it helps readers understand the story) and the story itself, which starts at the
// first real chapter. Etymology, extracts, contents, illustration lists and publisher pages
// are dropped. Skipped when no chapter is found, or when the "extras" are suspiciously large
// (likely a false heading match).
const MAX_FRONT_WORDS = 4800 // ~6 pages — longer than this is scholarship, not an author's note
const FRONT_JUNK_RE = /\S\s{3,}\d+\s*$|^\s*(list of )?(illustrations|contents)\.?\s*$|^\s*heading to chapter/i

const splitFrontAndStory = (lines) => {
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const heading = matchHeading(lines, i)
    if (!heading || heading.front) continue
    if (!(i > 0 && i < lines.length * 0.15)) return { front: [], story: lines }

    // First heading found is "Chapter II" or later: chapter 1 had no heading in this edition,
    // so the story begins right after the last contents/illustration-list line.
    let storyStart = i
    const firstIsOne = !heading.number || /^(I|1|ONE|FIRST|LETTER 1|BOOK\b.*)$/i.test(heading.number)
    if (!firstIsOne) {
      let listEnd = -1
      for (let j = 0; j < i; j++) if (/\S\s{3,}\d+\s*$/.test(lines[j])) listEnd = j
      if (listEnd !== -1) {
        storyStart = listEnd + 1
        while (storyStart < i && !lines[storyStart].trim()) storyStart++
      }
    }

    const preamble = lines.slice(0, storyStart)
    const frontAt = preamble.findIndex((l, idx) => l.trim() && matchHeading(preamble, idx)?.front)
    const front = frontAt === -1 ? [] : preamble.slice(frontAt).filter(l => !FRONT_JUNK_RE.test(l))
    const words = front.join(' ').split(/\s+/).filter(Boolean).length
    return { front: words <= MAX_FRONT_WORDS ? front : [], story: lines.slice(storyStart) }
  }
  return { front: [], story: lines }
}

const paginate = (lines, wordsPerPage, front) => {
  const pages = []
  let current = []
  let wordCount = 0
  let pendingChapter = null

  const flush = () => {
    const content = current.join('\n\n').trim()
    const ch = pendingChapter || {}
    pendingChapter = null
    current = []
    wordCount = 0
    if (!content && !ch.number && !ch.title) return
    pages.push({
      chapterNumber: ch.number || '',
      chapterTitle: ch.title || '',
      content,
      front,
    })
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    const heading = matchHeading(lines, i)
    if (heading) {
      // consecutive headings ("ADVENTURE I. TITLE" then "I.") describe one chapter
      if (!current.length && pendingChapter) {
        if (pendingChapter.group && !heading.group) {
          // "Book the Second" followed by "CHAPTER I." — keep both labels
          const n = /^[ivxlcdm\d]+$/i.test(heading.number) ? `Chapter ${heading.number}` : heading.number
          pendingChapter = {
            number: [pendingChapter.number, n].filter(Boolean).join(' · '),
            title: heading.title || pendingChapter.title,
          }
        } else {
          pendingChapter = {
            number: heading.number || pendingChapter.number,
            title: heading.title || pendingChapter.title,
          }
        }
        i = heading.consumedThrough + 1
        continue
      }
      // a tiny tail (a few lines left over at the end of a chapter) joins the previous page
      if (current.length && !pendingChapter && wordCount < 80 && pages.length) {
        pages[pages.length - 1].content += '\n\n' + current.join('\n\n')
        current = []
        wordCount = 0
      }
      flush()
      pendingChapter = { number: heading.number, title: heading.title, group: heading.group }
      i = heading.consumedThrough + 1
      continue
    }

    const para = [line.trim()]
    i++
    while (i < lines.length && lines[i].trim()) {
      para.push(lines[i].trim())
      i++
    }
    const paraText = para.join(' ')
    current.push(paraText)
    wordCount += paraText.split(/\s+/).length
    if (wordCount >= wordsPerPage) flush()
  }
  flush()
  return pages
}

// Returns pages in reading order: author's front matter first (page.front === true), then the story.
const buildPages = (text, wordsPerPage = WORDS_PER_PAGE) => {
  const { front, story } = splitFrontAndStory(dropTitlePage(stripFrontMatter(text.split('\n'))))
  return [...paginate(front, wordsPerPage, true), ...paginate(story, wordsPerPage, false)]
    .map((page, idx) => ({ pageNumber: idx + 1, ...page }))
}

// ---------- Genre mapping & cover generation ----------

const formatAuthorName = (raw) => {
  const parts = raw.split(',')
  return parts.length < 2 ? raw.trim() : `${parts[1].trim()} ${parts[0].trim()}`
}

const formatAuthors = (names = []) =>
  names.length ? names.map(formatAuthorName).join(' & ') : 'Unknown'

const mapGenre = (subjects = []) => {
  const joined = subjects.map(s => s.toLowerCase()).join(' | ')
  const direct = GENRES.find(g => joined.includes(g.toLowerCase()))
  if (direct) return direct
  for (const [genre, aliases] of Object.entries(GENRE_ALIASES)) {
    if (aliases.some(a => joined.includes(a))) return genre
  }
  return 'Fiction'
}

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Typographic cover in Shelf's chocolate palette — used when Gutendex scan is missing
const generateCover = (title, author) => {
  const wrap = (t, max) => {
    const out = []
    let line = ''
    for (const w of t.split(/\s+/)) {
      if ((line + ' ' + w).trim().length > max) { out.push(line.trim()); line = w }
      else line += ' ' + w
    }
    if (line.trim()) out.push(line.trim())
    return out
  }
  const lines = wrap(title, 18).slice(0, 6)
  const startY = 430 - ((lines.length - 1) * 58) / 2
  const tspans = lines.map((l, i) =>
    `<text x="300" y="${startY + i * 58}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="#f7f0e6">${escapeXml(l)}</text>`
  ).join('')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">` +
    `<rect width="600" height="900" fill="#5c3317"/>` +
    `<rect x="26" y="26" width="548" height="848" fill="none" stroke="#b8845a" stroke-width="1.5"/>` +
    `<rect x="34" y="34" width="532" height="832" fill="none" stroke="#e8ddd0" stroke-width="0.75"/>` +
    `<text x="300" y="130" text-anchor="middle" font-family="Georgia, serif" font-size="19" letter-spacing="8" fill="#b8845a">S H E L F</text>` +
    tspans +
    `<line x1="235" y1="710" x2="365" y2="710" stroke="#b8845a" stroke-width="1"/>` +
    `<text x="300" y="750" text-anchor="middle" font-family="Georgia, serif" font-size="23" font-style="italic" fill="#e8ddd0">${escapeXml(author)}</text>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// ---------- Public: full import ----------

const getGutenbergBook = async (id) => {
  const meta = await fetchMeta(id)
  const raw = await fetchText(meta)
  const pages = buildPages(cleanText(raw))
  if (!pages.length) throw new Error('No readable content found in this book')

  const author = formatAuthors(meta.authors?.map(a => a.name))
  const years = meta.authors?.[0]?.birth_year
    ? ` (${meta.authors[0].birth_year}\u2013${meta.authors[0].death_year ?? ''})`
    : ''

  return {
    title: meta.title,
    author,
    description: `A timeless classic by ${author}${years}.`,
    coverImage: meta.formats?.['image/jpeg'] || generateCover(meta.title, author),
    generatedCover: !meta.formats?.['image/jpeg'],
    genre: mapGenre(meta.subjects),
    price: '',
    isFree: false,
    freePreviewPages: Math.min(4, pages.length),
    // metadata — pages are fetched on demand at read time, never stored
    bookType: 'gutenberg',
    gutenbergId: String(id),
    totalPages: pages.length,
    frontPages: pages.filter(p => p.front).length,
    // included only so the admin form can preview page count before saving
    pages,
  }
}

module.exports = {
  searchGutenbergBooks,
  getGutenbergBook,
  // shared internals (reused by on-demand page fetching)
  fetchMeta,
  pickTextUrl,
  fetchBookText,
  cleanText,
  buildPages,
}
