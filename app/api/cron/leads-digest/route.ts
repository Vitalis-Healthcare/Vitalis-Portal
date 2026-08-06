// app/api/cron/leads-digest/route.ts
// Weekday-morning leads digest (v0.6.39). Schedule in the Vercel dashboard:
// 12:00 UTC Mon–Fri (8 am EDT / 7 am EST — matches how the assessment
// crons handle the ET/UTC drift).
//
// One email per lead owner listing: overdue next actions, actions due
// today, and Standby leads waking up in the next 7 days, plus a count of
// open leads with no next action at all. Owners with nothing to act on
// get no email — an empty digest trains people to delete digests.
//
// CRON_SECRET: if the env var is set, the Authorization: Bearer header is
// enforced. If not set the route allows through (safe to deploy before
// the secret is configured in Vercel).
// LEADS_EMAILS_PAUSED: handled inside lib/leads/email.ts.
// ?dry_run=1 — compute and report everything, send nothing.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendLeadsDigestEmail } from '@/lib/leads/email'
import type { DigestLead } from '@/lib/leads/email'
import { nextActionLabel } from '@/lib/leads/model'

type OwnerShape = { id: string; full_name: string; email: string | null }

function normOwner(v: OwnerShape | OwnerShape[] | null): OwnerShape | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function fmtDue(d: string | null): string | null {
  if (!d) return null
  const parts = d.split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

async function handler(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const dryRun = new URL(request.url).searchParams.get('dry_run') === '1'

  try {
    const db = createServiceClient()

    // "Today" in agency time, not server time.
    const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const horizon = new Date()
    horizon.setDate(horizon.getDate() + 7)
    const horizonET = horizon.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    const { data: leads, error } = await db
      .from('leads')
      .select(`
        id, full_name, client_name, status, stage,
        next_action_type, next_action_due, next_action_note,
        standby_until, standby_reason, archived_at,
        owner:assigned_to(id, full_name, email)
      `)
      .is('archived_at', null)
      .in('status', ['ongoing', 'standby'])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Bucket per owner.
    type Bucket = {
      owner: OwnerShape
      overdue: DigestLead[]
      dueToday: DigestLead[]
      wakingUp: DigestLead[]
      noActionCount: number
    }
    const buckets: Record<string, Bucket> = {}
    let unowned = 0

    for (const l of leads || []) {
      const owner = normOwner(l.owner as any)
      if (!owner || !owner.email) { unowned++; continue }
      if (!buckets[owner.id]) {
        buckets[owner.id] = { owner, overdue: [], dueToday: [], wakingUp: [], noActionCount: 0 }
      }
      const b = buckets[owner.id]
      const name = l.client_name || l.full_name

      if (l.status === 'standby') {
        const wake = l.standby_until
        const entry: DigestLead = {
          id: l.id, name,
          due: fmtDue(wake),
          actionLabel: 'Standby wake-up',
          note: l.standby_reason || null,
        }
        if (!wake) { b.noActionCount++ }
        else if (wake < todayET) { entry.actionLabel = 'Standby wake-up (past due)'; b.overdue.push(entry) }
        else if (wake === todayET) { b.dueToday.push(entry) }
        else if (wake <= horizonET) { b.wakingUp.push(entry) }
        continue
      }

      // Ongoing
      const due = l.next_action_due
      const entry: DigestLead = {
        id: l.id, name,
        due: fmtDue(due),
        actionLabel: nextActionLabel(l.next_action_type),
        note: l.next_action_note || null,
      }
      if (!due) { b.noActionCount++ }
      else if (due < todayET) { b.overdue.push(entry) }
      else if (due === todayET) { b.dueToday.push(entry) }
    }

    // Send.
    let sent = 0
    const skipped: string[] = []
    const errors: string[] = []
    for (const b of Object.values(buckets)) {
      const hasContent = b.overdue.length + b.dueToday.length + b.wakingUp.length > 0 || b.noActionCount > 0
      if (!hasContent) { skipped.push(b.owner.full_name); continue }
      if (dryRun) { sent++; continue }
      try {
        await sendLeadsDigestEmail(b.owner.email!, b.owner.full_name, {
          overdue: b.overdue, dueToday: b.dueToday, wakingUp: b.wakingUp,
          noActionCount: b.noActionCount,
        })
        sent++
      } catch (err: any) {
        console.error('[leads-digest] send failed for', b.owner.full_name, err?.message)
        errors.push(`${b.owner.full_name}: ${err?.message || 'unknown'}`)
      }
    }

    return NextResponse.json({
      ok: true,
      dry_run: dryRun,
      today_et: todayET,
      owners: Object.keys(buckets).length,
      sent,
      skipped_quiet: skipped,
      unowned_open_leads: unowned,
      ...(errors.length ? { errors } : {}),
    })
  } catch (err) {
    console.error('[leads-digest] unhandled:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── Method exports ──────────────────────────────────────────────────────────
// Vercel Cron invokes scheduled routes with GET; POST retained for manual
// triggers (a lesson the assessment digest paid 405s to learn).
export const GET = handler
export const POST = handler
