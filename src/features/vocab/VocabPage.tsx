import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '../../components/ui'
import { getAllWords, getCards, getWords, reviewWord } from '../../db/repositories/vocabRepo'
import type { VocabWord } from '../../db/types'
import { useAppStore } from '../../state/store'
import { StudySession } from './StudySession'

export default function VocabPage() {
  const { hydrated, profile, todayLog, stats, refreshToday, bumpDrills } = useAppStore()
  const [bank, setBank] = useState<VocabWord[]>([])
  const [sessionWords, setSessionWords] = useState<VocabWord[] | null>(null)
  const [introToday, setIntroToday] = useState(0)

  useEffect(() => {
    void refreshToday()
    void getAllWords().then(setBank)
  }, [refreshToday])

  useEffect(() => {
    if (!todayLog || todayLog.newWordIds.length === 0) {
      setIntroToday(0)
      return
    }
    void getCards(todayLog.newWordIds).then((cards) => setIntroToday(cards.length))
  }, [todayLog])

  async function startSession(): Promise<void> {
    if (!todayLog) return
    const [planWords, cards] = await Promise.all([
      getWords(todayLog.newWordIds),
      getCards(todayLog.newWordIds),
    ])
    const done = new Set(cards.map((c) => c.wordId))
    setSessionWords(planWords.filter((w) => !done.has(w.id)))
  }

  if (!hydrated || !profile) {
    return <p className="text-sm text-slate-500">Loading your data…</p>
  }

  if (sessionWords !== null) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Today&apos;s new words</h1>
        {sessionWords.length === 0 ? (
          <Card title="All done for today 🎉">
            <p className="text-sm text-slate-600">Every planned word already has a card. See you tomorrow!</p>
            <div className="mt-4">
              <Button onClick={() => setSessionWords(null)}>Back to overview</Button>
            </div>
          </Card>
        ) : (
          <StudySession
            words={sessionWords}
            bank={bank}
            onWordReviewed={(wordId, quality) => reviewWord(wordId, quality)}
            onDrillDone={() => bumpDrills()}
            onFinish={() => {
              setSessionWords(null)
              void refreshToday()
            }}
          />
        )}
      </div>
    )
  }

  const goal = todayLog?.newWordIds.length ?? profile.dailyWordGoal
  const done = Math.min(introToday, goal)
  const pct = goal === 0 ? 100 : Math.round((done / goal) * 100)

  return (
    <div className="space-y-6">
      <Card title="Today's lesson" description="Your daily goal from Settings, planned once per calendar day.">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">
            {done} / {goal} new words introduced
          </span>
          <span className="text-slate-400">{todayLog ? `drills done: ${todayLog.drillsDone}` : '…'}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" disabled={done >= goal} onClick={() => void startSession()}>
            {done >= goal ? 'Goal reached ✓' : 'Start studying →'}
          </Button>
          {stats && stats.dueNow > 0 && (
            <Link to="/review">
              <Button>Review {stats.dueNow} due</Button>
            </Link>
          )}
        </div>
      </Card>

      {stats && (
        <Card title="Your word bank" description="Seeded corpus plus your custom words, tracked by SM-2.">
          <div className="flex flex-wrap gap-2">
            <Badge tone="ok">{stats.introduced} introduced</Badge>
            <Badge tone="warn">{stats.learning} learning</Badge>
            <Badge tone="ok">{stats.review} mature</Badge>
            <Badge tone="bad">{stats.dueNow} due now</Badge>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Total words available: <span className="font-semibold text-slate-700">{stats.totalWords}</span> (A1–B1 seed
            corpus). Review direction alternates; typing accepts ae/oe/ue/ss for umlauts.
          </p>
        </Card>
      )}
    </div>
  )
}

