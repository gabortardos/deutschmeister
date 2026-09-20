import type { CefrLevel } from '../../db/types'
import type { PlacementQuestion } from '../../engine/placement'

/**
 * Curated placement bank: 10 items per level, alternating vocabulary
 * recognition (marked germanWord → word becomes "known") and grammar cloze.
 * Every option list has exactly 4 distinct options including the answer.
 */
function q(
  id: string,
  kind: 'vocab' | 'grammar',
  cefr: CefrLevel,
  prompt: string,
  answer: string,
  distractors: readonly string[],
  germanWord: string | null = null,
): PlacementQuestion {
  return { id, kind, cefr, prompt, options: [answer, ...distractors], answer, germanWord }
}

export const PLACEMENT_BANK: readonly PlacementQuestion[] = [
  // ── A1 ──────────────────────────────────────────────────────────────
  q('p-a1-01', 'vocab', 'A1', 'das Haus', 'house', ['horse', 'hat', 'hood'], 'Haus'),
  q('p-a1-02', 'grammar', 'A1', 'Ich ___ aus Deutschland. (sein)', 'bin', ['ist', 'sind', 'bist']),
  q('p-a1-03', 'vocab', 'A1', 'der Apfel', 'apple', ['bread', 'butter', 'egg'], 'Apfel'),
  q('p-a1-04', 'grammar', 'A1', 'Du ___ sehr nett. (sein)', 'bist', ['bin', 'ist', 'sind']),
  q('p-a1-05', 'vocab', 'A1', 'das Wasser', 'water', ['wine', 'beer', 'milk'], 'Wasser'),
  q('p-a1-06', 'grammar', 'A1', 'Ich habe ___ Zeit.', 'keine', ['nicht', 'kein', 'niemand']),
  q('p-a1-07', 'vocab', 'A1', 'schnell', 'fast', ['slow', 'late', 'early'], 'schnell'),
  q('p-a1-08', 'grammar', 'A1', '___ wohnst du?', 'Wo', ['Wer', 'Wann', 'Warum']),
  q('p-a1-09', 'vocab', 'A1', 'heute', 'today', ['tomorrow', 'yesterday', 'now'], 'heute'),
  q('p-a1-10', 'grammar', 'A1', 'Ich ___ einen Apfel. (essen)', 'esse', ['isst', 'esst', 'essen']),
  // ── A2 ──────────────────────────────────────────────────────────────
  q('p-a2-01', 'vocab', 'A2', 'die Reise', 'trip', ['street', 'rice', 'rise'], 'Reise'),
  q('p-a2-02', 'grammar', 'A2', 'Ich ___ gestern ins Kino gegangen.', 'bin', ['habe', 'war', 'hatte']),
  q('p-a2-03', 'vocab', 'A2', 'der Termin', 'appointment', ['termination', 'term', 'deadline'], 'Termin'),
  q('p-a2-04', 'grammar', 'A2', 'Ich fahre ___ dem Bus zur Arbeit.', 'mit', ['von', 'zu', 'bei']),
  q('p-a2-05', 'vocab', 'A2', 'die Umwelt', 'environment', ['weather', 'world', 'universe'], 'Umwelt'),
  q('p-a2-06', 'grammar', 'A2', 'Ich bleibe zu Hause, ___ ich krank bin.', 'weil', ['denn', 'dass', 'aber']),
  q('p-a2-07', 'vocab', 'A2', 'die Wohnung', 'apartment', ['furniture', 'rent', 'neighborhood'], 'Wohnung'),
  q('p-a2-08', 'grammar', 'A2', 'Peter ist ___ als Anna. (groß)', 'größer', ['groß', 'am größten', 'mehr groß']),
  q('p-a2-09', 'vocab', 'A2', 'die Nachricht', 'message', ['narration', 'notification', 'nation'], 'Nachricht'),
  q('p-a2-10', 'grammar', 'A2', 'Das Buch liegt ___ dem Tisch.', 'auf', ['an', 'in', 'über']),
  // ── B1 ──────────────────────────────────────────────────────────────
  q('p-b1-01', 'grammar', 'B1', 'Ich denke, ___ er recht hat.', 'dass', ['ob', 'weil', 'denn']),
  q('p-b1-02', 'vocab', 'B1', 'die Verantwortung', 'responsibility', ['response', 'relationship', 'reliability'], 'Verantwortung'),
  q('p-b1-03', 'grammar', 'B1', 'Das Auto, ___ ich gekauft habe, ist schnell.', 'das', ['der', 'den', 'dem']),
  q('p-b1-04', 'vocab', 'B1', 'die Entwicklung', 'development', ['enlargement', 'establishment', 'entertainment'], 'Entwicklung'),
  q('p-b1-05', 'grammar', 'B1', 'Das Haus ___ 1900 gebaut.', 'wurde', ['hat', 'ist', 'wird']),
  q('p-b1-06', 'vocab', 'B1', 'die Gesellschaft', 'society', ['science', 'signature', 'session'], 'Gesellschaft'),
  q('p-b1-07', 'grammar', 'B1', 'Ich freue mich ___ das Wochenende.', 'auf', ['für', 'an', 'zu']),
  q('p-b1-08', 'vocab', 'B1', 'der Erfolg', 'success', ['supply', 'successor', 'surplus'], 'Erfolg'),
  q('p-b1-09', 'grammar', 'B1', 'Wegen ___ Wetters bleiben wir zu Hause.', 'des', ['dem', 'den', 'der']),
  q('p-b1-10', 'vocab', 'B1', 'die Erfahrung', 'experience', ['experiment', 'adventure', 'empire'], 'Erfahrung'),
]
