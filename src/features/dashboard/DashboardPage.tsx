import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '../../app/ui'
import { getLlmLog } from '../../llm/adapter'
import { stt } from '../../speech/stt'
import { tts } from '../../speech/tts'
import { useAppStore } from '../../state/store'

export default function DashboardPage() {
  const { hydrated, profile, settings } = useAppStore()

  if (!hydrated || !profile || !settings) {
    return <p className="text-sm text-slate-500">Loading your data…</p>
  }

  const lastCall = getLlmLog()[0] ?? null
  const keyConfigured = settings.apiKey.trim().length > 0
  const connectionOk = lastCall?.ok === true

  const checklist = [
    { done: keyConfigured, label: 'Add your AI API key in Settings → AI Model', link: '/settings' },
    { done: connectionOk, label: 'Run “Test connection” once (Settings → AI Model)', link: '/settings' },
    { done: false, label: 'Vocabulary engine arrives in Milestone 1', link: '/vocab' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">
          Guten Tag, {profile.name}! 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Current level: <span className="font-semibold text-indigo-700">{profile.level}</span> ·
          Daily goal: <span className="font-semibold text-indigo-700">{profile.dailyWordGoal} words + 1 grammar topic</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={tts.supported ? 'ok' : 'bad'}>TTS {tts.supported ? 'available' : 'unsupported'}</Badge>
          <Badge tone={stt.supported ? 'ok' : 'warn'}>Microphone {stt.supported ? 'available' : 'fallback to typing'}</Badge>
        </div>
      </Card>

      <Card title="Setup checklist" description="Two quick steps to switch the AI layer on.">
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              <span className={item.done ? 'text-emerald-600' : 'text-slate-300'}>{item.done ? '✔' : '○'}</span>
              <span className={item.done ? 'text-slate-500 line-through' : 'text-slate-700'}>{item.label}</span>
              {!item.done && (
                <Link to={item.link}>
                  <Button variant="ghost" className="ml-1">
                    Go →
                  </Button>
                </Link>
              )}
            </li>
          ))}
        </ul>
        {lastCall && (
          <p className="mt-3 text-xs text-slate-400">
            Last AI call: {lastCall.ok ? '✓ succeeded' : '✗ failed'} · {lastCall.model} · {lastCall.ms} ms
          </p>
        )}
      </Card>

      <Card title="Roadmap" description="Where DeutschMeister is heading.">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li><span className="font-medium text-emerald-700">M0 — Foundation ✅</span> app shell, local database, full Settings &amp; Admin hub, AI adapter + test connection, speech adapters, CI/CD.</li>
          <li><span className="font-medium">M1 — Vocabulary</span> 500+ word corpus (A1→B1), SM-2 spaced repetition, daily lesson planner, flashcards &amp; drills.</li>
          <li><span className="font-medium">M2 — Grammar</span> topic tree, drill runner with rule-based grader, placement quiz.</li>
          <li><span className="font-medium">M3 — AI layer</span> role-play conversations (11 scenarios incl. Fitnessstudio), feedback reports, LLM drill generation.</li>
          <li><span className="font-medium">M4 — Polish</span> speaking/listening drills, PWA/offline, final QA.</li>
        </ol>
      </Card>
    </div>
  )
}
