import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useNotes } from '../context/NotesContext'
import './NoteView.css'

function NoteView() {
  const { noteId } = useParams()
  const { notes, categories, editNote } = useNotes()
  const navigate = useNavigate()
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(false)

  const note = notes.find(n => n._id === noteId)
  const category = note ? categories.find(cat => cat._id === note.categoryId?._id) : null

  if (!note) {
    return (
      <div className="note-view-page">
        <div className="note-not-found">
          <h2>Note not found</h2>
          <button type="button" className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleChangeCategory = async () => {
    if (selectedCategory && selectedCategory !== note.categoryId?.name) {
      try {
        setLoading(true)
        const result = await editNote(note._id, note.title, note.content, selectedCategory)
        if (result?.success) {
          navigate(`/category/${encodeURIComponent(selectedCategory)}`)
        } else {
          console.error('Failed to change category:', result?.message)
        }
      } catch (err) {
        console.error('Error changing category:', err)
      } finally {
        setLoading(false)
      }
    }
    setShowCategoryModal(false)
  }

  return (
    <div className="note-view-page">
      <div className="note-view-container">

        <div className="note-view-header">
          <button type="button" className="btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="note-view-actions">
            <button
              type="button"
              className="btn-change-category"
              onClick={() => {
                setSelectedCategory(note.categoryId?.name || '')
                setShowCategoryModal(true)
              }}
            >
              📁 Change Category
            </button>
            <button
              type="button"
              className="btn-edit"
              onClick={() => navigate(`/notes/edit/${note._id}`)}
            >
              Edit
            </button>
          </div>
        </div>

        <div className="note-view-meta">
          <span
            className="note-category-badge"
            style={{
              backgroundColor: `${category?.color}20`,
              color: category?.color
            }}
          >
            {note.categoryId?.name}
          </span>
          <span className="note-date">
            {note.updatedAt
              ? `Updated: ${new Date(note.updatedAt).toLocaleDateString()}`
              : `Created: ${new Date(note.createdAt).toLocaleDateString()}`
            }
          </span>
        </div>

        <h1 className="note-view-title">{note.title}</h1>

        <div
          className="note-view-content ProseMirror"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />

      </div>

      {showCategoryModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Change Category</h3>
            <p>Move "<strong>{note.title}</strong>" to:</p>
            <select
              className="category-select-modal"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="modal-buttons">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setShowCategoryModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-confirm-teal"
                onClick={handleChangeCategory}
                disabled={loading}
              >
                {loading ? 'Moving...' : 'Move Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NoteView