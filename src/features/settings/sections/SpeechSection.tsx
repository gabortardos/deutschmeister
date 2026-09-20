import { useEffect, useState } from 'react'
import { Badge, Button, Card, Field, inputClass } from '../../../app/ui'
import { stt } from '../../../speech/stt'
import { tts } from '../../../speech/tts'
import { useAppStore } from '../../../state/store'

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="German voice" hint={`${voices.length} German voice(s) found`}>
          <select
            className={inputClass}
            value={settings.ttsVoice ?? ''}
            onChange={(e) => void patchSettings({ ttsVoice: e.target.value || null })}
          >
            <option value="">Automatic (first German voice)</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
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

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button
          type="button"
          disabled={!tts.supported}
          onClick={() =>
            tts.speak('Hallo! Willkommen bei DeutschMeister. Lernen wir Deutsch!', {
              rate: settings.ttsRate,
              voiceURI: settings.ttsVoice,
            })
          }
        >
          ▶ Preview voice
        </Button>

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
