const User = require("../models/User")
const Category = require("../models/Category")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const pino = require("pino")
const mongoose = require('mongoose')

const logger = pino({ level: "info" })

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    let newUser
    const session = await mongoose.startSession()

    try {
      await session.withTransaction(async () => {
        const users = await User.create([{
          name,
          email,
          password: hashedPassword
        }], { session })

        newUser = users[0]

        await Category.create([{
          name: 'General',
          description: 'All your general notes',
          isDefault: true,
          color: '#187171',
          userId: newUser._id
        }], { session })
      })
    } finally {
      await session.endSession()
    }

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    logger.info(`New user registered: ${newUser._id}`)

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    })

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'User already exists' })
    }
    logger.error(`Signup error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // TYPE GUARD: Prevents NoSQL injection and bcrypt type errors
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    logger.info(`User logged in: ${user._id}`)

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    logger.error(`Login error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { signup, login }