import { describe, it, expect } from 'vitest'
import {
  parseGuests,
  validatePlan,
  assignSeats,
  computeAffinity,
  greedyClustering,
  greedyHamiltonianPath,
} from '../../src/services/seatingAssigner'
import type { Guest } from '../../src/types'

function makeGuest(name: string, labels: string[] = [], index = 0): Guest {
  return { id: `guest-${index}`, name, labels, tableId: null, seatIndex: null }
}

function makeGuests(names: string[]): Guest[] {
  return names.map((name, i) => makeGuest(name, [], i))
}

describe('parseGuests', () => {
  it('filters blank lines and trims whitespace', () => {
    const result = parseGuests('Alice\n  \nBob\n  Carol  \n')
    expect(result).toEqual(['Alice', 'Bob', 'Carol'])
  })

  it('returns empty array for blank input', () => {
    expect(parseGuests('')).toEqual([])
    expect(parseGuests('  \n  \n')).toEqual([])
  })
})

describe('validatePlan', () => {
  it('returns null when plan is valid', () => {
    expect(validatePlan(makeGuests(['Alice', 'Bob']), 2, 2)).toBeNull()
  })

  it('returns error for empty guest list', () => {
    expect(validatePlan([], 4, 5)).toBe('ERR_NO_GUESTS_ASSIGN')
  })

  it('returns error for zero tables', () => {
    expect(validatePlan(makeGuests(['Alice']), 0, 5)).toBe('ERR_NO_TABLES')
  })

  it('returns error for zero seats per table', () => {
    expect(validatePlan(makeGuests(['Alice']), 2, 0)).toBe('ERR_NO_SEATS')
  })

  it('returns error when guests exceed capacity', () => {
    const error = validatePlan(makeGuests(['A', 'B', 'C', 'D', 'E']), 2, 2)
    expect(error).toBe('ERR_CAPACITY_EXCEEDED:4:5')
  })

  it('accepts guests equal to capacity', () => {
    expect(validatePlan(makeGuests(['A', 'B', 'C', 'D']), 2, 2)).toBeNull()
  })
})

describe('computeAffinity', () => {
  it('returns 0 for guests with no shared labels', () => {
    const a = makeGuest('Alice Kowalska', ["Magda's Family"])
    const b = makeGuest('Bob Nowak', ["Piotr's Family"])
    expect(computeAffinity(a, b)).toBe(0)
  })

  it('returns count of shared labels', () => {
    const a = makeGuest('Alice Nowak', ["Magda's Family", "Magda's Friend"])
    const b = makeGuest('Bob Nowak', ["Magda's Family", "Piotr's Friend"])
    expect(computeAffinity(a, b)).toBe(11) // 1 shared label + 10 surname bonus
  })

  it('returns 0 for guests with no labels and different surnames', () => {
    expect(computeAffinity(makeGuest('Jan Kowalski'), makeGuest('Anna Nowak'))).toBe(0)
  })

  it('returns full overlap when all labels match', () => {
    const labels = ["Magda's Family", "Magda's Friend"]
    expect(computeAffinity(makeGuest('A B', labels), makeGuest('C D', labels))).toBe(2)
  })

  it('gives surname bonus for identical surnames', () => {
    expect(computeAffinity(makeGuest('Jan Kowalski'), makeGuest('Anna Kowalski'))).toBe(10)
  })

  it('gives surname bonus for gendered variant -ski/-ska', () => {
    expect(computeAffinity(makeGuest('Jan Kowalski'), makeGuest('Anna Kowalska'))).toBe(10)
  })

  it('gives surname bonus for longer gendered variant -ewski/-ewska', () => {
    expect(computeAffinity(makeGuest('Jan Wiśniewski'), makeGuest('Anna Wiśniewska'))).toBe(10)
  })

  it('gives surname bonus when compound surname shares a part', () => {
    // "Świć" appears in "Zydek-Świć" and as the whole surname of Miłosz
    expect(computeAffinity(makeGuest('Kasia Zydek-Świć'), makeGuest('Miłosz Świć'))).toBe(10)
  })

  it('gives no bonus for single-word names (no extractable surname)', () => {
    expect(computeAffinity(makeGuest('Alice'), makeGuest('Alice'))).toBe(0)
  })

  it('gives no bonus when surnames differ significantly', () => {
    expect(computeAffinity(makeGuest('Jan Nowak'), makeGuest('Anna Nowacki'))).toBe(0)
  })

  it('gives no bonus when compound parts do not overlap', () => {
    expect(computeAffinity(makeGuest('Anna Zydek-Nowak'), makeGuest('Jan Wiśniewski'))).toBe(0)
  })
})

