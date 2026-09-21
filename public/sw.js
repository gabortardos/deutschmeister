// DeutschMeister service worker — hand-rolled, dependency-free, scoped to /deutschmeister/.
// Plain JS on purpose: it is copied verbatim from public/ by Vite (no build, no types).
//
// Strategy:
//  - navigations (app shell): network-first, cached copy as offline fallback
//    (new deploys are picked up immediately when online; the cache is only for offline)
//  - /assets/* (content-hashed, immutable): cache-first
//  - other same-origin GETs (manifest, icons, favicon): stale-while-revalidate
//  - everything else — notably cross-origin LLM API traffic — is never intercepted
//
// Bump CACHE_VERSION when changing what/how we cache so stale caches get dropped.

const CACHE_VERSION = 'v1'
const STATIC_CACHE = `dm-static-${CACHE_VERSION}`
const PAGES_CACHE = `dm-pages-${CACHE_VERSION}`
const BASE = new URL(self.registration.scope) // ends with /deutschmeister/

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, PAGES_CACHE])
      for (const name of await caches.keys()) {
        if (!keep.has(name)) await caches.delete(name)
      }
      await self.clients.claim()
    })(),
  )
})

/** Cache-first for content-hashed assets (they never change contents). */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(STATIC_CACHE)
    await cache.put(request, response.clone())
  }
  return response
}

/** Serve from cache immediately, refresh the cache in the background. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  const fresh = fetch(request)
    .then((response) => {
      if (response.ok && response.type === 'basic') void cache.put(request, response.clone())
      return response
    })
    .catch(() => undefined)
  return cached || (await fresh) || Response.error()
}

/** Network-first for the app shell; offline → cached root document. */
async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE)
  try {
    const response = await fetch(request)
    // Cache under the app root URL so ANY offline navigation can fall back to it.
    // (Skip redirect bodies: they cannot be stored and confuse the cache API.)
    if (response.ok && !response.redirected) await cache.put(BASE.href, response.clone())
    return response
  } catch {
    const cached = (await cache.match(BASE.href)) || (await cache.match(request))
    if (cached) return cached
    return new Response('DeutschMeister is offline and no cached copy exists yet. Reconnect once, then retry.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // never touch LLM API traffic

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
    return
  }
  if (url.pathname.startsWith(`${BASE.pathname}assets/`)) {
    event.respondWith(cacheFirst(request))
    return
  }
  if (url.pathname.startsWith(BASE.pathname)) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
