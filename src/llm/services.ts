import { z } from 'zod'
import type { CefrLevel, DrillItem, KeyPhrase } from '../db/types'
import { newId } from '../utils/id'
import { chatJSON, type ChatMessage, type LlmConfig } from './adapter'

/**
 * The five M3 LLM service contracts (plus the conversation Hint helper).
 * Pure TS: no React. All network access goes through the adapter (`chatJSON`,
 * which defensively parses, zod-validates and retries); persistence stays in
 * repositories — services only talk to an injected cache port.
 */

// ---------------------------------------------------------------------------
// Dependencies & cache
// ---------------------------------------------------------------------------

export interface LlmCachePort {
  get(key: string): Promise<unknown | null>
  put(key: string, payload: unknown): Promise<void>
}

export interface LlmServiceDeps {
  config: LlmConfig
  /** Optional persistent cache (IndexedDB in the app; omitted in tests). */
  cache?: LlmCachePort
}

/** FNV-1a → base36 (same family as engine hashSeed; local to keep layers clean). */
export function shortHash(text: string): string {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

/** Cache-first wrapper: hit → return stored payload; miss → run, then store. */
async function withCache<T>(deps: LlmServiceDeps, key: string, run: () => Promise<T>): Promise<T> {
  if (deps.cache) {
    const hit = await deps.cache.get(key)
    if (hit !== null && hit !== undefined) return hit as T
  }
  const value = await run()
  if (deps.cache) {
    try {
      await deps.cache.put(key, value)
    } catch {
      // cache writes must never break the feature
    }
  }
  return value
}

const CEFR = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])

// ---------------------------------------------------------------------------
// 1. conversationTurn — one tutor reply in a role-play scene
// ---------------------------------------------------------------------------

const MistakeSchema = z.object({
  said: z.string().min(1),
  corrected: z.string().min(1),
  type: z.string().min(1),
})

export interface ConversationMistakeShape {
  said: string
  corrected: string
  type: string
}

const ConversationReplySchema = z.object({
  reply: z.string().min(1),
  mistakes: z.array(MistakeSchema).max(8).default([]),
  replyTranslationEn: z.string().default(''),
  tutorQuestion: z.string().default(''),
})

/** The scenario fields the prompts need (a db Scenario satisfies this). */
export interface ScenarioContext {
  title: string
  cefr: CefrLevel
  description: string
  goal: string
  keyPhrases: KeyPhrase[]
}

export interface HistoryTurn {
  role: 'user' | 'tutor'
  text: string
}

export interface ConversationTurnInput {
  scenario: ScenarioContext
  level: CefrLevel
  history: HistoryTurn[]
  /** The learner's latest German message; null = ask the tutor to open the scene. */
  userText: string | null
}

export interface ConversationTurnResult {
  reply: string
  mistakes: ConversationMistakeShape[]
  replyTranslationEn: string
  tutorQuestion: string
}

function conversationMessages(input: ConversationTurnInput): ChatMessage[] {
  const phrases =
    input.scenario.keyPhrases.length > 0
      ? input.scenario.keyPhrases.map((p) => `- ${p.de} — ${p.en}`).join('\n')
      : '(none)'
  const system = [
    `You are a friendly, patient German speaker role-playing with a learner at CEFR level ${input.level}.`,
    `Scenario: "${input.scenario.title}" — ${input.scenario.description}`,
    `The learner's goal in this scene: ${input.scenario.goal}`,
    'Key phrases the learner wants to practice:',
    phrases,
    'Rules:',
    '- ALWAYS stay in character and keep the scene moving; end your reply with a natural question.',
    `- Write your reply in German suited to CEFR ${input.level} (short, simple sentences for A1/A2).`,
    '- NEVER interrupt the role-play with corrections or meta-comments — mistakes are reported only in JSON.',
    `- In "mistakes", quote the learner's German exactly as said and give the minimal correction; empty array if the message was fine. Cover ONLY the learner's latest message — never repeat earlier mistakes.`,
    '- "reply" = your full in-character German answer (keep it under ~80 words); "tutorQuestion" = the German question you ended with; "replyTranslationEn" = natural English translation of "reply".',
    'JSON shape: { "reply": "...", "mistakes": [ { "said": "...", "corrected": "...", "type": "..." } ], "replyTranslationEn": "...", "tutorQuestion": "..." }',
    'Return ONLY raw JSON — every key above, no prose, no markdown fences.',
  ].join('\n')
  const history = input.history
    .filter((t) => t.text.trim().length > 0)
    .slice(-12)
    .map<ChatMessage>((t) => ({ role: t.role === 'user' ? 'user' : 'assistant', content: t.text }))
  const last: ChatMessage =
    input.userText === null
      ? { role: 'user', content: '(Start the role-play now: greet in character and ask your first question.)' }
      : { role: 'user', content: input.userText }
  return [{ role: 'system', content: system }, ...history, last]
}

