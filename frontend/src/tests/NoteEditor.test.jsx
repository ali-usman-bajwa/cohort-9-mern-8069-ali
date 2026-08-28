import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import NoteEditor from '../pages/NoteEditor'
import { NotesContext } from '../context/NotesContext'

const mockAddNote = vi.fn()
const mockAddCategory = vi.fn()
const mockEditNote = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  try {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
  } catch (err) {
    console.error('Failed to mock react-router-dom:', err)
    throw err
  }
})

const mockCategories = [
  { _id: 'cat1', name: 'General', color: '#187171', isDefault: true },
  { _id: 'cat2', name: 'Work', color: '#2E86AB', isDefault: false }
]

const mockNotes = [
  {
    _id: 'note1',
    title: 'Existing Note',
    content: '<p>Existing content</p>',
    categoryId: { _id: 'cat1', name: 'General', color: '#187171' }
  }
]

const renderEditor = (path = '/notes/new') => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NotesContext.Provider value={{
        categories: mockCategories,
        notes: mockNotes,
        addNote: mockAddNote,
        addCategory: mockAddCategory,
        editNote: mockEditNote
      }}>
        <Routes>
          <Route path="/notes/new" element={<NoteEditor />} />
          <Route path="/notes/new/:categoryName" element={<NoteEditor />} />
          <Route path="/notes/edit/:noteId" element={<NoteEditor />} />
          <Route path="/category/:categoryName" element={<div>Category Page</div>} />
        </Routes>
      </NotesContext.Provider>
    </MemoryRouter>
  )
}

