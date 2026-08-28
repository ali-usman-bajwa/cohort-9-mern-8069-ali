import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import NoteView from '../pages/NoteView'
import { NotesContext } from '../context/NotesContext'

const mockEditNote = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockNote = {
  _id: '123',
  title: 'Test Note',
  content: '<p>Test content</p>',
  categoryId: { _id: 'cat1', name: 'General', color: '#187171' },
  createdAt: new Date().toISOString(),
  updatedAt: null
}

const mockNoteWithUpdate = {
  ...mockNote,
  updatedAt: new Date().toISOString()
}

const mockCategories = [
  { _id: 'cat1', name: 'General', color: '#187171', isDefault: true },
  { _id: 'cat2', name: 'Work', color: '#2E86AB', isDefault: false }
]

const renderWithNote = (note = mockNote) => {
  return render(
    <MemoryRouter initialEntries={[`/notes/${note._id}`]}>
      <NotesContext.Provider value={{
        notes: [note],
        categories: mockCategories,
        editNote: mockEditNote
      }}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteView />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/category/:categoryName" element={<div>Category Page</div>} />
        </Routes>
      </NotesContext.Provider>
    </MemoryRouter>
  )
}

const renderNotFound = () => {
  return render(
    <MemoryRouter initialEntries={['/notes/999']}>
      <NotesContext.Provider value={{
        notes: [],
        categories: mockCategories,
        editNote: mockEditNote
      }}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteView />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </NotesContext.Provider>
    </MemoryRouter>
  )
}

describe('NoteView', () => {
  beforeEach(() => {
    mockEditNote.mockClear()
    mockNavigate.mockClear()
  })

  it('should show note not found when note does not exist', () => {
    renderNotFound()
    expect(screen.getByText('Note not found')).toBeInTheDocument()
  })

  it('should navigate to dashboard when back clicked on not found', () => {
    renderNotFound()
    fireEvent.click(screen.getByText('← Back to Dashboard'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it.each([
    ['note title', 'Test Note'],
    ['note content', 'Test content'],
    ['category badge', 'General'],
  ])('should render %s', (_, text) => {
    renderWithNote()
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('should navigate back on back button click', () => {
    renderWithNote()
    fireEvent.click(screen.getByText('← Back'))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('should navigate to edit page on edit button click', () => {
    renderWithNote()
    fireEvent.click(screen.getByText('Edit'))
    expect(mockNavigate).toHaveBeenCalledWith('/notes/edit/123')
  })

  it('should open change category modal', () => {
    renderWithNote()
    fireEvent.click(screen.getByText('📁 Change Category'))
    expect(screen.getByText('Change Category')).toBeInTheDocument()
  })

  it('should close modal on cancel', () => {
    renderWithNote()
    fireEvent.click(screen.getByText('📁 Change Category'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Change Category')).not.toBeInTheDocument()
  })

  it('should show created date when no updatedAt', () => {
    renderWithNote()
    expect(screen.getByText(/Created:/)).toBeInTheDocument()
  })

  it('should show updated date when updatedAt exists', () => {
    renderWithNote(mockNoteWithUpdate)
    expect(screen.getByText(/Updated:/)).toBeInTheDocument()
  })

  it('should call editNote when category changed and confirmed', async () => {
    mockEditNote.mockResolvedValue({ success: true })
    renderWithNote()
    fireEvent.click(screen.getByText('📁 Change Category'))
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Work' } })
    fireEvent.click(screen.getByText('Move Note'))
    await waitFor(() => {
      expect(mockEditNote).toHaveBeenCalledWith('123', 'Test Note', '<p>Test content</p>', 'Work')
    })
  })

  it('should show error when editNote fails', async () => {
    mockEditNote.mockResolvedValue({ success: false, message: 'Failed to change category. Try again.' })
    renderWithNote()
    fireEvent.click(screen.getByText('📁 Change Category'))
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Work' } })
    fireEvent.click(screen.getByText('Move Note'))
    await waitFor(() => {
      expect(screen.getByText('Failed to change category. Try again.')).toBeInTheDocument()
    })
  })

  it('should close modal when same category selected', async () => {
    renderWithNote()
    fireEvent.click(screen.getByText('📁 Change Category'))
    fireEvent.click(screen.getByText('Move Note'))
    await waitFor(() => {
      expect(screen.queryByText('Change Category')).not.toBeInTheDocument()
    })
  })
})