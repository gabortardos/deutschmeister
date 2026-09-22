import { rankGermanVoices } from '../engine/voiceRanking'

export interface SpeakOptions {
  rate?: number
  voiceURI?: string | null
}

/**
 * Text-to-speech adapter (Web Speech API). All speech usage must go through this
 * module so the future iOS (Capacitor) build can swap in a native implementation.
 *
 * Voice selection is defensive by necessity: `getVoices()` returns [] until the
 * browser finishes loading voices (async; fires `voiceschanged` once). Speaking
 * before that leaves the utterance without a voice, and most engines then use the
 * OS default (English) voice — so German text sounds English. We therefore prime
 * a German-voice cache at module load, refresh it on `voiceschanged`, and briefly
 * wait for voices on first speak.
 *
 * Within German voices we rank by expected quality (see `engine/voiceRanking.ts`):
 * network/natural voices first, legacy SAPI/eSpeak robotic voices last — "first
 * de-DE voice" alone used to land on robotic ones on Windows/Linux.
 */

const LANG = 'de-DE'
const VOICE_WAIT_MS = 800

let germanVoiceCache: SpeechSynthesisVoice[] = []

function refreshVoiceCache(): void {
  const all = window.speechSynthesis.getVoices()
  if (all.length === 0) return // voices not loaded yet — keep any previous cache
  germanVoiceCache = rankGermanVoices(all)
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoiceCache()
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoiceCache)
}

function resolveVoice(voiceURI?: string | null): SpeechSynthesisVoice | undefined {
  if (voiceURI) {
    const exact = germanVoiceCache.find((v) => v.voiceURI === voiceURI)
    if (exact) return exact
    // Stale saved preference (voice uninstalled / different browser) → automatic.
  }
  return germanVoiceCache[0]
}

function speakWith(text: string, opts: SpeakOptions, voice: SpeechSynthesisVoice | undefined): void {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = LANG
  utterance.rate = opts.rate ?? 0.9
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

export const tts = {
  get supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  },

  germanVoices(): SpeechSynthesisVoice[] {
    if (!this.supported) return []
    if (germanVoiceCache.length === 0) refreshVoiceCache()
    return [...germanVoiceCache]
  },

  onVoicesChanged(cb: () => void): () => void {
    if (!this.supported) return () => undefined
    window.speechSynthesis.addEventListener('voiceschanged', cb)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', cb)
  },

  speak(text: string, opts: SpeakOptions = {}): boolean {
    if (!this.supported || !text) return false
    window.speechSynthesis.cancel()
    if (germanVoiceCache.length === 0) refreshVoiceCache()
    const voice = resolveVoice(opts.voiceURI)
    if (voice) {
      speakWith(text, opts, voice)
      return true
    }
    // No German voice known yet (typical on the first speak after page load).
    // Poll briefly for the voice list instead of letting the engine read German
    // text with its default English voice; last resort: lang tag only.
    const started = performance.now()
    const attempt = (): void => {
      refreshVoiceCache()
      const v = resolveVoice(opts.voiceURI)
      if (v) speakWith(text, opts, v)
      else if (performance.now() - started < VOICE_WAIT_MS) window.setTimeout(attempt, 100)
      else speakWith(text, opts, undefined)
    }
    attempt()
    return true
  },

  stop(): void {
    if (this.supported) window.speechSynthesis.cancel()
  },
}
