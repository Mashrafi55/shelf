const express = require('express')
const mongoose = require('mongoose')
const Cover = require('../models/Cover')

const router = express.Router()

// GET /api/covers/:id - a stored cover image (public; ids are unguessable and never reused)
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end()
    const cover = await Cover.findById(req.params.id).lean()
    if (!cover) return res.status(404).end()
    res.set({
      'Content-Type': cover.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      // helmet's default would block the web app (another origin) from showing the image
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff',
    })
    res.send(cover.data.buffer ? Buffer.from(cover.data.buffer) : cover.data)
  } catch {
    res.status(500).end()
  }
})

module.exports = router
