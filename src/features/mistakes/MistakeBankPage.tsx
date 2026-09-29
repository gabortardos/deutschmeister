import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '../../components/ui'
import { loadMistakeBank, type MistakeBank } from '../../db/repositories/mistakeRepo'
import { reviewWord } from '../../db/repositories/vocabRepo'
import { pickPracticeDrills, pickPracticeWords } from '../../engine/mistakeBank'
import type { DrillItem, VocabWord } from '../../db/types'
import { useAppStore } from '../../state/store'
import DrillRunner from '../grammar/DrillRunner'
import { StudySession } from '../vocab/StudySession'
import { MistakeExplainer } from './MistakeExplainer'

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

/** Rows shown per section before the "+N more" note (data still loads fully). */
const SECTION_LIMIT = 20

/**
 * M11.1 Mistake bank: one place to see every mistake the app has noticed —
 * grammar drills you last answered wrong, words with SRS lapses, and the
 * tutor's recent conversation corrections. Clearing a mistake happens by
 * learning, right where it was made (a correct retry updates the latest
 * attempt; reviews and chats keep the other two lists honest).
 */
export default function MistakeBankPage() {
  const [bank, setBank] = useState<MistakeBank | null>(null)
  /** M11.2 practice sessions (WordBankPage pattern: page swaps to a runner). */
  const [drillPractice, setDrillPractice] = useState<DrillItem[] | null>(null)
  const [wordPractice, setWordPractice] = useState<VocabWord[] | null>(null)
  const { bumpDrills, refreshToday } = useAppStore()

  async function load(): Promise<void> {
    setBank(await loadMistakeBank())
  }

  useEffect(() => {
    void load()
  }, [])

  function startDrillPractice(): void {
    if (!bank) return
    setDrillPractice(pickPracticeDrills(bank.drills, bank.items))
  }

  function startWordPractice(): void {
    if (!bank) return
    setWordPractice(pickPracticeWords(bank.words, bank.bank))
  }

  /** Exit either session and refresh the bank — a correct retry should already
   *  have cleared that drill row (DrillRunner records attempts as you go). */
  function finishPractice(wordsSession: boolean): void {
    setDrillPractice(null)
    setWordPractice(null)
    void load()
    if (wordsSession) void refreshToday()
  }

  if (!bank) {
    return <p className="text-sm text-slate-500">Loading your mistakes…</p>
  }

  if (drillPractice) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Practice your mistakes · drills</h1>
        {drillPractice.length === 0 ? (
          <Card title="Nothing to practice 🎉">
            <p className="text-sm text-slate-600">Your open drill mistakes vanished — well done!</p>
            <div className="mt-4">
              <Button onClick={() => setDrillPractice(null)}>Back to the mistake bank</Button>
            </div>
          </Card>
        ) : (
          <DrillRunner
            drills={drillPractice}
            title="Mistake bank"
            onFinish={() => finishPractice(false)}
          />
        )}
      </div>
    )
  }

  if (wordPractice) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Practice your mistakes · words</h1>
        {wordPractice.length === 0 ? (
          <Card title="Nothing to practice 🎉">
            <p className="text-sm text-slate-600">No lapsed words to drill right now.</p>
            <div className="mt-4">
              <Button onClick={() => setWordPractice(null)}>Back to the mistake bank</Button>
            </div>
          </Card>
        ) : (
          <StudySession
            words={wordPractice}
            bank={bank.bank}
            onWordReviewed={(wordId, quality) => reviewWord(wordId, quality)}
            onDrillDone={() => bumpDrills()}
            onFinish={() => finishPractice(true)}
          />
        )}
      </div>
    )
  }

  const drillRows = bank.drills.slice(0, SECTION_LIMIT)
  const wordRows = bank.words.slice(0, SECTION_LIMIT)
  const convRows = bank.conversations
  const total = bank.drills.length + bank.words.length + convRows.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mistake bank 📌</h1>
        <p className="mt-1 text-sm text-slate-500">
          {total === 0
            ? 'Every mistake the app notices lands here — wrong drills, lapsed words, tutor corrections. Go make some! 🙂'
            : `${total} thing${total === 1 ? '' : 's'} to look at — answer a drill correctly again, review a word, or revisit a conversation to clear it.`}
        </p>
      </div>

      <Card
        title={`Grammar drills — last answer wrong (${bank.drills.length})`}
        description="A drill leaves this list the moment you answer it correctly again."
      >
        {bank.drills.length > 0 && (
          <div className="mb-4">
            <Button variant="primary" onClick={startDrillPractice}>
              Practice these drills →
            </Button>
          </div>
        )}
        {bank.drills.length === 0 ? (
          <p className="text-sm text-slate-500">No open drill mistakes. Keep drilling! 🎯</p>
        ) : (
          <ul className="space-y-3">
            {drillRows.map((m) => (
              <li key={m.itemId} className="rounded-lg border border-slate-200 bg-surface p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {m.wrongCount > 1 && <Badge tone="bad">missed {m.wrongCount}×</Badge>}
                  <span className="text-xs font-medium text-slate-400">{m.cefr}</span>
                  {m.topicId && (
                    <Link
                      to={`/grammar/${m.topicId}`}
                      className="ml-auto text-xs font-medium text-indigo-700 hover:underline"
                    >
                      {m.topicTitle ?? 'Topic'} →
                    </Link>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-slate-800">{m.prompt}</p>
                <p className="mt-1 text-xs text-slate-500">
                  you: <span className="font-medium text-red-700">{m.revealed ? '— (revealed)' : m.given}</span>
                  {' · '}expected: <span className="font-medium text-emerald-700">{m.expected}</span>
                  {' · '}{dateFmt.format(m.lastWrongAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {bank.drills.length > SECTION_LIMIT && (
          <p className="mt-2 text-xs text-slate-400">
            …and {bank.drills.length - SECTION_LIMIT} more — answer drills correctly to clear them.
          </p>
        )}
      </Card>

      <Card
        title={`Trouble words — ${bank.words.length} with lapses`}
        description="Every failed review (or Speak & Listen miss) adds a lapse; these are your repeat offenders."
      >
        {bank.words.length > 0 && (
          <div className="mb-4">
            <Button variant="primary" onClick={startWordPractice}>
              Practice these words →
            </Button>
          </div>
        )}
        {bank.words.length === 0 ? (
          <p className="text-sm text-slate-500">No lapsed words — your SRS reviews are going well. 💪</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {wordRows.map((w) => (
              <li key={`${w.wordId}-${w.lapses}`} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {w.article ? `${w.article} ` : ''}
                    {w.german}
                    <span className="ml-2 font-normal text-slate-500">{w.english}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {w.cefr} · next review {dateFmt.format(w.dueDate)}
                  </p>
                </div>
                <Badge tone="warn">
                  {w.lapses} lapse{w.lapses === 1 ? '' : 's'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        {bank.words.length > SECTION_LIMIT && (
          <p className="mt-2 text-xs text-slate-400">…and {bank.words.length - SECTION_LIMIT} more in the word bank.</p>
        )}
        {bank.words.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Review due words on the <Link to="/review" className="font-medium text-indigo-700 hover:underline">Review page</Link> or
            drill them in <Link to="/practice" className="font-medium text-indigo-700 hover:underline">Speak &amp; Listen</Link>.
          </p>
        )}
      </Card>

      <Card
        title={`Conversation corrections (${convRows.length})`}
        description="What your tutor corrected in recent chats and free writing — newest first."
      >
        {convRows.length === 0 ? (
          <p className="text-sm text-slate-500">No corrections yet — start a conversation and let the coach nitpick. 💬</p>
        ) : (
          <ul className="space-y-2">
            {convRows.map((c, i) => (
              <li key={`${c.sessionId}-${i}`} className="rounded-lg border border-slate-200 bg-surface p-3">
                {/* M11.3: tap for the micro-lesson + optional AI explanation. */}
                <MistakeExplainer said={c.said} corrected={c.corrected} type={c.type}>
                  <p className="text-sm">
                    <span className="text-red-700 line-through">{c.said}</span>
                    {' → '}
                    <span className="font-medium text-emerald-700">{c.corrected}</span>
                  </p>
                </MistakeExplainer>
                <p className="mt-1 text-xs text-slate-400">
                  {c.type} · {dateFmt.format(c.at)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {convRows.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Re-run these situations on the <Link to="/conversation" className="font-medium text-indigo-700 hover:underline">Conversation page</Link> — mistake drills are generated automatically after each chat.
          </p>
        )}
      </Card>
    </div>
  )
}
