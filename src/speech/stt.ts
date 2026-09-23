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

/** Events emitted by continuous recognition (`listenStream`). */
export interface SttStreamHandlers {
  /** Interim (not yet final) hypothesis — used for the live partial display. */
  onPartial?: (text: string) => void
  /** A finalized speech segment (Chrome finalizes after a natural pause). */
  onFinal: (text: string) => void
  onError?: (message: string) => void
  /** Recognizer stopped (Chrome auto-stops after silence) — callers decide to restart. */
  onEnd: () => void
}

export interface SttStreamHandle {
  stop(): void
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

  /**
   * Continuous recognition for hands-free conversation (M6.3): streams interim partials and
   * finalized segments. Chrome stops the recognizer after silence/network hiccups — `onEnd`
   * fires and the caller decides whether to restart. Throws when unsupported.
   */
  listenStream(lang = 'de-DE', handlers: SttStreamHandlers): SttStreamHandle {
    const Ctor = getCtor()
    if (!Ctor) throw new Error('Speech recognition is not supported in this browser.')
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        const alt = result?.[0]
        if (!alt) continue
        if (result.isFinal) handlers.onFinal(alt.transcript)
        else interim += alt.transcript
      }
      if (interim) handlers.onPartial?.(interim)
    }
    recognition.onerror = (e) => handlers.onError?.(`Speech recognition error: ${e.error}`)
    recognition.onend = () => handlers.onEnd()
    recognition.start()
    return {
      stop: () => {
        try {
          recognition.stop()
        } catch {
          // already stopped — nothing to do
        }
      },
    }
  },
}
