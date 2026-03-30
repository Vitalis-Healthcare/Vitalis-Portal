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
  const { id, logActivity, previousStatus, ...fields } = body
  // Null-coerce empty strings — Postgres rejects '' for uuid/date columns
  const UUID_FIELDS = ['referral_source_id', 'assigned_to']
  const DATE_FIELDS = ['expected_close_date', 'expected_start_date', 'won_date']
  for (const f of [...UUID_FIELDS, ...DATE_FIELDS]) {
    if ((fields as any)[f] === '') (fields as any)[f] = null
  }
  if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })

  const { data: lead, error } = await svc.from('leads').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
