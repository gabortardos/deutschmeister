import { describe, expect, it } from 'vitest'
import {
  FALLBACK_HD_VOICES,
  LruCache,
  buildSynthesizeRequest,
  decodeBase64,
  sortVoiceInfos,
} from '../hdTts'

describe('LruCache', () => {
  it('evicts the least recently used entry beyond max and disposes it', () => {
    const disposed: string[] = []
    const cache = new LruCache<string, string>(2, (v) => disposed.push(v))
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')
    expect(cache.size).toBe(2)
    expect(disposed).toEqual(['1'])
    expect(cache.has('a')).toBe(false)
  })

  it('refreshes recency on get', () => {
    const cache = new LruCache<string, string>(2)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.get('a') // a is now most recent
    cache.set('c', '3') // evicts b, not a
    expect(cache.has('a')).toBe(true)
    expect(cache.has('b')).toBe(false)
  })

  it('disposes the old value when a key is overwritten', () => {
    const disposed: string[] = []
    const cache = new LruCache<string, string>(2, (v) => disposed.push(v))
    cache.set('a', '1')
    cache.set('a', '2')
    expect(cache.get('a')).toBe('2')
    expect(disposed).toEqual(['1'])
  })
})

describe('buildSynthesizeRequest', () => {
  it('builds the Google TTS REST body with German voice and speaking rate', () => {
    const body = JSON.parse(buildSynthesizeRequest('Guten Tag', 'de-DE-Neural2-A', 0.9))
    expect(body).toEqual({
      input: { text: 'Guten Tag' },
      voice: { languageCode: 'de-DE', name: 'de-DE-Neural2-A' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.9 },
    })
  })
})

describe('decodeBase64', () => {
  it('decodes base64 to bytes', () => {
    // 'Hi!' → SGkh
    expect(Array.from(decodeBase64('SGkh'))).toEqual([72, 105, 33])
  })
})

describe('sortVoiceInfos', () => {
  it('puts Neural2 before Wavenet before Standard, ties alphabetical', () => {
    const sorted = sortVoiceInfos([
      { id: 'de-DE-Standard-A', gender: 'FEMALE' },
      { id: 'de-DE-Wavenet-B', gender: 'MALE' },
      { id: 'de-DE-Neural2-C', gender: 'FEMALE' },
    ])
    expect(sorted.map((v) => v.id)).toEqual(['de-DE-Neural2-C', 'de-DE-Wavenet-B', 'de-DE-Standard-A'])
  })

  it('fallback list is Neural2-only and sorted', () => {
    expect(FALLBACK_HD_VOICES.every((v) => v.id.startsWith('de-DE-Neural2-'))).toBe(true)
    expect(sortVoiceInfos(FALLBACK_HD_VOICES).map((v) => v.id)).toEqual(
      FALLBACK_HD_VOICES.map((v) => v.id),
    )
  })
})
