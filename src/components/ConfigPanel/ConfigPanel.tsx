import { useState, useEffect, useRef } from 'react'
import { useLang } from '../../i18n/LanguageContext'
import styles from './ConfigPanel.module.css'

interface ConfigPanelProps {
  tableCount: number
  tableSeatCounts: number[]
  onTableCountChange: (n: number) => void
  onTableSeatsChange: (text: string) => void
  onAssign: () => void
  onBack: () => void
  guestCount: number
  error: string | null
}

function computeSeatsText(counts: number[]): string {
  if (counts.length === 0) return ''
  const allEqual = counts.every((v) => v === counts[0])
  return allEqual ? String(counts[0]) : counts.join(', ')
}

export default function ConfigPanel({
  tableCount,
  tableSeatCounts,
  onTableCountChange,
  onTableSeatsChange,
  onAssign,
  onBack,
  guestCount,
  error,
}: ConfigPanelProps) {
  const { t } = useLang()
  const [seatsText, setSeatsText] = useState(() => computeSeatsText(tableSeatCounts))
  const prevLengthRef = useRef(tableSeatCounts.length)

  useEffect(() => {
    if (tableSeatCounts.length !== prevLengthRef.current) {
      prevLengthRef.current = tableSeatCounts.length
      setSeatsText(computeSeatsText(tableSeatCounts))
    }
  }, [tableSeatCounts])

  const totalSeats = tableSeatCounts.reduce((sum, n) => sum + n, 0)

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
            type="text"
            className={styles.seatsInput}
            value={seatsText}
            placeholder="6"
            onChange={(e) => setSeatsText(e.target.value)}
            onBlur={() => onTableSeatsChange(seatsText)}
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
