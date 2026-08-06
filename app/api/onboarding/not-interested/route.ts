// app/api/onboarding/not-interested/route.ts
//
// Public and token-gated. POST only — deliberately no GET handler, because a
// GET here is exactly what a mail scanner would fetch.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const raw = typeof body.token === 'string' ? body.token.trim() : ''
  // One message for every failure mode, so this endpoint cannot be used to
  // learn which tokens exist.
  const REFUSED = { error: 'This link is no longer valid. Please reply to any email from us and we will take care of it.' }
  if (!raw) return NextResponse.json(REFUSED, { status: 400 })

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, status, optout_expires_at')
    .eq('optout_token', hashToken(raw))
    .maybeSingle()

  if (!cand) return NextResponse.json(REFUSED, { status: 404 })
  if (cand.optout_expires_at && Date.parse(cand.optout_expires_at) < Date.now()) {
    return NextResponse.json(REFUSED, { status: 410 })
  }
  // A converted caregiver is an employee. Unsubscribing from a recruiting
  // email must never be able to retire a member of staff.
  if (cand.status === 'converted') {
    return NextResponse.json({
      error: 'Our records show you have already joined Vitalis. Please contact the Vitalis office directly.',
    }, { status: 409 })
  }
  // Already done — answer success so a double submit reads as calm, not broken.
  if (cand.status === 'withdrawn') {
    return NextResponse.json({ success: true, already: true })
  }

  const nowIso = new Date().toISOString()
  const { error } = await svc
    .from('onb_candidates')
    .update({
      status: 'withdrawn',
      withdrawn_at: nowIso,
      withdrawal_reason: 'not_interested',
      // Burn both tokens. The person has said they are done; neither link
      // should keep working, and the magic link least of all.
      access_token: null,
      token_expires_at: null,
      optout_token: null,
      optout_expires_at: null,
      updated_at: nowIso,
    })
    .eq('id', cand.id)
    // Conditional: if something else moved this candidate between the read and
    // the write, do not overwrite it.
    .eq('status', cand.status)

  if (error) return NextResponse.json({ error: 'We could not record that. Please reply to our email instead.' }, { status: 500 })

  return NextResponse.json({ success: true })
}
