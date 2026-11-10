const rateLimit = require('express-rate-limit')

const limiter = (windowMs, max, message) =>
  rateLimit({ windowMs, max, message: { message }, standardHeaders: true, legacyHeaders: false })

const minutes = (n) => n * 60 * 1000

module.exports = {
  authLimiter: limiter(minutes(15), 20, 'Too many attempts, please try again later'),
  apiLimiter: limiter(minutes(15), 600, 'Too many requests, please slow down'),
  adminLimiter: limiter(minutes(15), 200, 'Too many admin requests, please slow down'),
  pageLimiter: limiter(minutes(1), 120, 'You are reading too fast, please slow down'),
  writeLimiter: limiter(minutes(15), 40, 'Too many submissions, please try again later'),
}
