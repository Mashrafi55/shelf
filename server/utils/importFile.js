// Turn an uploaded PDF / EPUB / TXT into pages + chapters, reusing the Gutenberg chapter splitter.
const JSZip = require('jszip')
const { PDFParse } = require('pdf-parse')
const { buildPages, cleanText } = require('./gutenberg')

const MIN_CHARS_PER_PDF_PAGE = 100 // below this the PDF is almost certainly scanned pictures
const MAX_WORDS = 1500000

const fail = (message) => Object.assign(new Error(message), { status: 422 })

// ---------- shared text helpers ----------

const decodeEntities = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;|&#39;/g, "'").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&')

const titleFromFilename = (name = '') =>
  name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled'

const HEADING_LINE = /^(chapter|part|book|volume|letter|prologue|epilogue|preface|foreword|introduction)\b/i
const isShortHeading = (line) =>
  line.length <= 60 && (HEADING_LINE.test(line) || (/[A-Z]/.test(line) && line === line.toUpperCase() && !/[a-z]/.test(line)))

// ---------- PDF ----------

const normaliseEdge = (line) => line.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim()
const isPageNumber = (line) => /^(page\s+)?(\d{1,4}|[ivxlc]{1,7})$/i.test(line.trim()) || /^[-–—]\s*\d{1,4}\s*[-–—]$/.test(line.trim())

// Remove running headers/footers (lines repeated at the edge of many pages) and bare page numbers.
const stripPageFurniture = (pages) => {
  const edgeCount = new Map()
  const edges = (lines) => [...lines.slice(0, 2), ...lines.slice(-2)]
  for (const lines of pages) {
    for (const line of new Set(edges(lines).map(normaliseEdge))) {
      if (line) edgeCount.set(line, (edgeCount.get(line) || 0) + 1)
    }
  }
  const repeated = (line) => pages.length >= 5 && (edgeCount.get(normaliseEdge(line)) || 0) >= Math.max(3, pages.length * 0.4)
  return pages.map(lines => {
    const keep = lines.filter((line, i) => {
      const atEdge = i < 2 || i >= lines.length - 2
      return !(atEdge && (isPageNumber(line) || repeated(line)))
    })
    return keep
  })
}

// Lines -> paragraphs: join wrapped lines, mend "hyphen-\nated" words, keep headings on their own.
const reflow = (lines) => {
  const lengths = lines.map(l => l.length).filter(n => n >= 20).sort((a, b) => a - b)
  const typical = lengths.length ? lengths[Math.floor(lengths.length * 0.9)] : 80
  const paragraphs = []
  let current = ''
  let lastWasHeading = false
  const push = () => { if (current.trim()) paragraphs.push(current.trim()); current = '' }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) { push(); continue }
    if (isShortHeading(line)) { push(); paragraphs.push(line); lastWasHeading = true; continue }
    // the line right after a heading, if short and unpunctuated, is its title ("Chapter 1" / "The Beginning")
    if (lastWasHeading && !current && line.length <= 70 && !/[.!?,;:]$/.test(line)) { paragraphs[paragraphs.length - 1] += '\n' + line; lastWasHeading = false; continue }
    lastWasHeading = false
    if (current) {
      if (/[a-z]-$/.test(current) && /^[a-z]/.test(line)) current = current.slice(0, -1) + line
      else current += ' ' + line
    } else current = line
    // a short line that ends a sentence ends the paragraph
    const next = lines[i + 1]
    if (line.length < typical * 0.7 && /[.!?”"’')\]]$/.test(line) && next) push()
  }
  push()
  return paragraphs.join('\n\n')
}

const extractPdf = async (buffer) => {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const [textResult, infoResult] = await Promise.all([parser.getText(), parser.getInfo().catch(() => null)])
    const pages = textResult.pages.map(p => p.text.split('\n').map(l => l.replace(/\s+/g, ' ').trim()))
    const chars = pages.reduce((n, lines) => n + lines.join('').length, 0)
    if (!pages.length || chars / pages.length < MIN_CHARS_PER_PDF_PAGE) {
      throw fail('This PDF looks scanned (it has pictures of pages, not text). Upload a PDF with selectable text.')
    }
    const text = reflow(stripPageFurniture(pages).flat())
    const info = infoResult?.info || {}
    return { text, title: (info.Title || '').trim(), author: (info.Author || '').trim() }
  } catch (error) {
    if (error.status) throw error
    throw fail('Could not read this PDF. It may be damaged or password protected.')
  } finally {
    await parser.destroy().catch(() => {})
  }
}

