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
  onDragSwap: (draggedId: string, targetId: string) => void
  onDragMove: (draggedId: string, toTableId: string, toSeatIndex: number) => void
}

export default function SeatingChart({ tables, guests, selectedGuestId, coupleColorMap, onGuestClick, onEmptySeatClick, onDragSwap, onDragMove }: SeatingChartProps) {
  const { t } = useLang()

  if (tables.length === 0) {
    return (
      <div className={styles.idle}>
        <span className={styles.idleOrnament}>❦ ✦ ❧</span>
        <p>{t.idleText(t.assignButton)}</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          guests={guests}
          selectedGuestId={selectedGuestId}
          coupleColorMap={coupleColorMap}
          onGuestClick={onGuestClick}
          onEmptySeatClick={onEmptySeatClick}
          onDragSwap={onDragSwap}
          onDragMove={onDragMove}
        />
      ))}
    </div>
  )
}
