import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '../../components/ui'
import { getCards } from '../../db/repositories/vocabRepo'
import { getLlmLog } from '../../llm/adapter'
import { stt } from '../../speech/stt'
import { tts } from '../../speech/tts'
import { useAppStore } from '../../state/store'

export default function DashboardPage() {
  const { hydrated, profile, apiKey, todayLog, dueCount, stats, refreshToday } = useAppStore()
  const [introToday, setIntroToday] = useState(0)

  useEffect(() => {
    void refreshToday()
  }, [refreshToday])

  useEffect(() => {
    if (!todayLog || todayLog.newWordIds.length === 0) {
      setIntroToday(0)
      return
    }
    void getCards(todayLog.newWordIds).then((cards) => setIntroToday(cards.length))
  }, [todayLog])

  if (!hydrated || !profile) {
    return <p className="text-sm text-slate-500">Loading your data…</p>
  }

  const connectionOk = getLlmLog()[0]?.ok === true
  const setupDone = apiKey.trim().length > 0 && connectionOk && (stats?.introduced ?? 0) > 0

  // One primary "What's next" action, by learning priority: placement → today's new words →
  // due reviews → grammar topic of the day. The other cards stay secondary.
  const newWordsTotal = todayLog?.newWordIds.length ?? 0
  const wordsLeft = newWordsTotal - introToday
  const focus = !profile.placementResult
    ? 'placement'
    : wordsLeft > 0
      ? 'words'
      : dueCount > 0
        ? 'review'
        : 'grammar'

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
        {!setupDone && (
          <p className="mt-4 text-sm text-slate-600">
            ⚙️ New here? Finish the short{' '}
            <Link to="/settings" className="font-medium text-indigo-700 underline">
              Getting started
            </Link>{' '}
            checklist in Settings — AI features need an API key.
          </p>
        )}
      </Card>

      <Card title="Today" description="Your daily vocabulary plan, generated once per calendar day.">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-slate-700">
            {introToday} / {todayLog?.newWordIds.length ?? profile.dailyWordGoal} new words
          </span>
          <span className="text-slate-300">·</span>
          <Link to="/vocab">
            <Button variant={focus === 'words' ? 'primary' : 'secondary'}>
              {wordsLeft > 0
                ? `Continue today’s words (${introToday}/${newWordsTotal}) →`
                : 'Words ✓ — visit Vocabulary'}
            </Button>
          </Link>
          <Link to="/review">
            <Button variant={focus === 'review' ? 'primary' : 'secondary'}>
              {dueCount > 0 ? `Review ${dueCount} due →` : 'Nothing due ✓'}
            </Button>
          </Link>
          <Link to="/grammar">
            <Button variant={focus === 'placement' || focus === 'grammar' ? 'primary' : 'secondary'}>
              {!profile.placementResult ? 'Take grammar placement →' : 'Grammar topic of the day →'}
            </Button>
          </Link>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{
              width: `${Math.round(
                (Math.min(introToday, todayLog?.newWordIds.length ?? profile.dailyWordGoal) /
                  Math.max(1, todayLog?.newWordIds.length ?? profile.dailyWordGoal)) *
                  100,
              )}%`,
            }}
          />
        </div>
        {stats && (
          <p className="mt-2 text-xs text-slate-400">
            Word bank: {stats.introduced} introduced · {stats.learning} learning · {stats.review} mature ·{' '}
            {stats.totalWords} total
          </p>
        )}
      </Card>
    </div>
  )
}
