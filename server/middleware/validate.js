const mongoose = require('mongoose')

// Validate and sanitise req.body with a zod schema. Unknown fields are stripped,
// and operator objects like { "$gt": "" } fail the string checks.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {})
  if (!result.success) {
    const issue = result.error.issues[0]
    const field = issue.path.join('.')
    return res.status(400).json({ message: field ? `${field}: ${issue.message}` : issue.message })
  }
  req.body = result.data
  next()
}

// Reject malformed ids up front instead of letting Mongoose throw a CastError (500)
const validateIds = (...names) => (req, res, next) => {
  for (const name of names) {
    if (!mongoose.isValidObjectId(req.params[name])) {
      return res.status(400).json({ message: `Invalid ${name}` })
    }
  }
  next()
}

module.exports = { validate, validateIds }
