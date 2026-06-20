import { useLang } from '../../i18n/LanguageContext'
import styles from './GuestInput.module.css'

interface GuestInputProps {
  value: string
  onChange: (text: string) => void
}

export default function GuestInput({ value, onChange }: GuestInputProps) {
  const { t } = useLang()
  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor="guest-input">
        {t.guestInputLabel}
      </label>
      <textarea
        id="guest-input"
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.guestInputPlaceholder}
        rows={10}
      />
    </div>
  )
}
