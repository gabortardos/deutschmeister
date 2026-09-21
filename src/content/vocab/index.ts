import type { CefrLevel, VocabWord } from '../../db/types'
import { A1_ROWS } from './a1'
import { A2_ROWS } from './a2'
import { B1_ROWS } from './b1'
import { B2_ROWS } from './b2'
import type { SeedRow } from './types'

/** Deterministic build stamp for seed rows (never changes per release). */
const SEED_TS = Date.UTC(2026, 8, 20, 12, 0, 0)

function build(rows: readonly SeedRow[], cefr: CefrLevel, rankStart: number, prefix: string): VocabWord[] {
  return rows.map((row, i) => ({
    id: `${prefix}-${String(i + 1).padStart(4, '0')}`,
    updatedAt: SEED_TS,
    german: row[1],
    article: row[0],
    plural: row[2],
    english: row[3],
    cefr,
    theme: row[4],
    exampleSentenceDe: row[5],
    exampleSentenceEn: row[6],
    custom: false,
    frequencyRank: rankStart + i,
  }))
}

const a1 = build(A1_ROWS, 'A1', 1, 'w-a1')
const a2 = build(A2_ROWS, 'A2', a1.length + 1, 'w-a2')
const b1 = build(B1_ROWS, 'B1', a1.length + a2.length + 1, 'w-b1')
const b2 = build(B2_ROWS, 'B2', a1.length + a2.length + b1.length + 1, 'w-b2')

/** Full seed corpus (A1–B2), ordered by frequencyRank. */
export const SEED_VOCAB: readonly VocabWord[] = [...a1, ...a2, ...b1, ...b2]

export const SEED_VOCAB_COUNTS: Readonly<Record<CefrLevel, number>> = {
  A1: a1.length,
  A2: a2.length,
  B1: b1.length,
  B2: b2.length,
  C1: 0,
  C2: 0,
}
