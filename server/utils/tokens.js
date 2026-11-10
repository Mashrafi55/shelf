const crypto = require('crypto')

// The raw token goes in the email link; only its SHA-256 hash is stored, so a database leak can't be used to reset accounts
const createToken = () => {
  const raw = crypto.randomBytes(32).toString('hex')
  return { raw, hash: hashToken(raw) }
}
const hashToken = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex')

module.exports = { createToken, hashToken }
