import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import NewCategoryModal from '../components/dashboard/NewCategoryModal'

const mockOnClose = vi.fn()
const mockOnAdd = vi.fn()

const existingCategories = [
  { _id: 'cat1', name: 'General', isDefault: true },
  { _id: 'cat2', name: 'Work', isDefault: false }
]

const renderModal = () => {
  return render(
    <NewCategoryModal
      onClose={mockOnClose}
      onAdd={mockOnAdd}
      existingCategories={existingCategories}
    />
  )
}

describe('NewCategoryModal', () => {
  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnAdd.mockClear()
  })

  it('should render modal with input', () => {
    renderModal()
    expect(screen.getByPlaceholderText('Category name')).toBeInTheDocument()
  })

  it('should show error when name is empty', () => {
    renderModal()
    fireEvent.click(screen.getByText('Create'))
    expect(screen.getByText('Category name cannot be empty.')).toBeInTheDocument()
  })

  it('should show error when duplicate name', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('Category name'), { target: { value: 'Work' } })
    fireEvent.click(screen.getByText('Create'))
    expect(screen.getByText('Category with this name already exists.')).toBeInTheDocument()
  })

  it('should call onAdd when valid name entered', async () => {
    mockOnAdd.mockResolvedValue(true)
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('Category name'), { target: { value: 'New Category' } })
    fireEvent.click(screen.getByText('Create'))
    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith('New Category')
    })
  })

  it('should show error when onAdd fails', async () => {
    mockOnAdd.mockResolvedValue(false)
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('Category name'), { target: { value: 'New Category' } })
    fireEvent.click(screen.getByText('Create'))
    await waitFor(() => {
      expect(screen.getByText('Failed to create category. Try again.')).toBeInTheDocument()
    })
  })

  it('should call onClose when cancel clicked', () => {
    renderModal()
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should clear error when typing', () => {
    renderModal()
    fireEvent.click(screen.getByText('Create'))
    expect(screen.getByText('Category name cannot be empty.')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Category name'), { target: { value: 'a' } })
    expect(screen.queryByText('Category name cannot be empty.')).not.toBeInTheDocument()
  })
})