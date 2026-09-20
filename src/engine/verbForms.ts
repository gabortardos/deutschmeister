/**
 * German verb conjugation (Präsens · Präteritum · Perfekt) for the corpus verbs.
 * Pure TS — no React, no DB (repo convention for src/engine).
 *
 * Strategy: regular weak verbs are derived by rule (with German orthography
 * rules: -est/-et after t/d and consonant+mn clusters, du-form -t after
 * s/ß/z/x, -eln elision for the ich-form, no ge- for inseparable prefixes and
 * -ieren verbs, ge-infix for separable verbs). Strong, mixed and auxiliary
 * verbs live in the curated IRREGULAR_VERBS table below, which covers every
 * irregular verb of the seed corpus (verified by __tests__/verbForms.test.ts).
 */

export interface VerbForms {
  infinitive: string
  /** Present tense in person order: ich, du, er/sie/es, wir, ihr, Sie/sie. */
  praesens: readonly [string, string, string, string, string, string]
  /** Präteritum ich/er form (identical for these persons in every corpus verb). */
  praeteritum: string
  /** Perfekt with er/sie/es subject, e.g. "hat gemacht" / "ist gegangen". */
  perfekt: string
  /** True when du/er present or the past forms come from the curated table. */
  irregular: boolean
}

/** Modals whose corpus translation does not start with "to …". */
const MODAL_EXTRA: ReadonlySet<string> = new Set(['können', 'müssen', 'sollen'])

/** True for verbs (used to decide whether a forms table is shown). */
export function isVerbWord(word: {
  article: string | null
  german: string
  english: string
}): boolean {
  return word.article === null && (MODAL_EXTRA.has(word.german) || /^to\b/i.test(word.english))
}

interface IrregularEntry {
  /** ich-form; default: regular stem + e. */
  ich?: string
  du: string
  er: string
  /** wir-form; default: infinitive. */
  wir?: string
  /** ihr-form; default: stem + t/et. */
  ihr?: string
  /** Sie/sie-form; default: infinitive. */
  sie?: string
  praeteritum: string
  partizip: string
  /** Perfekt with sein (movement/change of state); default haben. */
  ist?: boolean
}

