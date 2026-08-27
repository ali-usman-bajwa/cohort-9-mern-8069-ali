import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useNotes } from '../context/NotesContext'
import './CategoryView.css'

function CategoryView() {
  const { categoryName } = useParams()
  const { notes, categories, deleteNote, moveNotes } = useNotes()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [isMoveMode, setIsMoveMode] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState([])
  const [targetCategory, setTargetCategory] = useState('')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  const category = categories.find(cat => cat.name === categoryName)
  const categoryNotes = notes.filter(note => note.categoryId?.name === categoryName)
  const userCategories = categories.filter(cat => !cat.isDefault)

  const filteredNotes = categoryNotes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteNote = (note) => {
    setNoteToDelete(note)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    await deleteNote(noteToDelete._id)
    setShowDeleteModal(false)
    setNoteToDelete(null)
  }

  const handleNoteCheck = (noteId) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }

  const handleMoveConfirm = async () => {
    if (selectedNotes.length === 0) return
    await moveNotes(selectedNotes, targetCategory)
    setIsMoveMode(false)
    setSelectedNotes([])
    setTargetCategory('')
  }

  const handleCategorySelect = (catName) => {
    setTargetCategory(catName)
    setShowCategoryPicker(false)
    setIsMoveMode(true)
  }

  if (!category) {
    return (
      <div className="category-view-page">
        <div className="category-not-found">
          <h2>Category not found</h2>
          <button type="button" className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="category-view-page">
      <div className="category-view-container">

        <div className="category-view-header">
          <button type="button" className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <div className="category-view-title">
            <h2 style={{ color: category.color }}>{categoryName}</h2>
            <span className="category-note-count">{categoryNotes.length} notes</span>
          </div>
          <button
            type="button"
            className="btn-new-note"
            onClick={() => navigate(`/notes/new/${categoryName}`)}
          >
            + New Note
          </button>
        </div>

        {category.isDefault && categoryNotes.length > 0 && !isMoveMode && (
          <button
            type="button"
            className="btn-move-category"
            onClick={() => setShowCategoryPicker(true)}
          >
            📂 Move to Category
          </button>
        )}

        {showCategoryPicker && (
          <div className="category-picker">
            <p>Select a category to move notes into:</p>
            {userCategories.length === 0
              ? (
                <div className="no-categories">
                  <p>No categories available.</p>
                  <p>Create a category first from the dashboard.</p>
                  <button type="button" className="btn-back" onClick={() => setShowCategoryPicker(false)}>
                    Cancel
                  </button>
                </div>
              )
              : (
                <div className="category-picker-list">
                  {userCategories.map(cat => (
                    <button
                      type="button"
                      key={cat._id}
                      className="category-picker-item"
                      style={{ borderColor: cat.color, color: cat.color }}
                      onClick={() => handleCategorySelect(cat.name)}
                    >
                      📁 {cat.name}
                    </button>
                  ))}
                  <button type="button" className="btn-cancel-move" onClick={() => setShowCategoryPicker(false)}>
                    Cancel
                  </button>
                </div>
              )
            }
          </div>
        )}

        {isMoveMode && (
          <div className="move-mode-banner">
            <p>Moving to: <strong>{targetCategory}</strong></p>
            <p className="move-mode-hint">Select notes to move</p>
            <div className="move-mode-actions">
              <button
                type="button"
                className="btn-cancel-move"
                onClick={() => {
                  setIsMoveMode(false)
                  setSelectedNotes([])
                  setTargetCategory('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-move-confirm"
                onClick={handleMoveConfirm}
                disabled={selectedNotes.length === 0}
              >
                Move Selected ({selectedNotes.length})
              </button>
            </div>
          </div>
        )}

        <div className="category-search">
          <input
            type="text"
            placeholder={`Search in ${categoryName}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="category-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="category-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >✕</button>
          )}
        </div>

        {filteredNotes.length === 0 && searchQuery && (
          <div className="no-results">
            <p>No notes found for "<strong>{searchQuery}</strong>"</p>
            <button type="button" className="btn-clear-search" onClick={() => setSearchQuery('')}>
              ← Back to all notes
            </button>
          </div>
        )}

        {filteredNotes.length === 0 && !searchQuery && (
          <div className="no-notes">
            <p>No notes in this category yet.</p>
            <button
              type="button"
              className="btn-new-note"
              onClick={() => navigate(`/notes/new/${categoryName}`)}
            >
              + Create your first note
            </button>
          </div>
        )}

        <div className="notes-list">
          {filteredNotes.map(note => (
            <div key={note._id} className="note-card-wrapper">
              {isMoveMode && (
                <input
                  type="checkbox"
                  className="note-checkbox"
                  checked={selectedNotes.includes(note._id)}
                  onChange={() => handleNoteCheck(note._id)}
                />
              )}
              <button
                type="button"
                className={`note-card ${isMoveMode ? 'note-card--selectable' : ''} ${selectedNotes.includes(note._id) ? 'note-card--selected' : ''}`}
                onClick={() => {
                  if (isMoveMode) {
                    handleNoteCheck(note._id)
                  } else {
                    navigate(`/notes/${note._id}`)
                  }
                }}
              >
                <span className="note-card-body">
                  <span className="note-title">{note.title}</span>
                  <span className="note-date">
                    {note.updatedAt
                      ? `Updated: ${new Date(note.updatedAt).toLocaleDateString()}`
                      : `Created: ${new Date(note.createdAt).toLocaleDateString()}`
                    }
                  </span>
                </span>
              </button>
              {!isMoveMode && (
                <div className="note-card-actions">
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => navigate(`/notes/edit/${note._id}`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => handleDeleteNote(note)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {showDeleteModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Delete "{noteToDelete?.title}"?</h3>
            <p>This note will be permanently deleted.</p>
            <div className="modal-buttons">
              <button type="button" className="modal-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button type="button" className="modal-confirm" onClick={confirmDelete}>
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryView