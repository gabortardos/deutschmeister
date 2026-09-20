import { describe, expect, it } from 'vitest'
import { computeMastery, masteryPercent, MASTERY_MIN_ATTEMPTS } from '../mastery'

describe('computeMastery', () => {
  it('starts unmastered with no attempts', () => {
    const info = computeMastery([])
    expect(info.attempts).toBe(0)
    expect(info.ratio).toBe(0)
    expect(info.mastered).toBe(false)
    expect(masteryPercent(info)).toBe(0)
  })

  it('requires at least 6 attempts even with a perfect score', () => {
    const info = computeMastery([true, true, true, true, true])
    expect(info.attempts).toBe(5)
    expect(info.ratio).toBe(1)
    expect(info.mastered).toBe(false)
    expect(MASTERY_MIN_ATTEMPTS).toBe(6)
  })

  it('masteres with 6/6 correct', () => {
    const info = computeMastery([true, true, true, true, true, true])
    expect(info.mastered).toBe(true)
    expect(masteryPercent(info)).toBe(100)
  })

  it('early failures age out of the recency window', () => {
    // two early misses, then 8 straight correct → last 8 are all correct
    const info = computeMastery([false, false, ...Array<boolean>(8).fill(true)])
    expect(info.attempts).toBe(10)
    expect(info.recentCorrect).toBe(8)
    expect(info.mastered).toBe(true)
  })

  it('75% of the recent window masters, 66% does not', () => {
    const sixOfEight = computeMastery([true, true, true, true, true, true, false, false])
    expect(sixOfEight.ratio).toBeCloseTo(0.75)
    expect(sixOfEight.mastered).toBe(true)

    const fourOfSix = computeMastery([true, true, true, true, false, false])
    expect(fourOfSix.ratio).toBeCloseTo(0.667, 2)
    expect(fourOfSix.mastered).toBe(false)
  })

  it('only the last `window` attempts decide the ratio', () => {
    // 5 correct, then 3 wrong (window default 8 → last 8 = 5✓+3✗ → 0.625)
    const info = computeMastery([...Array<boolean>(5).fill(true), false, false, false])
    expect(info.recentCorrect).toBe(5)
    expect(info.ratio).toBeCloseTo(0.625)
    expect(info.mastered).toBe(false)
  })
})
