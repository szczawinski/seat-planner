import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import styles from './AdminPanel.module.css'

interface AdminPanelProps {
  onClose: () => void
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { user } = useAuth()
  const [users, setUsers] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setError('Nie można załadować listy użytkowników'))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setUsers(await res.json())
      setNewEmail('')
    } catch {
      setError('Błąd podczas dodawania użytkownika')
    }
  }

  async function handleRemove(email: string) {
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setUsers(await res.json())
    } catch {
      setError('Błąd podczas usuwania użytkownika')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.heading}>Panel Administratora</h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        <p className={styles.adminEmail}>Admin: {user?.email}</p>

        <div className={styles.addRow}>
          <input
            type="email"
            className={styles.input}
            placeholder="adres@gmail.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button type="button" className={styles.addButton} onClick={handleAdd}>
            Dodaj
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.userList}>
          <p className={styles.listHeading}>Dostęp ({users.length})</p>
          {loading && <p className={styles.loading}>Ładowanie…</p>}
          {users.map((email) => (
            <div key={email} className={styles.userRow}>
              <span className={styles.userEmail}>{email}</span>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => handleRemove(email)}
                title="Usuń dostęp"
              >
                ✕
              </button>
            </div>
          ))}
          {!loading && users.length === 0 && (
            <p className={styles.empty}>Brak dodanych użytkowników</p>
          )}
        </div>
      </div>
    </div>
  )
}
