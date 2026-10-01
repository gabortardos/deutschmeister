/**
 * M14 handoff: lesson pages ("Ask about this lesson") park a preseeded
 * question here; TutorChatPage consumes it once on mount (mode → Ask,
 * textarea prefilled) and clears the key. localStorage-only by design —
 * it is a one-shot UI hint, not user data, so it never syncs.
 */
export const TUTOR_PREFILL_KEY = 'dm-tutor-prefill'

export function setTutorPrefill(text: string): void {
  try {
    localStorage.setItem(TUTOR_PREFILL_KEY, text)
  } catch {
    // Private-mode/first-party storage blocked — the handoff is a nicety, never fatal.
  }
}

export function takeTutorPrefill(): string | null {
  try {
    const value = localStorage.getItem(TUTOR_PREFILL_KEY)
    if (value !== null) localStorage.removeItem(TUTOR_PREFILL_KEY)
    return value
  } catch {
    return null
  }
}
