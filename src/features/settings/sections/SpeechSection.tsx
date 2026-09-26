import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Badge, Card, Field, inputClass } from '../../../components/ui'
import { voiceQuality, type VoiceQuality } from '../../../engine/voiceRanking'
import { stt } from '../../../speech/stt'
import { tts } from '../../../speech/tts'
import {
  FALLBACK_HD_VOICES,
  getGoogleTtsKey,
  getHdConfig,
  hdTts,
  setGoogleTtsKey,
  setHdConfig,
  type HdVoiceInfo,
} from '../../../speech/hdTts'
import { useAppStore } from '../../../state/store'
import { useAuthStore } from '../../../sync/authStore'
import { usePlatformStore } from '../../../state/platformStore'

const PREVIEW_TEXT = 'Hallo! Willkommen bei DeutschMeister. Lernen wir Deutsch!'

export default function SpeechSection() {
  const settings = useAppStore((s) => s.settings)
  const patchSettings = useAppStore((s) => s.patchSettings)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  // M9.7: one clear engine — when HD is active the browser list greys out below.
  const [hdActive, setHdActive] = useState(false)
  const user = useAuthStore((s) => s.user)
  const ttsCharCap = usePlatformStore((s) => s.ttsCharCap)
  const platformAvailable = user != null && ttsCharCap > 0
  const handleHdActive = useCallback((a: boolean) => setHdActive(a), [])

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
          hint={
            hdActive
              ? 'HD cloud voice is active — this list is the offline fallback only (greyed). Turn HD off below to pick a browser voice.'
              : `${voices.length} German voice(s) found — ranked by expected quality, best first. ▶ previews and selects.`
          }
        >
          <div
            className={`divide-y divide-slate-100 rounded-lg border border-slate-200 transition-opacity ${
              hdActive ? 'pointer-events-none opacity-40' : ''
            }`}
          >
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

      <HdVoiceCard
        platformAvailable={platformAvailable}
        signedIn={user != null}
        onActiveChange={handleHdActive}
      />
    </Card>
  )
}

/**
 * Optional HD cloud TTS (M6.2 Google Cloud TTS, M9.7 platform voice): enable toggle,
 * optional own API key (localStorage only), German neural-voice picker with live list +
 * fallback, and a preview that surfaces errors. Active = own key OR the included plan
 * voice (signed in + plan cap); when active, every `tts.speak` call routes through HD
 * and falls back to the browser voice on any failure, and the browser list above is
 * greyed out to keep one clear engine.
 */
function HdVoiceCard(props: {
  platformAvailable: boolean
  signedIn: boolean
  onActiveChange: (active: boolean) => void
}) {
  const { platformAvailable, signedIn, onActiveChange } = props
  const settings = useAppStore((s) => s.settings)
  const [cfg, setCfg] = useState(getHdConfig)
  const [key, setKey] = useState(getGoogleTtsKey)
  const [hdVoices, setHdVoices] = useState<HdVoiceInfo[]>([...FALLBACK_HD_VOICES])
  const [voiceListError, setVoiceListError] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const active = cfg.enabled && (key.trim().length > 0 || platformAvailable)
  useEffect(() => {
    onActiveChange(active)
  }, [active, onActiveChange])

  useEffect(() => {
    if (!key.trim() && !platformAvailable) return
    let cancelled = false
    hdTts
      .listVoices()
      .then((list) => {
        if (!cancelled) {
          setHdVoices(list)
          setVoiceListError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) setVoiceListError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [key, platformAvailable])

  const previewHd = (): void => {
    setPreviewError(null)
    if (!active) {
      setPreviewError('HD voice is not active — sign in (included voice) or add your own Google key.')
      return
    }
    hdTts.speak(PREVIEW_TEXT, { rate: settings?.ttsRate ?? 0.9 }).catch((e) => {
      setPreviewError(e instanceof Error ? e.message : String(e))
    })
  }

  return (
    <div className="mt-6 border-t border-slate-200 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={cfg.enabled}
            onChange={(e) => setCfg(setHdConfig({ enabled: e.target.checked }))}
          />
          HD cloud voice (optional)
        </label>
        {active &&
          (key.trim() ? (
            <Badge tone="ok">active — your Google key</Badge>
          ) : (
            <Badge tone="ok">active — included with your plan</Badge>
          ))}
        {cfg.enabled && !key.trim() && !platformAvailable && (
          <Badge tone="warn">
            {signedIn ? 'HD voice is a Plus feature' : 'sign in to use the included HD voice'}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Crystal-clear neural voices from Google Cloud. Signed-in users get an included German set
        (bigger on paid plans) with no setup; your own Google key unlocks every German voice. All
        app speech routes through HD with automatic fallback to the browser voice. Key + voice are
        stored only in this browser (localStorage) — never in app data exports.
      </p>

      {cfg.enabled && (
        <div className="mt-3 grid gap-3">
          <Field
            label="Google Cloud API key (optional)"
            hint="Your own key unlocks ALL German voices incl. premium families. Google Cloud Console → APIs & Services → Credentials (Cloud Text-to-Speech API must be enabled)."
          >
            <input
              type="password"
              className={inputClass}
              placeholder={platformAvailable ? 'empty = included plan voice' : 'AIza…'}
              value={key}
              onChange={(e) => {
                setKey(e.target.value)
                setGoogleTtsKey(e.target.value)
              }}
              autoComplete="off"
            />
          </Field>
          <Field
            label="HD voice"
            hint={
              voiceListError
                ? `Could not load the voice list (${voiceListError}) — showing defaults.`
                : key.trim()
                  ? `${hdVoices.length} German voice(s) on your key — Neural2 first.`
                  : `${hdVoices.length} included German voice(s) — Neural2 first, then Wavenet.`
            }
          >
            <div className="flex gap-2">
              <select
                className={inputClass}
                value={cfg.voice}
                onChange={(e) => setCfg(setHdConfig({ voice: e.target.value }))}
              >
                {hdVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} ({v.gender.toLowerCase()})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                onClick={previewHd}
              >
                ▶ Preview
              </button>
            </div>
          </Field>
          {previewError && <p className="text-xs text-red-600">{previewError}</p>}
        </div>
      )}
    </div>
  )
}
