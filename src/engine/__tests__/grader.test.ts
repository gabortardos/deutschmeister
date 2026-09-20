import { describe, expect, it } from 'vitest'
import { gradeAnswer } from '../grader'
import { dateKey, normalize, startOfDay, stripArticle } from '../text'

describe('normalize', () => {
  it('trims, lowercases, collapses whitespace, strips trailing punctuation', () => {
    expect(normalize('  Hello   World!! ')).toBe('hello world')
    expect(normalize('Der Hund.')).toBe('der hund')
    expect(normalize('Ja, gerne?')).toBe('ja, gerne')
  })

  it('folds umlauts and ß to ASCII so both spellings match', () => {
    expect(normalize('Übung')).toBe('uebung')
    expect(normalize('uebung')).toBe('uebung')
    expect(normalize('Straße')).toBe('strasse')
    expect(normalize('Strasse')).toBe('strasse')
    expect(normalize('schön')).toBe('schön'.replace('ö', 'oe'))
  })
})

describe('stripArticle', () => {
  it('removes German and English articles', () => {
    expect(stripArticle('der apfel')).toBe('apfel')
    expect(stripArticle('die frauen')).toBe('frauen')
    expect(stripArticle('ein buch')).toBe('buch')
    expect(stripArticle('the apple')).toBe('apple')
    expect(stripArticle('apfel')).toBe('apfel')
  })
})

describe('gradeAnswer', () => {
  it('matches case/spacing/punctuation variants', () => {
    expect(gradeAnswer('Apfel ', ['der Apfel']).correct).toBe(false) // article matters by default
    expect(gradeAnswer('der apfel', ['der Apfel']).correct).toBe(true)
    expect(gradeAnswer('DIE Frau.', ['die Frau']).correct).toBe(true)
  })

  it('accepts umlaut variants in BOTH directions', () => {
    expect(gradeAnswer('Uebung', ['Übung']).correct).toBe(true)
    expect(gradeAnswer('uebung', ['Übung']).correct).toBe(true)
    expect(gradeAnswer('Übung', ['Uebung']).correct).toBe(true)
    expect(gradeAnswer('strasse', ['Straße']).correct).toBe(true)
    expect(gradeAnswer('Grüße', ['Gruesse']).correct).toBe(true)
  })

  it('accepts article-optional answers for noun drills when enabled', () => {
    const opts = { articleOptional: true }
    expect(gradeAnswer('Apfel', ['der Apfel'], opts).correct).toBe(true)
    expect(gradeAnswer('das Buch', ['Buch'], opts).correct).toBe(true)
    expect(gradeAnswer('Birne', ['der Apfel'], opts).correct).toBe(false)
  })

  it('rejects empty answers', () => {
    expect(gradeAnswer('   ', ['apfel']).correct).toBe(false)
  })
})

describe('date helpers', () => {
  it('produces zero-padded local date keys', () => {
    expect(dateKey(new Date(2026, 8, 5))).toBe('2026-09-05')
  })

  it('startOfDay returns local midnight', () => {
    const t = new Date(2026, 8, 20, 15, 42).getTime()
    expect(startOfDay(t)).toBe(new Date(2026, 8, 20, 0, 0, 0, 0).getTime())
  })
})