export async function conversationTurn(
  deps: LlmServiceDeps,
  input: ConversationTurnInput,
): Promise<ConversationTurnResult> {
  const parsed = await chatJSON(deps.config, conversationMessages(input), ConversationReplySchema, {
    maxTokens: 1400,
    temperature: 0.7,
  })
  return {
    reply: parsed.reply.trim(),
    mistakes: parsed.mistakes,
    replyTranslationEn: parsed.replyTranslationEn,
    tutorQuestion: parsed.tutorQuestion,
  }
}

// ---------------------------------------------------------------------------
// Hint — suggest one reply the learner could send (marked assisted in UI)
// ---------------------------------------------------------------------------

const SuggestReplySchema = z.object({
  suggestion: z.string().min(1),
  translationEn: z.string().default(''),
})

export interface SuggestedReply {
  suggestion: string
  translationEn: string
}

export async function suggestReply(
  deps: LlmServiceDeps,
  input: { scenario: ScenarioContext; level: CefrLevel; history: HistoryTurn[] },
): Promise<SuggestedReply> {
  const system = [
    `You are a German tutor helping a shy learner (CEFR ${input.level}) in the role-play "${input.scenario.title}".`,
    `The learner wants to achieve: ${input.scenario.goal}`,
    'Suggest ONE natural German message the learner could send next, at their level, using a key phrase if it fits.',
    'The suggestion must be something the LEARNER would say (not the tutor) and must move the scene toward the goal.',
    'Return ONLY valid JSON: { "suggestion": "<German>", "translationEn": "<English>" }.',
  ].join('\n')
  const history = input.history
    .slice(-12)
    .map<ChatMessage>((t) => ({ role: t.role === 'user' ? 'user' : 'assistant', content: t.text }))
  const parsed = await chatJSON(deps.config, [{ role: 'system', content: system }, ...history], SuggestReplySchema, {
    maxTokens: 300,
    temperature: 0.5,
  })
  return { suggestion: parsed.suggestion.trim(), translationEn: parsed.translationEn }
}

// ---------------------------------------------------------------------------
// 2. sessionFeedback — end-of-session report
// ---------------------------------------------------------------------------

export type MistakeCategory = 'gender' | 'case' | 'word-order' | 'vocab' | 'verb-form' | 'other'

const CATEGORY_MAP: Record<string, MistakeCategory> = {
  gender: 'gender',
  'gender/article': 'gender',
  artikel: 'gender',
  genus: 'gender',
  case: 'case',
  kasus: 'case',
  'case/agreement': 'case',
  'word-order': 'word-order',
  wordorder: 'word-order',
  'word order': 'word-order',
  satzbau: 'word-order',
  vocab: 'vocab',
  vocabulary: 'vocab',
  wortschatz: 'vocab',
  'verb-form': 'verb-form',
  verbform: 'verb-form',
  'verb form': 'verb-form',
  verb: 'verb-form',
  conjugation: 'verb-form',
  other: 'other',
}

/** Maps free-form LLM category strings onto the six fixed categories. */
export function normalizeCategory(raw: string): MistakeCategory {
  return CATEGORY_MAP[raw.trim().toLowerCase()] ?? 'other'
}

const SessionFeedbackSchema = z.object({
  overallScore: z.number().min(0).max(100),
  summary: z.string().default(''),
  strengths: z.array(z.string().min(1)).max(6).default([]),
  mistakes: z.array(MistakeSchema).max(15).default([]),
  recommendedDrillTopics: z.array(z.string().min(1)).max(6).default([]),
})

export interface SessionFeedback {
  overallScore: number
  summary: string
  strengths: string[]
  mistakes: { said: string; corrected: string; type: MistakeCategory }[]
  recommendedDrillTopics: string[]
}

