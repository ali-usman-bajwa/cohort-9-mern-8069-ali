import { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../api/axios'

const NotesContext = createContext()

export function NotesProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const fetchNotesRef = useRef(0)
  const [token, setToken] = useState(localStorage.getItem('token'))

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchNotes = async () => {
    const requestId = ++fetchNotesRef.current
    try {
      const res = await api.get('/notes')
      if (requestId === fetchNotesRef.current) {
        setNotes(res.data)
      }
      return { success: true }
    } catch (error) {
      console.error('Error fetching notes:', error)
      return { success: false }
    }
  }

  useEffect(() => {
    if (token) {
      setLoading(true)
      fetchNotesRef.current = 0
      Promise.all([fetchCategories(), fetchNotes()])
        .finally(() => setLoading(false))
    } else {
      setNotes([])
      setCategories([])
      setLoading(false)
    }
  }, [token])

  const addCategory = async (name) => {
    try {
      const colors = ['#7B5EA7', '#2E86AB', '#C17D3C', '#E05C8A', '#3DAA6E', '#E07B39']
      const color = colors[Math.floor(Math.random() * colors.length)]
      const res = await api.post('/categories', { name, color })
      setCategories(prev => [...prev, res.data])
      return true
    } catch (error) {
      if (error.response?.status === 400) {
        return false
      }
      console.error('Error creating category:', error)
      return false
    }
  }

  const deleteCategory = async (name, option) => {
    try {
      const category = categories.find(cat => cat.name === name)

      if (!category) {
        console.error('Category not found:', name)
        return { success: false, message: 'Category not found' }
      }

      if (option === 'move') {
        const generalCat = categories.find(cat => cat.isDefault)

        if (!generalCat) {
          console.error('No default category found')
          return { success: false, message: 'Default category not found. Cannot move notes.' }
        }

        await api.delete(`/categories/${category._id}`, {
          data: { option }
        })

        setNotes(prev => prev.map(note =>
          note.categoryId?._id === category._id
            ? { ...note, categoryId: { _id: generalCat._id, name: generalCat.name, color: generalCat.color } }
            : note
        ))
      } else {
        await api.delete(`/categories/${category._id}`, {
          data: { option }
        })

        setNotes(prev => prev.filter(note => note.categoryId?._id !== category._id))
      }

      setCategories(prev => prev.filter(cat => cat.name !== name))
      return { success: true }
    } catch (error) {
      console.error('Error deleting category:', error)
      return { success: false, message: 'Failed to delete category' }
    }
  }

  const addNote = async (title, content, categoryName) => {
    try {
      const category = categories.find(cat => cat.name === categoryName)
      if (!category) return { success: false, message: 'Category not found' }

      const clientRequestId = `${Date.now()}-${Math.random()}`

      await api.post('/notes', {
        title,
        content,
        categoryId: category._id,
        clientRequestId
      })

      fetchNotes().catch(err => console.error('Refresh failed:', err))
      return { success: true }
    } catch (error) {
      console.error('Error creating note:', error)
      return { success: false, message: 'Failed to create note' }
    }
  }

  const editNote = async (id, title, content, newCategoryName) => {
    try {
      const updateData = { title, content }
      if (newCategoryName) {
        const category = categories.find(cat => cat.name === newCategoryName)
        if (!category) return { success: false, message: 'Category not found' }
        updateData.categoryId = category._id
      }

      await api.put(`/notes/${id}`, updateData)

      const refresh = await fetchNotes()
      if (!refresh.success) {
        return { success: false, message: 'Note updated but failed to refresh' }
      }
      return { success: true }
    } catch (error) {
      console.error('Error updating note:', error)
      return { success: false, message: 'Failed to update note' }
    }
  }

  const moveNotes = async (noteIds, targetCategoryName) => {
    try {
      const targetCategory = categories.find(cat => cat.name === targetCategoryName)
      if (!targetCategory) return { success: false, message: 'Category not found' }

      await api.put('/notes/move', {
        noteIds,
        targetCategoryId: targetCategory._id
      })

      const refresh = await fetchNotes()
      if (!refresh.success) {
        return { success: false, message: 'Notes moved but failed to refresh' }
      }
      return { success: true }
    } catch (error) {
      console.error('Error moving notes:', error)
      return { success: false, message: 'Failed to move notes' }
    }
  }

  const deleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`)
      setNotes(prev => prev.filter(n => n._id !== id))
      return { success: true }
    } catch (error) {
      console.error('Error deleting note:', error)
      return { success: false, message: 'Failed to delete note' }
    }
  }

  return (
    <NotesContext.Provider value={{
      categories,
      notes,
      loading,
      addCategory,
      deleteCategory,
      addNote,
      editNote,
      deleteNote,
      moveNotes,
      fetchCategories,
      fetchNotes,
      logout,
      refreshAuth: () => setToken(localStorage.getItem('token'))
    }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  return useContext(NotesContext)
}