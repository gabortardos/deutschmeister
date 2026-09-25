/**
 * Paddle billing helpers (M9) — pure TS twins of the Edge Function logic.
 *
 * `supabase/functions/paddle-webhook/index.ts` carries a verbatim copy of this
 * signature verification (Deno runtime, zero imports); the copy here exists so
 * the scheme is unit-tested (a silent signature bug is the worst possible
 * failure mode). Web Crypto only — works in browsers, Deno and Node 20+.
 *
 * Scheme (verified against developer.paddle.com/webhooks/about/signature-verification):
 *   header  Paddle-Signature: ts=<unix-seconds>;h1=<hex hmac>
 *   signed  `${ts}:${rawBody}`  — the RAW request body string, byte-for-byte
 *   hmac    HMAC-SHA256(webhook secret) → lowercase hex → constant-time compare
 *   replay  reject ts older than 5 minutes (docs example uses 5 s; Paddle
 *           retries make a slightly wider window the safer choice)
 */

export interface PaddleSignatureParts {
  ts: string
  h1: string
}

export const PADDLE_SIGNATURE_MAX_AGE_SEC = 300

/** Parses `ts=…;h1=…` (order-insensitive); null when malformed. */
export function parsePaddleSignature(header: string | null): PaddleSignatureParts | null {
  if (!header) return null
  const parts: Record<string, string> = {}
  for (const segment of header.split(';')) {
    const eq = segment.indexOf('=')
    if (eq > 0) parts[segment.slice(0, eq).trim()] = segment.slice(eq + 1).trim()
  }
  if (!parts.ts || !parts.h1) return null
  return { ts: parts.ts, h1: parts.h1 }
}

/** The exact string Paddle signs: timestamp, colon, raw body. */
export function signedPayload(ts: string, rawBody: string): string {
  return `${ts}:${rawBody}`
}

/** Hex string comparison without early-exit timing leaks. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  const bytes = new Uint8Array(sig)
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}

/** True when the `ts` is within the accepted window of `nowSec`. */
export function signatureTimestampFresh(ts: string, nowSec: number): boolean {
  const t = Number(ts)
  if (!Number.isFinite(t) || t <= 0) return false
  return t <= nowSec + PADDLE_SIGNATURE_MAX_AGE_SEC && nowSec - t <= PADDLE_SIGNATURE_MAX_AGE_SEC
}

/** Full check: header shape, freshness, HMAC over `ts:rawBody`. */
export async function verifyPaddleSignature(
  header: string | null,
  rawBody: string,
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const parts = parsePaddleSignature(header)
  if (!parts || !secret) return false
  if (!signatureTimestampFresh(parts.ts, nowSec)) return false
  const expected = await hmacSha256Hex(secret, signedPayload(parts.ts, rawBody))
  return timingSafeEqualHex(expected, parts.h1.toLowerCase())
}

// --- price map (mirrors the PADDLE_PRICE_MAP secret of both Paddle functions) ---------------

export type PaddlePriceKind = 'subscription' | 'credit'

export interface PriceMapping {
  plan?: PlanIdLite
  kind: PaddlePriceKind
  interval?: 'month' | 'year'
  creditUsdMicros?: number
}

/** Plan ids the webhook may grant (free is never a purchasable plan). */
export type PlanIdLite = 'basic' | 'plus' | 'pro'

/** Parses the PADDLE_PRICE_MAP secret JSON; returns null when unset/invalid. */
export function parsePriceMap(raw: string | undefined | null): Record<string, PriceMapping> | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, PriceMapping>
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/** Subscription grant for a price id, or null when the price isn't mapped. */
export function subscriptionPlanOf(
  priceMap: Record<string, PriceMapping>,
  priceId: string | undefined | null,
): PlanIdLite | null {
  if (!priceId) return null
  const m = priceMap[priceId]
  return m && m.kind === 'subscription' && (m.plan === 'basic' || m.plan === 'plus' || m.plan === 'pro')
    ? m.plan
    : null
}