export async function sessionFeedback(
  deps: LlmServiceDeps,
  input: { scenario: ScenarioContext; level: CefrLevel; history: HistoryTurn[] },
): Promise<SessionFeedback> {
  const transcript = input.history.map((t) => `${t.role === 'user' ? 'Learner' : 'Tutor'}: ${t.text}`).join('\n')
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: [
        'You are a German tutor writing an end-of-session report (in English) for the learner.',
        `Scenario: "${input.scenario.title}" (${input.scenario.goal}). Learner level: ${input.level}.`,
        'Judge ONLY what the learner wrote; ignore the tutor text.',
        'Return ONLY valid JSON with:',
        '- overallScore: 0-100 (communication achieved, correctness for the level, range)',
        '- summary: 2 encouraging sentences',
        '- strengths: 2-4 short bullets',
        '- mistakes: up to 10 distinct { said, corrected, type } where type is one of gender|case|word-order|vocab|verb-form|other; quote the learner exactly',
        '- recommendedDrillTopics: 2-4 short grammar labels to practice next (e.g. "Akkusativ articles")',
      ].join('\n'),
    },
    { role: 'user', content: transcript || '(empty session)' },
  ]
  const parsed = await chatJSON(deps.config, messages, SessionFeedbackSchema, { maxTokens: 1200, temperature: 0.3 })
  return {
    overallScore: Math.round(parsed.overallScore),
    summary: parsed.summary,
    strengths: parsed.strengths,
    mistakes: parsed.mistakes.map((m) => ({
      said: m.said,
      corrected: m.corrected,
      type: normalizeCategory(m.type),
    })),
    recommendedDrillTopics: parsed.recommendedDrillTopics,
  }
}

// ---------------------------------------------------------------------------
// 3. generateDrillItems — new grammar drills, schema-validated + cached
// ---------------------------------------------------------------------------

const GEN_DRILL_TYPES = [
  'cloze',
  'choice',
  'transform',
  'wordorder',
  'translate_de_en',
  'translate_en_de',
] as const

const GeneratedDrillShapeSchema = z.object({
  type: z.enum(GEN_DRILL_TYPES),
  prompt: z.string().min(1),
  promptData: z.record(z.unknown()).nullish(),
  acceptedAnswers: z.array(z.string().min(1)).min(1).max(4),
})

const GenerateDrillsResponseSchema = z.object({ items: z.array(GeneratedDrillShapeSchema).min(1) })

export interface GeneratedDrillShape {
  type: (typeof GEN_DRILL_TYPES)[number]
  prompt: string
  promptData: Record<string, unknown> | null
  acceptedAnswers: string[]
}

/**
 * Deterministic clean-up of one generated drill so it matches the M2 drill
 * runner conventions. Returns null for unusable items (dropped).
 */
export function sanitizeDrill(shape: GeneratedDrillShape): GeneratedDrillShape | null {
  const prompt = shape.prompt.trim()
  let accepted = shape.acceptedAnswers.map((a) => a.trim()).filter((a) => a.length > 0)
  if (prompt.length === 0 || accepted.length === 0) return null
  const raw = shape.promptData ?? {}
  let promptData: Record<string, unknown> | null = null

  if (shape.type === 'cloze') {
    if (!prompt.includes('___')) return null
    const hint = typeof raw.hint === 'string' ? raw.hint.trim() : ''
    if (hint.length > 0) promptData = { hint }
  } else if (shape.type === 'choice') {
    const answer = accepted[0] ?? ''
    const options = Array.isArray(raw.options)
      ? raw.options
          .filter((o): o is string => typeof o === 'string' && o.trim().length > 0)
          .map((o) => o.trim())
      : []
    const unique = [...new Set([answer, ...options])]
    if (unique.length < 3) return null // unusable multiple choice
    promptData = { options: unique.slice(0, 4) }
    accepted = [answer]
  } else if (shape.type === 'wordorder') {
    const tokens = (accepted[0] ?? '').split(/\s+/).filter((t) => t.length > 0)
    if (tokens.length < 3) return null
    promptData = { tokens }
    accepted = [tokens.join(' ')]
  } else if (shape.type === 'transform') {
    const instruction =
      typeof raw.instruction === 'string' && raw.instruction.trim().length > 0
        ? raw.instruction.trim()
        : 'Transform the sentence following the grammar rule.'
    promptData = { instruction }
  }
  return { type: shape.type, prompt, promptData, acceptedAnswers: accepted.slice(0, 4) }
}

