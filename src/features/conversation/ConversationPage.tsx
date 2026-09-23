import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '../../components/ui'
import { recentSessions } from '../../db/repositories/conversationRepo'
import { getDrillsForTopic } from '../../db/repositories/grammarRepo'
import { ensureScenariosSeeded, getAllScenarios } from '../../db/repositories/scenarioRepo'
import type { ConversationSession, Scenario } from '../../db/types'
import { useAiRoute } from '../../state/useLlmDeps'

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** The scenario library: seed + custom scenarios, recent sessions, drill replays. */
export default function ConversationPage() {
  const aiReady = useAiRoute() !== 'none'
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null)
  const [drillCounts, setDrillCounts] = useState<Record<string, number>>({})
  const [sessions, setSessions] = useState<ConversationSession[]>([])

  useEffect(() => {
    void (async () => {
      await ensureScenariosSeeded()
      const list = await getAllScenarios()
      setScenarios(list)
      const counts = await Promise.all(list.map((s) => getDrillsForTopic(s.id).then((d) => d.length)))
      setDrillCounts(Object.fromEntries(list.map((s, i) => [s.id, counts[i] ?? 0])))
      setSessions(await recentSessions(6))
    })()
  }, [])

  const titleFor = (scenarioId: string): string =>
    scenarios?.find((s) => s.id === scenarioId)?.title ?? 'Unknown scenario'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Conversation practice</h1>
        <p className="mt-1 text-sm text-slate-500">
          Role-play everyday situations with your AI tutor — type or speak, get corrections afterwards.
        </p>
      </div>

      {!aiReady && (
        <Card>
          <p className="text-sm text-slate-600">
            🗣️ Conversations need AI. Add your own key in{' '}
            <Link to="/settings" className="font-medium text-indigo-700 underline underline-offset-2">
              Settings → AI Model
            </Link>{' '}
            — or sign in (Settings → Account) for the free $1 AI credit. Vocabulary, grammar and
            reviews keep working fully offline without either.
          </p>
        </Card>
      )}

      {scenarios === null ? (
        <p className="text-sm text-slate-500">Loading scenarios…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {scenarios.map((s) => {
            const drills = drillCounts[s.id] ?? 0
            return (
              <Card key={s.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      <span className="mr-2">{s.emoji}</span>
                      {s.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone="ok">{s.cefr}</Badge>
                      {s.custom && <Badge tone="warn">custom</Badge>}
                      <span className="text-xs text-slate-400">{s.keyPhrases.length} key phrases</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{s.description}</p>
                <p className="mt-1 text-xs italic text-slate-400">Goal: {s.goal}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {aiReady ? (
                    <Link to={`/conversation/${s.id}`}>
                      <Button variant="primary">Start role-play →</Button>
                    </Link>
                  ) : (
                    <Button disabled title="Add an AI key in Settings → AI Model — or sign in for the free credit">
                      Start role-play →
                    </Button>
                  )}
                  {drills > 0 && (
                    <Link to={`/conversation/${s.id}?practice=1`}>
                      <Button>Practice {drills} saved drills</Button>
                    </Link>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {sessions.length > 0 && (
        <Card title="Recent sessions">
          <ul className="divide-y divide-slate-100">
            {sessions.map((sess) => (
              <li key={sess.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm">
                <span className="font-medium text-slate-800">{titleFor(sess.scenarioId)}</span>
                <span className="text-xs text-slate-400">{dateFmt.format(new Date(sess.startedAt))}</span>
                {sess.summary && (
                  <span className="w-full text-xs text-slate-500 sm:w-auto sm:flex-1 sm:truncate">{sess.summary}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

