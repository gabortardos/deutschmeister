import { useEffect, useState } from 'react'
import { Badge, Button, Card } from '../../../components/ui'
import { clearLlmLog, getLlmLog, type LlmLogEntry } from '../../../llm/adapter'
import { APP_VERSION } from '../../../version'

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DiagnosticsSection() {
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null)
  const [log, setLog] = useState<LlmLogEntry[]>([])

  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then((e) => setEstimate({ usage: e.usage ?? 0, quota: e.quota ?? 0 }))
      .catch(() => setEstimate(null))
    setLog(getLlmLog())
  }, [])

  const indexedDbOk = typeof indexedDB !== 'undefined'

  return (
    <Card title="Diagnostics" description="Environment info and the last AI calls (keys are never logged).">
      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <p>
          App version: <span className="font-mono">{APP_VERSION}</span>
        </p>
        <p>
          IndexedDB: <Badge tone={indexedDbOk ? 'ok' : 'bad'}>{indexedDbOk ? 'available' : 'missing'}</Badge>
        </p>
        <p>
          Host: <span className="font-mono">{window.location.host || 'localhost'}</span>
        </p>
        <p>
          Storage used:{' '}
          {estimate ? `${formatBytes(estimate.usage)} of ${formatBytes(estimate.quota)}` : 'unavailable'}
        </p>
      </div>

      <h3 className="mt-5 text-sm font-semibold text-slate-800">Recent AI calls (max 10)</h3>
      {log.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">No AI calls yet.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {log.map((entry, index) => (
            <li key={`${entry.at}-${index}`} className="flex items-start gap-2 text-xs">
              <span className={entry.ok ? 'text-emerald-600' : 'text-red-600'}>{entry.ok ? '✓' : '✗'}</span>
              <span className="font-mono text-slate-400">{formatTime(entry.at)}</span>
              <span className="font-mono text-slate-600">{entry.model}</span>
              <span className="text-slate-400">{entry.ms} ms</span>
              {entry.error && <span className="text-red-600">{entry.error.slice(0, 120)}</span>}
            </li>
          ))}
        </ul>
      )}
      {log.length > 0 && (
        <div className="mt-3">
          <Button onClick={() => { clearLlmLog(); setLog([]) }}>Clear log</Button>
        </div>
      )}
    </Card>
  )
}
