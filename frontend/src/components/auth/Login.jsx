import { useNavigate, Link } from "react-router-dom"
import { useState } from "react"
import api from '../../api/axios'
import { useNotes } from '../../context/NotesContext'
import './Login.css'

function Login() {
    const navigate = useNavigate()
    const { refreshAuth } = useNotes()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        if (email === '' || password === '') {
            setError('Please fill in all fields.')
            return
        }

        try {
            setLoading(true)
            const res = await api.post('/auth/login', { email, password })
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('isLoggedIn', 'true')
            localStorage.setItem('user', JSON.stringify(res.data.user))
            refreshAuth()
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login</h2>
                <form onSubmit={handleLogin}>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            setError('')
                        }}
                    />
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setError('')
                        }}
                    />
                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
                    <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
                </form>
            </div>
        </div>
    )
}

export default Login