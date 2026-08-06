import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendLeadEvent, detectEventType } from '@/lib/carematch-webhook'
import { LEAD_STATUSES, legacyWireStatus, prettyKey } from '@/lib/leads/model'

const VALID_STATUSES = LEAD_STATUSES.map(s => s.key as string)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, ...rawFields } = body
  if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })

  // Strip non-column fields that come from Supabase joins (assignee, creator objects etc.)
  // ── v0.6.38: stage/status split — stage, standby, lost-reason code,
  // probability and the secondary owner join the allowed set. archived_at
  // is deliberately NOT here: archiving goes through /api/leads/delete.
  const ALLOWED_COLUMNS = [
    'full_name', 'client_name', 'email', 'phone', 'source', 'referral_name',
    'referral_source_id', 'status', 'stage', 'relationship', 'care_types', 'condition_notes',
    'preferred_schedule', 'estimated_hours_week', 'hourly_rate',
    'expected_start_date', 'expected_close_date', 'won_date', 'lost_date',
    'lost_reason', 'lost_reason_code', 'standby_until', 'standby_reason',
    'close_probability', 'notes', 'assigned_to', 'secondary_assigned_to',
    'next_action_type', 'next_action_due', 'next_action_note',
    'address', 'city', 'state', 'zip', 'date_of_birth',
  ]
  const fields: Record<string, any> = {}
  for (const col of ALLOWED_COLUMNS) {
    if (col in rawFields) fields[col] = rawFields[col]
  }

  // Null-coerce empty strings — Postgres rejects '' for uuid/date columns
  const UUID_FIELDS = ['referral_source_id', 'assigned_to', 'secondary_assigned_to']
  const DATE_FIELDS = ['expected_close_date', 'expected_start_date', 'won_date', 'lost_date', 'date_of_birth', 'standby_until', 'next_action_due']
  for (const f of [...UUID_FIELDS, ...DATE_FIELDS]) {
    if (fields[f] === '' || fields[f] === 'Invalid Date') fields[f] = null
  }
  if (fields.close_probability !== undefined) {
    if (fields.close_probability === null || fields.close_probability === '') {
      fields.close_probability = null
    } else {
      const p = Math.round(Number(fields.close_probability))
      fields.close_probability = isNaN(p) ? null : Math.min(100, Math.max(0, p))
    }
  }

  // Load the previous state — needed for transition guards, the activity
  // log, AND webhook event-type detection.
  const { data: prevLead } = await svc.from('leads').select('*').eq('id', id).single()
  if (!prevLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  // ── Status transition guards + automatic outcome dates ───────────────
  const todayStr = new Date().toISOString().split('T')[0]
  if (fields.status !== undefined) {
    const next = String(fields.status || '').toLowerCase()
    if (!VALID_STATUSES.includes(next)) {
      return NextResponse.json({ error: `Invalid status '${fields.status}'. Allowed: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
    }
    fields.status = next
    const changed = next !== prevLead.status

    if (changed && next === 'standby') {
      // A pause without a wake-up date is how a lead gets forgotten.
      const until = fields.standby_until ?? prevLead.standby_until
      if (!until) {
        return NextResponse.json({ error: 'Standby requires a follow-up date (standby_until).' }, { status: 400 })
      }
    }
    if (changed && next === 'lost') {
      const code = fields.lost_reason_code ?? prevLead.lost_reason_code
      if (!code) {
        return NextResponse.json({ error: 'Marking a lead Lost requires a reason (lost_reason_code).' }, { status: 400 })
      }
      if (fields.lost_date === undefined && !prevLead.lost_date) fields.lost_date = todayStr
    }
    if (changed && next === 'won') {
      if (fields.won_date === undefined && !prevLead.won_date) fields.won_date = todayStr
    }
    if (changed && next === 'ongoing') {
      // Reopening clears the outcome and the pause so the metrics stay honest.
      if (fields.won_date === undefined) fields.won_date = null
      if (fields.lost_date === undefined) fields.lost_date = null
      if (fields.standby_until === undefined) fields.standby_until = null
      if (fields.standby_reason === undefined) fields.standby_reason = null
      // ── v0.6.39: a reopened lead needs a next step or it will be
      // forgotten all over again.
      const due = fields.next_action_due ?? prevLead.next_action_due
      if (!due) {
        return NextResponse.json({ error: 'Reopening a lead requires a next action (next_action_type + next_action_due).' }, { status: 400 })
      }
    }
  }

  // ── v0.6.39: no open lead without a next action. An Ongoing lead's
  // next action can be REPLACED, never merely erased — clearing it means
  // either scheduling the next step or changing the status.
  const resultingStatus = (fields.status !== undefined ? fields.status : prevLead.status)
  if (resultingStatus === 'ongoing' && 'next_action_due' in fields && !fields.next_action_due) {
    return NextResponse.json({ error: 'An ongoing lead needs a next action. Set a new one, or move the lead to Standby / an outcome.' }, { status: 400 })
  }

  const { data: lead, error } = await svc.from('leads').update(fields).eq('id', id).select().single()
  if (error) {
    console.error('leads/update error:', error.message, '| fields:', JSON.stringify(fields))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Auto-log stage and status changes ────────────────────────────────
  const statusLabel = (k: string) => LEAD_STATUSES.find(s => s.key === k)?.label || prettyKey(k)
  if (fields.stage !== undefined && fields.stage !== prevLead.stage) {
    await svc.from('lead_activities').insert({
      lead_id: id, created_by: user.id,
      activity_type: 'status_change',
      content: `Stage moved: ${prettyKey(prevLead.stage)} \u2192 ${prettyKey(fields.stage)}`,
    })
  }
  if (fields.status !== undefined && fields.status !== prevLead.status) {
    let detail = ''
    if (fields.status === 'standby' && lead.standby_until) detail = ` (until ${lead.standby_until})`
    if (fields.status === 'lost' && lead.lost_reason_code) detail = ` (${prettyKey(lead.lost_reason_code)})`
    await svc.from('lead_activities').insert({
      lead_id: id, created_by: user.id,
      activity_type: 'status_change',
      content: `Status changed: ${statusLabel(prevLead.status)} \u2192 ${statusLabel(fields.status)}${detail}`,
    })
  }

  // ── Fire CareMatch360 webhook (fire-and-forget) ──────────────────────
  // detectEventType inspects field deltas and returns the right event name,
  // or null if nothing CareMatch360 cares about changed. The wire speaks
  // the legacy vocabulary — see lib/leads/model.ts.
  const eventType = detectEventType(prevLead, lead)
  if (eventType) {
    sendLeadEvent(eventType, lead, legacyWireStatus(prevLead)).catch(err => {
      console.error('[leads/update] webhook fire-and-forget error:', err)
    })
  }

  return NextResponse.json({ lead })
}
