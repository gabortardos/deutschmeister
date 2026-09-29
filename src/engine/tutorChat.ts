/**
 * M11.8 tutor chat — pure helpers for the free-form chat page (`/#/tutor`).
 * Unlike Conversation role-play there is no scenario: the learner either
 * chats everyday German (mode 'chat') or asks questions ABOUT the language
 * (mode 'ask'). Prompt composition lives in `llm/services.ts` (contract 7);
 * everything here is dependency-free and unit-tested.
 */

export type TutorChatMode = 'chat' | 'ask'

/** How much history the tutor sees per turn — mirrors the conversation cap
 *  (the cheap speed lever from PHASE2_PLAN: keeps input tokens flat). */
export const TUTOR_HISTORY_CAP = 12

export interface TutorHistoryTurn {
  role: 'user' | 'tutor'
  text: string
}

export interface TutorModeMeta {
  label: string
  emoji: string
  hint: string
}

export const TUTOR_MODES: Record<TutorChatMode, TutorModeMeta> = {
  chat: {
    label: 'Free chat',
    emoji: '🗣️',
    hint: 'Everyday German conversation — the tutor replies at your level and corrects you as you go.',
  },
  ask: {
    label: 'Ask the tutor',
    emoji: '❓',
    hint: 'Questions about German — grammar, words, usage — answered in clear English with examples.',
  },
}

export function isTutorChatMode(value: unknown): value is TutorChatMode {
  return value === 'chat' || value === 'ask'
}

/** Drops empty turns and keeps the newest `cap` (order preserved, oldest first). */
export function trimTutorHistory<T extends TutorHistoryTurn>(
  history: readonly T[],
  cap: number = TUTOR_HISTORY_CAP,
): T[] {
  return history.filter((t) => t.text.trim().length > 0).slice(-cap)
}
