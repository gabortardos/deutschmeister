export interface SpeakOptions {
  rate?: number
  voiceURI?: string | null
}

/**
 * Text-to-speech adapter (Web Speech API). All speech usage must go through this
 * module so the future iOS (Capacitor) build can swap in a native implementation.
 */
export const tts = {
  get supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  },

  germanVoices(): SpeechSynthesisVoice[] {
    if (!this.supported) return []
    return window.speechSynthesis
      .getVoices()
      .filter((v) => v.lang.toLowerCase().startsWith('de'))
  },

  onVoicesChanged(cb: () => void): () => void {
    if (!this.supported) return () => undefined
    window.speechSynthesis.addEventListener('voiceschanged', cb)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', cb)
  },

  speak(text: string, opts: SpeakOptions = {}): boolean {
    if (!this.supported || !text) return false
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = opts.rate ?? 0.9
    const voices = this.germanVoices()
    const voice = opts.voiceURI
      ? voices.find((v) => v.voiceURI === opts.voiceURI)
      : voices[0]
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
    return true
  },

  stop(): void {
    if (this.supported) window.speechSynthesis.cancel()
  },
}
