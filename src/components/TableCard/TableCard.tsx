import { useState, useRef, useLayoutEffect } from 'react'
import type { Guest, Table } from '../../types'
import { useLang } from '../../i18n/LanguageContext'
import styles from './TableCard.module.css'

interface TableCardProps {
  table: Table
  guests: Guest[]
  selectedGuestId: string | null
  coupleColorMap: Map<string, string>
  onGuestClick: (guestId: string) => void
  onEmptySeatClick: (tableId: string, seatIndex: number) => void
  onDragSwap: (draggedId: string, targetId: string) => void
  onDragMove: (draggedId: string, toTableId: string, toSeatIndex: number) => void
}

function SeatItem({
  seatId,
  guest,
  isSelected,
  selectedSuffix,
  coupleColor,
  isClickDropTarget,
  isDraggingOver,
  isDragging,
  nodeRef,
  onGuestClick,
  onEmptySeatClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  seatId: string | null
  guest: Guest | undefined
  isSelected: boolean
  selectedSuffix: string
  coupleColor?: string
  isClickDropTarget: boolean
  isDraggingOver: boolean
  isDragging: boolean
  nodeRef?: (el: HTMLDivElement | null) => void
  onGuestClick: (id: string) => void
  onEmptySeatClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}) {
  if (seatId === null) {
    const emptyClass = [
      isClickDropTarget ? styles.emptySeatTarget : styles.emptySeat,
      isDraggingOver ? styles.dragOverEmpty : '',
    ].filter(Boolean).join(' ')

    return (
      <div
        className={emptyClass}
        onClick={isClickDropTarget ? (e) => { e.stopPropagation(); onEmptySeatClick() } : undefined}
        onKeyDown={isClickDropTarget ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEmptySeatClick() } } : undefined}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        tabIndex={isClickDropTarget ? 0 : undefined}
        role={isClickDropTarget ? 'button' : undefined}
        aria-label={isClickDropTarget ? 'Move guest here' : undefined}
      >
        {isClickDropTarget ? '+ →' : '— —'}
      </div>
    )
  }

  const className = [
    styles.guestItem,
    isSelected ? styles.selected : '',
    isDragging ? styles.dragging : '',
    isDraggingOver ? styles.dragOverGuest : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={nodeRef}
      className={className}
      style={coupleColor ? { borderLeft: `4px solid ${coupleColor}`, paddingLeft: '6px' } : undefined}
      draggable
      onClick={(e) => { e.stopPropagation(); onGuestClick(seatId) }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGuestClick(seatId) } }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${guest?.name ?? seatId}${isSelected ? selectedSuffix : ''}`}
    >
      {guest?.name ?? seatId}
    </div>
  )
}

export default function TableCard({ table, guests, selectedGuestId, coupleColorMap, onGuestClick, onEmptySeatClick, onDragSwap, onDragMove }: TableCardProps) {
  const { t } = useLang()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  // FLIP animation refs
  const seatRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const prevPositions = useRef<Map<string, { top: number; left: number }>>(new Map())

  function capturePositions() {
    const positions = new Map<string, { top: number; left: number }>()
    seatRefs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect()
      positions.set(id, { top: rect.top, left: rect.left })
    })
    prevPositions.current = positions
  }

  useLayoutEffect(() => {
    if (prevPositions.current.size === 0) return
    seatRefs.current.forEach((el, id) => {
      const prev = prevPositions.current.get(id)
      if (!prev) return
      const curr = el.getBoundingClientRect()
      const dy = prev.top - curr.top
      const dx = prev.left - curr.left
      if (Math.abs(dy) < 1 && Math.abs(dx) < 1) return
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 220, easing: 'ease-out', fill: 'none' }
      )
    })
    prevPositions.current = new Map()
  }, [table.seats])

  const guestMap = new Map(guests.map((g) => [g.id, g]))
  const leftCount = Math.ceil(table.capacity / 2)
  const leftSeats = table.seats.slice(0, leftCount)
  const rightSeats = table.seats.slice(leftCount)

  function makeDragHandlers(seatId: string | null, seatIndex: number) {
    const key = seatId ?? `empty-${table.id}-${seatIndex}`
    return {
      onDragStart(e: React.DragEvent) {
        if (!seatId) return
        e.dataTransfer.setData('text/plain', seatId)
        e.dataTransfer.effectAllowed = 'move'
        setDraggingId(seatId)
      },
      onDragEnd() {
        setDraggingId(null)
        setDragOverKey(null)
      },
      onDragOver(e: React.DragEvent) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverKey(key)
      },
      onDragLeave() {
        setDragOverKey((prev) => (prev === key ? null : prev))
      },
      onDrop(e: React.DragEvent) {
        e.preventDefault()
        e.stopPropagation()
        const draggedId = e.dataTransfer.getData('text/plain')
        if (!draggedId) return
        if (seatId && draggedId !== seatId) {
          capturePositions()
          onDragSwap(draggedId, seatId)
        } else if (!seatId) {
          onDragMove(draggedId, table.id, seatIndex)
        }
        setDragOverKey(null)
        setDraggingId(null)
      },
    }
  }

  function renderSeat(seatId: string | null, absoluteIndex: number) {
    const handlers = makeDragHandlers(seatId, absoluteIndex)
    const key = seatId ?? `empty-${table.id}-${absoluteIndex}`
    return (
      <SeatItem
        key={seatId ?? `empty-${absoluteIndex}`}
        seatId={seatId}
        guest={seatId ? guestMap.get(seatId) : undefined}
        isSelected={seatId === selectedGuestId}
        selectedSuffix={t.selectedSuffix}
        coupleColor={seatId ? coupleColorMap.get(seatId) : undefined}
        isClickDropTarget={seatId === null && selectedGuestId !== null}
        isDraggingOver={dragOverKey === key}
        isDragging={draggingId === seatId}
        nodeRef={seatId ? (el) => {
          if (el) seatRefs.current.set(seatId, el)
          else seatRefs.current.delete(seatId)
        } : undefined}
        onGuestClick={onGuestClick}
        onEmptySeatClick={() => onEmptySeatClick(table.id, absoluteIndex)}
        {...handlers}
      />
    )
  }

  return (
    <div className={styles.card} data-testid="table-card" onClick={(e) => e.stopPropagation()}>
      <div className={styles.tableLayout}>
        <div className={styles.side}>
          <span className={styles.sideLabel}>{t.leftSide}</span>
          {leftSeats.map((seatId, i) => renderSeat(seatId, i))}
        </div>

        <div className={styles.tableTop}>
          <div className={styles.tableName}>{table.label}</div>
        </div>

        <div className={styles.side}>
          <span className={styles.sideLabel}>{t.rightSide}</span>
          {rightSeats.map((seatId, i) => renderSeat(seatId, leftCount + i))}
        </div>
      </div>
    </div>
  )
}
