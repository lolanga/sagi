import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('sagi_user')
    if (!stored) return null
    try { return JSON.parse(stored) } catch { return null }
  })

  const login = useCallback(async (dni, password) => {
    const { data } = await api.post('/login', { dni, password })
    localStorage.setItem('sagi_token', data.token)
    localStorage.setItem('sagi_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      // ignorar errores de red al cerrar sesión
    }
    localStorage.removeItem('sagi_token')
    localStorage.removeItem('sagi_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}