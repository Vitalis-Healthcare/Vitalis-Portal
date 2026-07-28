// ═════════════════════════════════════════════════════════════════════════
// POST /api/webhooks/carematch-provider   (v0.6.25)
//
// Receives a provider record pushed from CareMatch360 and turns it into a Vita
// candidate with a PRE-FILLED application draft. When that candidate later
// reaches /onboarding/application, the page already loads any saved draft
// through applicationRowToData(), so the form comes up populated and editable
// with no change to the form itself.
//
// Authenticated by HMAC-SHA256 over the raw body, exactly as CareMatch360's own
// /api/webhooks/vita-lead receiver does. This repo has NO middleware, so this
// route is public the moment it exists and gates itself entirely on the
// signature.
//
// Deliberate divergences from the vita-lead receiver, both because this endpoint
// CREATES candidate records rather than refreshing a draft case:
//   • a five-minute replay window on `sent_at`
//   • fill-blanks-only merging, and a hard refusal once the application is
//     submitted — an inbound push must never overwrite a person's own answers
//
// No invite is sent from here. A CareMatch360 admin pressing a button must not
// cause Vita to email a stranger; the candidate lands at 'invited' with no token
// and a coordinator presses Invite on the candidates list.
// ═════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { buildApplicationRow } from '@/lib/onboarding/sanitize'
import {
  type CarematchEnvelope,
  looksLikeEmail,
  mapProviderToApplication,
  mergeBlanksOnly,
  splitName,
} from '@/lib/carematch-inbound'

export const dynamic = 'force-dynamic'

/** How far out of date `sent_at` may be before the push is refused. */
const REPLAY_WINDOW_MS = 5 * 60 * 1000

const SOURCE = 'carematch360'

/**
 * Byte-for-byte verification of the raw request body. Parsing and re-serialising
 * the JSON would change the bytes and break the signature, which is why the
 * handler reads req.text() and only then parses.
 *
 * Mirrors verifySignature() in CareMatch360's vita-lead receiver so the two
 * directions can never disagree about what a valid signature looks like.
 */
