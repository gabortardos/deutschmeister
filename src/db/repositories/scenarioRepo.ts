import { SEED_SCENARIOS } from '../../content/scenarios'
import { db } from '../dexie'
import type { Scenario } from '../types'

/** Idempotent seeding of the 20 built-in scenarios (checked in bulk). */
export async function ensureScenariosSeeded(): Promise<void> {
  const existing = await db.scenarios.bulkGet(SEED_SCENARIOS.map((s) => s.id))
  const missing = SEED_SCENARIOS.filter((_, i) => existing[i] === undefined)
  if (missing.length > 0) await db.scenarios.bulkPut([...missing])
}

/** Seed scenarios in curriculum order, then custom ones (newest first). */
export async function getAllScenarios(): Promise<Scenario[]> {
  const all = await db.scenarios.toArray()
  const order = new Map(SEED_SCENARIOS.map((s, i) => [s.id, i]))
  return all.sort((a, b) => {
    const ai = order.get(a.id) ?? 999
    const bi = order.get(b.id) ?? 999
    if (ai !== bi) return ai - bi
    return b.updatedAt - a.updatedAt
  })
}

export async function getScenario(id: string): Promise<Scenario | undefined> {
  return db.scenarios.get(id)
}
