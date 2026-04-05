import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('dg_token'))
  const [user, setUser]   = useState(() => {
    try {
      const raw = localStorage.getItem('dg_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/api/auth/login', { username, password })
    localStorage.setItem('dg_token', data.token)
    setToken(data.token)

    // Decode payload (not full verification — just for display)
    const parts   = data.token.split('.')
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    const userObj = { username: payload.user, role: payload.role }
    localStorage.setItem('dg_user', JSON.stringify(userObj))
    setUser(userObj)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('dg_token')
    localStorage.removeItem('dg_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
