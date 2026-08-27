import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useNotes } from '../context/NotesContext'
import './NoteEditor.css'

function NoteEditor() {
  const { categories, addCategory, addNote, editNote, notes } = useNotes()
  const { categoryName, noteId } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(categoryName || '')
  const prevCategoryRef = useRef(categoryName || '')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, forceUpdate] = useState(0)

  const isEditMode = !!noteId && !categoryName
  const existingNote = noteId ? notes.find(n => n._id === noteId) : null

  console.log('noteId from params:', noteId)
  console.log('all note ids:', notes.map(n => n._id))
  console.log('existingNote found:', existingNote)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: () => forceUpdate(n => n + 1),
    onSelectionUpdate: () => forceUpdate(n => n + 1),
    onTransaction: () => forceUpdate(n => n + 1),
  })

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categoryName || categories[0]?.name || '')
    }
  }, [categories])

  useEffect(() => {
    if (!editor) return
    if (existingNote) {
      setTitle(existingNote.title)
      setSelectedCategory(existingNote.categoryId?.name || '')
      editor.commands.setContent(existingNote.content)
    }
  }, [editor, existingNote])

  const handleSave = async () => {
    if (title.trim() === '') {
      setError('Please add a title.')
      return
    }
    if (!editor || editor.getText().trim() === '') {
      setError('Note content cannot be empty.')
      return
    }

    try {
      setLoading(true)
      if (isEditMode && existingNote) {
        await editNote(existingNote._id, title, editor.getHTML())
        navigate(`/category/${existingNote.categoryId?.name}`)
      } else {
        await addNote(title, editor.getHTML(), selectedCategory)
        navigate(`/category/${selectedCategory}`)
      }
    } catch (err) {
      setError('Failed to save note. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="note-editor-page">
      <div className="note-editor-container">

        <div className="note-editor-header">
          <h2>{isEditMode ? 'Edit Note' : 'New Note'}</h2>
          <div className="note-editor-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="button" className="btn-save" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <input
          type="text"
          className="note-title-input"
          placeholder="Note Title..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setError('')
          }}
        />

        {!isEditMode && (
          <div className="category-section">
            <label className="category-label" htmlFor="category-select">Category</label>
            <select
              id="category-select"
              className="category-select"
              value={selectedCategory}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  prevCategoryRef.current = selectedCategory
                  setShowNewCategory(true)
                } else {
                  setSelectedCategory(e.target.value)
                  setShowNewCategory(false)
                }
              }}
            >
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
              <option value="__new__">+ Create New Category</option>
            </select>

            {showNewCategory && (
              <div className="new-category-inline">
                <input
                  type="text"
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="new-category-input"
                />
                <button
                  type="button"
                  className="btn-create-category"
                  onClick={async () => {
                    if (newCategoryName.trim() === '') return
                    const success = await addCategory(newCategoryName.trim())
                    if (success) {
                      setSelectedCategory(newCategoryName.trim())
                      setNewCategoryName('')
                      setShowNewCategory(false)
                    } else {
                      setError('Category already exists.')
                    }
                  }}
                >
                  Create
                </button>
                <button
                  type="button"
                  className="btn-cancel-category"
                  onClick={() => {
                    setShowNewCategory(false)
                    setSelectedCategory(prevCategoryRef.current)
                    setNewCategoryName('')
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        <div className="toolbar">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor?.isActive('bold') ? 'toolbar-btn active' : 'toolbar-btn'}
          ><b>B</b></button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor?.isActive('italic') ? 'toolbar-btn active' : 'toolbar-btn'}
          ><i>I</i></button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor?.isActive('strike') ? 'toolbar-btn active' : 'toolbar-btn'}
          ><s>S</s></button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor?.isActive('heading', { level: 1 }) ? 'toolbar-btn active' : 'toolbar-btn'}
          >H1</button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor?.isActive('heading', { level: 2 }) ? 'toolbar-btn active' : 'toolbar-btn'}
          >H2</button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor?.isActive('bulletList') ? 'toolbar-btn active' : 'toolbar-btn'}
          >• List</button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor?.isActive('orderedList') ? 'toolbar-btn active' : 'toolbar-btn'}
          >1. List</button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor?.isActive('codeBlock') ? 'toolbar-btn active' : 'toolbar-btn'}
          >{'</>'}</button>
        </div>

        <div className="note-editor-content">
          <EditorContent editor={editor} />
        </div>

      </div>
    </div>
  )
}

export default NoteEditor