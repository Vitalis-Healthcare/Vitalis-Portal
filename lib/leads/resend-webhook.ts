// lib/leads/resend-webhook.ts
// ═════════════════════════════════════════════════════════════════════════
// Ship 5c (v0.6.49) — verification for inbound Resend webhooks.
//
// Resend signs webhooks with the Svix scheme. Rather than add the `svix`
// package, we verify with Node crypto — the same posture as
// lib/carematch-webhook.ts, which already does HMAC by hand.
//
// The scheme: HMAC-SHA256 over `${svix-id}.${svix-timestamp}.${rawBody}`,
// keyed by the base64-decoded portion of the secret after "whsec_", then
// base64-encoded and compared against one of the space-delimited
// "v1,<signature>" entries in the svix-signature header.
//
// FAILS CLOSED. No secret configured, missing headers, stale timestamp, or
// no matching signature => rejected. An unverified webhook must never be
// allowed to mutate email status.
// ═════════════════════════════════════════════════════════════════════════
import { createHmac, timingSafeEqual } from 'node:crypto'

/** Reject anything older than this to blunt replay attacks. */
const TOLERANCE_SECONDS = 5 * 60

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: string; status: number }

export function resendWebhookSecret(): string | undefined {
  return process.env.RESEND_WEBHOOK_SECRET
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function verifyResendSignature(args: {
  rawBody: string
  svixId: string | null
  svixTimestamp: string | null
  svixSignature: string | null
  secret: string | undefined
}): VerifyResult {
  const { rawBody, svixId, svixTimestamp, svixSignature, secret } = args

  if (!secret) {
    return {
      ok: false,
      status: 503,
      reason: 'RESEND_WEBHOOK_SECRET is not configured on this deployment',
    }
  }
  if (!svixId || !svixTimestamp || !svixSignature) {
    return { ok: false, status: 400, reason: 'Missing Svix signature headers' }
  }

  const ts = Number(svixTimestamp)
  if (!Number.isFinite(ts)) {
    return { ok: false, status: 400, reason: 'Malformed svix-timestamp' }
  }
  const drift = Math.abs(Math.floor(Date.now() / 1000) - ts)
  if (drift > TOLERANCE_SECONDS) {
    return { ok: false, status: 400, reason: `Timestamp outside tolerance (${drift}s)` }
  }

  // "whsec_<base64>" — the prefix is not part of the key material.
  const rawKey = secret.startsWith('whsec_') ? secret.slice(6) : secret
  let keyBytes: Buffer
  try {
    keyBytes = Buffer.from(rawKey, 'base64')
  } catch {
    return { ok: false, status: 503, reason: 'RESEND_WEBHOOK_SECRET is not valid base64' }
  }

  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`
  const expected = createHmac('sha256', keyBytes).update(signedContent).digest('base64')

  // Header may carry several versioned signatures; any v1 match is valid.
  for (const part of svixSignature.split(' ')) {
    const [version, sig] = part.split(',')
    if (version === 'v1' && sig && safeEqual(sig, expected)) return { ok: true }
  }
  return { ok: false, status: 401, reason: 'No matching v1 signature' }
}

// ── Event vocabulary ────────────────────────────────────────────────────

export type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.bounced'
  | 'email.complained'
  | 'email.opened'
  | 'email.clicked'

export interface ResendEvent {
  type: string
  created_at?: string
  data?: {
    email_id?: string
    to?: string[] | string
    subject?: string
    bounce?: { message?: string; type?: string; subType?: string }
    reason?: string
  }
}

/** Pull the Resend message id out of an event, whatever shape it arrives in. */
export function eventEmailId(evt: ResendEvent): string | null {
  const id = evt.data?.email_id
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

/** A human-readable bounce reason for the timeline and the badge tooltip. */
export function bounceReason(evt: ResendEvent): string | null {
  const b = evt.data?.bounce
  const parts = [b?.message, b?.type, b?.subType, evt.data?.reason]
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
  if (!parts.length) return null
  return parts.join(' \u00b7 ').slice(0, 500)
}
