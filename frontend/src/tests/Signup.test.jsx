import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Signup from '../components/auth/Signup'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn()
  }
}))

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  try {
    const actual = await vi.importActual('react-router-dom')
    return {
      ...actual,
      useNavigate: () => mockNavigate
    }
  } catch (err) {
    console.error('Failed to mock react-router-dom:', err)
    throw err
  }
})

describe('Signup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders signup form elements correctly', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 2, name: /create account/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
  })

  it('shows error when submitting empty fields', async () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    expect(await screen.findByText('Please fill in all fields.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows password hint when password length is less than 8 characters', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    const passwordInput = screen.getByPlaceholderText('Password')
    fireEvent.change(passwordInput, { target: { value: '12345' } })

    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()

    fireEvent.change(passwordInput, { target: { value: '12345678' } })
    expect(screen.queryByText('Password must be at least 8 characters')).not.toBeInTheDocument()
  })

  it('handles successful signup flow and navigates to login', async () => {
    api.post.mockResolvedValueOnce({
      data: { message: 'User registered successfully' }
    })

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'New User' } })
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'newuser@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '12345678' } })

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/signup', {
        name: 'New User',
        email: 'newuser@test.com',
        password: '12345678'
      })
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('displays API error message on signup failure', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: { message: 'User already exists' }
      }
    })

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Existing User' } })
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'existing@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '12345678' } })

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    expect(await screen.findByText('User already exists')).toBeInTheDocument()
  })
})