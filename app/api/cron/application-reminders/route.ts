// app/api/cron/application-reminders/route.ts
//
// The scheduled half of the reminder cadence. Runs at 14:00 UTC (10 am EDT /
// 9 am EST) — an hour after the CJIS sweep, so the two never land in the same
// inbox minute.
//
// Day 3 sends reminder 1, day 7 sends reminder 2, day 10 sets the candidate
// aside. All three thresholds and the whole cohort definition live in
// lib/onboarding/reminders.ts, which the manual button and the candidate page
// already use — this route decides nothing for itself.
//
// AUTH: dual, via lib/brief/auth.ts.
// ?dry_run=1 — compute and report everything, send and write nothing.
// portal_settings.application_reminders_paused = 'true' silences it.

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { authorizeBriefRequest } from '@/lib/brief/auth'
import {
  isAwaitingApplication, nextReminderAction, reminderPathForTrack,
  REMINDER_1_DAY, REMINDER_2_DAY, SET_ASIDE_DAY,
} from '@/lib/onboarding/reminders'
import {
  sendApplicationReminder, sendSetAsideNotice,
  REMINDER_TOKEN_TTL_DAYS, OPTOUT_TOKEN_TTL_DAYS,
} from '@/lib/onboarding/reminder-email'

export const dynamic = 'force-dynamic'

export const PAUSE_KEY = 'application_reminders_paused'

/** Statuses worth loading. isAwaitingApplication does the real per-track work. */
const CANDIDATE_STATUSES = ['invited', 'test_passed', 'applying']

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function days(n: number) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString()
}

interface Outcome {
  id: string
  name: string
  days_quiet: number
  action: string
  ok?: boolean
  error?: string
}

