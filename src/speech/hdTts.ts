/**
 * Optional HD cloud text-to-speech via Google Cloud TTS (M6.2).
 *
 * Why Google: plain REST + API key from the browser (CORS verified 2026-09-23 via preflight —
 * `access-control-allow-origin` reflects our Pages origin, `x-goog-api-key` allowed), no SDK
 * dependency, and the free tier (1M chars/month of Neural2) comfortably covers a learner.
 * The provider is isolated to this file — swapping later touches nothing else.
 *
 * Config (enabled flag + voice) and the API key live ONLY in localStorage, like the LLM key
 * (`src/llm/keyStore.ts`): never in IndexedDB, never in exports, never committed. `tts.speak`
 * consults `shouldHandle()` and falls back to browser voices on any failure.
 */

const API_BASE = 'https://texttospeech.googleapis.com/v1'
const CFG_KEY = 'dm.ttsHd'
const KEY_STORAGE = 'dm.googleTtsKey'
const FETCH_TIMEOUT_MS = 10_000
const CACHE_MAX = 40

export interface HdTtsConfig {
  enabled: boolean
  voice: string
}

export interface HdVoiceInfo {
  id: string
  gender: string
}

/** Fallback list when the voices endpoint can't be reached (kept to free-tier Neural2 voices). */
export const FALLBACK_HD_VOICES: readonly HdVoiceInfo[] = [
  { id: 'de-DE-Neural2-A', gender: 'FEMALE' },
  { id: 'de-DE-Neural2-B', gender: 'MALE' },
  { id: 'de-DE-Neural2-C', gender: 'FEMALE' },
  { id: 'de-DE-Neural2-D', gender: 'FEMALE' },
  { id: 'de-DE-Neural2-F', gender: 'MALE' },
]

/** Simple LRU with dispose hook — testable without the browser. */
export class LruCache<K, V> {
  private map = new Map<K, V>()
  constructor(
    private readonly max: number,
    private readonly dispose: (value: V) => void = () => undefined,
  ) {}

  has(key: K): boolean {
    return this.map.has(key)
  }

  get(key: K): V | undefined {
    const value = this.map.get(key)
    if (value !== undefined) {
      this.map.delete(key)
      this.map.set(key, value) // refresh recency
    }
    return value
  }

  set(key: K, value: V): void {
    const existing = this.map.get(key)
    if (existing !== undefined) this.dispose(existing)
    this.map.set(key, value)
    while (this.map.size > this.max) {
      const oldest = this.map.keys().next().value as K
      this.dispose(this.map.get(oldest) as V)
      this.map.delete(oldest)
    }
  }

  get size(): number {
    return this.map.size
  }
}

// --- localStorage config + key (try/catch: node/test env, blocked storage) -------------

function readJson<T>(storageKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(storageKey: string, value: unknown): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // storage full/blocked — settings UI will simply show defaults
  }
}

const DEFAULT_CONFIG: HdTtsConfig = { enabled: false, voice: 'de-DE-Neural2-A' }

export function getHdConfig(): HdTtsConfig {
  return { ...DEFAULT_CONFIG, ...readJson<HdTtsConfig>(CFG_KEY, DEFAULT_CONFIG) }
}

export function setHdConfig(patch: Partial<HdTtsConfig>): HdTtsConfig {
  const next = { ...getHdConfig(), ...patch }
  writeJson(CFG_KEY, next)
  return next
}

export function getGoogleTtsKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function setGoogleTtsKey(key: string): void {
  try {
    const trimmed = key.trim()
    if (trimmed) localStorage.setItem(KEY_STORAGE, trimmed)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    // ignore
  }
}

// --- pure request/response helpers (unit-tested) ---------------------------------------

export function buildSynthesizeRequest(text: string, voice: string, speakingRate: number): string {
  return JSON.stringify({
    input: { text },
    voice: { languageCode: 'de-DE', name: voice },
    audioConfig: { audioEncoding: 'MP3', speakingRate },
  })
}

