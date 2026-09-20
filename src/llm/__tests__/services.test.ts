import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  conversationTurn,
  mistakesToDrills,
  normalizeCategory,
  shortHash,
  suggestReply,
  type LlmCachePort,
  type LlmServiceDeps,
} from '../services'

/**
 * The services are tested against a stubbed fetch: the adapter's defensive
 * parsing, zod validation and retry logic all run for real.
 */

function completions(content: string): unknown {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
    text: async () => content,
  }
}

function memoryCache(): LlmCachePort & { store: Map<string, unknown> } {
  const store = new Map<string, unknown>()
  return {
    store,
    get: async (k) => store.get(k) ?? null,
    put: async (k, v) => {
      store.set(k, v)
    },
  }
}

const CONFIG = { baseUrl: 'https://example.test/v1', apiKey: 'test-key', model: 'test-model' }
const deps = (cache?: LlmCachePort): LlmServiceDeps => ({ config: CONFIG, ...(cache ? { cache } : {}) })

const SCENARIO = {
  title: 'Im Fitnessstudio',
  cefr: 'A2' as const,
  description: 'Talk about machines and training',
  goal: 'Ask how a machine works',
  keyPhrases: [{ de: 'Wie funktioniert dieses Gerät?', en: 'How does this machine work?' }],
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('conversationTurn', () => {
  it('parses a fenced JSON reply into the contract shape', async () => {
    fetchMock.mockResolvedValueOnce(
      completions(
        '```json\n{"reply":"Natürlich! Ich zeige es dir.","mistakes":[{"said":"Ich gehe zu gym","corrected":"Ich gehe ins Fitnessstudio","type":"vocab"}],"replyTranslationEn":"Sure! I will show you.","tutorQuestion":"Wie lange trainierst du schon?"}\n```',
      ),
    )
    const res = await conversationTurn(deps(), {
      scenario: SCENARIO,
      level: 'A2',
      history: [],
      userText: 'Ich gehe zu gym',
    })
    expect(res.reply).toBe('Natürlich! Ich zeige es dir.')
    expect(res.mistakes).toHaveLength(1)
    expect(res.mistakes[0]?.corrected).toBe('Ich gehe ins Fitnessstudio')
    expect(res.replyTranslationEn).toBe('Sure! I will show you.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('recovers when the first response is invalid JSON but the retry is valid', async () => {
    fetchMock
      .mockResolvedValueOnce(completions('Sorry, here is my answer in plain prose!'))
      .mockResolvedValueOnce(
        completions(
          '{"reply":"Guten Tag! Wie kann ich helfen?","mistakes":[],"replyTranslationEn":"Hello!","tutorQuestion":"Wie geht es dir?"}',
        ),
      )
    const res = await conversationTurn(deps(), { scenario: SCENARIO, level: 'A1', history: [], userText: null })
    expect(res.reply).toBe('Guten Tag! Wie kann ich helfen?')
    expect(res.mistakes).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws after exhausting retries on schema-invalid output', async () => {
    fetchMock.mockResolvedValue(completions('{"reply": ""}')) // reply min(1) fails every time
    await expect(
      conversationTurn(deps(), { scenario: SCENARIO, level: 'A1', history: [], userText: 'Hallo' }),
    ).rejects.toThrow(/Schema validation failed/)
    expect(fetchMock).toHaveBeenCalledTimes(3) // 1 + 2 retries
  })
})

describe('suggestReply', () => {
  it('returns the suggestion with a defaulted translation', async () => {
    fetchMock.mockResolvedValueOnce(completions('{"suggestion":"Wie viel Gewicht soll ich nehmen?"}'))
    const res = await suggestReply(deps(), { scenario: SCENARIO, level: 'A2', history: [] })
    expect(res.suggestion).toBe('Wie viel Gewicht soll ich nehmen?')
    expect(res.translationEn).toBe('')
  })
})

describe('sessionFeedback + normalizeCategory', () => {
  it('rounds the score and normalizes free-form categories onto the fixed set', async () => {
    const { sessionFeedback } = await import('../services')
    fetchMock.mockResolvedValueOnce(
      completions(
        '{"overallScore":78.6,"summary":"Gut gemacht!","strengths":["clear questions"],"mistakes":[{"said":"Ich habe drei Tag","corrected":"Ich habe drei Tage","type":"Satzbau"},{"said":"der Übung","corrected":"die Übung","type":"irgendwas"}],"recommendedDrillTopics":["Plural forms"]}',
      ),
    )
    const res = await sessionFeedback(deps(), {
      scenario: SCENARIO,
      level: 'A2',
      history: [
        { role: 'tutor', text: 'Wie lange trainierst du schon?' },
        { role: 'user', text: 'Ich habe drei Tag' },
      ],
    })
    expect(res.overallScore).toBe(79)
    expect(res.mistakes[0]?.type).toBe('word-order')
    expect(res.mistakes[1]?.type).toBe('other')
  })

  it('normalizeCategory maps German and compound labels', () => {
    expect(normalizeCategory('Artikel')).toBe('gender')
    expect(normalizeCategory(' Kasus ')).toBe('case')
    expect(normalizeCategory('verb form')).toBe('verb-form')
    expect(normalizeCategory('???')).toBe('other')
  })
})

describe('generateDrillItems', () => {
  const topic = {
    id: 'g-a1-05',
    title: 'Akkusativ',
    cefr: 'A1' as const,
    focus: 'direct objects',
    explanationMd: '## Rule\n- den Mann',
  }

  const payload = {
    items: [
      { type: 'cloze', prompt: 'Ich sehe ___ Mann.', promptData: null, acceptedAnswers: ['den'] },
      { type: 'choice', prompt: 'Akkusativ of “der Mann”?', promptData: {}, acceptedAnswers: ['den Mann'] }, // no options → dropped
      {
        type: 'choice',
        prompt: 'Akkusativ of “die Frau”?',
        promptData: { options: ['die Frau', 'der Frau', 'dem Mann', 'den Mann'] },
        acceptedAnswers: ['die Frau'],
      },
      { type: 'wordorder', prompt: 'Build the sentence', promptData: null, acceptedAnswers: ['Ich sehe den Mann'] },
      { type: 'transform', prompt: 'Der Mann ist groß.', promptData: {}, acceptedAnswers: ['Den Mann sehe ich'] },
      { type: 'cloze', prompt: 'No gap here', promptData: null, acceptedAnswers: ['x'] }, // dropped (no ___)
    ],
  }

  it('sanitizes generated drills into runner-compatible items', async () => {
    const { generateDrillItems } = await import('../services')
    fetchMock.mockResolvedValueOnce(completions(JSON.stringify(payload)))
    const items = await generateDrillItems(deps(), { topic, n: 4 })
    expect(items).toHaveLength(4) // 6 raw − 2 unusable, sliced to n
    for (const item of items) {
      expect(item.ownerId).toBe(topic.id)
      expect(item.cefr).toBe('A1')
      expect(item.source).toBe('llm')
      expect(item.validated).toBe(true)
    }
    const ids = new Set(items.map((i) => i.id))
    expect(ids.size).toBe(items.length)
    const choice = items.find((i) => i.type === 'choice')
    expect(choice?.promptData?.options).toEqual(['die Frau', 'der Frau', 'dem Mann', 'den Mann'])
    expect(choice?.acceptedAnswers).toEqual(['die Frau'])
    const wordorder = items.find((i) => i.type === 'wordorder')
    expect(wordorder?.promptData?.tokens).toEqual(['Ich', 'sehe', 'den', 'Mann'])
    const transform = items.find((i) => i.type === 'transform')
    expect(typeof transform?.promptData?.instruction).toBe('string')
  })

  it('caches the raw generation and skips the LLM on the second call', async () => {
    const { generateDrillItems } = await import('../services')
    const cache = memoryCache()
    fetchMock.mockResolvedValueOnce(completions(JSON.stringify(payload)))
    const first = await generateDrillItems(deps(cache), { topic, n: 3 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const second = await generateDrillItems(deps(cache), { topic, n: 3 })
    expect(fetchMock).toHaveBeenCalledTimes(1) // cache hit
    expect(second.map((i) => i.prompt)).toEqual(first.map((i) => i.prompt))
    expect(cache.store.size).toBe(1)
    expect([...cache.store.keys()][0]).toContain('drills:g-a1-05:3:0:test-model')
  })
})

describe('exampleSentences', () => {
  it('returns level-tagged sentences and caches them (case-insensitive key)', async () => {
    const { exampleSentences } = await import('../services')
    const cache = memoryCache()
    fetchMock.mockResolvedValueOnce(
      completions(
        '{"sentences":[{"de":"Die Bank ist hart.","en":"The bench is hard.","cefr":"A2"},{"de":"Ich liege auf der Bank.","en":"I am lying on the bench.","cefr":"B1"},{"de":"Die Bank steht im Park.","en":"The bench is in the park.","cefr":"A2"}]}',
      ),
    )
    const first = await exampleSentences(deps(cache), {
      word: { german: 'die Bank', english: 'bench' },
      cefr: 'A2',
      n: 3,
    })
    expect(first).toHaveLength(3)
    expect(first[0]?.de).toBe('Die Bank ist hart.')
    const second = await exampleSentences(deps(cache), {
      word: { german: 'Die Bank', english: 'bench' },
      cefr: 'A2',
      n: 3,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second).toEqual(first)
  })
})

describe('mistakesToDrills', () => {
  it('dedupes, skips no-ops and builds transform drills with category instructions', () => {
    const drills = mistakesToDrills(
      [
        { said: 'Ich gehe zu gym', corrected: 'Ich gehe ins Fitnessstudio', type: 'vocab' },
        { said: 'Ich gehe zu gym', corrected: 'Ich gehe ins Fitnessstudio', type: 'vocab' }, // dup
        { said: 'Alles gut', corrected: 'Alles gut', type: 'other' }, // no-op
        { said: 'Ich habe drei Tag', corrected: 'Ich habe drei Tage', type: 'word-order' },
      ],
      'A2',
      's-fitness',
    )
    expect(drills).toHaveLength(2)
    expect(drills.every((d) => d.type === 'transform' && d.ownerId === 's-fitness' && d.source === 'llm')).toBe(true)
    expect(drills[0]?.acceptedAnswers).toEqual(['Ich gehe ins Fitnessstudio'])
    expect(String(drills[1]?.promptData?.instruction)).toContain('word order')
  })
})

describe('shortHash', () => {
  it('is deterministic and distinguishes inputs', () => {
    expect(shortHash('abc')).toBe(shortHash('abc'))
    expect(shortHash('abc')).not.toBe(shortHash('abd'))
  })
})


