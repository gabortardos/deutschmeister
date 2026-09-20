import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, inputClass } from '../../components/ui'
import { dueCards, getWords, reviewWord } from '../../db/repositories/vocabRepo'
import type { VocabCard, VocabWord } from '../../db/types'
import { gradeAnswer } from '../../engine/grader'
import { useAppStore } from '../../state/store'
import { tts } from '../../speech/tts'

interface QueueItem {
  card: VocabCard
  word: VocabWord
}

/** Reviews due SM-2 cards with alternating direction (DE→EN, then EN→DE). */
export default function ReviewPage() {
  const { refreshToday } = useAppStore()
  const [queue, setQueue] = useState<QueueItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const [score, setScore] = useState({ ok: 0, bad: 0 })
  const [busy, setBusy] = useState(false)

  async function load(): Promise<void> {
    const cards = await dueCards()
    const words = await getWords(cards.map((c) => c.wordId))
    const byId = new Map(words.map((w) => [w.id, w]))
    setQueue(
      cards
        .map((c) => ({ card: c, word: byId.get(c.wordId) }))
        .filter((x): x is QueueItem => Boolean(x.word)),
    )
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const item = queue?.[index]

  async function submit(gaveUp = false): Promise<void> {
    if (!item || result !== null || busy) return
    setBusy(true)
    const { card, word } = item
    const askGerman = card.repetitions % 2 === 1
    const accepted = askGerman
      ? word.article
        ? [`${word.article} ${word.german}`, word.german]
        : [word.german]
      : [word.english]
    const graded = gaveUp ? { correct: false } : gradeAnswer(answer, accepted, { articleOptional: askGerman })
    setResult(graded.correct)
    setScore((s) => ({ ok: s.ok + (graded.correct ? 1 : 0), bad: s.bad + (graded.correct ? 0 : 1) }))
    await reviewWord(word.id, graded.correct ? 4 : 1)
    if (graded.correct) tts.speak(word.german)
    setBusy(false)
  }

  function next(): void {
    setAnswer('')
    setResult(null)
    setIndex((i) => i + 1)
  }

  function restart(): void {
    setIndex(0)
    setAnswer('')
    setResult(null)
    setScore({ ok: 0, bad: 0 })
    void refreshToday()
    void load()
  }

  if (queue === null) {
    return <p className="text-sm text-slate-500">Loading review queue…</p>
  }
  if (!item) {
    return (
      <div className="space-y-4">
        <Card title={queue.length === 0 ? 'Nothing due 🎉' : 'Review round complete 🎉'}>
          {queue.length === 0 ? (
            <p className="text-sm text-slate-600">
              No cards are scheduled right now. New reviews appear as SM-2 due dates arrive.
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              You reviewed {queue.length} cards: {score.ok} correct, {score.bad} to relearn (they come back tomorrow).
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/vocab">
              <Button>Learn new words</Button>
            </Link>
            <Button variant="primary" onClick={restart}>
              Refresh queue
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const { card, word } = item
  const askGerman = card.repetitions % 2 === 1
  const full = word.article ? `${word.article} ${word.german}` : word.german
  const correctAnswer = askGerman ? full : word.english
  const progress = Math.round((index / queue.length) * 100)

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Review {index + 1} / {queue.length} · {askGerman ? 'EN → DE' : 'DE → EN'}
          </span>
          <span>
            {score.ok} ✓ · {score.bad} ✗
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card>
        {!askGerman ? (
          <>
            <p className="text-center text-3xl font-bold text-slate-900">{full}</p>
            {word.exampleSentenceDe && (
              <p className="mt-2 text-center text-sm italic text-slate-500">{word.exampleSentenceDe}</p>
            )}
            <div className="mt-3 flex justify-center">
              <Button onClick={() => tts.speak(word.german)}>🔊 Listen</Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Type in German</p>
            <p className="mt-2 text-center text-3xl font-bold text-slate-900">{word.english}</p>
            {word.exampleSentenceEn && (
              <p className="mt-2 text-center text-sm italic text-slate-500">{word.exampleSentenceEn}</p>
            )}
          </>
        )}

        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <input
            className={`${inputClass} text-center text-lg`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={askGerman ? 'German answer…' : 'English answer…'}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={result !== null}
          />
          {askGerman && (
            <div className="flex justify-center gap-2">
              {['ä', 'ö', 'ü', 'ß'].map((ch) => (
                <Button key={ch} type="button" disabled={result !== null} onClick={() => setAnswer((t) => t + ch)}>
                  {ch}
                </Button>
              ))}
            </div>
          )}
          {result === null && (
            <div className="flex justify-center gap-2">
              <Button variant="primary" type="submit" disabled={answer.trim().length === 0}>
                Check
              </Button>
              <Button type="button" disabled={busy} onClick={() => void submit(true)}>
                I don&apos;t know
              </Button>
            </div>
          )}
        </form>

        {result !== null && (
          <div className="mt-4 space-y-3 text-center">
            {result ? (
              <Badge tone="ok">Richtig!</Badge>
            ) : (
              <Badge tone="bad">Correct: {correctAnswer}</Badge>
            )}
            <p className="text-xs text-slate-400">umlaut-free typing accepted · next interval scheduled by SM-2</p>
            <div>
              <Button variant="primary" onClick={next}>
                {index + 1 >= queue.length ? 'Finish' : 'Next →'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

