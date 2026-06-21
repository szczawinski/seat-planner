import type { Guest, Table } from '../types'

export function parseGuests(rawText: string): { name: string; labels: string[] }[] {
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
      return { name: parts[0] ?? '', labels: parts.slice(1) }
    })
    .filter(({ name }) => name.length > 0)
}

export function validatePlan(guests: Guest[], tableSeatCounts: number[]): string | null {
  if (guests.length === 0) return 'ERR_NO_GUESTS_ASSIGN'
  if (tableSeatCounts.length < 1) return 'ERR_NO_TABLES'
  if (tableSeatCounts.some((s) => s < 1)) return 'ERR_NO_SEATS'
  const totalCapacity = tableSeatCounts.reduce((sum, s) => sum + s, 0)
  if (totalCapacity < guests.length) {
    return `ERR_CAPACITY_EXCEEDED:${totalCapacity}:${guests.length}`
  }
  return null
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function makeTables(tableSeatCounts: number[]): Table[] {
  return tableSeatCounts.map((capacity, i) => ({
    id: `table-${i + 1}`,
    label: `Table ${i + 1}`,
    capacity,
    seats: Array<string | null>(capacity).fill(null),
  }))
}

function surnameParts(fullName: string): string[] {
  const words = fullName.trim().split(/\s+/)
  if (words.length < 2) return []
  // Last word is the surname; split on '-' for compound surnames like "Zydek-Świć"
  return words[words.length - 1]
    .split('-')
    .map((s) => s.toLowerCase())
    .filter((s) => s.length >= 2)
}

function surnamePartsMatch(a: string, b: string): boolean {
  if (a === b) return true
  // Handle Polish gendered suffixes (Kowalski/Kowalska, Wiśniewski/Wiśniewska):
  // match when both share a prefix of ≥5 chars and differ in at most 3 trailing chars each.
  let common = 0
  const minLen = Math.min(a.length, b.length)
  while (common < minLen && a[common] === b[common]) common++
  return common >= 5 && a.length - common <= 3 && b.length - common <= 3
}

function surnameBonus(a: Guest, b: Guest): number {
  const pa = surnameParts(a.name)
  const pb = surnameParts(b.name)
  const match = pa.some((x) => pb.some((y) => surnamePartsMatch(x, y)))
  return match ? 10 : 0
}

export function computeAffinity(a: Guest, b: Guest): number {
  return a.labels.filter((l) => b.labels.includes(l)).length + surnameBonus(a, b)
}

function buildUnits(guests: Guest[]): Guest[][] {
  const units: Guest[][] = []
  const added = new Set<string>()
  for (const g of guests) {
    if (added.has(g.id)) continue
    added.add(g.id)
    if (g.coupleId) {
      const partner = guests.find(
        (p) => p.coupleId === g.coupleId && p.id !== g.id && !added.has(p.id),
      )
      if (partner) {
        added.add(partner.id)
        units.push([g, partner])
        continue
      }
    }
    units.push([g])
  }
  return units
}

export function greedyClustering(guests: Guest[], tableSeatCounts: number[]): Guest[][] {
  const tableCount = tableSeatCounts.length
  const units = buildUnits(fisherYatesShuffle([...guests]))
  let remainingUnits = [...units]
  const clusters: Guest[][] = []

  for (let t = 0; t < tableCount; t++) {
    const capacity = tableSeatCounts[t]
    if (remainingUnits.length === 0) {
      clusters.push([])
      continue
    }
    const tablesLeft = tableCount - t
    const totalRemaining = remainingUnits.reduce((sum, u) => sum + u.length, 0)
    const targetSize = Math.min(capacity, Math.ceil(totalRemaining / tablesLeft))

    const allRemaining = remainingUnits.flat()
    let seedIdx = 0
    let maxAffSum = -1
    for (let i = 0; i < remainingUnits.length; i++) {
      if (remainingUnits[i].length > capacity) continue
      let sum = 0
      for (const g of remainingUnits[i]) {
        for (const other of allRemaining) {
          if (other.id !== g.id) sum += computeAffinity(g, other)
        }
      }
      if (sum > maxAffSum) {
        maxAffSum = sum
        seedIdx = i
      }
    }

    if (maxAffSum === -1) { clusters.push([]); continue }

    const cluster: Guest[] = [...remainingUnits[seedIdx]]
    remainingUnits = remainingUnits.filter((_, i) => i !== seedIdx)

    while (cluster.length < targetSize && remainingUnits.length > 0) {
      let bestIdx = -1
      let bestAff = -1
      for (let i = 0; i < remainingUnits.length; i++) {
        if (cluster.length + remainingUnits[i].length > capacity) continue
        const aff = remainingUnits[i].reduce(
          (sum, g) => sum + cluster.reduce((s, c) => s + computeAffinity(c, g), 0),
          0,
        )
        if (aff > bestAff) {
          bestAff = aff
          bestIdx = i
        }
      }
      if (bestIdx === -1) break
      cluster.push(...remainingUnits[bestIdx])
      remainingUnits = remainingUnits.filter((_, i) => i !== bestIdx)
    }

    clusters.push(cluster)
  }

  return clusters
}

export function greedyHamiltonianPath(cluster: Guest[]): Guest[] {
  if (cluster.length <= 1) return [...cluster]

  // Start with the most-connected guest
  let startIdx = 0
  let maxTotal = -1
  for (let i = 0; i < cluster.length; i++) {
    const total = cluster.reduce(
      (sum, g, j) => (j !== i ? sum + computeAffinity(cluster[i], g) : sum),
      0,
    )
    if (total > maxTotal) {
      maxTotal = total
      startIdx = i
    }
  }

  const path: Guest[] = [cluster[startIdx]]
  const unvisited = cluster.filter((_, i) => i !== startIdx)

  while (unvisited.length > 0) {
    const last = path[path.length - 1]
    let bestIdx = 0
    let bestAff = -1
    for (let i = 0; i < unvisited.length; i++) {
      const aff = computeAffinity(last, unvisited[i])
      if (aff > bestAff) {
        bestAff = aff
        bestIdx = i
      }
    }
    path.push(unvisited[bestIdx])
    unvisited.splice(bestIdx, 1)
  }

  return path
}

export function assignCoupleIds(guests: Guest[]): Guest[] {
  const result = guests.map((g) => ({ ...g, coupleId: null as string | null }))
  let coupleIndex = 0
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].coupleId !== null) continue
    const partsA = surnameParts(result[i].name)
    const partsB = surnameParts(result[i + 1].name)
    if (partsA.length > 0 && partsB.length > 0 && partsA.some((x) => partsB.some((y) => surnamePartsMatch(x, y)))) {
      const id = `couple-${coupleIndex++}`
      result[i] = { ...result[i], coupleId: id }
      result[i + 1] = { ...result[i + 1], coupleId: id }
      i++ // skip the partner on the next iteration
    }
  }
  return result
}

