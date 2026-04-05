import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/client'

const StaffAuthContext = createContext(null)

export function StaffAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('dg_staff_token'))
  const [staff, setStaff] = useState(() => {
    try {
      const raw = localStorage.getItem('dg_staff')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/staff/login', { email, password })
    localStorage.setItem('dg_staff_token', data.token)
    setToken(data.token)
    const parts   = data.token.split('.')
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    const obj     = { id: payload.sub, name: payload.name, role: payload.role }
    localStorage.setItem('dg_staff', JSON.stringify(obj))
    setStaff(obj)
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/api/staff/logout') } catch { /* ignore */ }
    localStorage.removeItem('dg_staff_token')
    localStorage.removeItem('dg_staff')
    setToken(null)
    setStaff(null)
  }, [])

  const isLoggedIn = !!token

  return (
    <StaffAuthContext.Provider value={{ token, staff, login, logout, isLoggedIn }}>
      {children}
    </StaffAuthContext.Provider>
  )
}

export const useStaffAuth = () => useContext(StaffAuthContext)
