// app/api/onboarding/candidates/[id]/convert/route.ts
//
// Direct conversion. ADMIN ONLY as of v0.6.24-b — a supervisor or staff member
// must instead raise a conversion request for an admin to approve. An admin
// converting directly is recorded as a self-approved request, so the audit
// trail has no hole in it where the quickest path was taken.
//
// The conversion itself lives in lib/onboarding/conversion.ts, shared with the
// approval path, so the two can never drift.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { loadGateInput } from '@/lib/onboarding/gate-data'
import { evaluateConvertGate, blockerSummary } from '@/lib/onboarding/gates'
import { performConversion, CONVERTIBLE_STATUSES } from '@/lib/onboarding/conversion'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }
  if (role !== 'admin') {
    return NextResponse.json({
      error: 'Only an administrator can convert a candidate directly. Use Request approval instead.',
      code: 'approval_required',
    }, { status: 403 })
  }

  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, email, status, converted_to_profile_id')
    .eq('id', id)
    .maybeSingle()

  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  if (cand.converted_to_profile_id) {
    return NextResponse.json({ already: true, profile_id: cand.converted_to_profile_id })
  }

  // ── Credentialing + signed agreement gate ─────────────────────────────────
  const gateInput = await loadGateInput(id)
  if (!gateInput) {
    return NextResponse.json({ error: 'Could not check credentialing status.' }, { status: 500 })
  }
  const gate = evaluateConvertGate(gateInput)
  if (!gate.ok) {
    console.warn('[convert] blocked for', id, '-', blockerSummary(gate.blockers))
    return NextResponse.json({
      error: 'This candidate is not ready to be converted.',
      code: 'gate_blocked',
      blockers: gate.blockers,
    }, { status: 409 })
  }

  if (!CONVERTIBLE_STATUSES.includes(cand.status || '')) {
    return NextResponse.json({ error: 'Convert is available once the candidate is in review or pushed to AxisCare.' }, { status: 409 })
  }

  const result = await performConversion(svc, cand, user.id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Record the admin's direct conversion as an approved request. Without this
  // the history would show approvals for everything EXCEPT the conversions the
  // administrator did fastest, which is exactly backwards.
  const nowIso = new Date().toISOString()
  try {
    await svc.from('onb_conversion_requests').insert({
      candidate_id: cand.id,
      requested_by: user.id,
      requested_note: 'Converted directly by an administrator.',
      status: 'approved',
      decided_by: user.id,
      decided_at: nowIso,
      decision_note: 'Self-approved.',
    })
  } catch (err) {
    console.error('[convert] could not record the self-approval:', err)
  }

  return NextResponse.json({
    success: true,
    profile_id: result.profileId,
    outcome: result.outcome,
    emailed: result.emailed,
    credentials: result.credentials,
  })
}
