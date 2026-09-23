import AiModelSection from './sections/AiModelSection'
import GettingStartedSection from './sections/GettingStartedSection'
import AccountSection from './sections/AccountSection'
import LearningSection from './sections/LearningSection'
import SpeechSection from './sections/SpeechSection'
import ContentStudioSection from './sections/ContentStudioSection'
import DataSection from './sections/DataSection'
import DiagnosticsSection from './sections/DiagnosticsSection'
import { APP_VERSION } from '../../version'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings &amp; Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything is stored locally in this browser. Changes save automatically.
        </p>
      </div>
      <GettingStartedSection />
      <AccountSection />
      <AiModelSection />
      <LearningSection />
      <SpeechSection />
      <ContentStudioSection />
      <DataSection />
      <DiagnosticsSection />
      <p className="pt-2 text-center text-xs text-slate-400">
        DeutschMeister v{APP_VERSION} · local-first PWA · your data stays in this browser
        unless you sign in (Settings → Account)
      </p>
    </div>
  )
}