export interface GenerateDrillsInput {
  topic: { id: string; title: string; cefr: CefrLevel; focus: string; explanationMd: string }
  /** Topic-related German words the drills may prefer (vocabulary anchor). */
  words?: string[]
  n: number
  /** Bump to get a fresh batch (part of the cache key, e.g. current drill count). */
  variant?: number
}

/**
 * Generates up to n drill items for a grammar topic. The LLM is asked for
 * n+3 items (over-generation) so sanitizing can drop unusable ones. The raw
 * shapes are cached; every call re-materializes them with fresh ids.
 */
export async function generateDrillItems(deps: LlmServiceDeps, input: GenerateDrillsInput): Promise<DrillItem[]> {
  const n = Math.max(1, Math.min(10, Math.round(input.n)))
  const key = `drills:${input.topic.id}:${n}:${input.variant ?? 0}:${deps.config.model}`
  const cached = await withCache(deps, key, async (): Promise<{ items: GeneratedDrillShape[] }> => {
    const words = (input.words ?? []).slice(0, 15)
    const system = [
      'You are an author of German grammar exercises stored in a learning app.',
      `Topic: "${input.topic.title}" (CEFR ${input.topic.cefr}) — focus: ${input.topic.focus}.`,
      'Reference explanation (excerpt):',
      input.topic.explanationMd.slice(0, 800),
      words.length > 0 ? `Related vocabulary to prefer: ${words.join(', ')}.` : '',
      'Drill conventions (MUST follow exactly):',
      '- type "cloze": prompt contains "___" where the answer goes; acceptedAnswers = the missing part(s).',
      '- type "choice": exactly 4 distinct options in promptData.options; exactly one correct = acceptedAnswers[0]; options are short phrases.',
      '- type "transform": prompt = one German source sentence; promptData.instruction = short English task ("Change X to Y").',
      '- type "wordorder": acceptedAnswers[0] = one natural German sentence (4-8 words) about this topic.',
      '- type "translate_de_en": prompt = German sentence; acceptedAnswers = correct English translations.',
      '- type "translate_en_de": prompt = English sentence; acceptedAnswers = correct German translations (proper umlauts ä/ö/ü/ß).',
      'Mix the types. Correct German orthography. Level-appropriate vocabulary only.',
      'Return ONLY valid JSON: { "items": [ { "type": "...", "prompt": "...", "promptData": { ... } | null, "acceptedAnswers": ["..."] } ] }.',
    ]
      .filter((line) => line.length > 0)
      .join('\n')
    const parsed = await chatJSON(
      deps.config,
      [
        { role: 'system', content: system },
        { role: 'user', content: `Generate ${n + 3} drills now.` },
      ],
      GenerateDrillsResponseSchema,
      { maxTokens: 1800, temperature: 0.8 },
    )
    return {
      items: parsed.items.map((i) => ({
        type: i.type,
        prompt: i.prompt,
        promptData: i.promptData ?? null,
        acceptedAnswers: i.acceptedAnswers,
      })),
    }
  })
  const usable = cached.items
    .map(sanitizeDrill)
    .filter((s): s is GeneratedDrillShape => s !== null)
    .slice(0, n)
  return usable.map<DrillItem>((s) => ({
    id: newId(),
    updatedAt: Date.now(),
    ownerId: input.topic.id,
    type: s.type,
    prompt: s.prompt,
    promptData: s.promptData,
    acceptedAnswers: s.acceptedAnswers,
    cefr: input.topic.cefr,
    source: 'llm',
    validated: true,
  }))
}

// ---------------------------------------------------------------------------
// 4. explainGrammar — personalized English explanation (markdown)
// ---------------------------------------------------------------------------

const ExplainSchema = z.object({ markdown: z.string().min(1) })