/** Curated forms for every strong/mixed/auxiliary verb (incl. separable bases). */
export const IRREGULAR_VERBS: Readonly<Record<string, IrregularEntry>> = {
  // auxiliaries & modals
  sein: { ich: 'bin', du: 'bist', er: 'ist', wir: 'sind', ihr: 'seid', sie: 'sind', praeteritum: 'war', partizip: 'gewesen', ist: true },
  haben: { du: 'hast', er: 'hat', praeteritum: 'hatte', partizip: 'gehabt' },
  werden: { du: 'wirst', er: 'wird', praeteritum: 'wurde', partizip: 'geworden', ist: true },
  wissen: { ich: 'weiß', du: 'weißt', er: 'weiß', praeteritum: 'wusste', partizip: 'gewusst' },
  können: { ich: 'kann', du: 'kannst', er: 'kann', praeteritum: 'konnte', partizip: 'gekonnt' },
  müssen: { ich: 'muss', du: 'musst', er: 'muss', praeteritum: 'musste', partizip: 'gemusst' },
  sollen: { ich: 'soll', du: 'sollst', er: 'soll', praeteritum: 'sollte', partizip: 'gesollt' },
  wollen: { ich: 'will', du: 'willst', er: 'will', praeteritum: 'wollte', partizip: 'gewollt' },
  // A1 strong verbs
  geben: { du: 'gibst', er: 'gibt', praeteritum: 'gab', partizip: 'gegeben' },
  kommen: { du: 'kommst', er: 'kommt', praeteritum: 'kam', partizip: 'gekommen', ist: true },
  gehen: { du: 'gehst', er: 'geht', praeteritum: 'ging', partizip: 'gegangen', ist: true },
  sehen: { du: 'siehst', er: 'sieht', praeteritum: 'sah', partizip: 'gesehen' },
  essen: { du: 'isst', er: 'isst', praeteritum: 'aß', partizip: 'gegessen' },
  trinken: { du: 'trinkst', er: 'trinkt', praeteritum: 'trank', partizip: 'getrunken' },
  schlafen: { du: 'schläfst', er: 'schläft', praeteritum: 'schlief', partizip: 'geschlafen' },
  sprechen: { du: 'sprichst', er: 'spricht', praeteritum: 'sprach', partizip: 'gesprochen' },
  lesen: { du: 'liest', er: 'liest', praeteritum: 'las', partizip: 'gelesen' },
  schreiben: { du: 'schreibst', er: 'schreibt', praeteritum: 'schrieb', partizip: 'geschrieben' },
  fahren: { du: 'fährst', er: 'fährt', praeteritum: 'fuhr', partizip: 'gefahren', ist: true },
  nehmen: { du: 'nimmst', er: 'nimmt', praeteritum: 'nahm', partizip: 'genommen' },
  denken: { du: 'denkst', er: 'denkt', praeteritum: 'dachte', partizip: 'gedacht' },
  bringen: { du: 'bringst', er: 'bringt', praeteritum: 'brachte', partizip: 'gebracht' },
  finden: { du: 'findest', er: 'findet', praeteritum: 'fand', partizip: 'gefunden' },
  sitzen: { du: 'sitzt', er: 'sitzt', praeteritum: 'saß', partizip: 'gesessen' },
  stehen: { du: 'stehst', er: 'steht', praeteritum: 'stand', partizip: 'gestanden' },
  laufen: { du: 'läufst', er: 'läuft', praeteritum: 'lief', partizip: 'gelaufen', ist: true },
  tragen: { du: 'trägst', er: 'trägt', praeteritum: 'trug', partizip: 'getragen' },
  schneiden: { du: 'schneidest', er: 'schneidet', praeteritum: 'schnitt', partizip: 'geschnitten' },
  backen: { du: 'backst', er: 'backt', praeteritum: 'buk', partizip: 'gebacken' },
  schwimmen: { du: 'schwimmst', er: 'schwimmt', praeteritum: 'schwamm', partizip: 'geschwommen', ist: true },
  rufen: { du: 'rufst', er: 'ruft', praeteritum: 'rief', partizip: 'gerufen' },
  ziehen: { du: 'ziehst', er: 'zieht', praeteritum: 'zog', partizip: 'gezogen' },
  schieben: { du: 'schiebst', er: 'schiebt', praeteritum: 'schob', partizip: 'geschoben' },
  werfen: { du: 'wirfst', er: 'wirft', praeteritum: 'warf', partizip: 'geworfen' },
  fangen: { du: 'fängst', er: 'fängt', praeteritum: 'fing', partizip: 'gefangen' },
  bleiben: { du: 'bleibst', er: 'bleibt', praeteritum: 'blieb', partizip: 'geblieben', ist: true },
  helfen: { du: 'hilfst', er: 'hilft', praeteritum: 'half', partizip: 'geholfen' },
  heißen: { du: 'heißt', er: 'heißt', praeteritum: 'hieß', partizip: 'geheißen' },
  waschen: { du: 'wäschst', er: 'wäscht', praeteritum: 'wusch', partizip: 'gewaschen' },
  treffen: { du: 'triffst', er: 'trifft', praeteritum: 'traf', partizip: 'getroffen' },
  reiten: { du: 'reitest', er: 'reitet', praeteritum: 'ritt', partizip: 'geritten', ist: true },
  folgen: { du: 'folgst', er: 'folgt', praeteritum: 'folgte', partizip: 'gefolgt', ist: true },
  springen: { du: 'springst', er: 'springt', praeteritum: 'sprang', partizip: 'gesprungen', ist: true },
  // A2/B1 strong & mixed verbs
  gefallen: { du: 'gefällst', er: 'gefällt', praeteritum: 'gefiel', partizip: 'gefallen' },
  laden: { du: 'lädst', er: 'lädt', praeteritum: 'lud', partizip: 'geladen' },
  schließen: { du: 'schließt', er: 'schließt', praeteritum: 'schloss', partizip: 'geschlossen' },
  verstehen: { du: 'verstehst', er: 'versteht', praeteritum: 'verstand', partizip: 'verstanden' },
  vergessen: { du: 'vergisst', er: 'vergisst', praeteritum: 'vergaß', partizip: 'vergessen' },
  verlieren: { du: 'verlierst', er: 'verliert', praeteritum: 'verlor', partizip: 'verloren' },
  gewinnen: { du: 'gewinnst', er: 'gewinnt', praeteritum: 'gewann', partizip: 'gewonnen' },
  verbinden: { du: 'verbindest', er: 'verbindet', praeteritum: 'verband', partizip: 'verbunden' },
  unterscheiden: { du: 'unterscheidest', er: 'unterscheidet', praeteritum: 'unterschied', partizip: 'unterschieden' },
  unterbrechen: { du: 'unterbrichst', er: 'unterbricht', praeteritum: 'unterbrach', partizip: 'unterbrochen' },
  entscheiden: { du: 'entscheidest', er: 'entscheidet', praeteritum: 'entschied', partizip: 'entschieden' },
  verbieten: { du: 'verbietest', er: 'verbietet', praeteritum: 'verbot', partizip: 'verboten' },
  empfehlen: { du: 'empfiehlst', er: 'empfiehlt', praeteritum: 'empfahl', partizip: 'empfohlen' },
  gelten: { du: 'giltst', er: 'gilt', praeteritum: 'galt', partizip: 'gegolten' },
  betreffen: { du: 'betriffst', er: 'betrifft', praeteritum: 'betraf', partizip: 'betroffen' },
  entlassen: { du: 'entlässt', er: 'entlässt', praeteritum: 'entließ', partizip: 'entlassen' },
  widersprechen: { du: 'widersprichst', er: 'widerspricht', praeteritum: 'widersprach', partizip: 'widersprochen' },
  bewerben: { du: 'bewirbst', er: 'bewirbt', praeteritum: 'bewarb', partizip: 'beworben' },
  verzeihen: { du: 'verzeihst', er: 'verzeiht', praeteritum: 'verzieh', partizip: 'verziehen' },
  // bases that only occur inside separable corpus verbs
  steigen: { du: 'steigst', er: 'steigt', praeteritum: 'stieg', partizip: 'gestiegen', ist: true },
  fallen: { du: 'fällst', er: 'fällt', praeteritum: 'fiel', partizip: 'gefallen' },
  heben: { du: 'hebst', er: 'hebt', praeteritum: 'hob', partizip: 'gehoben' },
  bieten: { du: 'bietest', er: 'bietet', praeteritum: 'bot', partizip: 'geboten' },
  schlagen: { du: 'schlägst', er: 'schlägt', praeteritum: 'schlug', partizip: 'geschlagen' },
  // "abhängen von" is strong even though "aufhängen" is weak — full override
  abhängen: {
    ich: 'hänge ab',
    du: 'hängst ab',
    er: 'hängt ab',
    wir: 'hängen ab',
    ihr: 'hängt ab',
    sie: 'hängen ab',
    praeteritum: 'hing ab',
    partizip: 'abgehangen',
  },
}

