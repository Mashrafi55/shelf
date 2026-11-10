const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')

dotenv.config()

for (const name of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
}

const connectDB = require('./config/db')
const { authLimiter, apiLimiter } = require('./middleware/rateLimiters')

const app = express()

// behind a reverse proxy (Render, Nginx, ...) set TRUST_PROXY=1 so rate limits see real client IPs
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1)

app.use(helmet())
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim())
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
// cover images are cheap, cacheable and loaded dozens at a time, so they skip the general API rate limit
app.use('/api/covers', require('./routes/covers'))
app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter)

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/books', require('./routes/books'))
app.use('/api/user', require('./routes/user'))
app.use('/api/admin', require('./routes/admin'))

app.get('/', (req, res) => res.send('Shelf API running'))

// 404 + central error handler (bad JSON, oversized bodies, anything uncaught)
app.use((req, res) => res.status(404).json({ message: 'Not found' }))
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500
  if (status >= 500) console.error(err)
  res.status(status).json({ message: status >= 500 ? 'Something went wrong' : err.message })
})

const PORT = process.env.PORT || 5000

const start = async () => {
  await connectDB()
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`)
    server.close(() => require('mongoose').connection.close().then(() => process.exit(0)))
    setTimeout(() => process.exit(1), 10000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

start()
