// app/api/leads/link-client/route.ts
// ═════════════════════════════════════════════════════════════════════════
// Ship 5d (v0.6.50) — link a lead to an existing client record. NOTHING ELSE.
//
// Why this exists: the nine legacy won leads were converted before the
// leads module knew about client records. Until now the only way to attach
// one was to schedule an assessment, which also picked a nurse, created a
// clinical schedule, seeded an assessment, and emailed the nurse — four
// side effects nobody asked for, on leads whose care started months ago.
//
// This route writes the two link columns and a timeline line. It does not
// touch stage, status, payer, schedules, assessments, or send any email.
//
// Deliberately ONE LEAD AT A TIME. No bulk endpoint exists and none should:
// the bulk-invite incident of 31 July is the standing reason.
// ═════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'supervisor'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const lead_id: string = body.lead_id
    const client_id: string = body.client_id
    if (!lead_id || !client_id) {
      return NextResponse.json({ error: 'lead_id and client_id are required' }, { status: 400 })
    }

    const { data: lead } = await svc
      .from('leads')
      .select('id, full_name, client_name, assessment_client_id, archived_at')
      .eq('id', lead_id)
      .maybeSingle()
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    if (lead.archived_at) {
      return NextResponse.json({ error: 'This lead is archived. Restore it before linking a client record.' }, { status: 409 })
    }
    if (lead.assessment_client_id) {
      return NextResponse.json({
        error: 'This lead is already linked to a client record. Unlinking is not something this action does \u2014 tell the office if it is linked to the wrong one.',
      }, { status: 409 })
    }

    const { data: client } = await svc
      .from('assessment_clients')
      .select('id, full_name, lead_id')
      .eq('id', client_id)
      .maybeSingle()
    if (!client) return NextResponse.json({ error: 'Client record not found' }, { status: 404 })

    // Guard the other direction too: never steal a client from another lead.
    if (client.lead_id && client.lead_id !== lead_id) {
      return NextResponse.json({
        error: `${client.full_name} is already linked to a different lead. Linking it here would detach it from that one.`,
      }, { status: 409 })
    }

    // ── The link itself, both directions ────────────────────────────────
    const { error: leadErr } = await svc
      .from('leads')
      .update({ assessment_client_id: client.id, updated_at: new Date().toISOString() })
      .eq('id', lead_id)
    if (leadErr) {
      return NextResponse.json({ error: `Could not link the lead: ${leadErr.message}` }, { status: 500 })
    }

    const { error: clientErr } = await svc
      .from('assessment_clients')
      .update({ lead_id })
      .eq('id', client.id)
    if (clientErr) {
      // Roll the lead side back rather than leave a half-written link.
      await svc.from('leads').update({ assessment_client_id: null }).eq('id', lead_id)
      return NextResponse.json({ error: `Could not link the client record: ${clientErr.message}` }, { status: 500 })
    }

    try {
      await svc.from('lead_activities').insert({
        lead_id, created_by: user.id,
        activity_type: 'status_change',
        content: `Linked to client record: ${client.full_name}`,
      })
    } catch (err) {
      console.error('[leads/link-client] timeline insert failed:', err)
    }

    return NextResponse.json({
      linked: true,
      client: { id: client.id, full_name: client.full_name },
    })
  } catch (err) {
    console.error('[leads/link-client POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