/** Corpus separable verbs (explicit map — no prefix guessing, no false positives). */
export const SEPARABLE_VERBS: Readonly<
  Record<string, { prefix: string; base: string; geFront?: boolean }>
> = {
  aufstehen: { prefix: 'auf', base: 'stehen' },
  anrufen: { prefix: 'an', base: 'rufen' },
  anfangen: { prefix: 'an', base: 'fangen' },
  anziehen: { prefix: 'an', base: 'ziehen' },
  anbieten: { prefix: 'an', base: 'bieten' },
  fernsehen: { prefix: 'fern', base: 'sehen' },
  einschlafen: { prefix: 'ein', base: 'schlafen' },
  mitnehmen: { prefix: 'mit', base: 'nehmen' },
  umsteigen: { prefix: 'um', base: 'steigen' },
  einsteigen: { prefix: 'ein', base: 'steigen' },
  aussteigen: { prefix: 'aus', base: 'steigen' },
  mitkommen: { prefix: 'mit', base: 'kommen' },
  umziehen: { prefix: 'um', base: 'ziehen' },
  einladen: { prefix: 'ein', base: 'laden' },
  ausgehen: { prefix: 'aus', base: 'gehen' },
  zurückkommen: { prefix: 'zurück', base: 'kommen' },
  zurückgeben: { prefix: 'zurück', base: 'geben' },
  abgeben: { prefix: 'ab', base: 'geben' },
  ausgeben: { prefix: 'aus', base: 'geben' },
  auffallen: { prefix: 'auf', base: 'fallen' },
  aufheben: { prefix: 'auf', base: 'heben' },
  wegwerfen: { prefix: 'weg', base: 'werfen' },
  abwaschen: { prefix: 'ab', base: 'waschen' },
  teilnehmen: { prefix: 'teil', base: 'nehmen' },
  nachdenken: { prefix: 'nach', base: 'denken' },
  vorhaben: { prefix: 'vor', base: 'haben' },
  vorschlagen: { prefix: 'vor', base: 'schlagen' },
  mitbringen: { prefix: 'mit', base: 'bringen' },
  abschließen: { prefix: 'ab', base: 'schließen' },
  zunehmen: { prefix: 'zu', base: 'nehmen' },
  abnehmen: { prefix: 'ab', base: 'nehmen' },
  aussehen: { prefix: 'aus', base: 'sehen' },
  kaputtgehen: { prefix: 'kaputt', base: 'gehen' },
  aufmachen: { prefix: 'auf', base: 'machen' },
  zumachen: { prefix: 'zu', base: 'machen' },
  einkaufen: { prefix: 'ein', base: 'kaufen' },
  aufräumen: { prefix: 'auf', base: 'räumen' },
  ausfüllen: { prefix: 'aus', base: 'füllen' },
  abholen: { prefix: 'ab', base: 'holen' },
  aufwachen: { prefix: 'auf', base: 'wachen' },
  aufhören: { prefix: 'auf', base: 'hören' },
  umtauschen: { prefix: 'um', base: 'tauschen' },
  ausruhen: { prefix: 'aus', base: 'ruhen' },
  aufpassen: { prefix: 'auf', base: 'passen' },
  ablehnen: { prefix: 'ab', base: 'lehnen' },
  ausdrücken: { prefix: 'aus', base: 'drücken' },
  vorbereiten: { prefix: 'vor', base: 'bereiten' },
  vorstellen: { prefix: 'vor', base: 'stellen' },
  einstellen: { prefix: 'ein', base: 'stellen' },
  austauschen: { prefix: 'aus', base: 'tauschen' },
  aufhängen: { prefix: 'auf', base: 'hängen' }, // weak: hängte auf, aufgehängt
  abtrocknen: { prefix: 'ab', base: 'trocknen' },
  staubsaugen: { prefix: 'staub', base: 'saugen', geFront: true }, // ge·staub·saugt
  zusammenarbeiten: { prefix: 'zusammen', base: 'arbeiten' },
  zusammenfassen: { prefix: 'zusammen', base: 'fassen' },
  fortsetzen: { prefix: 'fort', base: 'setzen' },
  übereinstimmen: { prefix: 'überein', base: 'stimmen' },
  umsetzen: { prefix: 'um', base: 'setzen' },
}

