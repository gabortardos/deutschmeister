import { describe, expect, it } from 'vitest'
import type { VocabWord } from '../../db/types'
import { checkCloze, clozeItems, clozeOptions, findGap } from '../clozeReviews'

function word(over: Partial<VocabWord> & { id: string }): VocabWord {
  return {
    german: 'Tag',
    article: 'der',
    plural: 'Tage',
    english: 'day',
    cefr: 'A1',
    theme: 'Time',
    frequencyRank: 1,
    exampleSentenceDe: 'Der Tag ist lang.',
    exampleSentenceEn: 'The day is long.',
    custom: false,
    updatedAt: 0,
    ...over,
  }
}

describe('findGap', () => {
  it('gaps the article form when present, preserving surrounding spacing', () => {
    expect(findGap('Der Tag ist lang.', word({ id: 'a' }))).toEqual({
      before: '',
      after: ' ist lang.',
      answer: 'Der Tag',
    })
  })

  it('falls back to the bare word and matches case-insensitively', () => {
    const w = word({ id: 'a', german: 'Apfel', article: 'die', exampleSentenceDe: 'Ich esse einen Apfel.' })
    expect(findGap('Ich esse einen Apfel.', w)).toEqual({ before: 'Ich esse einen ', after: '.', answer: 'Apfel' })
  })

  it('never matches inside a longer word (Unicode letter boundary)', () => {
    const w = word({ id: 'a', german: 'Tag', article: null, exampleSentenceDe: 'Die Tage sind lang.' })
    expect(findGap('Die Tage sind lang.', w)).toBeNull()
  })

  it('returns null when the word only appears inflected or is absent', () => {
    const sein = word({ id: 'a', german: 'sein', article: null, exampleSentenceDe: 'Ich bin müde.' })
    expect(findGap('Ich bin müde.', sein)).toBeNull()
    expect(findGap('Wir haben ein Auto.', word({ id: 'b' }))).toBeNull()
  })
})

describe('clozeOptions', () => {
  it('puts the answer first, same-theme distractors before others, caps at 4', () => {
    const w = word({ id: 'a', german: 'Tag', article: 'der' })
    const bank = [
      word({ id: 'b', german: 'Nacht', article: 'die', theme: 'Time', english: 'night' }),
      word({ id: 'c', german: 'Jahr', article: 'das', theme: 'Time', english: 'year' }),
      word({ id: 'd', german: 'Haus', article: 'das', theme: 'Home', english: 'house' }),
      word({ id: 'e', german: 'Auto', article: 'das', theme: 'Travel', english: 'car' }),
    ]
    const options = clozeOptions('Der Tag', w, bank)
    expect(options).toHaveLength(4)
    expect(options[0]).toBe('Der Tag')
    expect(options.slice(1)).toEqual(['die Nacht', 'das Jahr', 'das Haus'])
  })

  it('mirrors a bare-word answer with bare distractors', () => {
    const w = word({ id: 'a', german: 'Haus', article: 'das', theme: 'Home' })
    const bank = [word({ id: 'b', german: 'Auto', article: 'das', theme: 'Home' })]
    expect(clozeOptions('Haus', w, bank)).toEqual(['Haus', 'Auto'])
  })

  it('keeps article variants of the same noun (gender practice), skips exact duplicates', () => {
    const w = word({ id: 'a', german: 'Tag', article: 'der' })
    const bank = [
      word({ id: 'b', german: 'Tag', article: 'das' }), // wrong-article variant → useful distractor
      word({ id: 'dup', german: 'Tag', article: 'der' }), // exact same form → duplicate
      word({ id: 'c', german: 'Nacht', article: 'die' }),
    ]
    expect(clozeOptions('Der Tag', w, bank)).toEqual(['Der Tag', 'das Tag', 'die Nacht'])
  })
})

describe('clozeItems', () => {
  it('builds items only for literally gappable words and dedupes sentences', () => {
    const bank = [
      word({ id: 'b', german: 'Nacht', article: 'die', english: 'night', exampleSentenceDe: 'Die Nacht ist kalt.' }),
      word({ id: 'c', german: 'Jahr', article: 'das', english: 'year', exampleSentenceDe: 'Das Jahr ist schnell.' }),
    ]
    const items = clozeItems(
      [
        word({ id: 'a' }),
        word({ id: 'dup', german: 'Zeit', article: 'die', english: 'time', exampleSentenceDe: 'Der Tag ist lang.' }),
        word({ id: 'bin', german: 'sein', article: null, exampleSentenceDe: 'Ich bin müde.' }),
      ],
      bank,
    )
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      id: 'a:cloze',
      kind: 'cloze',
      wordId: 'a',
      before: '',
      after: ' ist lang.',
      answer: 'Der Tag',
      word: 'der Tag',
      sentenceEn: 'The day is long.',
    })
  })

  it('caps at the limit and skips items without a distractor', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      word({ id: `w${i}`, german: `Wort${i}`, article: 'das', exampleSentenceDe: `Das Wort${i} ist neu.`, theme: `T${i % 3}` }),
    )
    expect(clozeItems(many, many, 5)).toHaveLength(5)
    const solo = word({ id: 'solo', german: 'Eins', article: 'das', exampleSentenceDe: 'Das Eins ist da.' })
    expect(clozeItems([solo], [])).toHaveLength(0)
  })
})

describe('checkCloze', () => {
  it('compares normalization-tolerantly', () => {
    const item = clozeItems([word({ id: 'a' })], [word({ id: 'b', german: 'Nacht', article: 'die' })])[0]
    expect(checkCloze(item, 'Der Tag')).toBe(true)
    expect(checkCloze(item, 'der tag')).toBe(true)
    expect(checkCloze(item, 'die Nacht')).toBe(false)
  })
})
