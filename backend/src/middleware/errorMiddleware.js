const pino = require('pino')
const logger = pino({ level: 'info' })

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode

  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method
  })

  const message = statusCode >= 500
    ? 'Internal Server Error'
    : err.message

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  logger.warn(`404 - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

module.exports = { errorHandler, notFound }