/** Verbs that form the Perfekt with sein (movement / change of state). */
export const SEIN_VERBS: ReadonlySet<string> = new Set([
  'sein',
  'werden',
  'gehen',
  'kommen',
  'mitkommen',
  'zurückkommen',
  'fahren',
  'laufen',
  'reiten',
  'schwimmen',
  'springen',
  'folgen',
  'steigen',
  'passieren',
  'bleiben',
  'umziehen',
  'umsteigen',
  'einsteigen',
  'aussteigen',
  'ausgehen',
  'aufstehen',
  'aufwachen',
  'einschlafen',
  'kaputtgehen',
  'auffallen',
])

/** Inseparable prefixes (no ge- in the Partizip II). */
const INSEPARABLE_PREFIXES: readonly string[] = [
  'be',
  'ge',
  'er',
  'ver',
  'zer',
  'ent',
  'emp',
  'miss',
  'unter',
  'hinter',
  'wieder',
]

/** Stems needing -e- before -st/-t/-te endings (arbeiten, öffnen, zeichnen …). */
const CLUSTER_END = /(?:t|d)$/
/** Stems where the du-form merges to stem + t (reisen → du reist). */
const SIBYLANT_END = /(?:s|ß|z|x)$/

/**
 * True when the stem needs a linking -e- before -st/-t: after -t/-d and after
 * an obstruent + m/n cluster (atmen, öffnen, regnen, zeichnen). NOT after
 * l/r (lernst, filmst), doubled nasals (kennst, könnt) or vowel+h (ahnst, lehnst).
 */
