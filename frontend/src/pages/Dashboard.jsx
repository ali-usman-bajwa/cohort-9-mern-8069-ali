import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar'
import CategoryCard from '../components/dashboard/CategoryCard'
import NewCategoryModal from '../components/dashboard/NewCategoryModal'
import { useNotes } from '../context/NotesContext'
import './Dashboard.css'

function Dashboard() {
  const { categories, notes, loading, deleteCategory, addCategory } = useNotes()
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleDeleteCategory = (name, option) => {
    deleteCategory(name, option)
  }

  const handleAddCategory = (name) => {
    return addCategory(name)
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredNotes = searchQuery
    ? notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Navbar onSearch={(q) => setSearchQuery(q)} />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Welcome back! 👋</h1>
            <p>Capture your ideas and never lose track.</p>
          </div>
          <div className="dashboard-actions">
            <button type="button" className="btn-primary" onClick={() => navigate('/notes/new')}>
              + New Note
            </button>
            <button type="button" className="btn-outline" onClick={() => setShowCategoryModal(true)}>
              + New Category
            </button>
          </div>
        </div>

        <div className="categories-section">
          <div className="categories-section-header">
            <h2>📁 Categories {searchQuery && `(${filteredCategories.length})`}</h2>
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
              >
                ← Back to all categories
              </button>
            )}
          </div>

          {filteredCategories.length === 0 && searchQuery && filteredNotes.length === 0 && (
            <div className="no-results">
              <p>No results found for "<strong>{searchQuery}</strong>"</p>
            </div>
          )}

          <div className="categories-grid">
            {filteredCategories.map(cat => (
              <CategoryCard
                key={cat._id}
                id={cat._id}
                name={cat.name}
                description={cat.description}
                noteCount={notes.filter(n => n.categoryId?._id === cat._id).length}
                isDefault={cat.isDefault}
                color={cat.color}
                onDelete={handleDeleteCategory}
              />
            ))}
          </div>
        </div>

        {searchQuery && filteredNotes.length > 0 && (
          <div className="search-notes-section">
            <h2>📝 Notes ({filteredNotes.length})</h2>
            <div className="search-notes-list">
              {filteredNotes.map(note => {
                return (
                  <button
                    type="button"
                    key={note._id}
                    className="search-note-card"
                    onClick={() => navigate(`/notes/${note._id}`)}
                  >
                    <div className="search-note-body">
                      <h3 className="search-note-title">{note.title}</h3>
                      <span
                        className="search-note-category"
                        style={{ color: note.categoryId?.color }}
                      >
                        📁 {note.categoryId?.name}
                      </span>
                    </div>
                    <span className="search-note-date">
                      {note.updatedAt ? `Updated: ${new Date(note.updatedAt).toLocaleDateString()}` : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {showCategoryModal && (
        <NewCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onAdd={handleAddCategory}
          existingCategories={categories}
        />
      )}

      <footer className="dashboard-footer">
        © 2025 My Notes. All rights reserved.
      </footer>
    </div>
  )
}

export default Dashboard