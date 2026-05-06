import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService';

const AuthContext = createContext(null)

export const TOKEN_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  user: 'hrm_user',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEYS.user)
    if (stored) {
      try { setUser(JSON.parse(stored)) }
      catch { localStorage.clear() }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password)
    const userData = response.data.user
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates }
      localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(updated))
      return updated
    })
  }, [])

  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager'
  const canManage = isAdmin || isManager

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAdmin, isManager, canManage }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être dans <AuthProvider>')
  return ctx
}