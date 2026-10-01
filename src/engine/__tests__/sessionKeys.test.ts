import { describe, expect, it } from 'vitest'
import { choiceKeyIndex, introKeyAction, resultKeyAction, skipKeyAction } from '../sessionKeys'

describe('introKeyAction', () => {
  it('reveals on Space before the meaning is shown', () => {
    expect(introKeyAction(' ', false)).toBe('reveal')
  })

  it('continues on Space after the meaning is shown', () => {
    expect(introKeyAction(' ', true)).toBe('continue')
  })

  it('treats Enter like Space', () => {
    expect(introKeyAction('Enter', false)).toBe('reveal')
    expect(introKeyAction('Enter', true)).toBe('continue')
  })

  it('ignores other keys', () => {
    expect(introKeyAction('a', false)).toBeNull()
    expect(introKeyAction('ArrowRight', true)).toBeNull()
    expect(introKeyAction('', false)).toBeNull()
  })
})

describe('choiceKeyIndex', () => {
  it('maps digits 1–4 to indices 0–3', () => {
    expect(choiceKeyIndex('1', 4)).toBe(0)
    expect(choiceKeyIndex('4', 4)).toBe(3)
  })

  it('returns null for digits beyond the option count', () => {
    expect(choiceKeyIndex('5', 4)).toBeNull()
  })

  it('returns null for non-digit keys', () => {
    expect(choiceKeyIndex('0', 4)).toBeNull()
    expect(choiceKeyIndex('a', 4)).toBeNull()
    expect(choiceKeyIndex('', 4)).toBeNull()
  })

  it('supports up to nine options', () => {
    expect(choiceKeyIndex('9', 9)).toBe(8)
  })
})

describe('resultKeyAction', () => {
  it('advances on Space or Enter', () => {
    expect(resultKeyAction(' ')).toBe('next')
    expect(resultKeyAction('Enter')).toBe('next')
  })

  it('ignores other keys', () => {
    expect(resultKeyAction('n')).toBeNull()
    expect(resultKeyAction('Escape')).toBeNull()
  })
})

describe('skipKeyAction (M12.9)', () => {
  it('maps s and S to skip', () => {
    expect(skipKeyAction('s')).toBe('skip')
    expect(skipKeyAction('S')).toBe('skip')
  })

  it('ignores everything else — including keys containing an s', () => {
    expect(skipKeyAction('a')).toBeNull()
    expect(skipKeyAction('Enter')).toBeNull()
    expect(skipKeyAction('Shift')).toBeNull()
    expect(skipKeyAction('Escape')).toBeNull()
    expect(skipKeyAction('')).toBeNull()
  })
})