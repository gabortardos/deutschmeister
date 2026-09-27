import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { resumePaddleCheckoutFromUrl } from './billing/paddleClient'
import { importKeyFromUrl } from './llm/keyStore'
import { registerServiceWorker } from './pwa'
import { usePlatformStore } from './state/platformStore'
import { useAppStore } from './state/store'
import { initTheme } from './state/theme'

async function bootstrap(): Promise<void> {
  // M10.2: apply the stored/system theme (the index.html inline script already
  // did the first paint) and keep following OS changes while choice='system'.
  initTheme()
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
  // v2.4.2: landing with ?_ptxn=… on the URL (Paddle payment-link redirect)
  // re-opens the stashed checkout as an overlay instead of quietly showing the
  // home screen doing nothing.
  void resumePaddleCheckoutFromUrl(() => void usePlatformStore.getState().refresh())
}

void bootstrap()
