import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/authApi'

const AuthContext = createContext(null)

// ── Clés localStorage — MODIFIÉES pour correspondre aux autres fichiers ────────
export const TOKEN_KEYS = {
  access:  'access_token',   // ← Changé
  refresh: 'refresh_token',  // ← Changé
  user:    'hrm_user',
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const access = localStorage.getItem(TOKEN_KEYS.access)
    const stored = localStorage.getItem(TOKEN_KEYS.user)
    if (access && stored) {
      try { setUser(JSON.parse(stored)) }
      catch { localStorage.clear() }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password)
    localStorage.setItem(TOKEN_KEYS.access,  data.tokens.access)
    localStorage.setItem(TOKEN_KEYS.refresh, data.tokens.refresh)
    localStorage.setItem(TOKEN_KEYS.user,    JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem(TOKEN_KEYS.refresh)
      if (refresh) await authApi.logout(refresh)
    } catch { /* token expiré */ }
    localStorage.removeItem(TOKEN_KEYS.access)
    localStorage.removeItem(TOKEN_KEYS.refresh)
    localStorage.removeItem(TOKEN_KEYS.user)
    setUser(null)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates }
      localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(updated))
      return updated
    })
  }, [])

  const isAdmin   = user?.role === 'admin'
  const isManager = user?.role === 'manager'
  const canManage = isAdmin || isManager

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAdmin, isManager, canManage }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook séparé du Provider pour compatibilité HMR Vite ──────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être dans <AuthProvider>')
  return ctx
}