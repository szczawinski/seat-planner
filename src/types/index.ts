export interface Guest {
  id: string
  name: string
  labels: string[]
  coupleId: string | null
  tableId: string | null
  seatIndex: number | null
}

export interface Table {
  id: string
  label: string
  capacity: number
  seats: (string | null)[]
}

export interface PlanConfig {
  tableCount: number
  seatsPerTable: number
  tableSeatCounts?: number[]
  rawGuestText: string
}

export interface SeatingPlan {
  version: number
  config: PlanConfig
  guests: Guest[]
  tables: Table[]
  assigned: boolean
  availableLabels: string[]
}
