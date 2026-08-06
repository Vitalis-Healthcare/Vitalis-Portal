// app/api/webhooks/resend/route.ts
// ═════════════════════════════════════════════════════════════════════════
// Ship 5c (v0.6.49) — inbound Resend delivery events.
//
// Turns "Sent" (we handed it to Resend) into the truth: Delivered, Opened,
// Bounced, or Marked spam. Matches strictly on lead_emails.resend_id;
// anything else the portal sends (credential reminders, digests) is
// acknowledged and ignored — those are not lead emails and must not 500.
//
// Invariants:
//   • FAIL CLOSED — unverified requests never mutate anything.
//   • BOUNCE AND COMPLAINT ARE TERMINAL — webhook ordering is not
//     guaranteed, so a late 'opened' can never flip a bounce back to green.
//   • IDEMPOTENT — Svix retries; replaying an event changes nothing.
//   • Always 200 once verified, even when we ignore the event. A non-2xx
//     makes Resend retry forever for mail we simply don't track.
// ═════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  verifyResendSignature, resendWebhookSecret, eventEmailId, bounceReason,
  type ResendEvent,
} from '@/lib/leads/resend-webhook'

export const dynamic = 'force-dynamic'

/** Terminal states cannot be downgraded by a later, out-of-order event. */
const TERMINAL = ['bounced', 'complained']

export async function POST(req: NextRequest) {
  // The signature covers the RAW body — read text, never req.json() first.
  const rawBody = await req.text()

  const verdict = verifyResendSignature({
    rawBody,
    svixId: req.headers.get('svix-id'),
    svixTimestamp: req.headers.get('svix-timestamp'),
    svixSignature: req.headers.get('svix-signature'),
    secret: resendWebhookSecret(),
  })
  if (!verdict.ok) {
    console.error('[webhooks/resend] rejected:', verdict.reason)
    return NextResponse.json({ error: verdict.reason }, { status: verdict.status })
  }

  let evt: ResendEvent
  try {
    evt = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Body is not valid JSON' }, { status: 400 })
  }

  const emailId = eventEmailId(evt)
  if (!emailId) return NextResponse.json({ ignored: 'no email id on event' })

  const svc = createServiceClient()
  const { data: row } = await svc
    .from('lead_emails')
    .select('id, lead_id, status, subject, template_key, to_email, opened_at, delivered_at')
    .eq('resend_id', emailId)
    .maybeSingle()

  // Not one of ours (credential reminders, digests, anything else).
  if (!row) return NextResponse.json({ ignored: 'not a lead email' })

  const at = evt.created_at && !isNaN(Date.parse(evt.created_at))
    ? new Date(evt.created_at).toISOString()
    : new Date().toISOString()

  const isTerminal = TERMINAL.includes(row.status)
  const update: Record<string, unknown> = {}
  let timelineNote: string | null = null

  switch (evt.type) {
    case 'email.delivered':
      if (!isTerminal) {
        update.status = 'delivered'
        update.delivered_at = row.delivered_at || at
      }
      break

    case 'email.opened':
      // Open implies delivery, but never overrides a terminal state.
      if (!isTerminal) {
        update.status = 'delivered'
        update.delivered_at = row.delivered_at || at
        update.opened_at = row.opened_at || at
      }
      break

    case 'email.bounced': {
      const reason = bounceReason(evt)
      update.status = 'bounced'
      update.bounced_at = at
      update.failure_reason = reason || 'The receiving server rejected this email'
      timelineNote = row.template_key === 'consent_request'
        ? `Service Agreement email bounced \u2014 ${row.to_email} did not receive the signing link. Check the address and re-send the agreement.`
        : `Email bounced: ${row.subject} \u2014 ${row.to_email} did not receive it. The address may be wrong.`
      break
    }

    case 'email.complained':
      update.status = 'complained'
      update.bounced_at = row.status === 'complained' ? undefined : at
      update.failure_reason = 'The recipient reported this email as spam'
      timelineNote = `Email marked as spam by ${row.to_email}: ${row.subject}. Avoid re-sending to this address without speaking to them first.`
      break

    case 'email.delivery_delayed':
      // Informational only — the message is still in flight.
      return NextResponse.json({ ok: true, noted: 'delivery delayed' })

    default:
      // email.sent, email.clicked, and anything Resend adds later.
      return NextResponse.json({ ok: true, ignored: evt.type })
  }

  // Idempotency: a replayed event yields nothing new to write.
  for (const k of Object.keys(update)) if (update[k] === undefined) delete update[k]
  if (!Object.keys(update).length) {
    return NextResponse.json({ ok: true, noop: 'already in a terminal or equal state' })
  }

  const { error: updErr } = await svc.from('lead_emails').update(update).eq('id', row.id)
  if (updErr) {
    console.error('[webhooks/resend] update failed:', updErr.message)
    return NextResponse.json({ error: 'Could not record the event' }, { status: 500 })
  }

  // Bounces and complaints get a timeline line — the badge alone is too
  // quiet to notice. Only on the FIRST transition, so retries stay silent.
  if (timelineNote && !isTerminal) {
    try {
      await svc.from('lead_activities').insert({
        lead_id: row.lead_id, created_by: null,
        activity_type: 'note', content: timelineNote,
      })
    } catch (err) {
      console.error('[webhooks/resend] timeline insert failed:', err)
    }
  }

  return NextResponse.json({ ok: true, applied: evt.type })
}
