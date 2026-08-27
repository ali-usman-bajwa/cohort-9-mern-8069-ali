const Note = require('../models/Notes')
const Category = require('../models/Category')
const pino = require('pino')
const mongoose = require('mongoose')

const logger = pino({ level: 'info' })
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id })
      .populate('categoryId', 'name color')
    logger.info(`Notes fetched for user: ${req.user.id}`)
    res.status(200).json(notes)
  } catch (error) {
    logger.error(`Get notes error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

const getNotesByCategory = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID' })
    }

    const notes = await Note.find({
      userId: req.user.id,
      categoryId: req.params.categoryId
    }).populate('categoryId', 'name color')

    logger.info(`Notes fetched for category: ${req.params.categoryId}`)
    res.status(200).json(notes)
  } catch (error) {
    logger.error(`Get notes by category error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

const createNote = async (req, res) => {
  try {
    const { title, content, categoryId } = req.body

    if (!title || !content || !categoryId) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID' })
    }

    const category = await Category.findOne({
      _id: categoryId,
      userId: req.user.id
    })
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    const note = await Note.create({
      title,
      content,
      userId: req.user.id,
      categoryId
    })

    logger.info(`Note created: ${title} for user: ${req.user.id}`)
    res.status(201).json(note)
  } catch (error) {
    logger.error(`Create note error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateNote = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid note ID' })
    }

    const note = await Note.findById(req.params.id)

    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }

    if (note.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const { title, content, categoryId } = req.body

    if (categoryId) {
      if (!isValidObjectId(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' })
      }
      const category = await Category.findOne({
        _id: categoryId,
        userId: req.user.id
      })
      if (!category) {
        return res.status(404).json({ message: 'Category not found' })
      }
      note.categoryId = categoryId
    }

    note.title = title || note.title
    note.content = content || note.content

    await note.save()

    logger.info(`Note updated: ${note._id}`)
    res.status(200).json(note)
  } catch (error) {
    logger.error(`Update note error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteNote = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid note ID' })
    }

    const note = await Note.findById(req.params.id)

    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }

    if (note.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    await Note.findByIdAndDelete(req.params.id)

    logger.info(`Note deleted: ${req.params.id}`)
    res.status(200).json({ message: 'Note deleted successfully' })
  } catch (error) {
    logger.error(`Delete note error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

const moveNotes = async (req, res) => {
  try {
    const { noteIds, targetCategoryId } = req.body

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({ message: 'noteIds must be a non-empty array' })
    }

    if (!targetCategoryId || !isValidObjectId(targetCategoryId)) {
      return res.status(400).json({ message: 'Invalid target category ID' })
    }

    const invalidIds = noteIds.filter(id => !isValidObjectId(id))
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: 'Invalid note IDs provided' })
    }

    const targetCategory = await Category.findOne({
      _id: targetCategoryId,
      userId: req.user.id
    })
    if (!targetCategory) {
      return res.status(404).json({ message: 'Target category not found' })
    }

    await Note.updateMany(
      { _id: { $in: noteIds }, userId: req.user.id },
      { categoryId: targetCategoryId }
    )

    logger.info(`Notes moved to category: ${targetCategoryId}`)
    res.status(200).json({ message: 'Notes moved successfully' })
  } catch (error) {
    logger.error(`Move notes error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

const searchNotes = async (req, res) => {
  try {
    const { q } = req.query

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query required' })
    }

    const notes = await Note.find({
      userId: req.user.id,
      title: { $regex: escapeRegex(q), $options: 'i' }
    }).populate('categoryId', 'name color')

    logger.info(`Search results for user: ${req.user.id}`)
    res.status(200).json(notes)
  } catch (error) {
    logger.error(`Search notes error: ${error.message}`)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getNotes,
  getNotesByCategory,
  createNote,
  updateNote,
  deleteNote,
  moveNotes,
  searchNotes
}