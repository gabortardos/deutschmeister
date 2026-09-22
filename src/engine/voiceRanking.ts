/**
 * German TTS voice quality ranking (pure, browser-free — unit-testable).
 *
 * `speechSynthesis.getVoices()` returns German voices in arbitrary order; picking
 * "first de-DE" regularly lands on legacy SAPI/eSpeak voices that sound robotic.
 * We score each voice on signals that correlate with naturalness:
 *
 * - Locale: de-DE first, other German locales (de-AT/de-CH) close behind.
 * - Network voices (`localService === false`, e.g. Chrome's "Google Deutsch")
 *   are modern neural-ish engines → big bonus. Local is NOT punished (macOS/
 *   Windows 11 ship excellent on-device voices).
 * - Name keywords: google / natural / neural / premium / enhanced / siri → bonus.
 * - Known-robotic families (eSpeak/festival/pico, legacy SAPI "Hedda"/"Steffi")
 *   → heavy penalty so they sink below everything else.
 * - `default === true` (browser's own pick) → small bonus.
 */

export interface VoiceLike {
  name: string
  lang: string
  localService?: boolean
  default?: boolean
}

export type VoiceQuality = 'premium' | 'good' | 'basic'

const PREMIUM_LIMIT = 55
const GOOD_LIMIT = 25

const NAME_BONUS: ReadonlyArray<[keyword: string, points: number]> = [
  ['google', 20],
  ['natural', 22],
  ['neural', 22],
  ['premium', 15],
  ['enhanced', 15],
  ['siri', 12],
]

const ROBOTIC_NAMES = ['espeak', 'festival', 'pico', 'mbrola'] as const
const LEGACY_SAPI_NAMES = ['hedda', 'steffi'] as const

export function germanVoiceScore(v: VoiceLike): number {
  const lang = v.lang.toLowerCase()
  if (!lang.startsWith('de')) return Number.NEGATIVE_INFINITY // caller filters, but be safe

  let score = lang.startsWith('de-de') ? 30 : 18
  if (v.localService === false) score += 25 // network voice (Chrome)
  const name = v.name.toLowerCase()
  for (const [keyword, points] of NAME_BONUS) if (name.includes(keyword)) score += points
  if (v.default === true) score += 3
  if (ROBOTIC_NAMES.some((n) => name.includes(n))) score -= 40
  if (LEGACY_SAPI_NAMES.some((n) => name.includes(n))) score -= 25
  return score
}

/** Filter to German voices and sort best-first (stable for equal scores). */
export function rankGermanVoices<T extends VoiceLike>(voices: readonly T[]): T[] {
  return voices
    .filter((v) => v.lang.toLowerCase().startsWith('de'))
    .sort((a, b) => germanVoiceScore(b) - germanVoiceScore(a))
}

/** Coarse label for the Settings picker badge. */
export function voiceQuality(v: VoiceLike): VoiceQuality {
  const score = germanVoiceScore(v)
  if (score >= PREMIUM_LIMIT) return 'premium'
  if (score >= GOOD_LIMIT) return 'good'
  return 'basic'
}
