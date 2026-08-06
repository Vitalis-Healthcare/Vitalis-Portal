import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendLeadEvent } from '@/lib/carematch-webhook'

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
  const { full_name, source } = body
  // Null-coerce empty strings — Postgres rejects '' for uuid/date columns
  const NULLABLE = [
    'referral_source_id', 'assigned_to', 'secondary_assigned_to', 'created_by',
    'expected_close_date', 'expected_start_date', 'won_date', 'date_of_birth',
    'standby_until', 'next_action_due',
  ]
  for (const f of NULLABLE) {
    if (body[f] === '' || body[f] === 'Invalid Date') body[f] = null
  }

  if (!full_name?.trim() || !source) {
    return NextResponse.json({ error: 'Name and source are required' }, { status: 400 })
  }

  // ── v0.6.39: a lead you cannot reach, size, or schedule is a rumor, ──
  // not a lead. Server-side enforcement mirrors the form.
  if (!body.phone?.trim() && !body.email?.trim()) {
    return NextResponse.json({ error: 'A phone number or an email is required — at least one way to reach them.' }, { status: 400 })
  }
  const hoursNum = Number(body.estimated_hours_week)
  const rateNum = Number(body.hourly_rate)
  if (!hoursNum || hoursNum <= 0) {
    return NextResponse.json({ error: 'Estimated weekly hours are required (start at the 12h/week floor if unsure).' }, { status: 400 })
  }
  if (!rateNum || rateNum <= 0) {
    return NextResponse.json({ error: 'An hourly rate is required (start at the $32.50 floor if unsure).' }, { status: 400 })
  }
  if (!body.expected_close_date) {
    return NextResponse.json({ error: 'A target close date is required.' }, { status: 400 })
  }
  // No open lead without a next action — from birth.
  if (!body.next_action_due || !body.next_action_type) {
    return NextResponse.json({ error: 'A first next action (type and due date) is required.' }, { status: 400 })
  }

  // ── v0.6.38: stage/status split ──────────────────────────────────────
  // A new lead is always operationally ALIVE (status 'ongoing'); the form
  // may choose its initial journey stage. Whatever the client sent for
  // status is ignored — outcomes are set later, deliberately, on the
  // detail page.
  const stage = (typeof body.stage === 'string' && body.stage.trim()) ? body.stage.trim() : 'new'
  delete body.status
  delete body.stage

  // close_probability: integer percent 0–100 or null
  let closeProbability: number | null = null
  if (body.close_probability !== undefined && body.close_probability !== null && body.close_probability !== '') {
    const p = Math.round(Number(body.close_probability))
    if (!isNaN(p)) closeProbability = Math.min(100, Math.max(0, p))
  }
  delete body.close_probability

  const { data: lead, error } = await svc.from('leads').insert({
    ...body,
    full_name: full_name.trim(),
    stage,
    status: 'ongoing',
    close_probability: closeProbability,
    created_by: user.id,
    assigned_to: body.assigned_to || user.id,
  }).select().single()

  if (error) {
    console.error('leads/create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-log a creation activity
  await svc.from('lead_activities').insert({
    lead_id: lead.id, created_by: user.id,
    activity_type: 'note',
    content: `Lead created — source: ${source}${body.referral_name ? ` (referred by ${body.referral_name})` : ''}`,
  })

  // Fire-and-forget CareMatch360 webhook — a webhook failure never loses a lead
  sendLeadEvent('lead.created', lead).catch(err => {
    console.error('[leads/create] webhook fire-and-forget error:', err)
  })

  return NextResponse.json({ lead })
}
