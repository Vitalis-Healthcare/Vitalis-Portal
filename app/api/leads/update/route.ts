import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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
  const { id, logActivity, previousStatus, ...rawFields } = body
  if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })

  // Strip non-column fields that come from Supabase joins (assignee, creator objects etc.)
  const ALLOWED_COLUMNS = [
    'full_name', 'client_name', 'email', 'phone', 'source', 'referral_name',
    'referral_source_id', 'status', 'relationship', 'care_types', 'condition_notes',
    'preferred_schedule', 'estimated_hours_week', 'hourly_rate',
    'expected_start_date', 'expected_close_date', 'won_date', 'lost_date',
    'lost_reason', 'notes', 'assigned_to',
    // ── v0.1.0: address + DOB for CareMatch360 hand-off ──
    'address', 'city', 'state', 'zip', 'date_of_birth',
  ]
  const fields: Record<string, any> = {}
  for (const col of ALLOWED_COLUMNS) {
    if (col in rawFields) fields[col] = rawFields[col]
  }

  // Null-coerce empty strings — Postgres rejects '' for uuid/date columns
  const UUID_FIELDS = ['referral_source_id', 'assigned_to']
  const DATE_FIELDS = ['expected_close_date', 'expected_start_date', 'won_date', 'lost_date', 'date_of_birth']
  for (const f of [...UUID_FIELDS, ...DATE_FIELDS]) {
    if (fields[f] === '' || fields[f] === 'Invalid Date') fields[f] = null
  }

  const { data: lead, error } = await svc.from('leads').update(fields).eq('id', id).select().single()
  if (error) {
    console.error('leads/update error:', error.message, '| fields:', JSON.stringify(fields))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-log status change
  if (fields.status && fields.status !== previousStatus) {
    const labels: Record<string, string> = {
      new: 'New', contacted: 'Contacted', assessment_scheduled: 'Assessment Scheduled',
      proposal_sent: 'Proposal Sent', won: 'Won ✓', on_hold: 'On Hold',
      cold: 'Cold', lost: 'Lost'
    }
    await svc.from('lead_activities').insert({
      lead_id: id, created_by: user.id,
      activity_type: 'status_change',
      content: `Status changed: ${labels[previousStatus] || previousStatus} → ${labels[fields.status] || fields.status}`,
    })
  }

  return NextResponse.json({ lead })
}
