import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import Login from "./components/auth/Login"
import Signup from "./components/auth/Signup"
import Dashboard from "./pages/Dashboard"
import NoteEditor from './pages/NoteEditor'
import CategoryView from './pages/CategoryView'
import NoteView from './pages/NoteView'


function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  return isLoggedIn === 'true' ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login"/>}/>
        <Route path="/login" element={<Login />}/>
        <Route path="/signup" element={<Signup />}/>
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }/>
        <Route path="/notes/new" element={
          <ProtectedRoute>
            <NoteEditor />
          </ProtectedRoute>
        } />
        <Route path="/category/:categoryName" element={
          <ProtectedRoute>
            <CategoryView />
          </ProtectedRoute>
        } />
        <Route path="/notes/new/:categoryName" element={
          <ProtectedRoute>
            <NoteEditor />
          </ProtectedRoute>
        } />
        <Route path="/notes/edit/:noteId" element={
          <ProtectedRoute>
            <NoteEditor />
          </ProtectedRoute>
        } />
        <Route path="/notes/:noteId" element={
          <ProtectedRoute>
            <NoteView />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App