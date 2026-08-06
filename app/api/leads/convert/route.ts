// app/api/leads/convert/route.ts — v0.6.43 (Ship 4b)
//
// Convert a lead to a client. The database work is ATOMIC via the
// convert_lead_to_client() Postgres function (all-or-nothing):
//   1. Create the client record prefilled from the lead — or reuse the
//      linked one (payer set, status reactivated to active).
//   2. Lead → status 'won', won_date auto-set if unset, link written.
//   3. Timeline row inserted, with the override reason and unmet
//      readiness items logged VERBATIM when converting on an override.
//
// Readiness is recomputed SERVER-SIDE (never trusted from the browser):
// contact info, hours & rate, meets minimum, target close date, consent
// signed. Any unmet item requires a free-text override reason. Gated
// admin/supervisor — both may override (signed-off decision).
//
// After the RPC succeeds, the CareMatch360 wire hears the normal won
// behavior: lead.won with the legacy vocabulary, fire-and-forget.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendLeadEvent } from '@/lib/carematch-webhook'
import { legacyWireStatus, isBelowFloor } from '@/lib/leads/model'
import { isValidPayerType } from '@/lib/payers'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
    if (!['admin', 'supervisor'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { lead_id, payer_type } = body
    const override_reason = typeof body.override_reason === 'string' ? body.override_reason.trim() : ''

    if (!lead_id) return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })
    if (!isValidPayerType(payer_type)) {
      return NextResponse.json({ error: 'A valid payer type is required.' }, { status: 400 })
    }

    const { data: prevLead } = await svc.from('leads').select('*').eq('id', lead_id).single()
    if (!prevLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    if (prevLead.archived_at) {
      return NextResponse.json({ error: 'This lead is archived. Restore it before converting.' }, { status: 400 })
    }
    if (prevLead.status === 'won') {
      return NextResponse.json({ error: 'This lead is already converted (won).' }, { status: 400 })
    }

    // ── Server-side readiness recompute — same five checks as the UI ─────
    const readiness = [
      { label: 'Contact info', ok: !!(prevLead.phone || prevLead.email) },
      { label: 'Hours & rate', ok: !!(prevLead.estimated_hours_week && prevLead.hourly_rate) },
      { label: 'Meets minimum', ok: !isBelowFloor(prevLead.estimated_hours_week, prevLead.hourly_rate) },
      { label: 'Target close date', ok: !!prevLead.expected_close_date },
      { label: 'Consent signed', ok: (prevLead.consent_status || '') === 'signed' },
    ]
    const unmet = readiness.filter(r => !r.ok).map(r => r.label)

    if (unmet.length > 0 && !override_reason) {
      return NextResponse.json({
        error: `Converting with unmet readiness items requires a reason. Unmet: ${unmet.join(', ')}.`,
        unmet,
      }, { status: 400 })
    }

    // Timeline content — unmet items and the reason are logged verbatim.
    const timelineContent = unmet.length === 0
      ? `Converted to client · Payer: ${payer_type}`
      : `Converted to client with override · Payer: ${payer_type} · Unmet: ${unmet.join(', ')} · Reason: ${override_reason}`

    const todayStr = new Date().toISOString().split('T')[0]

    // ── Atomic conversion via the Postgres function ──────────────────────
    const { data: rpcResult, error: rpcErr } = await svc.rpc('convert_lead_to_client', {
      p_lead_id: lead_id,
      p_actor: user.id,
      p_payer_type: payer_type,
      p_won_date: todayStr,
      p_timeline_content: timelineContent,
    })
    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 500 })
    }

    const clientId = (rpcResult as { client_id?: string } | null)?.client_id || null
    const clientCreated = (rpcResult as { client_created?: boolean } | null)?.client_created === true

    // ── Read back the results for the UI ─────────────────────────────────
    const { data: lead } = await svc
      .from('leads')
      .select(`*, assignee:assigned_to(full_name), secondary:secondary_assigned_to(full_name), creator:created_by(full_name)`)
      .eq('id', lead_id).single()

    let client: { id: string; full_name: string; status: string } | null = null
    if (clientId) {
      const { data: c } = await svc
        .from('assessment_clients').select('id, full_name, status')
        .eq('id', clientId).maybeSingle()
      client = c || null
    }

    // ── CareMatch360 wire — normal won behavior, fire-and-forget ─────────
    if (lead) {
      sendLeadEvent('lead.won', lead, legacyWireStatus(prevLead)).catch(err => {
        console.error('[leads/convert] webhook fire-and-forget error:', err)
      })
    }

    return NextResponse.json({
      lead,
      client,
      client_created: clientCreated,
      timeline_content: timelineContent + (clientCreated ? ' — client record created' : ' — linked client record reused'),
    })
  } catch (err) {
    console.error('[leads/convert POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
