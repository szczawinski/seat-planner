import type { Guest, Table } from '../../types'
import { useLang } from '../../i18n/LanguageContext'
import TableCard from '../TableCard/TableCard'
import styles from './SeatingChart.module.css'

interface SeatingChartProps {
  tables: Table[]
  guests: Guest[]
  selectedGuestId: string | null
  coupleColorMap: Map<string, string>
  onGuestClick: (guestId: string) => void
  onEmptySeatClick: (tableId: string, seatIndex: number) => void
  tableCount: number
}

export default function SeatingChart({ tables, guests, selectedGuestId, coupleColorMap, onGuestClick, onEmptySeatClick, tableCount }: SeatingChartProps) {
  const { t } = useLang()
  const compact = tableCount >= 4

  if (tables.length === 0) {
    return (
      <div className={styles.idle}>
        <span className={styles.idleOrnament}>❦ ✦ ❧</span>
        <p>{t.idleText(t.assignButton)}</p>
      </div>
    )
  }

  const gridStyle = compact
    ? { gridTemplateColumns: `repeat(${tableCount}, 1fr)`, gap: '12px' }
    : undefined

  return (
    <div className={styles.grid} style={gridStyle}>
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          guests={guests}
          selectedGuestId={selectedGuestId}
          coupleColorMap={coupleColorMap}
          compact={compact}
          onGuestClick={onGuestClick}
          onEmptySeatClick={onEmptySeatClick}
        />
      ))}
    </div>
  )
}
