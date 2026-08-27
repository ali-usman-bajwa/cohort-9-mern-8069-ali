const express = require('express')
const router = express.Router()
const {
  getNotes,
  getNotesByCategory,
  createNote,
  updateNote,
  deleteNote,
  moveNotes,
  searchNotes
} = require('../controllers/noteController')
const { protect } = require('../middleware/authMiddleware')

router.get('/search', protect, searchNotes)
router.get('/category/:categoryId', protect, getNotesByCategory)
router.put('/move', protect, moveNotes)
router.get('/', protect, getNotes)
router.post('/', protect, createNote)
router.put('/:id', protect, updateNote)
router.delete('/:id', protect, deleteNote)

module.exports = router