import { describe, expect, it } from 'vitest'
import {
  isTutorChatMode,
  trimTutorHistory,
  TUTOR_HISTORY_CAP,
  TUTOR_MODES,
  type TutorHistoryTurn,
} from '../tutorChat'

function turn(role: 'user' | 'tutor', n: number): TutorHistoryTurn {
  return { role, text: `Nachricht ${n}` }
}

describe('trimTutorHistory (M11.8)', () => {
  it('keeps the newest `cap` turns, order preserved', () => {
    const history = Array.from({ length: 15 }, (_, i) => turn(i % 2 ? 'user' : 'tutor', i))
    const trimmed = trimTutorHistory(history, 12)
    expect(trimmed).toHaveLength(12)
    expect(trimmed[0]?.text).toBe('Nachricht 3') // oldest three dropped
    expect(trimmed[11]?.text).toBe('Nachricht 14')
  })

  it('drops empty and whitespace-only turns before capping', () => {
    const history: TutorHistoryTurn[] = [
      { role: 'user', text: '   ' },
      { role: 'tutor', text: '' },
      { role: 'user', text: 'Hallo!' },
      { role: 'tutor', text: 'Hi! Wie geht es dir?' },
    ]
    expect(trimTutorHistory(history)).toEqual(history.slice(2))
  })

  it('returns history unchanged when under the cap', () => {
    const history = [turn('user', 0), turn('tutor', 1)]
    expect(trimTutorHistory(history)).toEqual(history)
  })

  it('caps at TUTOR_HISTORY_CAP (12) by default', () => {
    const history = Array.from({ length: 20 }, (_, i) => turn('user', i))
    expect(trimTutorHistory(history)).toHaveLength(TUTOR_HISTORY_CAP)
  })
})

describe('TUTOR_MODES + isTutorChatMode (M11.8)', () => {
  it('describes exactly the two modes with UI metadata', () => {
    expect(Object.keys(TUTOR_MODES).sort()).toEqual(['ask', 'chat'])
    for (const meta of Object.values(TUTOR_MODES)) {
      expect(meta.label.length).toBeGreaterThan(0)
      expect(meta.emoji.length).toBeGreaterThan(0)
      expect(meta.hint.length).toBeGreaterThan(0)
    }
  })

  it('guards persisted mode strings from localStorage', () => {
    expect(isTutorChatMode('chat')).toBe(true)
    expect(isTutorChatMode('ask')).toBe(true)
    expect(isTutorChatMode('roleplay')).toBe(false)
    expect(isTutorChatMode(null)).toBe(false)
  })
})