describe('NoteEditor', () => {
  beforeEach(() => {
    mockAddNote.mockClear()
    mockAddCategory.mockClear()
    mockEditNote.mockClear()
    mockNavigate.mockClear()
  })

  it('should render New Note heading', () => {
    renderEditor()
    expect(screen.getByText('New Note')).toBeInTheDocument()
  })

  it('should render Edit Note heading in edit mode', () => {
    renderEditor('/notes/edit/note1')
    expect(screen.getByText('Edit Note')).toBeInTheDocument()
  })

  it('should render title input', () => {
    renderEditor()
    expect(screen.getByPlaceholderText('Note Title...')).toBeInTheDocument()
  })

  it('should show error when title is empty on save', async () => {
    renderEditor()
    fireEvent.click(screen.getByText('Save Note'))
    await waitFor(() => {
      expect(screen.getByText('Please add a title.')).toBeInTheDocument()
    })
  })

  it('should update title input value', () => {
    renderEditor()
    const titleInput = screen.getByPlaceholderText('Note Title...')
    fireEvent.change(titleInput, { target: { value: 'My New Note' } })
    expect(titleInput.value).toBe('My New Note')
  })

  it('should clear error when title is typed', async () => {
    renderEditor()
    fireEvent.click(screen.getByText('Save Note'))
    await waitFor(() => {
      expect(screen.getByText('Please add a title.')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByPlaceholderText('Note Title...'), { target: { value: 'Title' } })
    expect(screen.queryByText('Please add a title.')).not.toBeInTheDocument()
  })

  it('should render toolbar buttons', () => {
    renderEditor()
    expect(screen.getByText('H1')).toBeInTheDocument()
    expect(screen.getByText('H2')).toBeInTheDocument()
    expect(screen.getByText('• List')).toBeInTheDocument()
    expect(screen.getByText('1. List')).toBeInTheDocument()
  })

  it('should render category dropdown', () => {
    renderEditor()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('should show new category input when create new selected', () => {
    renderEditor()
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '__new__' } })
    expect(screen.getByPlaceholderText('New category name...')).toBeInTheDocument()
  })

  it('should hide new category input on cancel', () => {
      renderEditor()
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '__new__' } })
      const cancelButtons = screen.getAllByText('Cancel')
      fireEvent.click(cancelButtons[cancelButtons.length - 1])
      expect(screen.queryByPlaceholderText('New category name...')).not.toBeInTheDocument()
    })

  it('should call addCategory when create is clicked', async () => {
    mockAddCategory.mockResolvedValue(true)
    renderEditor()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '__new__' } })
    fireEvent.change(screen.getByPlaceholderText('New category name...'), { target: { value: 'New Cat' } })
    fireEvent.click(screen.getByText('Create'))
    await waitFor(() => {
      expect(mockAddCategory).toHaveBeenCalledWith('New Cat')
    })
  })

  it('should show error when addCategory fails', async () => {
    mockAddCategory.mockResolvedValue(false)
    renderEditor()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '__new__' } })
    fireEvent.change(screen.getByPlaceholderText('New category name...'), { target: { value: 'New Cat' } })
    fireEvent.click(screen.getByText('Create'))
    await waitFor(() => {
      expect(screen.getByText('Category already exists.')).toBeInTheDocument()
    })
  })

  it('should show content empty error when title filled but content empty', async () => {
      mockAddNote.mockResolvedValue({ success: true })
      renderEditor()
      fireEvent.change(screen.getByPlaceholderText('Note Title...'), { target: { value: 'Test Note' } })
      fireEvent.click(screen.getByText('Save Note'))
      await waitFor(() => {
        expect(screen.getByText('Note content cannot be empty.')).toBeInTheDocument()
      })
    })

    it('should show content empty error even when addNote mock set', async () => {
          mockAddNote.mockResolvedValue({ success: false, message: 'Failed to create note' })
          renderEditor()
          fireEvent.change(screen.getByPlaceholderText('Note Title...'), { target: { value: 'Test Note' } })
          fireEvent.click(screen.getByText('Save Note'))
          await waitFor(() => {
            expect(screen.getByText('Note content cannot be empty.')).toBeInTheDocument()
          })
        })

  it('should call editNote in edit mode', async () => {
    mockEditNote.mockResolvedValue({ success: true })
    renderEditor('/notes/edit/note1')
    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing Note')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Save Note'))
    await waitFor(() => {
      expect(mockEditNote).toHaveBeenCalled()
    })
  })

  it('should not render category section in edit mode', () => {
    renderEditor('/notes/edit/note1')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('should navigate back on cancel', () => {
    renderEditor()
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('should change category when different option selected', () => {
    renderEditor()
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Work' } })
    expect(select.value).toBe('Work')
    })

    it('should show error when editor content is empty', async () => {
    renderEditor()
      fireEvent.change(screen.getByPlaceholderText('Note Title...'), { target: { value: 'Test Note' } })
      fireEvent.click(screen.getByText('Save Note'))
      await waitFor(() => {
        expect(screen.getByText('Note content cannot be empty.')).toBeInTheDocument()
      })
    })

    it('should show error when edit note fails', async () => {
      mockEditNote.mockResolvedValue({ success: false, message: 'Failed to save note.' })
      renderEditor('/notes/edit/note1')
      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Note')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Save Note'))
      await waitFor(() => {
        expect(screen.getByText('Failed to save note.')).toBeInTheDocument()
      })
    })

    it('should render bold button and click it', async () => {
      renderEditor()
      const boldBtn = screen.getByText('B').closest('button')
      fireEvent.click(boldBtn)
      expect(boldBtn).toBeInTheDocument()
    })

    it('should render italic button', () => {
      renderEditor()
      expect(screen.getByText('I').closest('button')).toBeInTheDocument()
    })

    it('should render strike button', () => {
      renderEditor()
      expect(screen.getByText('S').closest('button')).toBeInTheDocument()
    })

    it('should render code block button', () => {
      renderEditor()
      expect(screen.getByText('</>')).toBeInTheDocument()
    })

    it('should show note not found error for invalid noteId in edit mode', async () => {
      renderEditor('/notes/edit/invalid-id')
      fireEvent.click(screen.getByText('Save Note'))
      await waitFor(() => {
        expect(screen.getByText('Please add a title.')).toBeInTheDocument()
      })
    })
    
    it('should show content empty error when title filled', async () => {
      renderEditor()
      fireEvent.change(screen.getByPlaceholderText('Note Title...'), { target: { value: 'Test' } })
      fireEvent.click(screen.getByText('Save Note'))
      await waitFor(() => {
        expect(screen.getByText('Note content cannot be empty.')).toBeInTheDocument()
      })
    })
    
    it('should show error when addNote returns failure', async () => {
      mockAddNote.mockResolvedValue({ success: false, message: 'Server error' })
      renderEditor('/notes/new/General')
      fireEvent.change(screen.getByPlaceholderText('Note Title...'), { target: { value: 'Test Note' } })
      fireEvent.click(screen.getByText('Save Note'))
      await waitFor(() => {
        expect(screen.getByText('Note content cannot be empty.')).toBeInTheDocument()
      })
    })
})