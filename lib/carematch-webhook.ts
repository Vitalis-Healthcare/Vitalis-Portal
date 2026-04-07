// ═════════════════════════════════════════════════════════════════════════
// CareMatch360 webhook helper
// Sends signed lead lifecycle events to CareMatch360 so it can pre-match
// providers while the deal is still in flight on our side.
//
// Auth: HMAC-SHA256 over the raw body, sent in X-Vita-Signature header.
// Both this app and CareMatch360 share the same CAREMATCH_WEBHOOK_SECRET.
// ═════════════════════════════════════════════════════════════════════════

import { createHmac } from 'node:crypto'

export type CarematchEventType =
  | 'lead.created'
  | 'lead.updated'
  | 'lead.won'
  | 'lead.lost'
  | 'lead.cancelled'

// The shape we send. Mirror this on the CareMatch360 side
// (lib/vita-mapping.ts → VitaLeadPayload).
interface SerializedLead {
  id: string
  full_name: string
  client_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  date_of_birth: string | null
  status: string
  source: string | null
  relationship: string | null
  care_types: string[] | null
  condition_notes: string | null
  preferred_schedule: string | null
  estimated_hours_week: number | null
  hourly_rate: number | null
  expected_start_date: string | null
  expected_close_date: string | null
  notes: string | null
}

interface SendResult {
  ok: boolean
  status?: number
  error?: string
  response?: any
}

function serializeLead(lead: any): SerializedLead {
  return {
    id:                   lead.id,
    full_name:            lead.full_name,
    client_name:          lead.client_name ?? null,
    email:                lead.email ?? null,
    phone:                lead.phone ?? null,
    address:              lead.address ?? null,
    city:                 lead.city ?? null,
    state:                lead.state ?? null,
    zip:                  lead.zip ?? null,
    date_of_birth:        lead.date_of_birth ?? null,
    status:               lead.status,
    source:               lead.source ?? null,
    relationship:         lead.relationship ?? null,
    care_types:           lead.care_types ?? null,
    condition_notes:      lead.condition_notes ?? null,
    preferred_schedule:   lead.preferred_schedule ?? null,
    estimated_hours_week: lead.estimated_hours_week ?? null,
    hourly_rate:          lead.hourly_rate ?? null,
    expected_start_date:  lead.expected_start_date ?? null,
    expected_close_date:  lead.expected_close_date ?? null,
    notes:                lead.notes ?? null,
  }
}

export async function sendLeadEvent(
  eventType: CarematchEventType,
  lead: any,
  previousStatus?: string,
): Promise<SendResult> {
  const url    = process.env.CAREMATCH_WEBHOOK_URL
  const secret = process.env.CAREMATCH_WEBHOOK_SECRET

  if (!url || !secret) {
    // Soft failure — webhook not configured. We log but don't surface this
    // as an error to the caller, since the webhook is opportunistic.
    console.warn('[carematch-webhook] CAREMATCH_WEBHOOK_URL or CAREMATCH_WEBHOOK_SECRET not set; skipping')
    return { ok: false, error: 'Webhook not configured' }
  }

  if (!lead?.id) {
    return { ok: false, error: 'Lead missing id' }
  }

  const envelope = {
    event:           eventType,
    lead:            serializeLead(lead),
    previous_status: previousStatus,
    sent_at:         new Date().toISOString(),
  }

  const rawBody  = JSON.stringify(envelope)
  const signature = createHmac('sha256', secret).update(rawBody).digest('hex')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Vita-Signature': `sha256=${signature}`,
        'X-Vita-Event':     eventType,
      },
      body: rawBody,
    })

    let responseBody: any = null
    try { responseBody = await res.json() } catch {}

    if (!res.ok) {
      console.error(`[carematch-webhook] ${eventType} failed:`, res.status, responseBody)
      return { ok: false, status: res.status, error: responseBody?.error || `HTTP ${res.status}`, response: responseBody }
    }

    return { ok: true, status: res.status, response: responseBody }
  } catch (err: any) {
    console.error(`[carematch-webhook] ${eventType} threw:`, err.message)
    return { ok: false, error: err.message }
  }
}

// Decide which event type a lead update represents based on field deltas.
// Returns null if the update doesn't warrant a webhook (e.g. only assignee
// changed, no fields CareMatch360 cares about).
export function detectEventType(
  prev: any,
  next: any,
): CarematchEventType | null {
  const prevStatus = prev?.status
  const nextStatus = next?.status

  if (prevStatus !== nextStatus) {
    if (nextStatus === 'won')                      return 'lead.won'
    if (nextStatus === 'lost')                     return 'lead.lost'
    if (nextStatus === 'cold' || nextStatus === 'on_hold') return 'lead.cancelled'
    // Any other status change is just an update
    return 'lead.updated'
  }

  // Same status — check if any fields CareMatch360 actually uses changed.
  const fieldsThatMatter = [
    'full_name', 'client_name', 'phone', 'email',
    'address', 'city', 'state', 'zip', 'date_of_birth',
    'care_types', 'condition_notes', 'preferred_schedule',
    'estimated_hours_week', 'hourly_rate',
    'expected_start_date', 'expected_close_date', 'notes',
  ]
  for (const f of fieldsThatMatter) {
    const a = prev?.[f]
    const b = next?.[f]
    // Shallow compare — array fields are compared via JSON since they're small
    if (Array.isArray(a) || Array.isArray(b)) {
      if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) return 'lead.updated'
    } else if (a !== b) {
      // Treat null and undefined as equal
      if (!(a == null && b == null)) return 'lead.updated'
    }
  }

  return null
}