function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const provided = signature.startsWith('sha256=') ? signature.slice(7) : signature
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  // timingSafeEqual requires equal-length buffers.
  if (provided.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Signature ──────────────────────────────────────────────────────
    const secret = process.env.CAREMATCH_INBOUND_SECRET
    if (!secret) {
      console.error('[carematch-provider] CAREMATCH_INBOUND_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const rawBody = await req.text()
    if (!verifySignature(rawBody, req.headers.get('x-carematch-signature'), secret)) {
      console.warn('[carematch-provider] invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // ── 2. Envelope ───────────────────────────────────────────────────────
    let envelope: CarematchEnvelope
    try {
      envelope = JSON.parse(rawBody) as CarematchEnvelope
    } catch {
      return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 })
    }

    const provider = envelope?.provider
    if (!envelope?.event || !provider?.id) {
      return NextResponse.json({ error: 'Invalid payload: event and provider.id are required' }, { status: 400 })
    }

    // Replay window. A captured request replayed later would only re-fill the
    // same blanks, but this endpoint creates records, so it is worth closing.
    const sentAt = Date.parse(envelope.sent_at || '')
    if (!Number.isFinite(sentAt) || Math.abs(Date.now() - sentAt) > REPLAY_WINDOW_MS) {
      return NextResponse.json(
        { error: 'This request is too old or its timestamp is unreadable. Please try again.', code: 'stale_timestamp' },
        { status: 400 },
      )
    }

    // ── 3. Data Vita cannot work without ──────────────────────────────────
    // Both refusals are written to be shown verbatim on the CareMatch360 button.
    const email = (provider.email || '').trim().toLowerCase()
    if (!looksLikeEmail(email)) {
      return NextResponse.json({
        error: 'This provider has no usable email address. Vita identifies candidates by email and sends the competency test there. Add an email in CareMatch360 and try again.',
        code: 'email_required',
      }, { status: 422 })
    }

    const name = splitName(provider.name)
    if (!name) {
      return NextResponse.json({
        error: 'This provider\u2019s name is a single word. Vita needs a first and a last name. Please complete the name in CareMatch360 and try again.',
        code: 'name_incomplete',
      }, { status: 422 })
    }

    const svc = createServiceClient()
    const nowIso = new Date().toISOString()

    // ── 4. Find or create the candidate ───────────────────────────────────
    // The provider id is the authoritative idempotency key. Email is a
    // best-effort second pass so a candidate a coordinator already keyed in by
    // hand is picked up rather than duplicated.
    let candidate: { id: string; status: string; carematch_provider_id: string | null } | null = null

    const { data: byProvider } = await svc
      .from('onb_candidates')
      .select('id, status, carematch_provider_id')
      .eq('carematch_provider_id', provider.id)
      .maybeSingle()
    candidate = byProvider ?? null

    if (!candidate) {
      const { data: byEmail } = await svc
        .from('onb_candidates')
        .select('id, status, carematch_provider_id')
        .eq('email', email)
        .maybeSingle()
      candidate = byEmail ?? null
    }

    // A candidate already claimed by a DIFFERENT provider means two CareMatch360
    // records share an email. Linking would breach the unique index and, worse,
    // silently merge two people. Refuse and say so.
    if (candidate?.carematch_provider_id && candidate.carematch_provider_id !== provider.id) {
      return NextResponse.json({
        error: 'A different CareMatch360 provider is already linked to this email address in Vita. Please check for a duplicate provider record.',
        code: 'provider_conflict',
      }, { status: 409 })
    }

    let created = false
    if (!candidate) {
      const { data: inserted, error: insErr } = await svc
        .from('onb_candidates')
        .insert({
          first_name: name.first,
          last_name: name.last,
          email,
          status: 'invited',
          source: SOURCE,
          carematch_provider_id: provider.id,
          // No access_token: the invite is a deliberate human act. The
          // candidates list shows "Invite" until a coordinator presses it.
        })
        .select('id, status, carematch_provider_id')
        .single()

      if (insErr || !inserted) {
        console.error('[carematch-provider] candidate insert failed:', insErr?.message)
        return NextResponse.json({ error: 'Could not create the candidate in Vita.' }, { status: 500 })
      }
      candidate = inserted
      created = true
    } else if (!candidate.carematch_provider_id) {
      // Existing Vita candidate, first time we have seen them from CareMatch360.
      const { error: linkErr } = await svc
        .from('onb_candidates')
        .update({ carematch_provider_id: provider.id, updated_at: nowIso })
        .eq('id', candidate.id)
      if (linkErr) {
        console.error('[carematch-provider] candidate link failed:', linkErr.message)
        return NextResponse.json({ error: 'Could not link this provider to the existing Vita candidate.' }, { status: 500 })
      }
    }

    // ── 5. The application draft ──────────────────────────────────────────
    const { data: existingApp } = await svc
      .from('onb_applications')
      .select('*')
      .eq('candidate_id', candidate.id)
      .maybeSingle()

    // Once submitted, the application is the candidate's sworn statement. An
    // inbound push does not get to touch it; staff edit it through the existing
    // staff edit route, where the change is attributable.
    if (existingApp?.submitted_at) {
      return NextResponse.json({
        ok: false,
        candidate_id: candidate.id,
        created,
        error: 'This candidate has already submitted their Vita application, so it was not changed. Their details are on the candidate page.',
        code: 'application_already_submitted',
      }, { status: 409 })
    }

    // Route the mapped values through the SAME sanitiser both application write
    // paths use, so the receiver can never drift from them — and inherits any
    // future correction to it.
    const mapped = mapProviderToApplication(provider)
    const sanitized = buildApplicationRow(mapped as Record<string, unknown>)
    const { row, filled, skipped } = mergeBlanksOnly(existingApp ?? null, sanitized)

    if (Object.keys(row).length > 0) {
      const { error: upErr } = await svc
        .from('onb_applications')
        .upsert({ candidate_id: candidate.id, ...row, updated_at: nowIso }, { onConflict: 'candidate_id' })
      if (upErr) {
        console.error('[carematch-provider] application upsert failed:', upErr.message)
        return NextResponse.json({ error: 'The candidate was saved but the application draft could not be written.' }, { status: 500 })
      }
    }

    const portalUrl = (process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app').replace(/\/+$/, '')

    return NextResponse.json({
      ok: true,
      created,
      candidate_id: candidate.id,
      candidate_url: `${portalUrl}/candidates/${candidate.id}`,
      fields_filled: filled.length,
      fields_left_alone: skipped.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[carematch-provider] threw:', message)
    return NextResponse.json({ error: 'Unexpected error handling the provider push.' }, { status: 500 })
  }
}

/**
 * Health check. CareMatch360 (or a browser) can hit this to confirm the endpoint
 * is routable and a secret is configured. Reports only whether one is SET —
 * never its value.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/webhooks/carematch-provider',
    secret_configured: !!process.env.CAREMATCH_INBOUND_SECRET,
  })
}
