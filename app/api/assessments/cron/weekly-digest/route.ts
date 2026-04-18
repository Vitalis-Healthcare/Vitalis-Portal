// app/api/assessments/cron/weekly-digest/route.ts
// Fires every Monday at 13:00 UTC (8 am EST / 9 am EDT).
// 1. Flips past-due scheduled assessments → overdue.
// 2. Sends one digest email per nurse listing this week's assessments.
//
// CRON_SECRET: if the env var is set, the Authorization: Bearer header
// is enforced. If not set the route allows through (safe to deploy
// before the secret is configured in Vercel).
//
// ASSESSMENT_EMAILS_PAUSED: handled inside lib/assessments/email.ts.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendWeeklyDigestEmail } from '@/lib/assessments/email'
import type { DigestItem } from '@/lib/assessments/email'

type NurseShape = {
  id:        string
  full_name: string
  email:     string
}
type ClientShape = {
  full_name: string
  phone:     string | null
  address:   string | null
  city:      string | null
  state:     string | null
  zip:       string | null
}
type ARow = {
  scheduled_date: string
  nurse:          NurseShape | NurseShape[] | null
  client:         ClientShape | ClientShape[] | null
}

function normNurse(n: NurseShape | NurseShape[] | null): NurseShape | null {
  if (!n) return null
  return Array.isArray(n) ? (n[0] ?? null) : n
}
function normClient(c: ClientShape | ClientShape[] | null): ClientShape | null {
  if (!c) return null
  return Array.isArray(c) ? (c[0] ?? null) : c
}

export async function POST(request: Request) {
  // Auth: enforce CRON_SECRET if set; allow through if not yet configured.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const db = createServiceClient()
    const now      = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // ── 1. Flip past-due assessments to overdue ──────────────────────────────
    const { error: overdueErr } = await db
      .from('assessments')
      .update({ status: 'overdue', updated_at: now.toISOString() })
      .eq('status', 'scheduled')
      .lt('scheduled_date', todayStr)

    if (overdueErr) {
      console.error('[weekly-digest] overdue flip error:', overdueErr.message)
    }

    // ── 2. Week range: today (Monday) through +6 days (Sunday) ───────────────
    const endDate = new Date(now)
    endDate.setUTCDate(endDate.getUTCDate() + 6)
    const endStr = endDate.toISOString().split('T')[0]

    // ── 3. Fetch this week's assessments with nurse + client ─────────────────
    const { data: rawRows, error: aErr } = await db
      .from('assessments')
      .select(`
        scheduled_date,
        nurse:profiles!nurse_id ( id, full_name, email ),
        client:assessment_clients!client_id ( full_name, phone, address, city, state, zip )
      `)
      .in('status', ['scheduled', 'overdue'])
      .gte('scheduled_date', todayStr)
      .lte('scheduled_date', endStr)
      .order('scheduled_date', { ascending: true })

    if (aErr) {
      console.error('[weekly-digest] fetch error:', aErr.message)
      return NextResponse.json({ error: aErr.message }, { status: 500 })
    }

    const rows = (rawRows ?? []) as ARow[]

    // ── 4. Group by nurse ────────────────────────────────────────────────────
    const byNurse = new Map<string, { name: string; email: string; items: DigestItem[] }>()
    for (const row of rows) {
      const nurse  = normNurse(row.nurse)
      const client = normClient(row.client)
      if (!nurse?.email || !client) continue
      if (!byNurse.has(nurse.id)) {
        byNurse.set(nurse.id, {
          name:  nurse.full_name || nurse.email,
          email: nurse.email,
          items: [],
        })
      }
      const addr = [client.address, client.city, client.state, client.zip]
        .filter(Boolean)
        .join(', ')
      byNurse.get(nurse.id)!.items.push({
        clientName:    client.full_name,
        clientPhone:   client.phone ?? null,
        clientAddress: addr,
        scheduledDate: row.scheduled_date,
      })
    }

    // ── 5. Build week label ──────────────────────────────────────────────────
    const startLabel = new Date(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
    ).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    const endLabel = new Date(
      endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()
    ).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const weekLabel = `${startLabel}\u2013${endLabel}`

    // ── 6. Send one email per nurse ──────────────────────────────────────────
    let sent = 0
    const errors: string[] = []
    for (const [, nurse] of byNurse) {
      try {
        await sendWeeklyDigestEmail({
          nurseEmail: nurse.email,
          nurseName:  nurse.name,
          weekLabel,
          items:      nurse.items,
        })
        sent++
      } catch (e) {
        const msg = `${nurse.email}: ${String(e)}`
        errors.push(msg)
        console.error('[weekly-digest] email error:', msg)
      }
    }

    console.log(`[weekly-digest] done. sent=${sent} errors=${errors.length}`)
    return NextResponse.json({
      sent,
      ...(errors.length ? { errors } : {}),
    })
  } catch (err) {
    console.error('[weekly-digest] unhandled:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
