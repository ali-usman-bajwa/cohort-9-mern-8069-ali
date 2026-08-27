const mongoose = require('mongoose')
const pino = require('pino')

const logger = pino({ level: 'info' })

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    logger.info(`MongoDB Connected: ${conn.connection.host}`)
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`)
    throw err
  }
}

module.exports = connectDB