import { db } from '../dexie'
import type { DrillItem, VocabWord } from '../types'
import type {
  ConvCorrection,
  DrillMistake,
  TroubleWord,
} from '../../engine/mistakeBank'
import {
  collectConversationMistakes,
  collectDrillMistakes,
  collectTroubleWords,
} from '../../engine/mistakeBank'

export interface MistakeBank {
  drills: DrillMistake[]
  words: TroubleWord[]
  conversations: ConvCorrection[]
  /** M11.2 raw rows for practice sessions: all drill items + the whole word bank. */
  items: DrillItem[]
  bank: VocabWord[]
}

/**
 * M11.1: loads every mistake source and aggregates via the pure engine.
 * Reads only — nothing here mutates; clearing mistakes happens by learning
 * (a correct retry becomes the latest attempt, a good review still leaves
 * lapses — those words stay listed until redesigned on purpose).
 */
export async function loadMistakeBank(): Promise<MistakeBank> {
  const [attempts, items, topics, cards, words, turns, pieces] = await Promise.all([
    db.drillAttempts.toArray(),
    db.drillItems.toArray(),
    db.grammarTopics.toArray(),
    db.vocabCards.toArray(),
    db.vocabWords.toArray(),
    db.conversationTurns.toArray(),
    db.writingPieces.toArray(),
  ])
  // M11.9: graded free-writing pieces ride the conversation-corrections
  // pipeline as pseudo-turns — same { said, corrected, type } shape, so the
  // bank needs zero new rendering. The 'writing' sessionId is a display key
  // only; the bank never deep-links it to a conversation route.
  const pieceTurns = pieces.map((p) => ({
    id: p.id,
    sessionId: 'writing',
    updatedAt: p.updatedAt,
    mistakes: p.mistakes,
  }))
  return {
    drills: collectDrillMistakes(attempts, items, topics),
    words: collectTroubleWords(cards, words),
    conversations: collectConversationMistakes([...pieceTurns, ...turns], 20),
    items,
    bank: words,
  }
}
