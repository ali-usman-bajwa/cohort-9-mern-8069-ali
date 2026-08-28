import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CategoryCard.css'

function CategoryCard({ name, description, noteCount, isDefault, color, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [deleteOption, setDeleteOption] = useState('move')
  const navigate = useNavigate()

  const handleDeleteConfirm = () => {
    onDelete(name, deleteOption)
    setShowModal(false)
  }

  return (
    <>
      <div
        className={`category-card ${isDefault ? 'category-card--default' : ''}`}
        onClick={() => navigate(`/category/${encodeURIComponent(name)}`)}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter') {
            navigate(`/category/${encodeURIComponent(name)}`)
          }
          if (e.key === ' ') {
            e.preventDefault()
            navigate(`/category/${encodeURIComponent(name)}`)
          }
        }}
      >
        <div className="category-card-top">
          <div className="category-icon" style={{ backgroundColor: `${color}20`, color: color }}>
            {isDefault ? '📁' : '📂'}
          </div>
          {isDefault
            ? <span className="built-in-badge">Built-in</span>
            : (
              <div className="category-menu-wrapper">
                <button
                  type="button"
                  className="category-menu"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(!menuOpen)
                  }}
                  aria-expanded={menuOpen}
                  aria-label="Category options"
                >⋮</button>
                {menuOpen && (
                  <div className="category-dropdown">
                    <button
                      type="button"
                      className="dropdown-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(false)
                        setShowModal(true)
                      }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            )
          }
        </div>

        <div className="category-card-body">
          <h3 style={{ color: color }}>{name}</h3>
          <p>{description}</p>
        </div>

        <div className="category-card-footer">
          <span className="note-count" style={{ backgroundColor: `${color}20`, color: color }}>
            {noteCount} notes
          </span>
        </div>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="modal">
            <h3 id="delete-modal-title">Delete "{name}"?</h3>
            <p>This category contains <strong>{noteCount} notes</strong>.</p>
            <p>What would you like to do with these notes?</p>

            <div className="modal-options">
              <label>
                <input
                  type="radio"
                  name="deleteOption"
                  value="move"
                  checked={deleteOption === 'move'}
                  onChange={() => setDeleteOption('move')}
                />{' '}
                Move all notes to General
              </label>
              <label>
                <input
                  type="radio"
                  name="deleteOption"
                  value="delete"
                  checked={deleteOption === 'delete'}
                  onChange={() => setDeleteOption('delete')}
                />{' '}
                Delete all notes
              </label>
            </div>

            <div className="modal-buttons">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-confirm"
                onClick={handleDeleteConfirm}
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CategoryCard;