export async function explainGrammar(
  deps: LlmServiceDeps,
  input: {
    topic: { id: string; title: string; cefr: CefrLevel; focus: string; explanationMd: string }
    /** Recent wrong answers from this topic, to tailor the explanation. */
    mistakesContext?: string[]
  },
): Promise<string> {
  const context = (input.mistakesContext ?? []).slice(0, 8)
  const key = `explain:${input.topic.id}:${deps.config.model}:${shortHash(context.join('|'))}`
  return withCache(deps, key, async () => {
    const parsed = await chatJSON(
      deps.config,
      [
        {
          role: 'system',
          content: [
            'You are an expert German grammar teacher explaining to an English speaker.',
            'Use ONLY this markdown subset: "## " headings, "- " bullets, **bold**. No other syntax.',
            'Write in English; all examples in German with English translations in parentheses.',
            'Structure: ## The rule (2-3 sentences) · ## Examples (2-3 bullets) · ## Watch out (the most common mistake) · ## Try it (one mini self-test question).',
            'Keep it under 220 words, warm and concrete.',
            'Return ONLY valid JSON: { "markdown": "..." }.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            `Topic: "${input.topic.title}" (CEFR ${input.topic.cefr}) — focus: ${input.topic.focus}.`,
            'Existing course explanation for reference:',
            input.topic.explanationMd.slice(0, 800),
            context.length > 0
              ? `The learner recently answered these exercises incorrectly — address the underlying mistakes:\n${context
                  .map((c) => `- "${c}"`)
                  .join('\n')}`
              : 'No recent mistakes known — explain the topic from scratch.',
          ].join('\n'),
        },
      ],
      ExplainSchema,
      { maxTokens: 900, temperature: 0.4 },
    )
    return parsed.markdown.trim()
  })
}

// ---------------------------------------------------------------------------
// 5. exampleSentences — level-tagged German example sentences for one word
// ---------------------------------------------------------------------------

const ExampleSentenceSchema = z.object({
  de: z.string().min(1),
  en: z.string().min(1),
  cefr: CEFR,
})
const ExampleSentencesSchema = z.object({ sentences: z.array(ExampleSentenceSchema).min(1) })

export interface ExampleSentence {
  de: string
  en: string
  cefr: CefrLevel
}

export async function exampleSentences(
  deps: LlmServiceDeps,
  input: { word: { german: string; english: string }; cefr: CefrLevel; n?: number },
): Promise<ExampleSentence[]> {
  const n = Math.max(1, Math.min(6, input.n ?? 3))
  const key = `examples:${input.word.german.trim().toLowerCase()}:${n}:${deps.config.model}`
  const cached = await withCache(deps, key, async (): Promise<{ sentences: ExampleSentence[] }> => {
    const parsed = await chatJSON(
      deps.config,
      [
        {
          role: 'system',
          content: [
            'You write natural, useful German example sentences for a vocabulary app.',
            "Each sentence uses the given word in a different everyday context, at or below the learner's level.",
            'Proper German orthography (ä ö ü ß). Return ONLY valid JSON: { "sentences": [ { "de": "...", "en": "...", "cefr": "A1"|"A2"|"B1"|"B2" } ] }.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: `Word: ${input.word.german} (${input.word.english}). Learner level: ${input.cefr}. Write ${n} sentences.`,
        },
      ],
      ExampleSentencesSchema,
      { maxTokens: 500, temperature: 0.7 },
    )
    return { sentences: parsed.sentences }
  })
  return cached.sentences.slice(0, n)
}

// ---------------------------------------------------------------------------
// mistakes → drills (pure, used by the end-of-session report)
// ---------------------------------------------------------------------------

export const MISTAKE_CATEGORY_LABEL: Record<MistakeCategory, string> = {
  gender: 'article gender',
  case: 'case',
  'word-order': 'word order',
  vocab: 'vocabulary',
  'verb-form': 'verb form',
  other: 'grammar',
}

/**
 * Converts conversation mistakes into transform drills (prompt = what the
 * learner said, answer = the correction). Deduped, capped at 10 items.
 */
export function mistakesToDrills(
  mistakes: readonly { said: string; corrected: string; type?: string }[],
  cefr: CefrLevel,
  ownerId: string,
): DrillItem[] {
  const seen = new Set<string>()
  const items: DrillItem[] = []
  for (const m of mistakes) {
    const said = m.said.trim()
    const corrected = m.corrected.trim()
    if (said.length === 0 || corrected.length === 0) continue
    if (said.toLowerCase() === corrected.toLowerCase()) continue
    if (seen.has(said.toLowerCase())) continue
    seen.add(said.toLowerCase())
    const category = normalizeCategory(m.type ?? 'other')
    items.push({
      id: newId(),
      updatedAt: Date.now(),
      ownerId,
      type: 'transform',
      prompt: said,
      promptData: {
        instruction: `Correct this sentence — watch the ${MISTAKE_CATEGORY_LABEL[category]}`,
      },
      acceptedAnswers: [corrected],
      cefr,
      source: 'llm',
      validated: true,
    })
    if (items.length >= 10) break
  }
  return items
}