async function handler(request: NextRequest) {
  const auth = await authorizeBriefRequest(request)
  if (!auth.caller) return auth.response!

  const dryRun = new URL(request.url).searchParams.get('dry_run') === '1'
  const svc = createServiceClient()

  let paused = false
  try {
    const { data } = await svc.from('portal_settings').select('value').eq('key', PAUSE_KEY).maybeSingle()
    paused = data?.value === 'true'
  } catch {
    paused = false
  }

  // ── Load the possible cohort ─────────────────────────────────────────────
  const { data: candRows, error: candErr } = await svc
    .from('onb_candidates')
    .select('id, first_name, email, status, track, invited_at, test_passed_at, converted_to_profile_id')
    .in('status', CANDIDATE_STATUSES)
    .is('converted_to_profile_id', null)
    .limit(500)
  if (candErr) {
    return NextResponse.json({ error: candErr.message }, { status: 500 })
  }
  const candidates = (Array.isArray(candRows) ? candRows : [])
    .filter((c) => isAwaitingApplication(c.status, c.track))

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, considered: 0, sent: 0, set_aside: 0, outcomes: [] })
  }

  const ids = candidates.map((c) => c.id)

  // Last time each candidate touched their draft.
  const appUpdated: Record<string, string | null> = {}
  try {
    const { data } = await svc
      .from('onb_applications')
      .select('candidate_id, updated_at, submitted_at')
      .in('candidate_id', ids)
    for (const a of Array.isArray(data) ? data : []) {
      // A submitted application means they are out of the cohort entirely;
      // recording it here lets the loop below skip them defensively even if a
      // status write was missed somewhere.
      appUpdated[String(a.candidate_id)] = a.submitted_at ? 'SUBMITTED' : (a.updated_at ?? null)
    }
  } catch {
    // No draft timestamps: the clock falls back to invite/test dates, which is
    // the correct conservative reading — never more aggressive.
  }

  // Which automatic reminders have already gone out.
  const sentNumbers: Record<string, number[]> = {}
  try {
    const { data } = await svc
      .from('onb_application_reminders')
      .select('candidate_id, reminder_number, kind')
      .in('candidate_id', ids)
      .eq('kind', 'auto')
    for (const r of Array.isArray(data) ? data : []) {
      const k = String(r.candidate_id)
      if (!sentNumbers[k]) sentNumbers[k] = []
      sentNumbers[k].push(Number(r.reminder_number))
    }
  } catch {
    // Unknown history would mean re-sending. The unique index still refuses a
    // duplicate, so the worst case is a claim that fails and is released.
  }

  const now = new Date()
  const outcomes: Outcome[] = []
  let sentCount = 0
  let asideCount = 0

  for (const c of candidates) {
    const draft = appUpdated[String(c.id)]
    if (draft === 'SUBMITTED') continue

    const decision = nextReminderAction(
      {
        status: c.status,
        track: c.track,
        invitedAt: c.invited_at,
        testPassedAt: c.test_passed_at,
        applicationUpdatedAt: draft ?? null,
      },
      sentNumbers[String(c.id)] || [],
      now,
    )
    if (decision.action === 'nothing') continue

    const name = `${c.first_name || ''}`.trim() || c.email
    const quiet = decision.daysQuiet

    if (dryRun || paused) {
      outcomes.push({
        id: c.id, name, days_quiet: quiet,
        action: decision.action === 'send' ? `would send reminder ${decision.reminderNumber}` : 'would set aside',
      })
      continue
    }

    // ── Set aside ──────────────────────────────────────────────────────────
    if (decision.action === 'set_aside') {
      const nowIso = new Date().toISOString()
      const { error } = await svc
        .from('onb_candidates')
        .update({
          status: 'withdrawn',
          withdrawn_at: nowIso,
          withdrawal_reason: 'unresponsive',
          updated_at: nowIso,
        })
        .eq('id', c.id)
        // Conditional: if anything moved this candidate since the read, leave
        // them alone rather than overwriting someone else's decision.
        .eq('status', c.status)
      if (error) {
        outcomes.push({ id: c.id, name, days_quiet: quiet, action: 'set_aside', ok: false, error: error.message })
        continue
      }
      asideCount++
      // Courtesy notice. A failure here is reported but never un-sets-aside
      // them — the status write is the decision, the email is the manners.
      const notice = await sendSetAsideNotice(c.email, c.first_name || '')
      outcomes.push({ id: c.id, name, days_quiet: quiet, action: 'set_aside', ok: true, error: notice.ok ? undefined : notice.error })
      continue
    }

    // ── Send a reminder ────────────────────────────────────────────────────
    // Claim the slot FIRST. The partial unique index makes this atomic: if a
    // concurrent or retried run already claimed it, the insert fails and we
    // move on rather than sending twice.
    const { data: claim, error: claimErr } = await svc
      .from('onb_application_reminders')
      .insert({ candidate_id: c.id, reminder_number: decision.reminderNumber, kind: 'auto' })
      .select('id')
      .single()
    if (claimErr || !claim) {
      outcomes.push({
        id: c.id, name, days_quiet: quiet,
        action: `reminder ${decision.reminderNumber}`, ok: false,
        error: 'slot already claimed',
      })
      continue
    }

    const rawAccessToken = crypto.randomBytes(32).toString('hex')
    const rawOptoutToken = crypto.randomBytes(32).toString('hex')
    const nowIso = new Date().toISOString()
    await svc.from('onb_candidates').update({
      access_token: hashToken(rawAccessToken),
      token_expires_at: days(REMINDER_TOKEN_TTL_DAYS),
      optout_token: hashToken(rawOptoutToken),
      optout_expires_at: days(OPTOUT_TOKEN_TTL_DAYS),
      updated_at: nowIso,
    }).eq('id', c.id)

    const sent = await sendApplicationReminder({
      to: c.email,
      firstName: c.first_name || '',
      reminderNumber: decision.reminderNumber,
      rawAccessToken,
      rawOptoutToken,
      path: reminderPathForTrack(c.track),
    })

    if (sent.ok) {
      await svc.from('onb_application_reminders').update({ resend_id: sent.id }).eq('id', claim.id)
      sentCount++
      outcomes.push({ id: c.id, name, days_quiet: quiet, action: `reminder ${decision.reminderNumber}`, ok: true })
    } else {
      // Release the claim so tomorrow retries. Burning the slot on a transient
      // Resend failure would mean this candidate silently never gets chased —
      // the exact outcome the whole feature exists to prevent.
      await svc.from('onb_application_reminders').delete().eq('id', claim.id)
      outcomes.push({
        id: c.id, name, days_quiet: quiet,
        action: `reminder ${decision.reminderNumber}`, ok: false, error: sent.error,
      })
    }
  }

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    paused,
    cadence: { reminder_1_day: REMINDER_1_DAY, reminder_2_day: REMINDER_2_DAY, set_aside_day: SET_ASIDE_DAY },
    considered: candidates.length,
    acted_on: outcomes.length,
    sent: sentCount,
    set_aside: asideCount,
    outcomes,
  })
}

export async function GET(request: NextRequest) { return handler(request) }
export async function POST(request: NextRequest) { return handler(request) }
