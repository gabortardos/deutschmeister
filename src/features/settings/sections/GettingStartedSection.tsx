import { Link } from 'react-router-dom'
import { Button, Card } from '../../../components/ui'
import { getLlmLog } from '../../../llm/adapter'
import { useAppStore } from '../../../state/store'
import { useAuthStore } from '../../../sync/authStore'

/**
 * First-run checklist (M4.2 — moved here from the dashboard so the Today page stays
 * focused on learning). Renders nothing once every item is done.
 */
export default function GettingStartedSection() {
  const apiKey = useAppStore((s) => s.apiKey)
  const stats = useAppStore((s) => s.stats)
  const user = useAuthStore((s) => s.user)

  const lastCall = getLlmLog()[0] ?? null
  const checklist = [
    {
      done: apiKey.trim().length > 0 || user !== null,
      label:
        'Set up AI: add your own key (AI Model section below) — or simply sign in above for the free $1 AI credit',
    },
    {
      done: lastCall?.ok === true,
      label: 'BYO-key users: run “Test connection” once (AI Model section below)',
    },
    { done: (stats?.introduced ?? 0) > 0, label: 'Learn your first words in Vocabulary' },
  ]
  if (checklist.every((item) => item.done)) return null

  return (
    <Card
      title="Getting started"
      description="Everything works offline without AI — but these two steps switch the AI layer on."
    >
      <ul className="space-y-2">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <span className={item.done ? 'text-emerald-600' : 'text-slate-300'}>{item.done ? '✔' : '○'}</span>
            <span className={item.done ? 'text-slate-500 line-through' : 'text-slate-700'}>{item.label}</span>
            {!item.done && item.label.includes('Vocabulary') && (
              <Link to="/vocab">
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
  )
}
