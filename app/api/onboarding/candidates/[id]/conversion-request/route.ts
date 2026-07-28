// app/api/onboarding/candidates/[id]/conversion-request/route.ts
//
// The approval step between a coordinator finishing a candidate and that person
// becoming a caregiver with a real portal account.
//
// POST    raise a request           (staff / supervisor / admin)
// PATCH   approve or return it      (admin only)
// DELETE  withdraw your own request (requester or admin)
//
// Design decision worth stating: raising a request runs the FULL gate, exactly
// as converting does. An approver should only ever see a finished file —
// otherwise the approval step quietly becomes the paperwork-chasing step.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { loadGateInput } from '@/lib/onboarding/gate-data'
import { evaluateConvertGate, blockerSummary } from '@/lib/onboarding/gates'
import { performConversion, CONVERTIBLE_STATUSES } from '@/lib/onboarding/conversion'
import {
  notifyApprovalRequested, notifyApprovalReturned, notifyApprovalApproved,
  lookupStaffEmail,
} from '@/lib/onboarding/approval-emails'

export const dynamic = 'force-dynamic'

type Viewer = { userId: string; role: string; name: string; email: string }

async function viewerGate(): Promise<{ ok: true; viewer: Viewer } | { ok: false; res: NextResponse }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, res: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('role, full_name, email').eq('id', user.id).single()
    const role = profile?.role || ''
    if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) {
      return { ok: false, res: NextResponse.json({ error: 'Staff access required' }, { status: 403 }) }
    }
    return {
      ok: true,
      viewer: {
        userId: user.id,
        role,
        name: (profile?.full_name || '').trim(),
        email: (profile?.email || '').trim(),
      },
    }
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Auth check failed' }, { status: 500 }) }
  }
}

// ── POST: raise a conversion request ────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await viewerGate()
  if (!g.ok) return g.res

  let note = ''
  try {
    const body = await req.json()
    note = typeof body.note === 'string' ? body.note.slice(0, 1000).trim() : ''
  } catch {
    note = ''
  }

  const svc = createServiceClient()

  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, status, converted_to_profile_id')
    .eq('id', id)
    .maybeSingle()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })
  if (cand.converted_to_profile_id) {
    return NextResponse.json({ error: 'This candidate has already been converted.' }, { status: 409 })
  }
  if (cand.status === 'awaiting_approval') {
    return NextResponse.json({ error: 'A request is already awaiting approval for this candidate.' }, { status: 409 })
  }
  if (!CONVERTIBLE_STATUSES.includes(cand.status || '')) {
    return NextResponse.json({
      error: 'Approval can be requested once the candidate is in review or pushed to AxisCare.',
    }, { status: 409 })
  }

  // Same gate as conversion itself — see the note at the top of this file.
  const gateInput = await loadGateInput(id)
  if (!gateInput) {
    return NextResponse.json({ error: 'Could not check credentialing status.' }, { status: 500 })
  }
  const gate = evaluateConvertGate(gateInput)
  if (!gate.ok) {
    console.warn('[conversion-request] blocked for', id, '-', blockerSummary(gate.blockers))
    return NextResponse.json({
      error: 'This candidate is not ready to be sent for approval.',
      code: 'gate_blocked',
      blockers: gate.blockers,
    }, { status: 409 })
  }

  const nowIso = new Date().toISOString()

  const { data: reqRow, error: insErr } = await svc
    .from('onb_conversion_requests')
    .insert({
      candidate_id: id,
      requested_by: g.viewer.userId,
      requested_note: note || null,
      status: 'pending',
    })
    .select('id, requested_at')
    .single()

  if (insErr || !reqRow) {
    // The partial unique index allows only one pending request per candidate,
    // so a duplicate lands here rather than creating a second one.
    console.error('[conversion-request] insert failed:', insErr?.message)
    return NextResponse.json({
      error: 'Could not raise the request. There may already be one awaiting approval.',
    }, { status: 409 })
  }

  const { error: updErr } = await svc
    .from('onb_candidates')
    .update({ status: 'awaiting_approval', updated_at: nowIso })
    .eq('id', id)

  if (updErr) {
    // Roll the request back rather than leave a pending approval against a
    // candidate whose status never moved — the list would not show it.
    await svc.from('onb_conversion_requests').delete().eq('id', reqRow.id)
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  // Tell the approvers. Soft-fail: the request stands whether or not the mail
  // goes out, but the outcome is REPORTED rather than swallowed. A workflow
  // whose notifications fail quietly is the bug this release exists to fix.
  const notice = await notifyApprovalRequested(svc, {
    candidate: cand,
    requesterName: g.viewer.name,
    note: note || null,
  })

  return NextResponse.json({
    success: true,
    request_id: reqRow.id,
    status: 'awaiting_approval',
    emailed: notice.ok,
    email_error: notice.ok ? undefined : notice.error,
    notified: notice.recipients,
  })
}

