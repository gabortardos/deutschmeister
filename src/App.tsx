import { Route, Routes } from 'react-router-dom'
import Layout from './app/Layout'
import DashboardPage from './features/dashboard/DashboardPage'
import VocabPage from './features/vocab/VocabPage'
import WordBankPage from './features/vocab/WordBankPage'
import GrammarPage from './features/grammar/GrammarPage'
import GrammarTopicPage from './features/grammar/GrammarTopicPage'
import PlacementPage from './features/grammar/PlacementPage'
import ReviewPage from './features/review/ReviewPage'
import ConversationPage from './features/conversation/ConversationPage'
import ConversationSessionPage from './features/conversation/ConversationSessionPage'
import SpeakListenPage from './features/practice/SpeakListenPage'
import SettingsPage from './features/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="vocab" element={<VocabPage />} />
        <Route path="words" element={<WordBankPage />} />
        <Route path="grammar" element={<GrammarPage />} />
        <Route path="grammar/placement" element={<PlacementPage />} />
        <Route path="grammar/:topicId" element={<GrammarTopicPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="conversation" element={<ConversationPage />} />
        <Route path="conversation/:scenarioId" element={<ConversationSessionPage />} />
        <Route path="practice" element={<SpeakListenPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
