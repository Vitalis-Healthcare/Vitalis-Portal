// app/api/cron/cjis-overdue/route.ts
//
// The daily chase. Runs at 12:00 UTC (8 am EDT / 7 am EST — the same drift
// handling the other crons use), so it lands before the working day rather
// than during it.
//
// Daily, not weekly, and deliberately repetitive: a weekly digest of overdue
// background checks is a document people file. A short email every morning
// naming the same person for the fifth day running is one people close by
// resolving it.
//
// AUTH: dual, via lib/brief/auth.ts — CRON_SECRET bearer for the scheduler, or
// a signed-in admin/supervisor session for a browser.
// ?dry_run=1 — compute and report everything, send nothing.
// ?force=1   — send even if today's email already went out.
// portal_settings.cjis_alerts_paused = 'true' silences it without a redeploy.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { authorizeBriefRequest } from '@/lib/brief/auth'
import { loadOverdueCjis, worstTier } from '@/lib/onboarding/overdue-cjis'
import {
  resolveRecipients, sendOverdueCjisEmail, subjectFor,
  PAUSE_KEY, LAST_SENT_KEY,
} from '@/lib/onboarding/overdue-cjis-email'

export const dynamic = 'force-dynamic'

async function handler(request: NextRequest) {
  const auth = await authorizeBriefRequest(request)
  if (!auth.caller) return auth.response!

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dry_run') === '1'
  const force = url.searchParams.get('force') === '1'

  const svc = createServiceClient()

  // "Today" in agency time, not server time — a sweep that thinks it is
  // tomorrow at 8 pm ET would chase people a day early.
  const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

  const overdue = await loadOverdueCjis(todayET)
  const tier = worstTier(overdue)

  if (overdue.length === 0) {
    // No email. An "all clear" every morning is the fastest way to teach
    // people that this sender can be ignored.
    return NextResponse.json({ ok: true, today: todayET, overdue: 0, sent: false, reason: 'nothing_overdue' })
  }

  // Pause switch, checked AFTER the list is computed so a dry run still shows
  // the truth while the emails are silenced.
  let paused = false
  try {
    const { data } = await svc.from('portal_settings').select('value').eq('key', PAUSE_KEY).maybeSingle()
    paused = data?.value === 'true'
  } catch {
    paused = false
  }

  // Once per day unless forced. Vercel retries a failed cron, and the retry
  // must not produce a second copy of the same chase.
  let alreadySentToday = false
  try {
    const { data } = await svc.from('portal_settings').select('value').eq('key', LAST_SENT_KEY).maybeSingle()
    alreadySentToday = data?.value === todayET
  } catch {
    alreadySentToday = false
  }

  const summary = {
    ok: true,
    today: todayET,
    overdue: overdue.length,
    tier,
    worst_days_overdue: overdue[0]?.daysOverdue ?? 0,
    subject: subjectFor(overdue, (tier || 1) as 1 | 2 | 3),
    candidates: overdue.map((o) => ({
      id: o.candidateId,
      name: `${o.firstName} ${o.lastName}`,
      days_overdue: o.daysOverdue,
      tier: o.tier,
      extensions: o.extensionCount,
      converted: !!o.convertedProfileId,
    })),
  }

  if (dryRun) return NextResponse.json({ ...summary, sent: false, reason: 'dry_run', paused, already_sent_today: alreadySentToday })
  if (paused) return NextResponse.json({ ...summary, sent: false, reason: 'paused' })
  if (alreadySentToday && !force) return NextResponse.json({ ...summary, sent: false, reason: 'already_sent_today' })

  const effectiveTier = (tier || 1) as 1 | 2 | 3
  const recipients = await resolveRecipients(svc, effectiveTier)
  const sent = await sendOverdueCjisEmail(recipients, overdue, effectiveTier)

  // Stamp only on success. A failed send must be retried tomorrow, not marked
  // done — silence is the exact failure this feature exists to prevent.
  if (sent.ok) {
    try {
      await svc.from('portal_settings').upsert(
        { key: LAST_SENT_KEY, value: todayET, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )
    } catch {
      // A missed stamp risks a duplicate email, which is far better than a
      // missed chase. Deliberately not fatal.
    }
  }

  return NextResponse.json({
    ...summary,
    sent: sent.ok,
    recipients: recipients.length,
    error: sent.error,
  })
}

export async function GET(request: NextRequest) { return handler(request) }
export async function POST(request: NextRequest) { return handler(request) }
