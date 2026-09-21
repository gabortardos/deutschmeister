/**
 * PWA glue: registers the service worker from /deutschmeister/sw.js.
 * Production only — the dev server must never be cached.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) return
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((err: unknown) => {
      console.error('Service worker registration failed:', err)
    })
  })
}
