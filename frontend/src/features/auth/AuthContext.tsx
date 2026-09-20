import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  changePasswordRequest,
  getSessionRequest,
  loginRequest,
  logoutRequest,
  UNAUTHORIZED_EVENT,
} from './api'
import type { AuthUser } from './types'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthUser>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const clearExpiredSession = () => {
      if (active) setUser(null)
    }

    window.addEventListener(UNAUTHORIZED_EVENT, clearExpiredSession)

    getSessionRequest()
      .then(({ user: sessionUser }) => {
        if (active) setUser(sessionUser)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      window.removeEventListener(UNAUTHORIZED_EVENT, clearExpiredSession)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) {
      const { user: authenticatedUser } = await loginRequest(email, password)
      setUser(authenticatedUser)
      return authenticatedUser
    },
    async logout() {
      try {
        await logoutRequest()
      } finally {
        setUser(null)
      }
    },
    async changePassword(currentPassword, newPassword) {
      await changePasswordRequest(currentPassword, newPassword)
      const { user: refreshedUser } = await getSessionRequest()
      setUser(refreshedUser)
      return refreshedUser
    },
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  return context
}
