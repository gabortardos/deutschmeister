import { useRef } from 'react'
import { Button, Card } from '../../../components/ui'
import { exportAll, factoryReset, importAll, isBackupFile, resetProgress } from '../../../db/repositories/backupRepo'

function backupFilename(): string {
  return `deutschmeister-backup-${new Date().toISOString().slice(0, 10)}.json`
}

export default function DataSection() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const doExport = async (): Promise<void> => {
    const backup = await exportAll()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = backupFilename()
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const onFileChosen = async (file: File): Promise<void> => {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isBackupFile(parsed)) {
        window.alert('This file is not a DeutschMeister backup.')
        return
      }
      const counts = Object.values(parsed.tables).reduce((sum, rows) => sum + rows.length, 0)
      if (!window.confirm(`Replace ALL current data with ${counts} records from this backup?`)) return
      await importAll(parsed)
      window.alert('Backup imported. Reloading…')
      window.location.reload()
    } catch (e) {
      window.alert(`Import failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const doResetProgress = async (): Promise<void> => {
    if (!window.confirm('Reset all learning progress? Your words, topics, scenarios and settings are kept.')) return
    if (!window.confirm('Really reset? This cannot be undone (unless you have a backup).')) return
    await resetProgress()
    window.alert('Progress reset. Reloading…')
    window.location.reload()
  }

  const doFactoryReset = async (): Promise<void> => {
    if (!window.confirm('FACTORY RESET: delete everything — progress, content, settings and your API key. Continue?')) return
    if (!window.confirm('Last chance: everything local will be gone. Are you sure?')) return
    await factoryReset()
    window.location.reload()
  }

  return (
    <Card title="Data" description="Your data lives only in this browser's IndexedDB. Export regularly as a backup.">
      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => void doExport()}>
            ⭳ Export backup (JSON)
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>⭱ Import backup</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onFileChosen(file)
              e.target.value = ''
            }}
          />
        </div>
        <hr className="border-slate-200" />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="danger" onClick={() => void doResetProgress()}>
            Reset learning progress
          </Button>
          <Button variant="danger" onClick={() => void doFactoryReset()}>
            Factory reset
          </Button>
          <span className="text-xs text-slate-400">Destructive — export a backup first.</span>
        </div>
      </div>
    </Card>
  )
}
