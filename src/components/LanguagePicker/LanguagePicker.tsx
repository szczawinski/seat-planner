import { useLang } from '../../i18n/LanguageContext'
import type { Lang } from '../../i18n/translations'
import styles from './LanguagePicker.module.css'

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'pl', label: 'Polski' },
  { value: 'en', label: 'English' },
  { value: 'it', label: 'Italiano' },
]

export default function LanguagePicker() {
  const { lang, setLang, t } = useLang()
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      className={styles.picker}
      aria-label={t.languageLabel}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
