import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
 
const AuthContext = createContext(null)
 
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => localStorage.getItem('ds_token'))
  const [loading, setLoading] = useState(true)
 
  // Set axios default header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('ds_token', token)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('ds_token')
    }
  }, [token])
 
  // Verify token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return }
    axios.get('/api/auth/me')
      .then(r => setUser(r.data))
      .catch(() => { setToken(null); setUser(null) })
      .finally(() => setLoading(false))
  }, [])
 
  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    setToken(data.access_token)
    setUser({ id: data.user_id, name: data.name, email: data.email, role: data.role })
    return data
  }
 
  const register = async (email, name, password, role = 'clinician') => {
    const { data } = await axios.post('/api/auth/register', { email, name, password, role })
    setToken(data.access_token)
    setUser({ id: data.user_id, name: data.name, email: data.email, role: data.role })
    return data
  }
 
  const logout = () => {
    setToken(null)
    setUser(null)
  }
 
  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
 
export const useAuth = () => useContext(AuthContext)
