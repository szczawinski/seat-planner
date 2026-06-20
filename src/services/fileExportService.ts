import type { Guest, Table } from '../types'

interface SeatingRow {
  table: string
  left: string[]
  right: string[]
}

interface Snapshot {
  savedAt: string
  step: number
  availableLabels: string[]
  guests: { name: string; labels: string[] }[]
  seating: SeatingRow[] | null
}

function buildSeating(guests: Guest[], tables: Table[]): SeatingRow[] {
  return tables.map((t) => {
    const leftCount = Math.ceil(t.capacity / 2)
    const findName = (id: string | null) =>
      id ? (guests.find((g) => g.id === id)?.name ?? '') : ''
    return {
      table: t.label,
      left: t.seats.slice(0, leftCount).map(findName).filter(Boolean),
      right: t.seats.slice(leftCount).map(findName).filter(Boolean),
    }
  })
}

export function exportSnapshot(
  step: number,
  guests: Guest[],
  tables: Table[],
  availableLabels: string[],
): void {
  const snapshot: Snapshot = {
    savedAt: new Date().toISOString(),
    step,
    availableLabels,
    guests: guests.map((g) => ({ name: g.name, labels: g.labels })),
    seating: tables.length > 0 ? buildSeating(guests, tables) : null,
  }

  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `wedding-seating-step${step}-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