// ---------- EPUB ----------

const htmlToText = (html) => decodeEntities(
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, t) => `\n\n${t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n\n`)
    .replace(/<\/(p|div|li|blockquote|tr)>|<br\s*\/?>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim()

const tag = (xml, name) => decodeEntities((xml.match(new RegExp(`<(?:\\w+:)?${name}[^>]*>([\\s\\S]*?)</(?:\\w+:)?${name}>`, 'i'))?.[1] || '').replace(/<[^>]+>/g, '')).trim()
const attr = (el, name) => el.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] || ''
const joinPath = (base, rel) => {
  const parts = (base.includes('/') ? base.slice(0, base.lastIndexOf('/') + 1) : '') + decodeURIComponent(rel.split('#')[0])
  const out = []
  for (const seg of parts.split('/')) { if (seg === '..') out.pop(); else if (seg && seg !== '.') out.push(seg) }
  return out.join('/')
}

const extractEpub = async (buffer) => {
  let zip
  try { zip = await JSZip.loadAsync(buffer) } catch { throw fail('This file is not a valid EPUB.') }
  const container = await zip.file('META-INF/container.xml')?.async('string')
  const opfPath = container && attr(container.match(/<rootfile\b[^>]*>/i)?.[0] || '', 'full-path')
  const opf = opfPath && await zip.file(opfPath)?.async('string')
  if (!opf) throw fail('This EPUB has no readable content list.')

  const manifest = {}
  for (const item of opf.match(/<item\b[^>]*>/gi) || []) manifest[attr(item, 'id')] = { href: attr(item, 'href'), type: attr(item, 'media-type') }
  const spine = (opf.match(/<itemref\b[^>]*>/gi) || []).map(r => manifest[attr(r, 'idref')]).filter(Boolean)

  const sections = []
  for (const item of spine) {
    if (!/x?html/.test(item.type)) continue
    const html = await zip.file(joinPath(opfPath, item.href))?.async('string')
    if (!html) continue
    const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html
    const heading = body.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)?.[1]
    sections.push({
      heading: heading ? decodeEntities(heading.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : '',
      text: htmlToText(body),
    })
  }
  return {
    title: tag(opf, 'title'),
    author: tag(opf, 'creator'),
    sections: sections.filter(s => s.text.split(/\s+/).length >= 40), // drops cover / contents / blank files
  }
}

// ---------- public API ----------

// returns { title, author, pages: [{ pageNumber, chapterNumber, chapterTitle, content }] }
const parseUpload = async ({ buffer, filename }) => {
  const ext = (filename.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase()
  let title = ''
  let author = ''
  let pages = []

  if (ext === 'epub') {
    const epub = await extractEpub(buffer)
    title = epub.title
    author = epub.author
    // each EPUB file is normally one chapter: split it by length, label its first page with the heading
    for (const section of epub.sections) {
      const built = buildPages(cleanText(section.text))
      built.forEach((page, i) => {
        if (i === 0 && !page.chapterNumber && !page.chapterTitle && section.heading) page.chapterTitle = section.heading
        pages.push(page)
      })
    }
  } else {
    let text
    if (ext === 'pdf') {
      const pdf = await extractPdf(buffer)
      text = pdf.text
      title = pdf.title
      author = pdf.author
    } else if (ext === 'txt') {
      text = buffer.toString('utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n')
    } else {
      throw fail('Only PDF, EPUB and TXT files are supported.')
    }
    pages = buildPages(cleanText(text))
  }

  if (!pages.length) throw fail('No readable text was found in this file.')
  const words = pages.reduce((n, p) => n + p.content.split(/\s+/).length, 0)
  if (words > MAX_WORDS) throw fail('This book is too large to import (over 1,500,000 words).')

  return {
    title: title || titleFromFilename(filename),
    author: author || 'Unknown',
    pages: pages.map((p, i) => ({
      pageNumber: i + 1,
      chapterNumber: p.chapterNumber || '',
      chapterTitle: p.chapterTitle || '',
      content: p.content,
    })),
  }
}

module.exports = { parseUpload }
