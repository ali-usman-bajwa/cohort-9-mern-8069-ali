import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Dashboard from '../pages/Dashboard'
import * as NotesContext from '../context/NotesContext'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('Dashboard Component', () => {
  const mockDeleteCategory = vi.fn()
  const mockAddCategory = vi.fn().mockResolvedValue({ success: true })

  const sampleCategories = [
    { _id: 'cat1', name: 'General', description: 'All your general notes', isDefault: true, color: '#187171' },
    { _id: 'cat2', name: 'Work', description: 'Work related tasks', isDefault: false, color: '#7B5EA7' }
  ]

  const sampleNotes = [
    { _id: 'note1', title: 'React Testing Guide', content: 'Use Vitest and RTL', categoryId: { _id: 'cat2', name: 'Work', color: '#7B5EA7' }, updatedAt: new Date().toISOString() },
    { _id: 'note2', title: 'Shopping List', content: 'Buy milk and eggs', categoryId: { _id: 'cat1', name: 'General', color: '#187171' }, updatedAt: new Date().toISOString() }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(NotesContext, 'useNotes').mockReturnValue({
      categories: sampleCategories,
      notes: sampleNotes,
      loading: false,
      deleteCategory: mockDeleteCategory,
      addCategory: mockAddCategory,
      logout: vi.fn()
    })
  })

  it('renders loading state when loading is true', () => {
    vi.spyOn(NotesContext, 'useNotes').mockReturnValue({
      categories: [],
      notes: [],
      loading: true,
      deleteCategory: mockDeleteCategory,
      addCategory: mockAddCategory,
      logout: vi.fn()
    })

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders dashboard header, actions, and categories', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    expect(screen.getByText('Welcome back! 👋')).toBeInTheDocument()
    expect(screen.getByText('+ New Note')).toBeInTheDocument()
    expect(screen.getByText('+ New Category')).toBeInTheDocument()

    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('navigates to /notes/new when clicking + New Note button', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('+ New Note'))
    expect(mockNavigate).toHaveBeenCalledWith('/notes/new')
  })

  it('opens New Category modal and handles category creation', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('+ New Category'))

    expect(screen.getByRole('heading', { level: 3, name: 'New Category' })).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Category name')
    fireEvent.change(input, { target: { value: 'Projects' } })

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(mockAddCategory).toHaveBeenCalledWith('Projects')
      expect(screen.queryByText('New Category')).not.toBeInTheDocument()
    })
  })

  it('shows error in modal if category name is empty or duplicate', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('+ New Category'))

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(screen.getByText('Category name cannot be empty.')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Category name')
    fireEvent.change(input, { target: { value: 'General' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(screen.getByText('Category with this name already exists.')).toBeInTheDocument()
  })

  it('handles search input and displays matching categories and notes', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText('Search notes or categories...')
    fireEvent.change(searchInput, { target: { value: 'React' } })

    const searchButtons = screen.getAllByRole('button', { name: /search/i })
    fireEvent.click(searchButtons[0])

    expect(screen.getByText('React Testing Guide')).toBeInTheDocument()
  })

  it('displays no results message when search query matches nothing', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText('Search notes or categories...')
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } })

    const searchButtons = screen.getAllByRole('button', { name: /search/i })
    fireEvent.click(searchButtons[0])

    expect(screen.getByText(/No results found for/i)).toBeInTheDocument()
  })
})
