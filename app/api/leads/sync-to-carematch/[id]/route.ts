import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendLeadEvent } from '@/lib/carematch-webhook'

// POST /api/leads/sync-to-carematch/[id]
//
// Manually re-fires a CareMatch360 webhook for a single lead. Used by the
// "Send to CareMatch360" button on the lead detail page when the
// coordinator wants to force a resync (e.g. after the auto-fire from
// create or update was missed because CareMatch360 was down).
//
// Unlike the auto-fired webhook from create/update, this awaits the
// response so the user gets immediate feedback in the UI.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { data: lead, error } = await svc.from('leads').select('*').eq('id', id).single()
  if (error || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Always send as 'lead.updated' on manual resync — the CareMatch360 side
  // will upsert idempotently and won't re-clobber a case that's already
  // been converted to active. (Status-change events are reserved for
  // actual status transitions in the update route.)
  const result = await sendLeadEvent('lead.updated', lead)

  if (!result.ok) {
    return NextResponse.json({
      error: result.error || 'Webhook failed',
      details: result.response,
    }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    sent_at: new Date().toISOString(),
    carematch_response: result.response,
  })
}
