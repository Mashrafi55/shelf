const isProd = process.env.NODE_ENV === 'production'

// Same options must be used when setting and clearing the cookie, otherwise browsers keep it
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  // set COOKIE_SAMESITE=none only if the client and API are on different sites (requires https)
  sameSite: process.env.COOKIE_SAMESITE || 'lax',
  path: '/',
}

const sessionCookie = { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 }

module.exports = { cookieOptions, sessionCookie }