export function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Prefer modern engine families; free-tier-friendly Neural2 first. */
const FAMILY_ORDER = ['neural2', 'studio', 'wavenet', 'chirp', 'standard']

export function sortVoiceInfos(voices: readonly HdVoiceInfo[]): HdVoiceInfo[] {
  const rank = (id: string): number => {
    const lower = id.toLowerCase()
    const idx = FAMILY_ORDER.findIndex((f) => lower.includes(f))
    return idx === -1 ? FAMILY_ORDER.length : idx
  }
  return [...voices].sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id))
}

function friendlyError(status: number, apiMessage: string): string {
  if (status === 401 || status === 403)
    return `Google rejected the API key (${status}). Check the key and that the Cloud Text-to-Speech API is enabled for its project. ${apiMessage}`
  if (status === 429) return 'Google TTS quota exceeded (429). Try again later or use browser voices.'
  return `Google TTS error ${status}: ${apiMessage}`
}

async function apiMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string } }
    return data.error?.message ?? ''
  } catch {
    return ''
  }
}

// --- runtime cache + playback ------------------------------------------------------------

const urlCache = new LruCache<string, string>(CACHE_MAX, (url) => {
  try {
    if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url)
  } catch {
    // ignore
  }
})

let currentAudio: HTMLAudioElement | null = null

function cacheKey(text: string, voice: string, rate: number): string {
  return `${voice}|${rate}|${text}`
}

function play(url: string, onEnd?: () => void): void {
  hdTts.stop()
  currentAudio = new Audio(url)
  if (onEnd) {
    currentAudio.onended = () => onEnd()
    currentAudio.onerror = () => onEnd()
  }
  void currentAudio.play().catch(() => {
    // Autoplay blocked or decode failure — tts.ts falls back to the browser voice.
    currentAudio = null
    onEnd?.()
  })
}

export const hdTts = {
  /** True when `tts.speak` should route here (browser voice becomes the fallback). */
  shouldHandle(): boolean {
    return getHdConfig().enabled && getGoogleTtsKey().trim().length > 0
  },

  /** Fetch German (de-DE) voices for the picker. Throws with a friendly message on failure. */
  async listVoices(): Promise<HdVoiceInfo[]> {
    const key = getGoogleTtsKey()
    if (!key.trim()) throw new Error('No Google TTS API key set.')
    const res = await fetch(`${API_BASE}/voices?languageCode=de-DE`, {
      headers: { 'x-goog-api-key': key },
    })
    if (!res.ok) throw new Error(friendlyError(res.status, await apiMessage(res)))
    const data = (await res.json()) as { voices?: Array<{ name: string; ssmlGender?: string }> }
    const list = (data.voices ?? [])
      .filter((v) => v.name.includes('de-DE'))
      .map((v) => ({ id: v.name, gender: v.ssmlGender ?? '—' }))
    return sortVoiceInfos(list.length > 0 ? list : FALLBACK_HD_VOICES)
  },

  /** Synthesize + play. Resolves false when HD is not usable; throws on API errors. */
  async speak(text: string, opts: { rate?: number; onEnd?: () => void } = {}): Promise<boolean> {
    if (!this.shouldHandle() || !text) return false
    const { voice } = getHdConfig()
    const rate = opts.rate ?? 1
    const key = cacheKey(text, voice, rate)
    const cached = urlCache.get(key)
    if (cached !== undefined) {
      play(cached, opts.onEnd)
      return true
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(`${API_BASE}/text:synthesize`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': getGoogleTtsKey() },
        body: buildSynthesizeRequest(text, voice, rate),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(friendlyError(res.status, await apiMessage(res)))
      const data = (await res.json()) as { audioContent?: string }
      if (!data.audioContent) throw new Error('Google TTS returned no audio.')
      const blob = new Blob([decodeBase64(data.audioContent) as BlobPart], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      urlCache.set(key, url)
      play(url, opts.onEnd)
      return true
    } finally {
      clearTimeout(timer)
    }
  },

  stop(): void {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
  },
}

