// app/api/onboarding/candidates/[id]/reminder/route.ts
//
// Staff-only. Sends an application reminder on demand and records it.
//
// A manual nudge is recorded with kind='manual' and reminder_number=0, so it
// sits in the same history a coordinator reads WITHOUT consuming one of the
// two automatic slots — the unique index only covers kind='auto'. The
// scheduled cadence (v0.6.61) reads the same table and will therefore still
// send reminder 1 on its own schedule.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  sendApplicationReminder,
  REMINDER_TOKEN_TTL_DAYS,
  OPTOUT_TOKEN_TTL_DAYS,
} from '@/lib/onboarding/reminder-email'
import { isAwaitingApplication, reminderPathForTrack } from '@/lib/onboarding/reminders'

export const dynamic = 'force-dynamic'

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function days(n: number) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString()
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
    .select('id, first_name, email, status, track')
    .eq('id', id)
    .single()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  // The same arbiter the scheduler uses. A reminder to someone who has already
  // submitted is worse than no reminder — it tells them we lost their work.
  if (!isAwaitingApplication(cand.status, cand.track)) {
    return NextResponse.json({
      error: 'This candidate is not waiting on an application, so an application reminder would be wrong. Check where they actually are in the process.',
      code: 'not_awaiting_application',
    }, { status: 409 })
  }

  // Fresh access token — a reminder carrying a dead link is worse than silence.
  const rawAccessToken = crypto.randomBytes(32).toString('hex')
  const rawOptoutToken = crypto.randomBytes(32).toString('hex')
  const nowIso = new Date().toISOString()

  const { error: updErr } = await svc
    .from('onb_candidates')
    .update({
      access_token: hashToken(rawAccessToken),
      token_expires_at: days(REMINDER_TOKEN_TTL_DAYS),
      optout_token: hashToken(rawOptoutToken),
      optout_expires_at: days(OPTOUT_TOKEN_TTL_DAYS),
      updated_at: nowIso,
    })
    .eq('id', cand.id)
  if (updErr) {
    return NextResponse.json({ error: 'Could not prepare the reminder link.' }, { status: 500 })
  }

  const sent = await sendApplicationReminder({
    to: cand.email,
    firstName: cand.first_name || '',
    reminderNumber: 1,
    rawAccessToken,
    rawOptoutToken,
    path: reminderPathForTrack(cand.track),
  })

  // Record it either way. A send that failed is still something a coordinator
  // needs to see, and swallowing it is how the silent-invite failure hid.
  const { data: row } = await svc
    .from('onb_application_reminders')
    .insert({
      candidate_id: cand.id,
      reminder_number: 0,
      kind: 'manual',
      sent_by: user.id,
      resend_id: sent.id || null,
    })
    .select('id, sent_at')
    .single()

  if (!sent.ok) {
    return NextResponse.json({
      error: `The reminder could not be emailed: ${sent.error || 'unknown error'}`,
      recorded: !!row,
    }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    email: cand.email,
    sent_at: row?.sent_at || nowIso,
  })
}
