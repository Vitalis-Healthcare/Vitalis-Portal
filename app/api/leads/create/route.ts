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
  if (body.referral_source_id === '') body.referral_source_id = null
  if (body.assigned_to === '') body.assigned_to = null
  if (body.created_by === '') body.created_by = null
  if (body.expected_close_date === '') body.expected_close_date = null
  if (body.expected_start_date === '') body.expected_start_date = null
  if (body.won_date === '') body.won_date = null

  if (!full_name?.trim() || !source) {
    return NextResponse.json({ error: 'Name and source are required' }, { status: 400 })
  }

  const { data: lead, error } = await svc.from('leads').insert({
    ...body,
    full_name: full_name.trim(),
    created_by: user.id,
    assigned_to: body.assigned_to || user.id,
  }).select().single()

  if (error) {
    console.error('leads/create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-log a creation activity
  await svc.from('lead_activities').insert({
    lead_id: lead.id,
    created_by: user.id,
    activity_type: 'note',
    content: `Lead created — source: ${source}${body.referral_name ? ` (referred by ${body.referral_name})` : ''}`,
  })

  // ── v0.2.0: fire CareMatch360 webhook (fire-and-forget) ──
  // We don't await — the user shouldn't have their UI block on a downstream
  // service, and we don't want a CareMatch360 outage to fail lead creation.
  // Errors are logged inside sendLeadEvent.
  sendLeadEvent('lead.created', lead).catch(err => {
    console.error('[leads/create] webhook fire-and-forget error:', err)
  })

  return NextResponse.json({ lead })
}
