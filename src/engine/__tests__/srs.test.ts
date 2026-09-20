import { describe, expect, it } from 'vitest'
import type { VocabCard } from '../../db/types'
import { isDue, newCard, previewInterval, reviewCard } from '../srs'

const NOW = new Date(2026, 8, 20, 10, 0).getTime()
const wordId = 'w-a1-0001'

function card(): VocabCard {
  return newCard(wordId, NOW)
}

describe('newCard', () => {
  it('starts as new with ease 2.5 and no interval', () => {
    const c = card()
    expect(c.state).toBe('new')
    expect(c.ease).toBe(2.5)
    expect(c.intervalDays).toBe(0)
    expect(c.repetitions).toBe(0)
    expect(isDue(c, NOW)).toBe(false)
  })
})

describe('reviewCard (SM-2)', () => {
  it('first success → interval 1 day, learning state, due tomorrow', () => {
    const next = reviewCard(card(), 4, NOW)
    expect(next.repetitions).toBe(1)
    expect(next.intervalDays).toBe(1)
    expect(next.state).toBe('learning')
    expect(next.dueDate).toBe(new Date(2026, 8, 21, 0, 0).getTime())
  })

  it('second success → fixed interval 6 days', () => {
    const c1 = reviewCard(card(), 4, NOW)
    const c2 = reviewCard(c1, 4, NOW)
    expect(c2.repetitions).toBe(2)
    expect(c2.intervalDays).toBe(6)
  })

  it('third success → interval scaled by ease factor', () => {
    const c1 = reviewCard(card(), 4, NOW)
    const c2 = reviewCard(c1, 4, NOW)
    const c3 = reviewCard(c2, 4, NOW)
    expect(c3.intervalDays).toBe(Math.round(6 * c2.ease))
    expect(c3.intervalDays).toBeGreaterThan(6)
  })

  it('quality 5 raises ease, quality 3 lowers ease (SM-2 formula)', () => {
    expect(reviewCard(card(), 5, NOW).ease).toBeGreaterThan(2.5)
    expect(reviewCard(card(), 3, NOW).ease).toBeLessThan(2.5)
    expect(reviewCard(card(), 4, NOW).ease).toBe(2.5)
  })

  it('ease never drops below 1.3', () => {
    let c = card()
    for (let i = 0; i < 20; i += 1) c = reviewCard(c, 3, NOW)
    expect(c.ease).toBeGreaterThanOrEqual(1.3)
  })

  it('failure resets repetitions, counts a lapse, relearns next day', () => {
    let c = reviewCard(card(), 4, NOW)
    c = reviewCard(c, 4, NOW)
    const failed = reviewCard(c, 1, NOW)
    expect(failed.repetitions).toBe(0)
    expect(failed.intervalDays).toBe(0)
    expect(failed.lapses).toBe(1)
    expect(failed.dueDate).toBe(new Date(2026, 8, 21, 0, 0).getTime())
    expect(failed.state).toBe('learning')
  })

  it('state becomes review once interval ≥ 21 days', () => {
    let c = card()
    for (let i = 0; i < 5; i += 1) c = reviewCard(c, 5, NOW)
    expect(c.state).toBe('review')
  })

  it('clamps out-of-range quality', () => {
    expect(reviewCard(card(), 9, NOW).repetitions).toBe(1)
    expect(reviewCard(card(), -2, NOW).repetitions).toBe(0)
  })
})

describe('previewInterval', () => {
  it('shows human-friendly next interval', () => {
    expect(previewInterval(card(), 4, NOW)).toBe('tomorrow')
  })
})
