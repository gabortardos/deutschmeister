/**
 * M14 handoff: lesson pages ("Ask about this lesson") park a preseeded
 * question here; TutorChatPage consumes it once on mount (mode → Ask,
 * textarea prefilled) and clears the key. localStorage-only by design —
 * it is a one-shot UI hint, not user data, so it never syncs.
 */
export const TUTOR_PREFILL_KEY = 'dm-tutor-prefill'

export interface TutorPrefill {
  /** Text placed into the Ask-mode textarea. */
  question: string
  /** M14.1: lesson context (cheat-sheet summary) the ask-mode tutor grounds its answer in. */
  context?: string
}

export function setTutorPrefill(prefill: TutorPrefill): void {
  try {
    localStorage.setItem(TUTOR_PREFILL_KEY, JSON.stringify(prefill))
  } catch {
    // Private-mode/first-party storage blocked — the handoff is a nicety, never fatal.
  }
}

export function takeTutorPrefill(): TutorPrefill | null {
  try {
    const value = localStorage.getItem(TUTOR_PREFILL_KEY)
    if (value !== null) localStorage.removeItem(TUTOR_PREFILL_KEY)
    if (value === null) return null
    try {
      const parsed = JSON.parse(value) as Partial<TutorPrefill>
      if (typeof parsed.question === 'string') {
        return {
          question: parsed.question,
          context: typeof parsed.context === 'string' ? parsed.context : undefined,
        }
      }
    } catch {
      // Legacy v2.35.0 payloads were plain strings — still work as the question.
    }
    return value.trim().length > 0 ? { question: value } : null
  } catch {
    return null
  }
}
