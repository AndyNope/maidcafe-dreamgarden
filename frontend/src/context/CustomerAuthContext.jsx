import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/client'

const CustomerAuthContext = createContext(null)

export function CustomerAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('dg_customer_token'))
  const [customer, setCustomer] = useState(() => {
    try {
      const raw = localStorage.getItem('dg_customer')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/customer/login', { email, password })
    localStorage.setItem('dg_customer_token', data.token)
    setToken(data.token)
    const parts   = data.token.split('.')
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    const obj     = { id: payload.sub, first_name: payload.first_name }
    localStorage.setItem('dg_customer', JSON.stringify(obj))
    setCustomer(obj)
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/api/customer/logout') } catch { /* ignore */ }
    localStorage.removeItem('dg_customer_token')
    localStorage.removeItem('dg_customer')
    setToken(null)
    setCustomer(null)
  }, [])

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      const { data } = await api.get('/api/customer/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCustomer(data)
      localStorage.setItem('dg_customer', JSON.stringify(data))
    } catch {
      logout()
    }
  }, [token, logout])

  const isLoggedIn = !!token

  return (
    <CustomerAuthContext.Provider value={{ token, customer, login, logout, refresh, isLoggedIn }}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export const useCustomerAuth = () => useContext(CustomerAuthContext)
