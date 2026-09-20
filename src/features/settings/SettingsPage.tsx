import AiModelSection from './sections/AiModelSection'
import LearningSection from './sections/LearningSection'
import SpeechSection from './sections/SpeechSection'
import ContentStudioSection from './sections/ContentStudioSection'
import DataSection from './sections/DataSection'
import DiagnosticsSection from './sections/DiagnosticsSection'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings &amp; Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything is stored locally in this browser. Changes save automatically.
        </p>
      </div>
      <AiModelSection />
      <LearningSection />
      <SpeechSection />
      <ContentStudioSection />
      <DataSection />
      <DiagnosticsSection />
    </div>
  )
}
