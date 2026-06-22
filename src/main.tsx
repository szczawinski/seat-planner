import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './components/LoginPage/LoginPage'
import './index.css'
import App from './App'
import type { AuthUser } from './contexts/AuthContext'

function AuthGate() {
  const { user, loading, logout } = useAuth()
  if (loading) return null
  if (!user) return <LoginPage />
  return <App authUser={user} onLogout={logout} />
}

function Root() {
  const [clientId, setClientId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data: { googleClientId: string | null }) => setClientId(data.googleClientId ?? null))
      .catch(() => setClientId(null))
  }, [])

  if (clientId === undefined) return null

  if (!clientId) {
    return <App />
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

export type { AuthUser }
