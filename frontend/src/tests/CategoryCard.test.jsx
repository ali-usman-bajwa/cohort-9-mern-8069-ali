import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import CategoryCard from '../components/dashboard/CategoryCard'

const mockOnDelete = vi.fn()
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

const defaultProps = {
  name: 'Test Category',
  description: 'Test description',
  noteCount: 5,
  isDefault: false,
  color: '#7B5EA7',
  onDelete: mockOnDelete
}

const renderCard = (props = {}) => {
  return render(
    <MemoryRouter>
      <CategoryCard {...defaultProps} {...props} />
    </MemoryRouter>
  )
}

describe('CategoryCard', () => {
  beforeEach(() => {
    mockOnDelete.mockClear()
    mockNavigate.mockClear()
  })

  it('should render category name and description', () => {
    renderCard()
    expect(screen.getByText('Test Category')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('should render note count', () => {
    renderCard()
    expect(screen.getByText('5 notes')).toBeInTheDocument()
  })

  it('should show Built-in badge for default category', () => {
    renderCard({ isDefault: true })
    expect(screen.getByText('Built-in')).toBeInTheDocument()
  })

  it('should not show delete menu for default category', () => {
    renderCard({ isDefault: true })
    expect(screen.queryByLabelText('Category options')).not.toBeInTheDocument()
  })

  it('should show options menu button for non-default category', () => {
    renderCard()
    expect(screen.getByLabelText('Category options')).toBeInTheDocument()
  })

  it('should navigate on Enter key', () => {
    renderCard()
    const card = screen.getByText('Test Category').closest('.category-card')
    fireEvent.keyDown(card, { key: 'Enter', target: card, currentTarget: card })
    expect(mockNavigate).toHaveBeenCalledWith('/category/Test%20Category')
  })

  it('should navigate on Space key', () => {
    renderCard()
    const card = screen.getByText('Test Category').closest('.category-card')
    fireEvent.keyDown(card, { key: ' ', target: card, currentTarget: card })
    expect(mockNavigate).toHaveBeenCalledWith('/category/Test%20Category')
  })

  it('should open delete modal when delete is clicked', () => {
    renderCard()
    fireEvent.click(screen.getByLabelText('Category options'))
    fireEvent.click(screen.getByText('🗑 Delete'))
    expect(screen.getByText(`Delete "Test Category"?`)).toBeInTheDocument()
  })

  it('should close modal on cancel', () => {
    renderCard()
    fireEvent.click(screen.getByLabelText('Category options'))
    fireEvent.click(screen.getByText('🗑 Delete'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText(`Delete "Test Category"?`)).not.toBeInTheDocument()
  })

  it('should call onDelete with move option by default', () => {
    renderCard()
    fireEvent.click(screen.getByLabelText('Category options'))
    fireEvent.click(screen.getByText('🗑 Delete'))
    fireEvent.click(screen.getByText('Delete Category'))
    expect(mockOnDelete).toHaveBeenCalledWith('Test Category', 'move')
  })

  it('should call onDelete with delete option when selected', () => {
    renderCard()
    fireEvent.click(screen.getByLabelText('Category options'))
    fireEvent.click(screen.getByText('🗑 Delete'))
    fireEvent.click(screen.getByText('Delete all notes'))
    fireEvent.click(screen.getByText('Delete Category'))
    expect(mockOnDelete).toHaveBeenCalledWith('Test Category', 'delete')
  })

  it('should not navigate when child element key pressed', () => {
    renderCard()
    const child = screen.getByText('Test Category')
    fireEvent.keyDown(child, { key: 'Enter' })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
    
  it('should call onDelete with move option when radio selected', () => {
    renderCard()
    fireEvent.click(screen.getByLabelText('Category options'))
    fireEvent.click(screen.getByText('🗑 Delete'))
    const moveRadio = screen.getByDisplayValue('move')
    fireEvent.click(moveRadio)
    fireEvent.click(screen.getByText('Delete Category'))
    expect(mockOnDelete).toHaveBeenCalledWith('Test Category', 'move')
  })
})