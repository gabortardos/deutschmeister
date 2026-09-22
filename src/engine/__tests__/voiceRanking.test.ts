import { describe, expect, it } from 'vitest'
import { germanVoiceScore, rankGermanVoices, voiceQuality, type VoiceLike } from '../voiceRanking'

const voice = (name: string, lang: string, extra: Partial<VoiceLike> = {}): VoiceLike => ({
  name,
  lang,
  ...extra,
})

describe('germanVoiceScore', () => {
  it('strongly prefers de-DE over other German locales', () => {
    const de = germanVoiceScore(voice('Stimme', 'de-DE'))
    const at = germanVoiceScore(voice('Stimme', 'de-AT'))
    expect(de).toBeGreaterThan(at)
  })

  it('bonuses network voices over identical local ones', () => {
    const network = germanVoiceScore(voice('Stimme', 'de-DE', { localService: false }))
    const local = germanVoiceScore(voice('Stimme', 'de-DE', { localService: true }))
    expect(network).toBeGreaterThan(local)
  })

  it('sinks robotic engines (eSpeak, legacy SAPI) below plain voices', () => {
    const plain = germanVoiceScore(voice('Stimme', 'de-DE'))
    expect(germanVoiceScore(voice('German (eSpeak)', 'de'))).toBeLessThan(plain)
    expect(germanVoiceScore(voice('Microsoft Hedda - German', 'de-DE'))).toBeLessThan(plain)
  })

  it('bonuses premium name keywords and the browser default', () => {
    const plain = germanVoiceScore(voice('Stimme', 'de-DE'))
    expect(germanVoiceScore(voice('Google Deutsch', 'de-DE', { localService: false }))).toBeGreaterThan(plain)
    expect(germanVoiceScore(voice('Microsoft Katja (Natural)', 'de-DE'))).toBeGreaterThan(plain)
    expect(germanVoiceScore(voice('Stimme', 'de-DE', { default: true }))).toBeGreaterThan(plain)
  })
})

describe('rankGermanVoices', () => {
  it('filters out non-German voices', () => {
    const ranked = rankGermanVoices([
      voice('Google US English', 'en-US', { localService: false }),
      voice('Stimme', 'de-DE'),
      voice('Samantha', 'en-US'),
    ])
    expect(ranked).toHaveLength(1)
    expect(ranked[0]?.name).toBe('Stimme')
  })

  it('ranks a realistic mixed list best-first', () => {
    const ranked = rankGermanVoices([
      voice('Microsoft Hedda - German (Germany)', 'de-DE', { localService: true }),
      voice('Google Deutsch', 'de-DE', { localService: false }),
      voice('Anna', 'de-DE', { localService: true, default: true }),
      voice('German (Germany)', 'de', { localService: true }), // eSpeak-ish? no keyword — plain 'de'
      voice('Google Österreich', 'de-AT', { localService: false }),
    ])
    expect(ranked.map((v) => v.name)).toEqual([
      'Google Deutsch',
      'Google Österreich',
      'Anna',
      'German (Germany)',
      'Microsoft Hedda - German (Germany)',
    ])
  })

  it('keeps input order for equal scores (stable)', () => {
    const ranked = rankGermanVoices([
      voice('B-Stimme', 'de-DE'),
      voice('A-Stimme', 'de-DE'),
      voice('C-Stimme', 'de-DE'),
    ])
    expect(ranked.map((v) => v.name)).toEqual(['B-Stimme', 'A-Stimme', 'C-Stimme'])
  })
})

describe('voiceQuality', () => {
  it('labels network/premium-name voices premium, plain voices good, robotic basic', () => {
    expect(voiceQuality(voice('Google Deutsch', 'de-DE', { localService: false }))).toBe('premium')
    expect(voiceQuality(voice('Microsoft Katja (Natural)', 'de-DE'))).toBe('good')
    expect(voiceQuality(voice('Anna', 'de-DE'))).toBe('good')
    expect(voiceQuality(voice('Microsoft Steffi', 'de-DE'))).toBe('basic')
    expect(voiceQuality(voice('German (eSpeak)', 'de'))).toBe('basic')
  })
})
