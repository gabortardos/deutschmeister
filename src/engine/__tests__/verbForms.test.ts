import { describe, expect, it } from 'vitest'
import { SEED_VOCAB } from '../../content/vocab'
import {
  IRREGULAR_VERBS,
  SEIN_VERBS,
  SEPARABLE_VERBS,
  conjugateVerb,
  isVerbWord,
} from '../verbForms'

const corpusVerbs = SEED_VOCAB.filter((w) => isVerbWord(w)).map((w) => w.german)

describe('isVerbWord', () => {
  it('detects the corpus modals without a to-translation', () => {
    for (const m of ['können', 'müssen', 'sollen']) {
      const word = SEED_VOCAB.find((w) => w.german === m)
      expect(word, m).toBeTruthy()
      expect(isVerbWord(word!), m).toBe(true)
    }
  })

  it('rejects nouns and plain adjectives/adverbs', () => {
    expect(isVerbWord({ article: 'die', german: 'Übung', english: 'exercise' })).toBe(false)
    expect(isVerbWord({ article: null, german: 'gut', english: 'good' })).toBe(false)
    expect(isVerbWord({ article: null, german: 'jetzt', english: 'now' })).toBe(false)
  })

  it('finds a substantial verb share of the corpus', () => {
    expect(corpusVerbs.length).toBeGreaterThanOrEqual(250)
  })
})

describe('conjugateVerb — corpus coverage', () => {
  it('produces complete forms for every corpus verb', () => {
    expect(corpusVerbs.length).toBeGreaterThan(0)
    for (const infinitive of corpusVerbs) {
      const f = conjugateVerb(infinitive)
      for (const [i, form] of f.praesens.entries()) {
        expect(form, `${infinitive} präsens #${i}`).toMatch(/^[a-zäöüß][^!;]*$/)
        expect(form.length, `${infinitive} präsens #${i}`).toBeGreaterThan(1)
      }
      expect(f.praeteritum, `${infinitive} präteritum`).toMatch(/^[a-zäöüß]/)
      expect(f.perfekt, `${infinitive} perfekt`).toMatch(/^(hat|ist) \S+.*$/)
    }
  })

  it('keeps every curated entry anchored in the corpus (or a known base)', () => {
    const bases = new Set(Object.values(SEPARABLE_VERBS).map((s) => s.base))
    for (const key of Object.keys(IRREGULAR_VERBS)) {
      expect(corpusVerbs.includes(key) || bases.has(key), key).toBe(true)
    }
    // weak bases are not corpus words themselves — guard against typos instead
    const weakBases = new Set([
      'machen', 'kaufen', 'räumen', 'füllen', 'holen', 'wachen', 'hören', 'tauschen',
      'ruhen', 'passen', 'lehnen', 'drücken', 'bereiten', 'stellen', 'hängen',
      'trocknen', 'saugen', 'arbeiten', 'fassen', 'setzen', 'stimmen',
    ])
    for (const [verb, { base }] of Object.entries(SEPARABLE_VERBS)) {
      expect(corpusVerbs.includes(verb), verb).toBe(true)
      expect(
        corpusVerbs.includes(base) ||
          Object.keys(IRREGULAR_VERBS).includes(base) ||
          weakBases.has(base),
        `${verb} → ${base}`,
      ).toBe(true)
    }
  })
  it('marks Perfekt with sein only for the curated movement verbs', () => {
    for (const infinitive of corpusVerbs) {
      const aux = conjugateVerb(infinitive).perfekt.split(' ')[0]
      expect(aux === 'ist', infinitive).toBe(SEIN_VERBS.has(infinitive.replace(/^sich\s+/, '')))
    }
  })
})

describe('conjugateVerb — regular weak rules', () => {
  it('conjugates machen fully', () => {
    const f = conjugateVerb('machen')
    expect(f.praesens).toEqual(['mache', 'machst', 'macht', 'machen', 'macht', 'machen'])
    expect(f.praeteritum).toBe('machte')
    expect(f.perfekt).toBe('hat gemacht')
    expect(f.irregular).toBe(false)
  })

  it('inserts -e- after t/d and consonant clusters', () => {
    const arbeiten = conjugateVerb('arbeiten')
    expect(arbeiten.praesens[1]).toBe('arbeitest')
    expect(arbeiten.praeteritum).toBe('arbeitete')
    expect(arbeiten.perfekt).toBe('hat gearbeitet')
    const öffnen = conjugateVerb('öffnen')
    expect(öffnen.praesens[1]).toBe('öffnest')
    expect(öffnen.perfekt).toBe('hat geöffnet')
    const zeichnen = conjugateVerb('zeichnen')
    expect(zeichnen.praesens[2]).toBe('zeichnet')
    expect(zeichnen.perfekt).toBe('hat gezeichnet')
  })

  it('merges the du-form after s/ß/z and elides -eln in the ich-form', () => {
    expect(conjugateVerb('reisen').praesens[1]).toBe('reist')
    expect(conjugateVerb('reisen').praesens[4]).toBe('reist')
    expect(conjugateVerb('klingeln').praesens[0]).toBe('klingle')
    expect(conjugateVerb('sammeln').praesens[0]).toBe('sammle')
  })

  it('omits ge- for inseparable prefixes and -ieren verbs', () => {
    expect(conjugateVerb('besuchen').perfekt).toBe('hat besucht')
    expect(conjugateVerb('verkaufen').perfekt).toBe('hat verkauft')
    expect(conjugateVerb('erzählen').perfekt).toBe('hat erzählt')
    expect(conjugateVerb('studieren').perfekt).toBe('hat studiert')
    expect(conjugateVerb('funktionieren').perfekt).toBe('hat funktioniert')
    expect(conjugateVerb('wiederholen').perfekt).toBe('hat wiederholt')
    expect(conjugateVerb('unterstützen').perfekt).toBe('hat unterstützt')
  })
})