function arrangeClusterWithCouples(cluster: Guest[], leftCount: number): Guest[] {
  const path = greedyHamiltonianPath(cluster)
  const rightCount = cluster.length - leftCount

  // Build ordered units: couple-pairs first, singles after
  const units: Guest[][] = []
  const processed = new Set<string>()

  for (const g of path) {
    if (processed.has(g.id)) continue
    processed.add(g.id)
    if (g.coupleId) {
      const partner = path.find((p) => p.coupleId === g.coupleId && p.id !== g.id)
      if (partner && !processed.has(partner.id)) {
        processed.add(partner.id)
        units.push([g, partner])
        continue
      }
    }
    units.push([g])
  }

  // Pack units into left then right, keeping couples on one side
  const left: Guest[] = []
  const right: Guest[] = []

  for (const unit of units) {
    if (unit.length === 2) {
      if (left.length + 2 <= leftCount) {
        left.push(...unit)
      } else if (right.length + 2 <= rightCount) {
        right.push(...unit)
      } else {
        // No room to keep together — place individually
        for (const g of unit) {
          if (left.length < leftCount) left.push(g)
          else right.push(g)
        }
      }
    } else {
      if (left.length < leftCount) left.push(unit[0])
      else right.push(unit[0])
    }
  }

  return [...left, ...right]
}

export function assignSeatsProximity(
  guests: Guest[],
  tableSeatCounts: number[],
): { guests: Guest[]; tables: Table[] } {
  const allHaveNoLabels = guests.every((g) => g.labels.length === 0)
  const allHaveNoCouples = guests.every((g) => !g.coupleId)

  if (allHaveNoLabels && allHaveNoCouples) {
    return assignSeats(guests, tableSeatCounts)
  }

  const tables = makeTables(tableSeatCounts)
  const clusters = greedyClustering(guests, tableSeatCounts)
  const newGuests: Guest[] = []

  clusters.forEach((cluster, tableIndex) => {
    const leftCount = Math.ceil(tableSeatCounts[tableIndex] / 2)
    const arranged = arrangeClusterWithCouples(cluster, leftCount)
    arranged.forEach((guest, i) => {
      tables[tableIndex].seats[i] = guest.id
      newGuests.push({ ...guest, tableId: tables[tableIndex].id, seatIndex: i })
    })
  })

  return { guests: newGuests, tables }
}

export function assignSeats(
  guestList: Guest[],
  tableSeatCounts: number[],
): { guests: Guest[]; tables: Table[] } {
  const shuffled = fisherYatesShuffle([...guestList])
  const tables = makeTables(tableSeatCounts)
  const guests: Guest[] = []
  let guestIdx = 0
  for (let t = 0; t < tables.length; t++) {
    for (let s = 0; s < tableSeatCounts[t] && guestIdx < shuffled.length; s++) {
      const guest = shuffled[guestIdx++]
      tables[t].seats[s] = guest.id
      guests.push({ ...guest, tableId: tables[t].id, seatIndex: s })
    }
  }
  return { guests, tables }
}
