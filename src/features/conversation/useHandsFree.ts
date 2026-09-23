import { useEffect, useRef, useState } from 'react'
import {
  SILENCE_COMMIT_MS,
  silenceElapsed,
  transition,
  type VoiceSessionEvent,
  type VoiceSessionState,
} from '../../engine/voiceSession'
import { stt, type SttStreamHandle } from '../../speech/stt'
import { tts } from '../../speech/tts'

export interface HandsFreeCallbacks {
  /**
   * Send the learner's utterance through the normal conversation pipeline. Resolves with the
   * tutor reply text, or null when the turn was skipped/failed (the page surfaces the error).
   */
  sendUserText: (text: string) => Promise<string | null>
  /** Speak the tutor reply; MUST call `notifyTtsDone` when playback ends (or never starts). */
  speakReply: (text: string, notifyTtsDone: () => void) => void
}

/**
 * Hands-free voice conversation driver (M6.3). Owns the impulsive parts around the pure
 * `engine/voiceSession` state machine: the continuous STT stream, the silence-commit timer,
 * and the listen → think → speak → listen loop. All mutable state lives in refs so browser
 * callbacks (which fire outside React events) never see stale closures.
 */
export function useHandsFree(callbacks: HandsFreeCallbacks) {
  const [state, setState] = useState<VoiceSessionState>('idle')
  const [partial, setPartial] = useState('')
  const [micError, setMicError] = useState<string | null>(null)

  const cbRef = useRef(callbacks)
  useEffect(() => {
    cbRef.current = callbacks
  })

  const stateRef = useRef<VoiceSessionState>('idle')
  const streamRef = useRef<SttStreamHandle | null>(null)
  const finalsRef = useRef('')
  const lastSpeechRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  const apply = (event: VoiceSessionEvent): VoiceSessionState => {
    const next = transition(stateRef.current, event)
    if (next !== stateRef.current) {
      stateRef.current = next
      setState(next)
    }
    return next
  }

  const clearTimer = (): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const stopStream = (): void => {
    streamRef.current?.stop()
    streamRef.current = null
  }

  const startListening = (): void => {
    if (stateRef.current !== 'listening') return
    if (!stt.supported) {
      setMicError('Speech recognition is not available in this browser.')
      apply({ type: 'ERROR' })
      return
    }
    stopStream()
    finalsRef.current = ''
    setPartial('')
    try {
      streamRef.current = stt.listenStream('de-DE', {
        onPartial: (text) => {
          setPartial(text)
          noteSpeech()
        },
        onFinal: (text) => {
          const trimmed = text.trim()
          if (trimmed)
            finalsRef.current = finalsRef.current ? `${finalsRef.current} ${trimmed}` : trimmed
          setPartial('')
          noteSpeech()
        },
        onError: (message) => {
          if (message.includes('not-allowed') || message.includes('service-not-allowed')) {
            setMicError('Microphone access was blocked — allow it in the browser, then start again.')
            apply({ type: 'ERROR' })
            stop()
          }
          // transient (network hiccup etc.) — onEnd follows and restarts the recognizer
        },
        onEnd: () => {
          if (stateRef.current !== 'listening') return
          if (finalsRef.current.trim()) void commit()
          else startListening() // Chrome auto-stopped without text — keep the loop alive
        },
      })
      noteSpeech()
    } catch (e) {
      setMicError(e instanceof Error ? e.message : String(e))
      apply({ type: 'ERROR' })
    }
  }

  const noteSpeech = (): void => {
    lastSpeechRef.current = Date.now()
    clearTimer()
    timerRef.current = window.setTimeout(checkSilence, SILENCE_COMMIT_MS)
  }

  const checkSilence = (): void => {
    if (stateRef.current !== 'listening') return
    if (!silenceElapsed(lastSpeechRef.current, Date.now())) {
      noteSpeech() // timer fired early — re-arm
      return
    }
    if (finalsRef.current.trim()) void commit()
    else noteSpeech() // nothing said yet — keep waiting for speech
  }

  const commit = async (): Promise<void> => {
    clearTimer()
    stopStream()
    const text = finalsRef.current.trim()
    finalsRef.current = ''
    setPartial('')
    if (apply({ type: 'UTTERANCE', text }) !== 'thinking') {
      startListening() // noise-only transcript — keep listening
      return
    }
    try {
      const reply = await cbRef.current.sendUserText(text)
      if (reply === null || reply.trim().length === 0) {
        apply({ type: 'ERROR' }) // page already showed the error; loop ends
        return
      }
      if (apply({ type: 'LLM_DONE' }) === 'speaking') {
        cbRef.current.speakReply(reply, () => {
          if (apply({ type: 'TTS_DONE' }) === 'listening') startListening()
        })
      }
    } catch {
      apply({ type: 'ERROR' })
    }
  }

  const start = (): void => {
    if (stateRef.current !== 'idle') return
    setMicError(null)
    if (!stt.supported) {
      setMicError('Speech recognition is not available in this browser (Chrome/Edge recommended).')
      return
    }
    apply({ type: 'START' })
    startListening()
  }

  const stop = (): void => {
    clearTimer()
    stopStream()
    finalsRef.current = ''
    setPartial('')
    apply({ type: 'STOP' })
  }

  // Stop everything when the page unmounts mid-session.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      streamRef.current?.stop()
      tts.stop()
    }
  }, [])

  return { state, partial, micError, active: state !== 'idle', start, stop }
}
