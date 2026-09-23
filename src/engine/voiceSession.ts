/**
 * Pure state machine for hands-free voice conversation (M6.3).
 *
 * idle → listening → thinking (utterance committed) → speaking (LLM replied, auto-TTS)
 *      → listening → … ; STOP/ERROR return to idle from anywhere.
 *
 * Unexpected events are IGNORED (return the current state): browser speech callbacks are
 * unreliable (e.g. `speechSynthesis.cancel()` may or may not fire `onend`), so the machine
 * must tolerate late/duplicate events instead of derailing. All logic here is pure and
 * unit-tested; timing side effects (timers, recognizers, audio) live in
 * `features/conversation/useHandsFree.ts`.
 */

export const SILENCE_COMMIT_MS = 1600

export type VoiceSessionState = 'idle' | 'listening' | 'thinking' | 'speaking'

export type VoiceSessionEvent =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'UTTERANCE'; text: string }
  | { type: 'LLM_DONE' }
  | { type: 'TTS_DONE' }
  | { type: 'ERROR' }

export function transition(state: VoiceSessionState, event: VoiceSessionEvent): VoiceSessionState {
  switch (event.type) {
    case 'STOP':
    case 'ERROR':
      return 'idle'
    case 'START':
      return state === 'idle' ? 'listening' : state
    case 'UTTERANCE':
      // Whitespace-only transcripts (mic noise) never leave listening.
      return state === 'listening' && event.text.trim().length > 0 ? 'thinking' : state
    case 'LLM_DONE':
      return state === 'thinking' ? 'speaking' : state
    case 'TTS_DONE':
      return state === 'speaking' ? 'listening' : state
  }
}

/** True when `now - lastSpeechAt` means the learner has stopped talking (silence commit). */
export function silenceElapsed(lastSpeechAt: number, now: number): boolean {
  return now - lastSpeechAt >= SILENCE_COMMIT_MS
}
