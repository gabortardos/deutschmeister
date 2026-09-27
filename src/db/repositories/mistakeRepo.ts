import { db } from '../dexie'
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
}

/**
 * M11.1: loads every mistake source and aggregates via the pure engine.
 * Reads only — nothing here mutates; clearing mistakes happens by learning
 * (a correct retry updates drillAttempts, a correct review drops lapses? No:
 * lapses never decrease — trouble words clear only by design choice later).
 */
export async function loadMistakeBank(): Promise<MistakeBank> {
  const [attempts, items, topics, cards, words, turns] = await Promise.all([
    db.drillAttempts.toArray(),
    db.drillItems.toArray(),
    db.grammarTopics.toArray(),
    db.vocabCards.toArray(),
    db.vocabWords.toArray(),
    db.conversationTurns.toArray(),
  ])
  return {
    drills: collectDrillMistakes(attempts, items, topics),
    words: collectTroubleWords(cards, words),
    conversations: collectConversationMistakes(turns, 20),
  }
}
