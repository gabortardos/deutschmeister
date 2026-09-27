import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '../../components/ui'
import { activityDays } from '../../db/repositories/statsRepo'
import { getAllWords } from '../../db/repositories/vocabRepo'
import { db } from '../../db/dexie'
import { computeInsights, type Insights } from '../../engine/insights'
import { collectTroubleWords, type TroubleWord } from '../../engine/mistakeBank'
import { computeStreaks, isActiveDay, keyOfDay } from '../../engine/progressStats'

/** Green from 80%, amber from 60%, red below — shared by all bar rows. */
function barTone(pct: number): string {
  return pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
}

interface InsightsData {
  insights: Insights
  streak: { current: number; longest: number }
  trouble: TroubleWord[]
}

/**
 * M11.7 insights page: the skill dimension (where am I strong / weak) — drill
 * accuracy by type and CEFR level, vocab coverage per level, conversation
 * correction types, and the most-lapsed words. The time dimension (heatmap,
 * streak calendar, due forecast) stays on the Dashboard. Everything is
 * aggregated locally — 100% offline, no LLM calls.
 */
export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load(): Promise<void> {
    const [attempts, items, cards, words, turns, sessions, days] = await Promise.all([
      db.drillAttempts.toArray(),
      db.drillItems.toArray(),
      db.vocabCards.toArray(),
      getAllWords(),
      db.conversationTurns.toArray(),
      db.conversationSessions.toArray(),
      activityDays(),
    ])
    const insights = computeInsights({
      attempts,
      items,
      cards,
      words,
      // Only learner turns carry corrections.
      turns: turns.filter((t) => t.role === 'user'),
      conversations: sessions.length,
    })
    const streak = computeStreaks(
      days.filter((d) => isActiveDay(d)).map((d) => d.date),
      keyOfDay(Date.now()),
    )
    const trouble = collectTroubleWords(cards, words).slice(0, 5)
    setData({ insights, streak, trouble })
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Loading insights…</p>
  }
  const { insights, streak, trouble } = data
  const { totals } = insights


  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-slate-900">Insights</h1>

      <Card title="Streak & activity" description="Everything below is computed from your local data — nothing leaves this browser.">
        <div className="flex flex-wrap gap-2">
          <Badge tone="ok">🔥 {streak.current}-day streak</Badge>
          <Badge tone="warn">best {streak.longest}</Badge>
          <Badge tone="ok">
            {totals.drills} drills · {totals.drillAccuracy}% correct
          </Badge>
          <Badge tone="ok">{totals.conversations} conversations</Badge>
          <Badge tone="warn">{totals.corrections} corrections received</Badge>
        </div>
      </Card>

      <Card title="Accuracy by drill type" description="Your weakest drill types first — practice them from the Mistake bank.">
        {insights.accuracyByType.length === 0 ? (
          <p className="text-sm text-slate-500">
            No drills yet — a grammar lesson or Speak &amp; Listen round will fill this in.
          </p>
        ) : (
          <ul className="space-y-3">
            {insights.accuracyByType.map((row) => (
              <li key={row.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-700">{row.label}</span>
                  <span className="text-xs text-slate-500">
                    {row.accuracy}% · {row.attempts} attempt{row.attempts === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${barTone(row.accuracy)}`} style={{ width: `${row.accuracy}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Accuracy by level" description="CEFR levels you have actually drilled, A1 → C2.">
        {insights.accuracyByCefr.length === 0 ? (
          <p className="text-sm text-slate-500">No level data yet.</p>
        ) : (
          <ul className="space-y-3">
            {insights.accuracyByCefr.map((row) => (
              <li key={row.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-700">{row.label}</span>
                  <span className="text-xs text-slate-500">
                    {row.accuracy}% · {row.attempts} attempt{row.attempts === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${barTone(row.accuracy)}`} style={{ width: `${row.accuracy}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Vocabulary coverage by level" description="How much of each level's word bank you have introduced.">
        <ul className="space-y-3">
          {insights.vocabCoverage.map((row) => {
            const pct = row.total === 0 ? 0 : Math.round((row.introduced / row.total) * 100)
            return (
              <li key={row.cefr}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-700">{row.cefr}</span>
                  <span className="text-xs text-slate-500">
                    {row.introduced} / {row.total} words
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card title="Most-corrected in conversation" description="What the tutor fixes most often in your replies.">
        {insights.mistakeTypes.length === 0 ? (
          <p className="text-sm text-slate-500">No conversations yet — corrections will show up here.</p>
        ) : (
          <ul className="space-y-2">
            {insights.mistakeTypes.map((row) => (
              <li key={row.key} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{row.label}</span>
                <Badge tone={row.count >= 5 ? 'bad' : 'warn'}>{row.count}×</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Trouble words" description="Words you have forgotten most often in review (SM-2 lapses).">
        {trouble.length === 0 ? (
          <p className="text-sm text-slate-500">No lapsed words yet — keep reviewing 🎉</p>
        ) : (
          <ul className="space-y-2">
            {trouble.map((w) => (
              <li key={w.wordId} className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-slate-700">
                  {w.article ? `${w.article} ` : ''}
                  {w.german} <span className="font-normal text-slate-400">— {w.english}</span>
                </span>
                <Badge tone="bad">
                  {w.lapses} lapse{w.lapses === 1 ? '' : 's'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Link to="/mistakes" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Practice these in the Mistake bank →
          </Link>
        </div>
      </Card>
    </div>
  )
}
