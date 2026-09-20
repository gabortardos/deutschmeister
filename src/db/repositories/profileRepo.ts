import { db } from '../dexie'
import type { UserProfile } from '../types'

const PROFILE_ID = 'default'

export async function getProfile(): Promise<UserProfile> {
  const existing = await db.userProfiles.get(PROFILE_ID)
  if (existing) return existing
  const profile: UserProfile = {
    id: PROFILE_ID,
    updatedAt: Date.now(),
    name: 'Learner',
    level: 'A1',
    dailyWordGoal: 5,
    currentGrammarTopicId: null,
    placementResult: null,
  }
  await db.userProfiles.put(profile)
  return profile
}

export async function updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getProfile()
  const next: UserProfile = {
    ...current,
    ...patch,
    id: PROFILE_ID, // never allow id changes
    updatedAt: Date.now(),
  }
  await db.userProfiles.put(next)
  return next
}

/** Used by reset flows. */
export async function resetProfile(): Promise<void> {
  await db.userProfiles.delete(PROFILE_ID)
  await getProfile()
}
