import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/** Read a repo file relative to the project root. */
const read = (p: string): string => readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)), 'utf8')

interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

interface Manifest {
  id: string
  name: string
  short_name: string
  start_url: string
  scope: string
  display: string
  theme_color: string
  icons: ManifestIcon[]
}

describe('PWA manifest', () => {
  const manifest: Manifest = JSON.parse(read('public/manifest.webmanifest'))

  it('is scoped to the GitHub Pages subpath', () => {
    expect(manifest.scope).toBe('/deutschmeister/')
    expect(manifest.start_url).toBe('/deutschmeister/')
    expect(manifest.id).toBe('/deutschmeister/')
  })

  it('is an installable standalone app with branding', () => {
    expect(manifest.display).toBe('standalone')
    expect(manifest.short_name).toBe('DeutschMeister')
    expect(manifest.theme_color).toBe('#4f46e5')
  })

  it('declares 192, 512 and maskable icons that exist with the right dimensions', () => {
    const purposes = manifest.icons.map((i) => `${i.sizes}:${i.purpose ?? 'any'}`).sort()
    expect(purposes).toEqual(['192x192:any', '512x512:any', '512x512:maskable'])
    for (const icon of manifest.icons) {
      const buf = readFileSync(fileURLToPath(new URL(`../../${icon.src.replace('/deutschmeister/', 'public/')}`, import.meta.url)))
      // PNG magic + IHDR width/height (bytes 16–23, big-endian).
      expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      const [w, h] = icon.sizes.split('x').map(Number)
      expect(buf.readUInt32BE(16)).toBe(w)
      expect(buf.readUInt32BE(20)).toBe(h)
    }
  })
})

describe('index.html PWA wiring', () => {
  it('links the manifest, an apple-touch-icon and a theme color', () => {
    const html = read('index.html')
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest"')
    expect(html).toContain('<link rel="apple-touch-icon" href="/icon-192.png"')
    expect(html).toContain('name="theme-color" content="#4f46e5"')
  })
})

describe('service worker (public/sw.js)', () => {
  const sw = read('public/sw.js')

  it('is syntactically valid JavaScript (node --check)', () => {
    const path = fileURLToPath(new URL('../../public/sw.js', import.meta.url))
    expect(() => execFileSync('node', ['--check', path], { stdio: 'pipe' })).not.toThrow()
  })

  it('stays in the subpath scope and never intercepts cross-origin traffic', () => {
    expect(sw).toContain('self.registration.scope')
    expect(sw).toContain("url.origin !== self.location.origin")
  })

  it('handles fetch, activates cleanly and takes over immediately', () => {
    expect(sw).toContain("addEventListener('fetch'")
    expect(sw).toContain('caches.delete')
    expect(sw).toContain('skipWaiting')
    expect(sw).toContain('clients.claim')
  })
})
