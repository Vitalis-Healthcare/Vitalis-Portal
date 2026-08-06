// app/api/leads/assessment/route.ts — v0.6.42 (Ship 4a)
//
// Schedule an assessment FROM a lead, wired into the existing Assessments
// module. One POST does the whole intake step:
//
//   1. Resolve the client record — reuse the lead's linked record, link an
//      existing unlinked assessment_clients row, or create one prefilled
//      from the lead (no re-entry). Both link directions are written:
//      leads.assessment_client_id and assessment_clients.lead_id.
//   2. Duplicate prevention — if the client already has an OPEN assessment
//      (scheduled/overdue), return it with 409 instead of creating another.
//   3. Mirror the assessments module's own scheduling exactly: deactivate
//      any active clinical schedule, insert the schedule, seed the first
//      assessment as 'scheduled', soft-fail the nurse assignment email.
//   4. Timeline-log the event on the lead (slim status_change line).
//
// Gated admin/supervisor — the leads module's standard (the assessments
// module's own endpoint was widened to match in this same ship).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendAssignmentEmail } from '@/lib/assessments/email'

const VALID_CADENCES = [30, 60, 90, 120, 365]
const OPEN_ASSESSMENT_STATUSES = ['scheduled', 'overdue']

const nurseName = (v: unknown): string | null => {
  if (Array.isArray(v)) return (v[0] as { full_name?: string } | undefined)?.full_name ?? null
  return (v as { full_name?: string } | null)?.full_name ?? null
}

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
    const { lead_id, existing_client_id, nurse_id, first_due_date } = body
    const cadence_days = Number(body.cadence_days ?? 120)
    const is_initial = body.is_initial !== false

    if (!lead_id || !nurse_id || !first_due_date) {
      return NextResponse.json({ error: 'lead_id, nurse_id, and first_due_date are required' }, { status: 400 })
    }
    if (!VALID_CADENCES.includes(cadence_days)) {
      return NextResponse.json({ error: 'cadence_days must be 30, 60, 90, 120, or 365' }, { status: 400 })
    }

    const { data: lead } = await svc.from('leads').select('*').eq('id', lead_id).single()
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    if (lead.archived_at) {
      return NextResponse.json({ error: 'This lead is archived. Restore it before scheduling an assessment.' }, { status: 400 })
    }

    // Nurse must be assignable — same criterion as the assessments module.
    const { data: nurse } = await svc
      .from('profiles').select('id, full_name, email, can_be_assigned')
      .eq('id', nurse_id).single()
    if (!nurse || nurse.can_be_assigned !== true) {
      return NextResponse.json({ error: 'The selected nurse is not assignable (can_be_assigned).' }, { status: 400 })
    }

    // ── 1. Resolve the client record ─────────────────────────────────────
    let clientId: string | null = lead.assessment_client_id || null
    let clientCreated = false
    let clientLinked = false

    if (clientId) {
      const { data: existing } = await svc
        .from('assessment_clients').select('id').eq('id', clientId).maybeSingle()
      if (!existing) clientId = null // linked record was deleted; fall through
    }

    if (!clientId && existing_client_id) {
      const { data: target } = await svc
        .from('assessment_clients').select('id, full_name, status, lead_id')
        .eq('id', existing_client_id).maybeSingle()
      if (!target) return NextResponse.json({ error: 'That client record was not found.' }, { status: 404 })
      if (target.status === 'discharged') {
        return NextResponse.json({ error: 'That client record is discharged and cannot be linked.' }, { status: 400 })
      }
      if (target.lead_id && target.lead_id !== lead_id) {
        return NextResponse.json({ error: 'That client record is already linked to a different lead.' }, { status: 409 })
      }
      const { error: linkErr } = await svc
        .from('assessment_clients').update({ lead_id }).eq('id', target.id)
      if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })
      clientId = target.id
      clientLinked = true
    }

    if (!clientId) {
      const { data: created, error: createErr } = await svc
        .from('assessment_clients')
        .insert({
          full_name:     String(lead.client_name || lead.full_name || '').trim(),
          date_of_birth: lead.date_of_birth || null,
          phone:         lead.phone || null,
          address:       lead.address || null,
          city:          lead.city || null,
          state:         lead.state || 'MD',
          zip:           lead.zip || null,
          notes:         'Created from the lead pipeline.',
          lead_id:       lead.id,
          created_by:    user.id,
        })
        .select('id')
        .single()
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
      clientId = created.id
      clientCreated = true
    }

    if (lead.assessment_client_id !== clientId) {
      const { error: leadLinkErr } = await svc
        .from('leads').update({ assessment_client_id: clientId }).eq('id', lead.id)
      if (leadLinkErr) return NextResponse.json({ error: leadLinkErr.message }, { status: 500 })
    }

    const { data: client } = await svc
      .from('assessment_clients').select('id, full_name, status, phone, address, city, state, zip')
      .eq('id', clientId).single()
    if (!client) return NextResponse.json({ error: 'Client record could not be read back.' }, { status: 500 })

    // ── 2. Duplicate prevention — open assessment wins ───────────────────
    const { data: openRows } = await svc
      .from('assessments')
      .select('id, status, scheduled_date, completed_date, is_initial, nurse:nurse_id(full_name)')
      .eq('client_id', clientId)
      .in('status', OPEN_ASSESSMENT_STATUSES)
      .order('scheduled_date', { ascending: true })
      .limit(1)
    const open = openRows?.[0]
    if (open) {
      return NextResponse.json({
        error: 'An assessment is already open for this client — opening it instead of creating another.',
        client: { id: client.id, full_name: client.full_name, status: client.status },
        assessment: {
          id: open.id, status: open.status, scheduled_date: open.scheduled_date,
          completed_date: open.completed_date, is_initial: open.is_initial,
          nurse_name: nurseName(open.nurse),
        },
      }, { status: 409 })
    }

    // ── 3. Schedule + first assessment (mirrors the assessments module) ──
    await svc
      .from('assessment_schedules')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('client_id', clientId).eq('plan_type', 'clinical').eq('is_active', true)

    const { data: sched, error: schedErr } = await svc
      .from('assessment_schedules')
      .insert({ client_id: clientId, nurse_id, cadence_days, plan_type: 'clinical', created_by: user.id })
      .select()
      .single()
    if (schedErr) return NextResponse.json({ error: schedErr.message }, { status: 500 })

    const { data: assessment, error: assessErr } = await svc
      .from('assessments')
      .insert({
        client_id: clientId, schedule_id: sched.id, nurse_id,
        assessment_type: 'routine', scheduled_date: first_due_date,
        status: 'scheduled', is_initial,
      })
      .select('id, status, scheduled_date, completed_date, is_initial')
      .single()
    if (assessErr) return NextResponse.json({ error: assessErr.message }, { status: 500 })

    // Assignment email — soft-fail, exactly like the assessments module.
    try {
      if (nurse.email) {
        const addr = [client.address, client.city, client.state, client.zip].filter(Boolean).join(', ')
        await sendAssignmentEmail({
          nurseEmail: nurse.email, nurseName: nurse.full_name || nurse.email,
          clientName: client.full_name, clientPhone: client.phone ?? null,
          clientAddress: addr, cadenceDays: cadence_days,
          nextDueDate: first_due_date, planType: 'clinical',
        })
      }
    } catch (emailErr) {
      console.error('[leads/assessment] assignment email failed (non-fatal):', emailErr)
    }

    // ── 4. Timeline log on the lead ──────────────────────────────────────
    const suffix = clientCreated ? ' — client record created'
                 : clientLinked  ? ' — linked to existing client record'
                 : ''
    await svc.from('lead_activities').insert({
      lead_id: lead.id, created_by: user.id,
      activity_type: 'status_change',
      content: `Assessment scheduled for ${first_due_date} with ${nurse.full_name || 'nurse'}${suffix}`,
    })

    return NextResponse.json({
      client: { id: client.id, full_name: client.full_name, status: client.status },
      assessment: {
        id: assessment.id, status: assessment.status, scheduled_date: assessment.scheduled_date,
        completed_date: assessment.completed_date, is_initial: assessment.is_initial,
        nurse_name: nurse.full_name || null,
      },
    })
  } catch (err) {
    console.error('[leads/assessment POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
