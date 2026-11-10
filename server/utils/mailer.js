const nodemailer = require('nodemailer')

const clientUrl = () => (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim()

let transporter
const getTransporter = () => {
  if (!process.env.SMTP_HOST) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  }
  return transporter
}

// Without SMTP settings (local development) emails are printed to the server console instead
const sendMail = async ({ to, subject, text }) => {
  const t = getTransporter()
  if (!t) {
    console.log(`\n--- email (SMTP not configured) ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n-----------------------------------\n`)
    return
  }
  await t.sendMail({ from: process.env.MAIL_FROM || 'Shelf <no-reply@shelf.local>', to, subject, text })
}

const sendVerificationEmail = (user, token) => sendMail({
  to: user.email,
  subject: 'Verify your Shelf email',
  text: `Hi ${user.name},\n\nConfirm your email address to finish setting up your Shelf account:\n${clientUrl()}/verify-email?token=${token}\n\nThis link expires in 24 hours. If you did not create an account, you can ignore this email.`,
})

const sendPasswordResetEmail = (user, token) => sendMail({
  to: user.email,
  subject: 'Reset your Shelf password',
  text: `Hi ${user.name},\n\nUse this link to choose a new password:\n${clientUrl()}/reset-password?token=${token}\n\nThis link expires in 1 hour. If you did not ask for this, you can ignore this email — your password has not changed.`,
})

module.exports = { sendVerificationEmail, sendPasswordResetEmail }
