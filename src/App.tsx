import { Route, Routes } from 'react-router-dom'
import Layout from './app/Layout'
import DashboardPage from './features/dashboard/DashboardPage'
import VocabPage from './features/vocab/VocabPage'
import GrammarPage from './features/grammar/GrammarPage'
import ReviewPage from './features/review/ReviewPage'
import ConversationPage from './features/conversation/ConversationPage'
import SettingsPage from './features/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="vocab" element={<VocabPage />} />
        <Route path="grammar" element={<GrammarPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="conversation" element={<ConversationPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
