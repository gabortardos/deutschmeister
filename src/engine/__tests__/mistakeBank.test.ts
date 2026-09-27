import { describe, expect, it } from 'vitest'
import type { AttemptLike, CardLike, DrillItemLike, TopicLike, TurnLike, WordLike } from '../mistakeBank'
import { collectConversationMistakes, collectDrillMistakes, collectTroubleWords } from '../mistakeBank'

const item = (id: string, ownerId = 'top-1', accepted = ['die Übung']): DrillItemLike => ({
  id,
  ownerId,
  type: 'cloze',
  prompt: `___ (${id})`,
  acceptedAnswers: accepted,
  cefr: 'A1',
})

const topics: TopicLike[] = [
  { id: 'top-1', title: 'Articles' },
  { id: 'top-2', title: 'Cases' },
]

describe('collectDrillMistakes', () => {
  it('lists an item whose only attempt is wrong', () => {
    const out = collectDrillMistakes([{ itemId: 'd1', correct: false, userAnswer: 'der Übung', at: 100 }], [item('d1')], topics)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ itemId: 'd1', expected: 'die Übung', given: 'der Übung', topicTitle: 'Articles' })
  })

  it('correct latest attempt clears the mistake, regardless of attempt order in the list', () => {
    const attempts: AttemptLike[] = [
      { itemId: 'd1', correct: false, userAnswer: 'x', at: 100 },
      { itemId: 'd1', correct: true, userAnswer: 'die Übung', at: 200 },
    ]
    expect(collectDrillMistakes(attempts, [item('d1')], topics)).toHaveLength(0)
    expect(collectDrillMistakes([...attempts].reverse(), [item('d1')], topics)).toHaveLength(0)
  })

  it('wrong again after a correct retry re-lists the item and keeps the total wrong count', () => {
    const out = collectDrillMistakes(
      [
        { itemId: 'd1', correct: false, userAnswer: 'a', at: 100 },
        { itemId: 'd1', correct: true, userAnswer: 'die Übung', at: 200 },
        { itemId: 'd1', correct: false, userAnswer: 'b', at: 300 },
      ],
      [item('d1')],
      topics,
    )
    expect(out).toHaveLength(1)
    expect(out[0].wrongCount).toBe(2)
    expect(out[0].lastWrongAt).toBe(300)
    expect(out[0].given).toBe('b')
  })

  it('flags revealed answers as mistakes', () => {
    const out = collectDrillMistakes([{ itemId: 'd1', correct: false, userAnswer: '(revealed)', at: 1 }], [item('d1')], topics)
    expect(out[0]?.revealed).toBe(true)
    expect(out[0]?.given).toBe('(revealed)')
  })

  it('skips attempts whose drill item no longer exists', () => {
    expect(collectDrillMistakes([{ itemId: 'ghost', correct: false, userAnswer: 'x', at: 1 }], [item('d1')], topics)).toHaveLength(0)
  })

  it('sorts newest wrong first, itemId breaks ties', () => {
    const out = collectDrillMistakes(
      [
        { itemId: 'd2', correct: false, userAnswer: 'x', at: 100 },
        { itemId: 'd1', correct: false, userAnswer: 'x', at: 200 },
        { itemId: 'd3', correct: false, userAnswer: 'x', at: 100 },
      ],
      [item('d1'), item('d2'), item('d3')],
      topics,
    )
    expect(out.map((m) => m.itemId)).toEqual(['d1', 'd2', 'd3'])
  })

  it('missing topic row still renders with null links', () => {
    const out = collectDrillMistakes([{ itemId: 'd9', correct: false, userAnswer: 'x', at: 1 }], [item('d9', 'ghost-topic')], topics)
    expect(out[0]?.topicId).toBeNull()
    expect(out[0]?.topicTitle).toBeNull()
  })

  it('empty inputs give an empty bank', () => {
    expect(collectDrillMistakes([], [], [])).toEqual([])
  })
})

describe('collectTroubleWords', () => {
  const words: WordLike[] = [
    { id: 'w1', german: 'Übung', article: 'die', english: 'exercise', cefr: 'A1' },
    { id: 'w2', german: 'Hund', article: 'der', english: 'dog', cefr: 'A1' },
  ]
  const cards: CardLike[] = [
    { wordId: 'w1', lapses: 2, dueDate: 10, state: 'learning' },
    { wordId: 'w2', lapses: 0, dueDate: 10, state: 'review' },
  ]

  it('excludes cards with zero lapses', () => {
    const ids = collectTroubleWords(cards, words).map((w) => w.wordId)
    expect(ids).toEqual(['w1'])
  })

  it('sorts by lapses descending, then German A→Z for ties', () => {
    const out = collectTroubleWords(
      [
        { wordId: 'w2', lapses: 5, dueDate: 1, state: 'learning' },
        { wordId: 'w1', lapses: 5, dueDate: 2, state: 'learning' },
        { wordId: 'w1', lapses: 1, dueDate: 3, state: 'review' },
      ],
      words,
    )
    expect(out.map((w) => w.wordId)).toEqual(['w2', 'w1', 'w1'])
  })

  it('carries word + card fields through', () => {
    const out = collectTroubleWords([cards[0]], words)
    expect(out[0]).toMatchObject({ german: 'Übung', article: 'die', english: 'exercise', lapses: 2, dueDate: 10 })
  })

  it('skips cards whose word row is gone', () => {
    expect(collectTroubleWords([{ wordId: 'ghost', lapses: 3, dueDate: 1, state: 'learning' }], words)).toHaveLength(0)
  })
})

describe('collectConversationMistakes', () => {
  const turn = (id: string, at: number, mistakes: TurnLike['mistakes']): TurnLike => ({
    id,
    sessionId: `s-${id}`,
    updatedAt: at,
    mistakes,
  })

  it('flattens mistakes newest-first across turns', () => {
    const out = collectConversationMistakes([
      turn('t1', 100, [{ said: 'ich bin müde', corrected: 'Ich bin müde', type: 'other' }]),
      turn('t2', 200, [
        { said: 'der Übung', corrected: 'die Übung', type: 'gender' },
        { said: 'nach Hause gehen ich', corrected: 'ich gehe nach Hause', type: 'word-order' },
      ]),
    ])
    expect(out.map((m) => m.type)).toEqual(['gender', 'word-order', 'other'])
    expect(out[0]).toMatchObject({ at: 200, sessionId: 's-t2' })
  })

  it('skips turns without mistakes and blank corrections', () => {
    const out = collectConversationMistakes([
      turn('t1', 1, null),
      turn('t2', 2, [{ said: '  ', corrected: 'x', type: 'other' }]),
    ])
    expect(out).toHaveLength(0)
  })

  it('caps the list at the limit, newest kept', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      turn(`t${i}`, i, [{ said: `s${i}`, corrected: `c${i}`, type: 'other' }]),
    )
    const out = collectConversationMistakes(many, 20)
    expect(out).toHaveLength(20)
    expect(out[0]?.said).toBe('s29')
  })
})
