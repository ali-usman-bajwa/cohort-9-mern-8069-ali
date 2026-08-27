const Category = require('../models/Category')
const Note = require('../models/Notes')
const pino = require('pino')
const mongoose = require('mongoose')

const logger = pino({ level: 'info' })

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id })
    logger.info(`Categories fetched for user: ${req.user.id}`)
    res.status(200).json(categories)
  } catch (error) {
    logger.error(`Get categories error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

const createCategory = async (req, res) => {
  try {
    const { name, color } = req.body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' })
    }

    const normalizedName = name.trim()

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(normalizedName)}$`, 'i') },
      userId: req.user.id
    })

    if (existing) {
      return res.status(400).json({ message: 'Category already exists' })
    }

    const category = await Category.create({
      name: normalizedName,
      color: color || '#7B5EA7',
      userId: req.user.id
    })

    logger.info(`Category created: ${normalizedName} for user: ${req.user.id}`)
    res.status(201).json(category)
  } catch (error) {
    logger.error(`Create category error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' })
    }

    const category = await Category.findById(id)

    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    if (category.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    if (category.isDefault) {
      return res.status(403).json({ message: 'Cannot delete default category' })
    }

    const { option } = req.body

    if (!option || (option !== 'move' && option !== 'delete')) {
      return res.status(400).json({ message: 'Invalid option. Use move or delete' })
    }

    let generalCategory = null
    if (option === 'move') {
      generalCategory = await Category.findOne({
        userId: req.user.id,
        isDefault: true
      })

      if (!generalCategory) {
        return res.status(404).json({ message: 'Default General category not found' })
      }
    }

    const session = await mongoose.startSession()

    try {
      await session.withTransaction(async () => {
        if (option === 'move') {
          await Note.updateMany(
            { categoryId: category._id },
            { categoryId: generalCategory._id },
            { session }
          )
          logger.info(`Notes moved to General from category: ${category.name}`)
        } else {
          await Note.deleteMany({ categoryId: category._id }, { session })
          logger.info(`Notes deleted with category: ${category.name}`)
        }

        await Category.findByIdAndDelete(id, { session })
      })
    } finally {
      await session.endSession()
    }

    logger.info(`Category deleted: ${category.name}`)
    res.status(200).json({ message: 'Category deleted successfully' })
  } catch (error) {
    logger.error(`Delete category error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getCategories, createCategory, deleteCategory }