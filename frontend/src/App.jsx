import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar    from './components/Navbar'
import Footer    from './components/Footer'
import Home      from './pages/Home'
import Analyze   from './pages/Analyze'
import Compare   from './pages/Compare'
import Tracker   from './pages/Tracker'
import Analytics from './pages/Analytics'
import Auth      from './pages/Auth'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col bg-ds-bg grid-bg">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/login"     element={<Auth mode="login" />} />
          <Route path="/register"  element={<Auth mode="register" />} />
          <Route path="/analyze"   element={<Analyze />} />
          <Route path="/compare"   element={<Compare />} />
          <Route path="/tracker"   element={<ProtectedRoute><Tracker /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