describe('greedyClustering', () => {
  it('returns tableCount clusters', () => {
    const guests = makeGuests(['A', 'B', 'C', 'D', 'E', 'F'])
    const clusters = greedyClustering(guests, 3, 2)
    expect(clusters).toHaveLength(3)
  })

  it('keeps high-affinity guests in the same cluster', () => {
    const family1: Guest[] = ['Alice', 'Bob', 'Carol'].map((n, i) =>
      makeGuest(n, ["Magda's Family"], i),
    )
    const family2: Guest[] = ['Dave', 'Eve', 'Frank'].map((n, i) =>
      makeGuest(n, ["Piotr's Family"], i + 3),
    )
    const guests = [...family1, ...family2]
    const clusters = greedyClustering(guests, 2, 3)

    expect(clusters).toHaveLength(2)

    const family1Names = new Set(['Alice', 'Bob', 'Carol'])
    const family2Names = new Set(['Dave', 'Eve', 'Frank'])

    const cluster0Names = new Set(clusters[0].map((g) => g.name))
    const cluster1Names = new Set(clusters[1].map((g) => g.name))

    const c0isFamily1 = [...cluster0Names].every((n) => family1Names.has(n))
    const c0isFamily2 = [...cluster0Names].every((n) => family2Names.has(n))
    const c1isFamily1 = [...cluster1Names].every((n) => family1Names.has(n))
    const c1isFamily2 = [...cluster1Names].every((n) => family2Names.has(n))

    expect((c0isFamily1 && c1isFamily2) || (c0isFamily2 && c1isFamily1)).toBe(true)
  })

  it('distributes all guests across clusters with no omissions', () => {
    const guests = makeGuests(['A', 'B', 'C', 'D', 'E'])
    const clusters = greedyClustering(guests, 2, 3)
    const total = clusters.reduce((sum, c) => sum + c.length, 0)
    expect(total).toBe(5)
  })
})

describe('greedyHamiltonianPath', () => {
  it('returns all cluster members', () => {
    const guests = [
      makeGuest('Alice', ["Magda's Family"], 0),
      makeGuest('Bob', ["Magda's Family"], 1),
      makeGuest('Carol', [], 2),
    ]
    const path = greedyHamiltonianPath(guests)
    expect(path).toHaveLength(3)
    expect(path.map((g) => g.name).sort()).toEqual(['Alice', 'Bob', 'Carol'].sort())
  })

  it('starts with the most-connected guest', () => {
    // Alice shares labels with both Bob and Carol (affinity 2 total)
    // Bob and Carol only share with Alice (affinity 1 each)
    const alice = makeGuest('Alice', ["Magda's Family", "Magda's Friend"], 0)
    const bob = makeGuest('Bob', ["Magda's Family"], 1)
    const carol = makeGuest('Carol', ["Magda's Friend"], 2)
    const path = greedyHamiltonianPath([alice, bob, carol])
    expect(path[0].name).toBe('Alice')
  })

  it('returns single guest unchanged', () => {
    const guest = makeGuest('Solo')
    expect(greedyHamiltonianPath([guest])).toEqual([guest])
  })

  it('returns two guests in some order', () => {
    const a = makeGuest('A', [], 0)
    const b = makeGuest('B', [], 1)
    const path = greedyHamiltonianPath([a, b])
    expect(path).toHaveLength(2)
    expect(path.map((g) => g.name).sort()).toEqual(['A', 'B'])
  })
})

describe('assignSeats', () => {
  it('assigns all guests — even distribution (20 guests, 4 tables, 5 seats)', () => {
    const guestList = makeGuests(Array.from({ length: 20 }, (_, i) => `Guest ${i + 1}`))
    const { guests, tables } = assignSeats(guestList, 4, 5)

    expect(guests).toHaveLength(20)
    expect(tables).toHaveLength(4)
    tables.forEach((t) => {
      const assigned = t.seats.filter((s) => s !== null)
      expect(assigned).toHaveLength(5)
    })
  })

  it('distributes unevenly without omissions (22 guests, 4 tables, 6 seats)', () => {
    const guestList = makeGuests(Array.from({ length: 22 }, (_, i) => `Guest ${i + 1}`))
    const { guests, tables } = assignSeats(guestList, 4, 6)

    expect(guests).toHaveLength(22)
    const totalAssigned = tables.reduce(
      (sum, t) => sum + t.seats.filter((s) => s !== null).length,
      0,
    )
    expect(totalAssigned).toBe(22)
  })

  it('each guest appears exactly once across all table seats', () => {
    const guestList = makeGuests(['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'])
    const { guests, tables } = assignSeats(guestList, 2, 3)

    const seatedIds = tables.flatMap((t) => t.seats.filter(Boolean)) as string[]
    const guestIds = guests.map((g) => g.id)
    expect(seatedIds.sort()).toEqual(guestIds.sort())
  })

  it('guest tableId and seatIndex are consistent with table.seats', () => {
    const guestList = makeGuests(['Alice', 'Bob', 'Carol', 'Dave'])
    const { guests, tables } = assignSeats(guestList, 2, 2)

    guests.forEach((guest) => {
      const table = tables.find((t) => t.id === guest.tableId)
      expect(table).toBeDefined()
      expect(table!.seats[guest.seatIndex!]).toBe(guest.id)
    })
  })

  it('handles single guest', () => {
    const guestList = [makeGuest('Solo', [], 0)]
    const { guests, tables } = assignSeats(guestList, 3, 2)
    expect(guests).toHaveLength(1)
    expect(guests[0].tableId).not.toBeNull()
    expect(guests[0].seatIndex).not.toBeNull()
  })

  it('generates correct table labels', () => {
    const { tables } = assignSeats(makeGuests(['A', 'B']), 2, 1)
    expect(tables[0].label).toBe('Table 1')
    expect(tables[1].label).toBe('Table 2')
  })

  it('preserves guest labels through assignment', () => {
    const guestList = [
      makeGuest('Alice', ["Magda's Family"], 0),
      makeGuest('Bob', ["Piotr's Family"], 1),
    ]
    const { guests } = assignSeats(guestList, 2, 1)
    const alice = guests.find((g) => g.name === 'Alice')!
    expect(alice.labels).toEqual(["Magda's Family"])
  })
})
