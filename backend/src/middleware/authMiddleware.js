const jwt = require("jsonwebtoken")
const pino = require("pino")
const logger = pino({ level: 'info' })

const protect = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]

        if(!token) {
            return res.status(401).json({ message: 'No token, unauthorized' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        logger.error(`Auth middleware error: ${error.message}`)
        res.status(401).json({ message: 'Invalid token' })
    }
}

module.exports = { protect }