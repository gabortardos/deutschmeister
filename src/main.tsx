import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { importKeyFromUrl } from './llm/keyStore'
import { registerServiceWorker } from './pwa'
import { useAppStore } from './state/store'

async function bootstrap(): Promise<void> {
  // Support one-time key loading via URL fragment (#/settings?key=...) before anything renders.
  importKeyFromUrl()
  try {
    await useAppStore.getState().hydrate()
  } catch (err) {
    console.error('Failed to hydrate app data:', err)
  }
  const rootEl = document.getElementById('root')
  if (!rootEl) throw new Error('Root element not found')
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  )
  registerServiceWorker()
}

void bootstrap()
