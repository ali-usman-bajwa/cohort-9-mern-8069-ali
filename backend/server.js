const express = require('express')
const dotenv = require('dotenv')
const pino = require("pino")
const pinoHTTP = require("pino-http")
const cors = require('cors')
const connectDB = require("./src/config/db")
const authRoutes = require('./src/routes/authRoutes')
const categoryRoutes = require('./src/routes/categoryRoutes')
const noteRoutes = require('./src/routes/noteRoutes')
const { errorHandler, notFound } = require('./src/middleware/errorMiddleware')

dotenv.config()

const app = express()
const logger = pino({level: "info"})

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(pinoHTTP({logger}))

app.get("/" , (req, res) => {
    res.json({message: "Notes App API is running"})
})

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/notes', noteRoutes)

app.use(notFound)
app.use(errorHandler)

const startServer = async () => {
  try {
    await connectDB()
    const PORT = process.env.PORT || 5000
    const server = app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`)
    })

    server.on('error', (error) => {
      logger.error(`HTTP server error: ${error.message}`)
      process.exit(1)
    })

  } catch (error) {
    logger.error(`Server startup error: ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  startServer()
}

module.exports = app