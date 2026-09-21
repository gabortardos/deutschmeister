// Generates the PWA icon PNGs in public/ (node scripts/gen-icons.mjs).
// Dependency-free: builds RGBA pixel buffers and encodes them as PNG via node:zlib.
// Matches public/favicon.svg: indigo rounded square + white geometric "D".
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const INDIGO = [79, 70, 229] // #4f46e5
const WHITE = [255, 255, 255]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i]
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(size, pixelAt) {
  const raw = Buffer.alloc(size * (size * 4 + 1)) // filter byte 0 per scanline
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixelAt(x, y, size)
      const o = row + 1 + x * 4
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
      raw[o + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** White "D": vertical bar + half-annulus bowl, centered and scaled by `scale`. */
function inD(x, y, s, scale) {
  const barX0 = s * (0.5 - 0.145 * scale)
  const barX1 = s * (0.5 - 0.05 * scale)
  const cy = s * 0.5
  const rOuter = s * 0.23 * scale
  const rInner = s * 0.13 * scale
  if (x >= barX0 && x <= barX1 && y >= cy - rOuter && y <= cy + rOuter) return true
  if (x > barX1) {
    const d = Math.hypot(x - barX1, y - cy)
    if (d <= rOuter && d >= rInner) return true
  }
  return false
}

function iconPixel(maskable) {
  return (x, y, s) => {
    const bg = maskable ? [79, 70, 229, 255] : [79, 70, 229, 255]
    // Non-maskable: transparent outside the rounded square (rx ≈ 0.22s like the favicon).
    if (!maskable) {
      const rx = s * 0.22
      const inRect = x >= 0 && y >= 0 && x < s && y < s
      const cx = Math.min(Math.max(x, rx), s - rx)
      const cy = Math.min(Math.max(y, rx), s - rx)
      if (!inRect || Math.hypot(x - cx, y - cy) > rx) return [0, 0, 0, 0]
    }
    // Maskable keeps the glyph inside the 80% safe zone (scale 0.8).
    return inD(x, y, s, maskable ? 0.8 : 1) ? [...WHITE, 255] : bg
  }
}

writeFileSync('public/icon-192.png', encodePng(192, iconPixel(false)))
writeFileSync('public/icon-512.png', encodePng(512, iconPixel(false)))
writeFileSync('public/icon-maskable-512.png', encodePng(512, iconPixel(true)))
console.log('icons written: public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png')