// ── PATCH: approve or return ────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await viewerGate()
  if (!g.ok) return g.res
  if (g.viewer.role !== 'admin') {
    return NextResponse.json({ error: 'Only an administrator can decide a conversion request.' }, { status: 403 })
  }

  let decision = ''
  let note = ''
  try {
    const body = await req.json()
    decision = String(body.decision || '').trim()
    note = typeof body.note === 'string' ? body.note.slice(0, 1000).trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (decision !== 'approve' && decision !== 'return') {
    return NextResponse.json({ error: "decision must be 'approve' or 'return'" }, { status: 400 })
  }
  // A return without a reason is just a rejection the coordinator cannot act on.
  if (decision === 'return' && note.length < 5) {
    return NextResponse.json({ error: 'Please say why you are returning this, so the coordinator knows what to fix.' }, { status: 400 })
  }

  const svc = createServiceClient()

  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, email, status, converted_to_profile_id')
    .eq('id', id)
    .maybeSingle()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  const { data: pending } = await svc
    .from('onb_conversion_requests')
    .select('id, requested_by')
    .eq('candidate_id', id)
    .eq('status', 'pending')
    .maybeSingle()
  if (!pending?.id) {
    return NextResponse.json({ error: 'There is no request awaiting approval for this candidate.' }, { status: 409 })
  }

  const nowIso = new Date().toISOString()

  // ── Return ──
  if (decision === 'return') {
    const { error } = await svc
      .from('onb_conversion_requests')
      .update({ status: 'returned', decided_by: g.viewer.userId, decided_at: nowIso, decision_note: note, updated_at: nowIso })
      .eq('id', pending.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await svc.from('onb_candidates')
      .update({ status: 'in_review', updated_at: nowIso })
      .eq('id', id)

    // The reason is the whole point of a return. Until this shipped it lived
    // only on the candidate page, which the coordinator had no reason to open.
    const requesterEmail = await lookupStaffEmail(svc, pending.requested_by)
    const notice = await notifyApprovalReturned({
      candidate: cand,
      requesterEmail,
      deciderName: g.viewer.name,
      reason: note,
    })

    return NextResponse.json({
      success: true,
      decision: 'returned',
      status: 'in_review',
      note,
      emailed: notice.ok,
      email_error: notice.ok ? undefined : notice.error,
      notified: notice.recipients,
    })
  }

  // ── Approve ──
  if (cand.converted_to_profile_id) {
    // Already converted by some other route in the meantime. Close the request
    // rather than trying to convert twice.
    await svc.from('onb_conversion_requests')
      .update({ status: 'approved', decided_by: g.viewer.userId, decided_at: nowIso, decision_note: note || null, updated_at: nowIso })
      .eq('id', pending.id)
    return NextResponse.json({ already: true, profile_id: cand.converted_to_profile_id })
  }

  // Re-check the gate at the moment of approval. Time passes between raising a
  // request and deciding it, and a document can be withdrawn in between.
  const gateInput = await loadGateInput(id)
  if (!gateInput) {
    return NextResponse.json({ error: 'Could not check credentialing status.' }, { status: 500 })
  }
  const gate = evaluateConvertGate(gateInput)
  if (!gate.ok) {
    return NextResponse.json({
      error: 'This candidate is no longer ready to be converted.',
      code: 'gate_blocked',
      blockers: gate.blockers,
    }, { status: 409 })
  }

  const result = await performConversion(svc, cand, g.viewer.userId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  await svc.from('onb_conversion_requests')
    .update({ status: 'approved', decided_by: g.viewer.userId, decided_at: nowIso, decision_note: note || null, updated_at: nowIso })
    .eq('id', pending.id)

  // Note the two different 'emailed' meanings: result.emailed is the WELCOME
  // mail to the new caregiver, sent inside performConversion. This one is the
  // notification back to the coordinator who asked. Both are reported.
  const requesterEmail = await lookupStaffEmail(svc, pending.requested_by)
  const notice = await notifyApprovalApproved({
    candidate: cand,
    requesterEmail,
    deciderName: g.viewer.name,
    note: note || null,
  })

  return NextResponse.json({
    success: true,
    decision: 'approved',
    profile_id: result.profileId,
    outcome: result.outcome,
    emailed: result.emailed,
    credentials: result.credentials,
    requester_emailed: notice.ok,
    requester_email_error: notice.ok ? undefined : notice.error,
  })
}

// ── DELETE: withdraw a pending request ──────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await viewerGate()
  if (!g.ok) return g.res

  const svc = createServiceClient()

  const { data: pending } = await svc
    .from('onb_conversion_requests')
    .select('id, requested_by')
    .eq('candidate_id', id)
    .eq('status', 'pending')
    .maybeSingle()
  if (!pending?.id) {
    return NextResponse.json({ error: 'There is no pending request to withdraw.' }, { status: 404 })
  }
  if (g.viewer.role !== 'admin' && pending.requested_by !== g.viewer.userId) {
    return NextResponse.json({ error: 'You can only withdraw a request you raised.' }, { status: 403 })
  }

  const nowIso = new Date().toISOString()

  const { error } = await svc.from('onb_conversion_requests').delete().eq('id', pending.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await svc.from('onb_candidates')
    .update({ status: 'in_review', updated_at: nowIso })
    .eq('id', id)

  return NextResponse.json({ success: true, status: 'in_review' })
}
