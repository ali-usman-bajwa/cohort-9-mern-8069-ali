import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Login from '../components/auth/Login'
import api from '../api/axios'
import * as NotesContext from '../context/NotesContext'

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn()
  }
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('Login Component', () => {
  const mockRefreshAuth = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.spyOn(NotesContext, 'useNotes').mockReturnValue({
      refreshAuth: mockRefreshAuth
    })
  })

  it('renders login form with input fields, button, and signup link', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 2, name: /login/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })

  it('displays error when submitting empty fields', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    expect(await screen.findByText('Please fill in all fields.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('clears error when typing into input fields', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /login/i }))
    expect(await screen.findByText('Please fill in all fields.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
    expect(screen.queryByText('Please fill in all fields.')).not.toBeInTheDocument()
  })

  it('handles successful login flow', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: 'fake-jwt-token',
        user: { id: '123', name: 'Test User', email: 'user@test.com' }
      }
    })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'user@test.com',
        password: 'password123'
      })
      expect(localStorage.getItem('token')).toBe('fake-jwt-token')
      expect(localStorage.getItem('isLoggedIn')).toBe('true')
      expect(localStorage.getItem('user')).toContain('Test User')
      expect(mockRefreshAuth).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('displays API error message on login failure', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Invalid credentials' }
      }
    })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } })

    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
  })
})
