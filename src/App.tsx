import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './app/Layout'
// M10.3: route-based code-splitting. The dashboard + welcome flow stay eager —
// they are the first screen on app open. Every other route lazy-loads its
// chunk on first navigation. Chunks are content-hashed and the service worker
// caches /assets/* cache-first, so any page you have visited keeps working
// offline afterwards.
import DashboardPage from './features/dashboard/DashboardPage'
import WelcomeFlow from './features/onboarding/WelcomeFlow'

const VocabPage = lazy(() => import('./features/vocab/VocabPage'))
const WordBankPage = lazy(() => import('./features/vocab/WordBankPage'))
const GrammarPage = lazy(() => import('./features/grammar/GrammarPage'))
const GrammarTopicPage = lazy(() => import('./features/grammar/GrammarTopicPage'))
const PlacementPage = lazy(() => import('./features/grammar/PlacementPage'))
const ReviewPage = lazy(() => import('./features/review/ReviewPage'))
const MistakeBankPage = lazy(() => import('./features/mistakes/MistakeBankPage'))
const ConversationPage = lazy(() => import('./features/conversation/ConversationPage'))
const ConversationSessionPage = lazy(() =>
  import('./features/conversation/ConversationSessionPage'),
)
const SpeakListenPage = lazy(() => import('./features/practice/SpeakListenPage'))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'))
const legalPages = () => import('./features/legal/LegalPages')
const AboutPage = lazy(() => legalPages().then((m) => ({ default: m.AboutPage })))
const ContactPage = lazy(() => legalPages().then((m) => ({ default: m.ContactPage })))
const PrivacyPage = lazy(() => legalPages().then((m) => ({ default: m.PrivacyPage })))
const RefundPage = lazy(() => legalPages().then((m) => ({ default: m.RefundPage })))
const TermsPage = lazy(() => legalPages().then((m) => ({ default: m.TermsPage })))

/** Minimal themed loading state shown while a lazy route chunk streams in. */
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Loading page">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="vocab" element={<VocabPage />} />
          <Route path="words" element={<WordBankPage />} />
          <Route path="grammar" element={<GrammarPage />} />
          <Route path="grammar/placement" element={<PlacementPage />} />
          <Route path="grammar/:topicId" element={<GrammarTopicPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="mistakes" element={<MistakeBankPage />} />
          <Route path="conversation" element={<ConversationPage />} />
          <Route path="conversation/:scenarioId" element={<ConversationSessionPage />} />
          <Route path="practice" element={<SpeakListenPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* M9.5: first-visit welcome & onboarding tour (auto-opens once per browser). */}
          <Route path="welcome" element={<WelcomeFlow />} />
          {/* M8.3: public pages for Paddle's website review (About / Contact / Terms / Privacy / Refund). */}
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="refund" element={<RefundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
