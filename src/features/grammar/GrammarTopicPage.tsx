import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, Card } from '../../components/ui'
import type { DrillItem, GrammarTopic } from '../../db/types'
import { getDrillsForTopic, getTopic } from '../../db/repositories/grammarRepo'
import { useAppStore } from '../../state/store'
import DrillRunner from './DrillRunner'

/** Renders the small markdown subset used by seed explanations: ##, -, **bold**. */
function renderMarkdown(md: string): React.ReactNode[] {
  const bold = (line: string): React.ReactNode[] =>
    line.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))
  const blocks: React.ReactNode[] = []
  let list: React.ReactNode[] = []
  const flush = (): void => {
    if (list.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
          {list}
        </ul>,
      )
      list = []
    }
  }
  for (const line of md.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      flush()
      continue
    }
    if (trimmed.startsWith('## ')) {
      flush()
      blocks.push(
        <h3 key={`h-${blocks.length}`} className="mt-4 text-sm font-bold uppercase tracking-wide text-indigo-700">
          {trimmed.slice(3)}
        </h3>,
      )
    } else if (trimmed.startsWith('- ')) {
      list.push(
        <li key={`li-${blocks.length}-${list.length}`} className="text-sm text-slate-700">
          {bold(trimmed.slice(2))}
        </li>,
      )
    } else {
      flush()
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-sm text-slate-700">
          {bold(trimmed)}
        </p>,
      )
    }
  }
  flush()
  return blocks
}

export default function GrammarTopicPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const { profile, patchProfile, bumpDrills, refreshToday } = useAppStore()
  const [topic, setTopic] = useState<GrammarTopic | null>(null)
  const [drills, setDrills] = useState<DrillItem[] | null>(null)
  const [practicing, setPracticing] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setTopic(null)
    setDrills(null)
    setPracticing(false)
    setDone(false)
    if (!topicId) return
    void (async () => {
      const t = await getTopic(topicId)
      setTopic(t ?? null)
      if (t) {
        setDrills(await getDrillsForTopic(t.id))
        if (profile && profile.currentGrammarTopicId !== t.id) {
          await patchProfile({ currentGrammarTopicId: t.id })
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId])

  const explanation = useMemo(() => (topic ? renderMarkdown(topic.explanationMd) : null), [topic])

  if (!topic) {
    return (
      <Card title="Topic not found">
        <p className="text-sm text-slate-600">This grammar topic does not exist (yet).</p>
        <Link to="/grammar">
          <Button className="mt-3">← Back to Grammar</Button>
        </Link>
      </Card>
    )
  }

  if (practicing && drills && drills.length > 0) {
    return (
      <div className="space-y-4">
        <Link to="/grammar" className="text-xs text-slate-400 hover:text-slate-600">
          ← Leave practice
        </Link>
        <DrillRunner
          drills={drills}
          title={topic.title}
          onFinish={() => {
            setPracticing(false)
            setDone(true)
            void bumpDrills()
            void refreshToday()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/grammar" className="text-xs text-slate-400 hover:text-slate-600">
        ← All topics
      </Link>
      <Card
        title={topic.title}
        description={`${topic.cefr} · ${topic.focus}`}
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="ok">{topic.cefr}</Badge>
          {topic.relatedVocabTheme && <Badge tone="warn">Pairs with “{topic.relatedVocabTheme}” vocabulary</Badge>}
        </div>
        <div className="mt-3 space-y-2">{explanation}</div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setPracticing(true)} disabled={(drills?.length ?? 0) === 0}>
            Practice {drills?.length ?? 0} drills →
          </Button>
          <Link to="/vocab">
            <Button>Study related words</Button>
          </Link>
        </div>
        {done && (
          <p className="mt-3 text-xs text-emerald-600">Round complete — attempts recorded, mastery updated.</p>
        )}
      </Card>
    </div>
  )
}
