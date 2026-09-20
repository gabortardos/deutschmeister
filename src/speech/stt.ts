// Minimal structural types for the Web Speech Recognition API (not in lib.dom for all TS versions).

interface SrAlternative {
  transcript: string
  confidence: number
}

interface SrResult {
  0: SrAlternative
  isFinal: boolean
  length: number
}

interface SrResultList {
  length: number
  [index: number]: SrResult
}

interface SrEvent {
  resultIndex: number
  results: SrResultList
}

interface SrErrorEvent {
  error: string
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: SrEvent) => void) | null
  onerror: ((e: SrErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SrCtor = new () => SpeechRecognitionLike

function getCtor(): SrCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: SrCtor; webkitSpeechRecognition?: SrCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface SttResult {
  transcript: string
  confidence: number
}

/**
 * Speech-to-text adapter (Web Speech API). Chrome/Edge recommended; Safari partial;
 * Firefox unsupported — callers must feature-detect via `supported` and fall back to typing.
 */
export const stt = {
  get supported(): boolean {
    return getCtor() !== null
  },

  listenOnce(lang = 'de-DE'): Promise<SttResult> {
    const Ctor = getCtor()
    if (!Ctor) {
      return Promise.reject(new Error('Speech recognition is not supported in this browser.'))
    }
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    return new Promise<SttResult>((resolve, reject) => {
      let settled = false
      recognition.onresult = (e) => {
        if (settled) return
        const result = e.results[e.results.length - 1]
        const alt = result?.[0]
        if (alt) {
          settled = true
          resolve({ transcript: alt.transcript, confidence: alt.confidence ?? 0 })
          recognition.stop()
        }
      }
      recognition.onerror = (e) => {
        if (!settled) {
          settled = true
          reject(new Error(`Speech recognition error: ${e.error}`))
        }
      }
      recognition.onend = () => {
        if (!settled) {
          settled = true
          reject(new Error('No speech captured.'))
        }
      }
      recognition.start()
    })
  },
}
