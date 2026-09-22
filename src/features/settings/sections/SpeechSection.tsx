import { useEffect, useState, type ReactNode } from 'react'
import { Badge, Card, Field } from '../../../components/ui'
import { voiceQuality, type VoiceQuality } from '../../../engine/voiceRanking'
import { stt } from '../../../speech/stt'
import { tts } from '../../../speech/tts'
import { useAppStore } from '../../../state/store'

const PREVIEW_TEXT = 'Hallo! Willkommen bei DeutschMeister. Lernen wir Deutsch!'

export default function SpeechSection() {
  const settings = useAppStore((s) => s.settings)
  const patchSettings = useAppStore((s) => s.patchSettings)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    const refresh = (): void => setVoices(tts.germanVoices())
    refresh()
    const off = tts.onVoicesChanged(refresh)
    return off
  }, [])

  if (!settings) return null

  const selected = settings.ttsVoice ?? ''

  const preview = (voiceURI: string): void => {
    void patchSettings({ ttsVoice: voiceURI || null })
    tts.speak(PREVIEW_TEXT, { rate: settings.ttsRate, voiceURI: voiceURI || null })
  }

  const row = (key: string, value: string, title: string, meta: string, quality: VoiceQuality): ReactNode => (
    <label key={key} className="flex cursor-pointer items-center gap-3 py-2 pr-2">
      <input
        type="radio"
        name="tts-voice"
        className="h-4 w-4 border-slate-300"
        checked={selected === value}
        onChange={() => void patchSettings({ ttsVoice: value || null })}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-800">{title}</span>
        <span className="block text-xs text-slate-500">{meta}</span>
      </span>
      {quality === 'premium' && <Badge tone="ok">★ premium</Badge>}
      {quality === 'basic' && <Badge tone="bad">robotic</Badge>}
      <button
        type="button"
        className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        disabled={!tts.supported}
        onClick={(e) => {
          e.preventDefault()
          preview(value)
        }}
      >
        ▶
      </button>
    </label>
  )

  return (
    <Card title="Speech" description="Text-to-speech and microphone input (browser dependent).">
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={tts.supported ? 'ok' : 'bad'}>
          Text-to-speech: {tts.supported ? 'available' : 'not supported in this browser'}
        </Badge>
        <Badge tone={stt.supported ? 'ok' : 'warn'}>
          Microphone input: {stt.supported ? 'available' : 'typing fallback (Firefox)'}
        </Badge>
      </div>

      <div className="grid gap-4">
        <Field
          label="German voice"
          hint={`${voices.length} German voice(s) found — ranked by expected quality, best first. ▶ previews and selects.`}
        >
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {row('auto', '', 'Automatic', 'best German voice on this device', 'premium')}
            {voices.map((v) =>
              row(
                v.voiceURI,
                v.voiceURI,
                v.name,
                `${v.lang} · ${v.localService ? 'on-device' : 'network'}`,
                voiceQuality(v),
              ),
            )}
            {voices.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-500">
                No German voices yet — they load asynchronously; reopen Settings if this stays empty.
              </p>
            )}
          </div>
        </Field>

        <Field label={`Speaking speed: ${settings.ttsRate.toFixed(2)}×`}>
          <input
            type="range"
            min={0.5}
            max={1.2}
            step={0.05}
            value={settings.ttsRate}
            className="mt-2 w-full"
            onChange={(e) => void patchSettings({ ttsRate: Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="mt-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={settings.sttEnabled}
            onChange={(e) => void patchSettings({ sttEnabled: e.target.checked })}
          />
          Enable microphone answers (where supported)
        </label>
      </div>
    </Card>
  )
}
