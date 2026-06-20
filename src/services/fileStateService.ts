import type { SeatingPlan } from '../types'
import { parsePlan } from './storageService'

const API = '/api/state'

export async function saveToFile(plan: SeatingPlan): Promise<void> {
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan, null, 2),
    })
  } catch {
    // Dev server not running (e.g. production build) — fail silently
  }
}

export async function loadFromFile(): Promise<SeatingPlan | null> {
  try {
    const res = await fetch(API)
    if (!res.ok) return null
    return parsePlan(await res.json())
  } catch {
    return null
  }
}
