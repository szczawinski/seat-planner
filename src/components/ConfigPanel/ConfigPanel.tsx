import { useLang } from '../../i18n/LanguageContext'
import styles from './ConfigPanel.module.css'

interface ConfigPanelProps {
  tableCount: number
  seatsPerTable: number
  onTableCountChange: (n: number) => void
  onSeatsPerTableChange: (n: number) => void
  onAssign: () => void
  onBack: () => void
  guestCount: number
  error: string | null
}

export default function ConfigPanel({
  tableCount,
  seatsPerTable,
  onTableCountChange,
  onSeatsPerTableChange,
  onAssign,
  onBack,
  guestCount,
  error,
}: ConfigPanelProps) {
  const { t } = useLang()
  const totalSeats = tableCount * seatsPerTable
  return (
    <div className={styles.panel}>
      <p className={styles.guestSummary}>{t.guestSummary(guestCount, totalSeats)}</p>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="table-count">
            {t.tablesLabel}
          </label>
          <input
            id="table-count"
            type="number"
            min={1}
            className={styles.input}
            value={tableCount}
            onChange={(e) => onTableCountChange(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="seats-per-table">
            {t.seatsPerTableLabel}
          </label>
          <input
            id="seats-per-table"
            type="number"
            min={1}
            className={styles.input}
            value={seatsPerTable}
            onChange={(e) => onSeatsPerTableChange(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <button className={styles.button} onClick={onAssign} aria-label={t.assignAriaLabel}>
          {t.assignButton}
        </button>
      </div>
      {error && (
        <p className={styles.error} role="status" aria-live="polite">
          {error}
        </p>
      )}
      <div className={styles.backRow}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          {t.back}
        </button>
      </div>
    </div>
  )
}
