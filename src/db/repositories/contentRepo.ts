import { db } from '../dexie'
import type { CefrLevel, KeyPhrase, Scenario, VocabWord } from '../types'
import { newId } from '../../utils/id'

export interface CustomWordInput {
  german: string
  article: 'der' | 'die' | 'das' | null
  plural: string | null
  english: string
  theme: string
  cefr: CefrLevel
  exampleSentenceDe?: string | null
  exampleSentenceEn?: string | null
}

export async function addCustomWord(input: CustomWordInput): Promise<VocabWord> {
  const word: VocabWord = {
    id: newId(),
    updatedAt: Date.now(),
    german: input.german.trim(),
    article: input.article,
    plural: input.plural?.trim() || null,
    english: input.english.trim(),
    cefr: input.cefr,
    theme: input.theme.trim() || 'Custom',
    frequencyRank: 999999,
    exampleSentenceDe: input.exampleSentenceDe ?? null,
    exampleSentenceEn: input.exampleSentenceEn ?? null,
    custom: true,
  }
  await db.vocabWords.put(word)
  return word
}

export interface CustomScenarioInput {
  title: string
  cefr: CefrLevel
  description: string
  goal: string
  keyPhrases: KeyPhrase[]
}

export async function addCustomScenario(input: CustomScenarioInput): Promise<Scenario> {
  const scenario: Scenario = {
    id: newId(),
    updatedAt: Date.now(),
    title: input.title.trim(),
    cefr: input.cefr,
    emoji: '⭐',
    description: input.description.trim(),
    goal: input.goal.trim(),
    keyPhrases: input.keyPhrases,
    custom: true,
  }
  await db.scenarios.put(scenario)
  return scenario
}

/** Parses lines of "Deutsche Phrase | English translation" into key phrases. */
export function parseKeyPhrases(text: string): KeyPhrase[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [de, en] = line.split('|').map((part) => part.trim())
      return { de: de ?? '', en: en ?? '' }
    })
    .filter((phrase) => phrase.de.length > 0)
}

export interface ContentCounts {
  words: number
  customWords: number
  scenarios: number
  customScenarios: number
  cachedLlmItems: number
}

export async function contentCounts(): Promise<ContentCounts> {
  const [words, customWords, scenarios, customScenarios, cached] = await Promise.all([
    db.vocabWords.count(),
    db.vocabWords.filter((w) => w.custom === true).count(),
    db.scenarios.count(),
    db.scenarios.filter((s) => s.custom === true).count(),
    db.llmCache.count(),
  ])
  return { words, customWords, scenarios, customScenarios, cachedLlmItems: cached }
}

export async function clearLlmCache(): Promise<void> {
  await db.llmCache.clear()
}
