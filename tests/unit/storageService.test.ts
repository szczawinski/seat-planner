import { describe, it, expect, beforeEach } from 'vitest'
import { save, load, clear, parsePlan } from '../../src/services/storageService'
import type { SeatingPlan } from '../../src/types'

const mockPlan: SeatingPlan = {
  version: 4,
  config: { tableCount: 2, seatsPerTable: 3, tableSeatCounts: [3, 3], rawGuestText: 'Alice\nBob' },
  guests: [
    { id: 'guest-0', name: 'Alice', labels: ['Magda', 'Family'], coupleId: null, tableId: 'table-1', seatIndex: 0 },
    { id: 'guest-1', name: 'Bob', labels: [], coupleId: null, tableId: 'table-2', seatIndex: 0 },
  ],
  tables: [
    { id: 'table-1', label: 'Table 1', capacity: 3, seats: ['guest-0', null, null] },
    { id: 'table-2', label: 'Table 2', capacity: 3, seats: ['guest-1', null, null] },
  ],
  assigned: true,
  availableLabels: ['Magda', 'Piotr', 'Family', 'Friend', 'High school', 'Studies'],
}

beforeEach(() => {
  localStorage.clear()
})

describe('storageService', () => {
  it('save then load returns identical object', () => {
    save(mockPlan)
    const loaded = load()
    expect(loaded).toEqual(mockPlan)
  })

  it('load returns null when key is absent', () => {
    expect(load()).toBeNull()
  })

  it('load returns null for malformed JSON', () => {
    localStorage.setItem('wedding-seating-plan', '{not valid json}')
    expect(load()).toBeNull()
  })

  it('load returns null when schema version is unrecognised', () => {
    const wrongVersion = { ...mockPlan, version: 99 }
    localStorage.setItem('wedding-seating-plan', JSON.stringify(wrongVersion))
    expect(load()).toBeNull()
  })

  it('clear removes the stored plan', () => {
    save(mockPlan)
    clear()
    expect(load()).toBeNull()
  })

  it('parsePlan returns null for v1 plans', () => {
    const v1 = { version: 1, config: {}, guests: [], tables: [], assigned: false }
    expect(parsePlan(v1)).toBeNull()
  })

  it('parsePlan returns null for v2 plans', () => {
    const v2 = { version: 2, config: {}, guests: [], tables: [], assigned: false, availableLabels: [] }
    expect(parsePlan(v2)).toBeNull()
  })

  it('parsePlan returns null for v3 plans', () => {
    const v3 = { version: 3, config: {}, guests: [], tables: [], assigned: false, availableLabels: [] }
    expect(parsePlan(v3)).toBeNull()
  })

  it('parsePlan returns plan for v4', () => {
    expect(parsePlan(mockPlan)).toEqual(mockPlan)
  })

  it('parsePlan returns null for non-object input', () => {
    expect(parsePlan(null)).toBeNull()
    expect(parsePlan('string')).toBeNull()
    expect(parsePlan(42)).toBeNull()
  })
})