describe('conjugateVerb — separable verbs', () => {
  it('composes einkaufen (weak base, ge-infix)', () => {
    const f = conjugateVerb('einkaufen')
    expect(f.praesens[0]).toBe('kaufe ein')
    expect(f.praesens[2]).toBe('kauft ein')
    expect(f.praeteritum).toBe('kaufte ein')
    expect(f.perfekt).toBe('hat eingekauft')
  })

  it('composes aufstehen (strong base, sein)', () => {
    const f = conjugateVerb('aufstehen')
    expect(f.praesens[0]).toBe('stehe auf')
    expect(f.praesens[2]).toBe('steht auf')
    expect(f.praeteritum).toBe('stand auf')
    expect(f.perfekt).toBe('ist aufgestanden')
    expect(f.irregular).toBe(true)
  })
})

describe('conjugateVerb — tricky separables & irregulars', () => {
  it('composes tricky separable verbs', () => {
    expect(conjugateVerb('vorbereiten').perfekt).toBe('hat vorbereitet')
    expect(conjugateVerb('fernsehen').perfekt).toBe('hat ferngesehen')
    expect(conjugateVerb('fernsehen').praesens[2]).toBe('sieht fern')
    expect(conjugateVerb('teilnehmen').praeteritum).toBe('nahm teil')
    expect(conjugateVerb('vorhaben').perfekt).toBe('hat vorgehabt')
    expect(conjugateVerb('einladen').praesens[2]).toBe('lädt ein')
    expect(conjugateVerb('einladen').perfekt).toBe('hat eingeladen')
    expect(conjugateVerb('staubsaugen').perfekt).toBe('hat gestaubsaugt')
    expect(conjugateVerb('übereinstimmen').perfekt).toBe('hat übereingestimmt')
    expect(conjugateVerb('kaputtgehen').perfekt).toBe('ist kaputtgegangen')
  })

  it('keeps weak hängen vs strong abhängen apart', () => {
    expect(conjugateVerb('aufhängen').praeteritum).toBe('hängte auf')
    expect(conjugateVerb('aufhängen').perfekt).toBe('hat aufgehängt')
    expect(conjugateVerb('abhängen').praeteritum).toBe('hing ab')
    expect(conjugateVerb('abhängen').perfekt).toBe('hat abgehangen')
  })

  it('conjugates sein, haben, werden and the modals', () => {
    expect(conjugateVerb('sein').praesens).toEqual(['bin', 'bist', 'ist', 'sind', 'seid', 'sind'])
    expect(conjugateVerb('sein').perfekt).toBe('ist gewesen')
    expect(conjugateVerb('haben').praesens[2]).toBe('hat')
    expect(conjugateVerb('haben').praeteritum).toBe('hatte')
    expect(conjugateVerb('werden').praesens[2]).toBe('wird')
    expect(conjugateVerb('werden').perfekt).toBe('ist geworden')
    expect(conjugateVerb('wissen').praesens[0]).toBe('weiß')
    expect(conjugateVerb('können').praesens.slice(0, 3)).toEqual(['kann', 'kannst', 'kann'])
    expect(conjugateVerb('können').praesens[4]).toBe('könnt')
    expect(conjugateVerb('müssen').praeteritum).toBe('musste')
  })

  it('applies present vowel changes and strong past forms', () => {
    expect(conjugateVerb('essen').praesens.slice(0, 3)).toEqual(['esse', 'isst', 'isst'])
    expect(conjugateVerb('essen').praeteritum).toBe('aß')
    expect(conjugateVerb('fahren').praesens[2]).toBe('fährt')
    expect(conjugateVerb('fahren').perfekt).toBe('ist gefahren')
    expect(conjugateVerb('sehen').praesens[0]).toBe('sehe')
    expect(conjugateVerb('lesen').praesens[1]).toBe('liest')
    expect(conjugateVerb('nehmen').praesens[2]).toBe('nimmt')
    expect(conjugateVerb('sitzen').praeteritum).toBe('saß')
    expect(conjugateVerb('finden').praeteritum).toBe('fand')
    expect(conjugateVerb('entlassen').praeteritum).toBe('entließ')
    expect(conjugateVerb('empfehlen').praesens[2]).toBe('empfiehlt')
    expect(conjugateVerb('gefallen').perfekt).toBe('hat gefallen')
  })

  it('uses sein for movement verbs and haben for the rest', () => {
    expect(conjugateVerb('gehen').perfekt).toBe('ist gegangen')
    expect(conjugateVerb('umziehen').perfekt).toBe('ist umgezogen')
    expect(conjugateVerb('folgen').perfekt).toBe('ist gefolgt')
    expect(conjugateVerb('passieren').perfekt).toBe('ist passiert')
    expect(conjugateVerb('bleiben').perfekt).toBe('ist geblieben')
    expect(conjugateVerb('ziehen').perfekt).toBe('hat gezogen') // "to pull"
    expect(conjugateVerb('schaffen').perfekt).toBe('hat geschafft') // "to manage"
  })

  it('strips the reflexive pronoun of sich beeilen', () => {
    const f = conjugateVerb('sich beeilen')
    expect(f.praesens[0]).toBe('beeile')
    expect(f.praeteritum).toBe('beeilte')
    expect(f.perfekt).toBe('hat beeilt')
  })
})
