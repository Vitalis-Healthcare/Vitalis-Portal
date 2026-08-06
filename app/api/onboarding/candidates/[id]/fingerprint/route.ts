// app/api/onboarding/candidates/[id]/fingerprint/route.ts
//
// Records "fingerprinting form sent — results pending", and extends it when
// the result is genuinely late.
//
// The extension is the part that matters. Anyone can push a date out; the
// point of this design is that pushing it out costs you a written reason and
// leaves a row behind. A superseded attestation is never deleted or edited —
// the chain of extensions IS the audit trail, and a coordinator who has
// extended three times is visible as exactly that.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  FINGERPRINT_WINDOW_DAYS,
  defaultExpectedBy,
  todayISO,
} from '@/lib/onboarding/fingerprint'

export const dynamic = 'force-dynamic'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function asDate(v: FormDataEntryValue | string | null | undefined): string | null {
  const s = typeof v === 'string' ? v.trim() : ''
  return DATE_RE.test(s) ? s : null
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor', 'staff'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }

  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id')
    .eq('id', id)
    .maybeSingle()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  // If the CJIS record is already on file there is nothing to attest to, and
  // recording one would open a window nobody needs.
  const { data: cjis } = await svc
    .from('onb_documents')
    .select('id')
    .eq('candidate_id', id)
    .eq('doc_type', 'cjis_background')
    .limit(1)
  if (Array.isArray(cjis) && cjis.length > 0) {
    return NextResponse.json({
      error: 'The CJIS background check is already on file for this candidate, so there is nothing pending.',
    }, { status: 409 })
  }

  const body = await req.json().catch(() => ({}))
  const sentAt = asDate(body.sent_at)
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : ''
  const extensionReason = typeof body.extension_reason === 'string'
    ? body.extension_reason.trim().slice(0, 1000)
    : ''

  if (!sentAt) {
    return NextResponse.json({ error: 'Enter the date the fingerprinting form was sent, as YYYY-MM-DD.' }, { status: 400 })
  }
  if (sentAt > todayISO()) {
    return NextResponse.json({ error: 'The date the form was sent cannot be in the future.' }, { status: 400 })
  }

  const expectedBy = asDate(body.expected_by) || defaultExpectedBy(sentAt, FINGERPRINT_WINDOW_DAYS)
  if (!expectedBy) {
    return NextResponse.json({ error: 'Could not work out the expected date. Enter it as YYYY-MM-DD.' }, { status: 400 })
  }
  if (expectedBy < sentAt) {
    return NextResponse.json({ error: 'The expected date cannot be before the form was sent.' }, { status: 400 })
  }

  // Is there already a live one? If so this is an EXTENSION and needs a reason.
  const { data: liveRows } = await svc
    .from('onb_fingerprint_attestations')
    .select('id, expected_by')
    .eq('candidate_id', id)
    .is('cleared_at', null)
    .is('superseded_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
  const live = Array.isArray(liveRows) && liveRows.length > 0 ? liveRows[0] : null

  if (live && !extensionReason) {
    return NextResponse.json({
      error: 'There is already a live attestation for this candidate. To move the expected date you must say why — that reason is recorded and reviewed.',
      code: 'extension_reason_required',
      current_expected_by: live.expected_by,
    }, { status: 400 })
  }

  const nowIso = new Date().toISOString()

  // Insert the new row FIRST would violate the one-live unique index, so
  // supersede the old one first. If the insert then fails we would be left with
  // no live attestation, which fails CLOSED — the gate goes back to demanding
  // the document. That is the right direction to fail.
  if (live) {
    const { error: supErr } = await svc
      .from('onb_fingerprint_attestations')
      .update({ superseded_at: nowIso })
      .eq('id', live.id)
      .is('superseded_at', null)
    if (supErr) {
      return NextResponse.json({ error: 'Could not update the existing attestation. Please try again.' }, { status: 500 })
    }
  }

  const { data: inserted, error: insErr } = await svc
    .from('onb_fingerprint_attestations')
    .insert({
      candidate_id: id,
      sent_at: sentAt,
      expected_by: expectedBy,
      note: note || null,
      extension_reason: live ? extensionReason : null,
      supersedes_id: live ? live.id : null,
      created_by: user.id,
    })
    .select('id, sent_at, expected_by, note, extension_reason, created_at')
    .single()

  if (insErr || !inserted) {
    console.error('[fingerprint] insert failed:', insErr?.message)
    return NextResponse.json({ error: 'Could not record the attestation. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    attestation: inserted,
    extended: !!live,
  })
}