function needsLinkingE(stem: string): boolean {
  if (CLUSTER_END.test(stem)) return true
  const cluster = /([^aeiouäöüy])([mn])$/.exec(stem)
  if (!cluster) return false
  const before = cluster[1]
  if (['l', 'r', 'm', 'n'].includes(before)) return false
  if (before === 'h') return !/[aeiouäöüy]$/.test(stem.slice(0, -2)) // zeichnen ✓, lehnen ✗
  return true
}

function stemOf(infinitive: string): string {
  if (infinitive.endsWith('en')) return infinitive.slice(0, -2)
  if (infinitive.endsWith('n')) return infinitive.slice(0, -1)
  return infinitive
}

function weakIch(infinitive: string, stem: string): string {
  return infinitive.endsWith('eln') ? `${infinitive.slice(0, -3)}le` : `${stem}e`
}

interface VerbParts {
  praesens: readonly [string, string, string, string, string, string]
  praeteritum: string
  partizip: string
  irregular: boolean
}

function irregularParts(infinitive: string, entry: IrregularEntry): VerbParts {
  const stem = stemOf(infinitive)
  return {
    praesens: [
      entry.ich ?? weakIch(infinitive, stem),
      entry.du,
      entry.er,
      entry.wir ?? infinitive,
      entry.ihr ?? (needsLinkingE(stem) ? `${stem}et` : `${stem}t`),
      entry.sie ?? infinitive,
    ],
    praeteritum: entry.praeteritum,
    partizip: entry.partizip,
    irregular: true,
  }
}

function separableParts(prefix: string, base: string, geFront = false): VerbParts {
  const baseParts = verbParts(base)
  const partizip = geFront
    ? `ge${prefix}${baseParts.partizip.replace(/^ge/, '')}` // staubsaugen → gestaubsaugt
    : baseParts.partizip.startsWith('ge')
      ? `${prefix}ge${baseParts.partizip.slice(2)}`
      : `${prefix}${baseParts.partizip}` // bases without ge- (vorbereiten → vorbereitet)
  const [i, d, e, w, ih, s] = baseParts.praesens
  return {
    praesens: [
      `${i} ${prefix}`,
      `${d} ${prefix}`,
      `${e} ${prefix}`,
      `${w} ${prefix}`,
      `${ih} ${prefix}`,
      `${s} ${prefix}`,
    ],
    praeteritum: `${baseParts.praeteritum} ${prefix}`,
    partizip,
    irregular: baseParts.irregular,
  }
}

function weakParts(infinitive: string): VerbParts {
  const stem = stemOf(infinitive)
  const cluster = needsLinkingE(stem)
  const noGe =
    INSEPARABLE_PREFIXES.some((p) => infinitive.startsWith(p)) || infinitive.endsWith('ieren')
  return {
    praesens: [
      weakIch(infinitive, stem),
      cluster ? `${stem}est` : SIBYLANT_END.test(stem) ? `${stem}t` : `${stem}st`,
      cluster ? `${stem}et` : `${stem}t`,
      infinitive,
      cluster ? `${stem}et` : `${stem}t`,
      infinitive,
    ],
    praeteritum: `${stem}${cluster ? 'ete' : 'te'}`,
    partizip: `${noGe ? '' : 'ge'}${stem}${cluster ? 'et' : 't'}`,
    irregular: false,
  }
}

function verbParts(infinitive: string): VerbParts {
  const irregular = IRREGULAR_VERBS[infinitive]
  if (irregular) return irregularParts(infinitive, irregular)
  const separable = SEPARABLE_VERBS[infinitive]
  if (separable)
    return separableParts(separable.prefix, separable.base, separable.geFront ?? false)
  return weakParts(infinitive)
}

/** Full conjugation for a corpus infinitive (reflexive "sich …" is stripped). */
export function conjugateVerb(rawInfinitive: string): VerbForms {
  const infinitive = rawInfinitive.replace(/^sich\s+/, '')
  const parts = verbParts(infinitive)
  const aux = SEIN_VERBS.has(infinitive) ? 'ist' : 'hat'
  return {
    infinitive: rawInfinitive,
    praesens: parts.praesens,
    praeteritum: parts.praeteritum,
    perfekt: `${aux} ${parts.partizip}`,
    irregular: parts.irregular,
  }
}
