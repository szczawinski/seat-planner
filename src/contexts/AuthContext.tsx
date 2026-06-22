import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface AuthUser {
  email: string
  name: string
  picture: string
  isAdmin: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (credential: string) => Promise<'ok' | 'denied' | 'error'>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(credential: string): Promise<'ok' | 'denied' | 'error'> {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      if (res.status === 403) return 'denied'
      if (!res.ok) return 'error'
      const data = await res.json()
      setUser(data)
      return 'ok'
    } catch {
      return 'error'
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
