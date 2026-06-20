import type { SeatingPlan } from '../types'

const STORAGE_KEY = 'wedding-seating-plan'
const SCHEMA_VERSION = 4

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePlan(data: any): SeatingPlan | null {
  if (!data || typeof data !== 'object') return null
  if (data.version !== SCHEMA_VERSION) return null
  const plan = data as SeatingPlan
  // Ensure coupleId exists on every guest (field added after initial v4 release)
  plan.guests = plan.guests.map((g) => ({ ...g, coupleId: g.coupleId ?? null }))
  return plan
}

export function save(plan: SeatingPlan): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
  } catch {
    // Storage quota exceeded or unavailable — fail silently
  }
}

export function load(): SeatingPlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    return parsePlan(JSON.parse(raw))
  } catch {
    return null
  }
}

export function clear(): void {
  localStorage.removeItem(STORAGE_KEY)
}
