// app/api/onboarding/candidates/route.ts
// Staff-only. Creates a candidate (or resends their invite), generates a
// single-use magic-link token, and emails the invite via Resend. The invite is
// track-aware (v0.6.35/v0.6.36): full -> competency test, application_only ->
// straight to the application, documents_only -> the documents upload page.
// Resend always honours the stored track. The email itself lives in
// lib/onboarding/invite-email.ts, shared with the "Send test" staff action.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { CANDIDATE_TRACKS, normalizeTrack, type CandidateTrack } from '@/lib/onboarding/application'
import { sendOnboardingInvite, variantForTrack, TOKEN_TTL_DAYS } from '@/lib/onboarding/invite-email'

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export async function POST(req: NextRequest) {
  // ── Staff-only gate (no middleware on this repo — check inside the handler) ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const action = body.action || 'create'
  const expires = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  if (action === 'resend') {
    const { id } = body
    if (!id) return NextResponse.json({ error: 'Missing candidate id.' }, { status: 400 })
    const { data: cand } = await svc.from('onb_candidates').select('*').eq('id', id).single()
    if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

    const rawToken = crypto.randomBytes(32).toString('hex')
    await svc.from('onb_candidates')
      .update({ access_token: hashToken(rawToken), token_expires_at: expires, updated_at: new Date().toISOString() })
      .eq('id', id)

    // Resend honours the track the candidate is on.
    const sent = await sendOnboardingInvite({
      to: cand.email, firstName: cand.first_name, rawToken,
      variant: variantForTrack(normalizeTrack(cand.track)),
    })
    return NextResponse.json({ success: true, id, email: cand.email, emailed: sent.ok, error: sent.error })
  }

  // ── create ──
  const first_name = (body.first_name || '').trim()
  const last_name = (body.last_name || '').trim()
  const email = (body.email || '').trim().toLowerCase()
  if (!first_name || !last_name) return NextResponse.json({ error: 'First and last name are required.' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })

  const requestedTrack = String(body.track || 'full')
  if (!(CANDIDATE_TRACKS as readonly string[]).includes(requestedTrack)) {
    return NextResponse.json({ error: 'That onboarding track is not available.' }, { status: 400 })
  }
  const track = requestedTrack as CandidateTrack

  const rawToken = crypto.randomBytes(32).toString('hex')
  const { data: inserted, error: insErr } = await svc
    .from('onb_candidates')
    .insert({
      first_name, last_name, email,
      status: 'invited',
      track,
      access_token: hashToken(rawToken),
      token_expires_at: expires,
      invited_by: user.id,
    })
    .select('id')
    .single()

  if (insErr || !inserted) {
    console.error('[onboarding-candidates] insert failed:', insErr?.message)
    return NextResponse.json({ error: 'Could not save the candidate. Please try again.' }, { status: 500 })
  }

  const sent = await sendOnboardingInvite({ to: email, firstName: first_name, rawToken, variant: variantForTrack(track) })
  // Soft-fail: the record is saved; the invite can be re-sent from the UI.
  return NextResponse.json({ success: true, id: inserted.id, email, emailed: sent.ok, error: sent.error })
}
