import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { collectFacts } from '@/lib/brief/collect'

// ─────────────────────────────────────────────────────────────────────────
// GET /api/brief/collect   (v0.6.28)
//
// Builds the deterministic fact block for The Thursday Brief.
//
// This release does NOT render, does NOT write commentary and does NOT send
// anything to anybody. It exists so the numbers can be read and corrected
// before a single line of this reaches the team.
//
// Query parameters:
//   dry_run=1        compute and return; write nothing
//   at=<ISO date>    pretend it is some other moment, for checking that the
//                    week boundaries land where they should
//
// Auth: Authorization: Bearer ${CRON_SECRET}
//
// Both GET and POST are exported. Vercel cron issues GET; a person testing
// by hand reaches for POST about half the time. Supporting one and not the
// other produces a 405 that looks exactly like a broken deployment.
// ─────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured on this deployment' },
      { status: 503 }
    )
  }
  if (req.headers.get('authorization') !== 'Bearer ' + secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dry_run') === '1'
  const atParam = url.searchParams.get('at')

  let at = new Date()
  if (atParam) {
    const parsed = new Date(atParam)
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'at is not a valid date' }, { status: 400 })
    }
    at = parsed
  }

  const facts = await collectFacts(at)

  if (dryRun) {
    return NextResponse.json({ dry_run: true, written: false, facts: facts })
  }

  // Upsert on week_key: re-running on the same Thursday refreshes the
  // edition rather than creating a second one. This is what makes a double
  // cron firing harmless.
  let written = false
  const writeWarnings: string[] = []
  try {
    const svc = createServiceClient()
    const { error } = await svc
      .from('brief_editions')
      .upsert(
        {
          week_key: facts.week_key,
          window_start: facts.closed.since,
          window_end: facts.closed.until,
          facts: facts,
          status: 'draft',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'week_key' }
      )
    if (error) {
      writeWarnings.push('brief_editions upsert failed: ' + error.message)
    } else {
      written = true
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    writeWarnings.push('brief_editions upsert threw: ' + msg)
  }

  return NextResponse.json({
    dry_run: false,
    written: written,
    write_warnings: writeWarnings,
    facts: facts,
  })
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
