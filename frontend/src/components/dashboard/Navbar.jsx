import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotes } from '../../context/NotesContext'
import './Navbar.css'

function Navbar({ onSearch }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const { logout } = useNotes()

  const handleLogout = () => {
    logout()
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleSearch = () => {
    if (onSearch) onSearch(searchQuery)
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="navbar-logo">🗒️</span>
        <span className="navbar-title">My Notes</span>
      </div>

      <div className="navbar-center">
        <div className="navbar-search-wrapper">
          <input
            type="text"
            aria-label="Search notes or categories"
            className="navbar-search"
            placeholder="Search notes or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            type="button"
            className="navbar-search-btn"
            aria-label="Search notes or categories"
            onClick={handleSearch}
          >
            🔍
          </button>

          {searchQuery && (
            <button type="button" aria-label="Clear search" className="search-clear" onClick={() => {
              setSearchQuery('')
              onSearch('')
            }}>✕</button>
          )}
        </div>
      </div>

      <div className="navbar-right">
        <button type="button" className="navbar-logout" onClick={handleLogout}>
          ⇥ Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar