import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService';

const AuthContext = createContext(null)

export const TOKEN_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  user: 'user',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restaurer l'utilisateur depuis localStorage si un token existe
    const storedUser = localStorage.getItem(TOKEN_KEYS.user)
    const accessToken = localStorage.getItem(TOKEN_KEYS.access)

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem(TOKEN_KEYS.user)
      }
    } else {
      // Si pas de token, nettoyer toute donnée résiduelle
      localStorage.removeItem(TOKEN_KEYS.user)
      localStorage.removeItem(TOKEN_KEYS.access)
      localStorage.removeItem(TOKEN_KEYS.refresh)
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password)
    const userData = response.data.user
    setUser(userData)
    localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(userData))
    // Les tokens sont déjà stockés par authService.login (normalement)
    return userData
  }, [])

  const logout = useCallback(async () => {
    // 1. Appeler le backend si nécessaire (optionnel)
    await authService.logout().catch(() => {})
    
    // 2. Supprimer TOUTES les données de session du localStorage
    localStorage.removeItem(TOKEN_KEYS.access)
    localStorage.removeItem(TOKEN_KEYS.refresh)
    localStorage.removeItem(TOKEN_KEYS.user)
    
    // 3. Réinitialiser l'état utilisateur
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