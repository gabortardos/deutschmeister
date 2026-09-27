/**
 * M10.5: keyboard-shortcut mapping for the learning surfaces (study
 * flashcards + SM-2 review). Pure on purpose — components only switch on the
 * returned action, so the mapping is fully unit-testable
 * (see __tests__/sessionKeys.test.ts).
 *
 * Conventions: Space/Enter reveal or advance; digits 1–9 pick the nth
 * multiple-choice option. While a typing input is active, Enter is left to
 * the native form submit — the components decide that, not this module.
 */

/** Flashcard front: reveal first, then advance once revealed. */
export function introKeyAction(key: string, revealed: boolean): 'reveal' | 'continue' | null {
  if (key !== ' ' && key !== 'Enter') return null
  return revealed ? 'continue' : 'reveal'
}

/**
 * Multiple choice: '1'..'9' → 0-based index into the options, or null when
 * the key is not a digit or the digit has no matching option.
 */
export function choiceKeyIndex(key: string, optionCount: number): number | null {
  if (!/^[1-9]$/.test(key)) return null
  const index = Number(key) - 1
  return index < optionCount ? index : null
}

/** After a result (correct/wrong) is shown: Space/Enter advance. */
export function resultKeyAction(key: string): 'next' | null {
  return key === ' ' || key === 'Enter' ? 'next' : null
}