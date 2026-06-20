import type { Guest, Table } from '../../types'
import { useLang } from '../../i18n/LanguageContext'
import styles from './TableCard.module.css'

interface TableCardProps {
  table: Table
  guests: Guest[]
  selectedGuestId: string | null
  coupleColorMap: Map<string, string>
  onGuestClick: (guestId: string) => void
}

function SeatItem({
  seatId,
  guest,
  isSelected,
  selectedSuffix,
  coupleColor,
  onGuestClick,
}: {
  seatId: string | null
  guest: Guest | undefined
  isSelected: boolean
  selectedSuffix: string
  coupleColor?: string
  onGuestClick: (id: string) => void
}) {
  if (seatId === null) {
    return <div className={styles.emptySeat}>— —</div>
  }
  return (
    <div
      className={`${styles.guestItem} ${isSelected ? styles.selected : ''}`}
      style={coupleColor ? { borderLeft: `4px solid ${coupleColor}`, paddingLeft: '6px' } : undefined}
      onClick={(e) => {
        e.stopPropagation()
        onGuestClick(seatId)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onGuestClick(seatId)
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${guest?.name ?? seatId}${isSelected ? selectedSuffix : ''}`}
    >
      {guest?.name ?? seatId}
    </div>
  )
}

export default function TableCard({ table, guests, selectedGuestId, coupleColorMap, onGuestClick }: TableCardProps) {
  const { t } = useLang()
  const guestMap = new Map(guests.map((g) => [g.id, g]))
  const leftCount = Math.ceil(table.capacity / 2)
  const leftSeats = table.seats.slice(0, leftCount)
  const rightSeats = table.seats.slice(leftCount)

  return (
    <div className={styles.card} data-testid="table-card" onClick={(e) => e.stopPropagation()}>
      <div className={styles.tableLayout}>
        <div className={styles.side}>
          <span className={styles.sideLabel}>{t.leftSide}</span>
          {leftSeats.map((seatId, i) => (
            <SeatItem
              key={seatId ?? `left-empty-${i}`}
              seatId={seatId}
              guest={seatId ? guestMap.get(seatId) : undefined}
              isSelected={seatId === selectedGuestId}
              selectedSuffix={t.selectedSuffix}
              coupleColor={seatId ? coupleColorMap.get(seatId) : undefined}
              onGuestClick={onGuestClick}
            />
          ))}
        </div>

        <div className={styles.tableTop}>
          <div className={styles.tableName}>{table.label}</div>
        </div>

        <div className={styles.side}>
          <span className={styles.sideLabel}>{t.rightSide}</span>
          {rightSeats.map((seatId, i) => (
            <SeatItem
              key={seatId ?? `right-empty-${i}`}
              seatId={seatId}
              guest={seatId ? guestMap.get(seatId) : undefined}
              isSelected={seatId === selectedGuestId}
              selectedSuffix={t.selectedSuffix}
              coupleColor={seatId ? coupleColorMap.get(seatId) : undefined}
              onGuestClick={onGuestClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
