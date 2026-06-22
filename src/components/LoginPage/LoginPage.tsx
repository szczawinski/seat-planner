import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../contexts/AuthContext'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const [status, setStatus] = useState<'idle' | 'denied' | 'error'>('idle')

  async function handleSuccess(response: { credential?: string }) {
    if (!response.credential) { setStatus('error'); return }
    const result = await login(response.credential)
    if (result !== 'ok') setStatus(result)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.ornament}>❦ ✦ ❧</div>
        <h1 className={styles.title}>Plan Rozmieszczenia Gości</h1>
        <p className={styles.subtitle}>Planer Weselny</p>
        <div className={styles.divider} />
        <p className={styles.prompt}>Zaloguj się, aby kontynuować</p>
        <div className={styles.buttonWrapper}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setStatus('error')}
            shape="rectangular"
            theme="outline"
            size="large"
            text="signin_with"
          />
        </div>
        {status === 'denied' && (
          <p className={styles.error}>Brak dostępu. Skontaktuj się z administratorem.</p>
        )}
        {status === 'error' && (
          <p className={styles.error}>Błąd logowania. Spróbuj ponownie.</p>
        )}
      </div>
    </div>
  )
}
