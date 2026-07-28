import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { collectFacts } from '@/lib/brief/collect'
import { authorizeBriefRequest } from '@/lib/brief/auth'
import type { BriefFacts, BriefSection, Item } from '@/lib/brief/types'

// ─────────────────────────────────────────────────────────────────────────
// GET /api/brief/collect   (v0.6.29)
//
// Builds the deterministic fact block for The Thursday Brief.
//
// Two ways in:
//   - signed into the portal as an admin or supervisor, in a browser
//   - Authorization: Bearer ${CRON_SECRET}, for the scheduler
//
// Query parameters:
//   dry_run=1        compute and return; write nothing
//   at=<ISO date>    pretend it is some other moment, to check the week
//                    boundaries land where they should
//   format=json      force JSON even in a browser
//   format=html      force the inspection view even from the command line
//
// A browser gets the inspection view by default; anything else gets JSON.
//
// THE INSPECTION VIEW IS NOT THE BRIEF. It is a plain readable dump of the
// facts, so the numbers can be checked before any of this is rendered
// properly or shown to anybody. The real renderer is the next release.
// ─────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function esc(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const INK = '#1c1c1a'
const MUTED = '#6b6b63'
const RULE = '#d9d6cc'
const ALERT = '#8a3324'
const GREEN = '#2D5A1B'

function renderItems(title: string, items: Item[], accent: string): string {
  if (items.length === 0) return ''
  let out =
    '<div style="margin:18px 0 0 0;">' +
    '<div style="font:600 12px/1.4 \'DM Sans\',system-ui,sans-serif;letter-spacing:.08em;' +
    'text-transform:uppercase;color:' + accent + ';margin-bottom:8px;">' +
    esc(title) + ' (' + items.length + ')</div>' +
    '<table style="border-collapse:collapse;width:100%;">'
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    const days = it.days == null ? '' : String(it.days) + 'd'
    out +=
      '<tr style="border-top:1px solid ' + RULE + ';">' +
      '<td style="padding:7px 10px 7px 0;font:500 14px/1.5 \'DM Sans\',system-ui,sans-serif;' +
      'color:' + INK + ';white-space:nowrap;vertical-align:top;">' + esc(it.label) + '</td>' +
      '<td style="padding:7px 10px 7px 0;font:400 14px/1.5 \'DM Sans\',system-ui,sans-serif;' +
      'color:' + MUTED + ';vertical-align:top;">' + esc(it.detail) + '</td>' +
      '<td style="padding:7px 10px 7px 0;font:400 13px/1.5 \'DM Sans\',system-ui,sans-serif;' +
      'color:' + MUTED + ';white-space:nowrap;vertical-align:top;">' + esc(it.owner || '') + '</td>' +
      '<td style="padding:7px 0;font:500 13px/1.5 \'DM Sans\',system-ui,sans-serif;' +
      'color:' + (it.days != null && it.days >= 14 ? ALERT : MUTED) +
      ';text-align:right;white-space:nowrap;vertical-align:top;">' + esc(days) + '</td>' +
      '</tr>'
  }
  return out + '</table></div>'
}

function renderSection(s: BriefSection): string {
  let out =
    '<section style="margin:0 0 40px 0;">' +
    '<h2 style="font:600 22px/1.3 \'Cormorant Garamond\',Georgia,serif;color:' + INK + ';' +
    'margin:0 0 14px 0;padding-bottom:8px;border-bottom:2px solid ' + INK + ';">' +
    esc(s.title) + '</h2>'

  if (s.headline.length > 0) {
    out += '<div style="display:flex;flex-wrap:wrap;gap:26px;margin:0 0 4px 0;">'
    for (let i = 0; i < s.headline.length; i++) {
      const m = s.headline[i]
      const shown = m.value == null ? '—' : String(m.value)
      const colour = m.value == null ? ALERT : INK
      out +=
        '<div style="min-width:110px;">' +
        '<div style="font:600 26px/1.2 \'Cormorant Garamond\',Georgia,serif;color:' + colour + ';">' +
        esc(shown) + '</div>' +
        '<div style="font:500 11px/1.4 \'DM Sans\',system-ui,sans-serif;letter-spacing:.05em;' +
        'text-transform:uppercase;color:' + MUTED + ';margin-top:2px;">' + esc(m.label) + '</div>' +
        (m.hint
          ? '<div style="font:400 11px/1.4 \'DM Sans\',system-ui,sans-serif;color:' + MUTED + ';">' +
            esc(m.hint) + '</div>'
          : '') +
        '</div>'
    }
    out += '</div>'
  }

  out += renderItems('Waiting on us', s.orphaned, ALERT)
  out += renderItems('Stalled', s.stalled, ALERT)
  out += renderItems('Moved', s.moved, GREEN)
  out += renderItems('Coming up', s.upcoming, MUTED)

  if (s.note) {
    out +=
      '<p style="font:400 14px/1.6 \'DM Sans\',system-ui,sans-serif;color:' + MUTED + ';' +
      'margin:16px 0 0 0;">' + esc(s.note) + '</p>'
  }

  for (let i = 0; i < s.warnings.length; i++) {
    out +=
      '<p style="font:500 13px/1.5 \'DM Sans\',system-ui,sans-serif;color:' + ALERT + ';' +
      'margin:12px 0 0 0;padding:9px 12px;background:#fdf4f2;border-left:3px solid ' + ALERT + ';">' +
      esc(s.warnings[i]) + '</p>'
  }

  return out + '</section>'
}

function renderInspection(facts: BriefFacts, written: boolean): string {
  let out =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Thursday Brief — inspection view</title></head>' +
    '<body style="margin:0;padding:36px 22px 80px;background:#fbfaf7;">' +
    '<div style="max-width:820px;margin:0 auto;">' +
    '<div style="font:500 11px/1.4 \'DM Sans\',system-ui,sans-serif;letter-spacing:.1em;' +
    'text-transform:uppercase;color:' + MUTED + ';">Inspection view — not the finished brief</div>' +
    '<h1 style="font:600 34px/1.2 \'Cormorant Garamond\',Georgia,serif;color:' + INK + ';' +
    'margin:6px 0 4px 0;">The Thursday Brief</h1>' +
    '<div style="font:400 15px/1.5 \'DM Sans\',system-ui,sans-serif;color:' + MUTED + ';' +
    'margin-bottom:6px;">Week just ended: ' + esc(facts.window_label) + '</div>' +
    '<div style="font:400 12px/1.5 \'DM Sans\',system-ui,sans-serif;color:' + MUTED + ';' +
    'margin-bottom:30px;">' + esc(facts.week_key) + ' · generated ' + esc(facts.generated_at) +
    ' · ' + (written ? 'saved to brief_editions' : 'not saved (dry run)') + '</div>'

  for (let i = 0; i < facts.warnings.length; i++) {
    out +=
      '<p style="font:500 13px/1.5 \'DM Sans\',system-ui,sans-serif;color:' + ALERT + ';' +
      'margin:0 0 14px 0;padding:9px 12px;background:#fdf4f2;border-left:3px solid ' + ALERT + ';">' +
      esc(facts.warnings[i]) + '</p>'
  }

  for (let i = 0; i < facts.sections.length; i++) out += renderSection(facts.sections[i])

  return out +
    '<p style="font:400 12px/1.6 \'DM Sans\',system-ui,sans-serif;color:' + MUTED + ';' +
    'border-top:1px solid ' + RULE + ';padding-top:14px;margin-top:10px;">' +
    'A dash means the figure could not be worked out — it never means zero. ' +
    'Add <code>?format=json</code> to this URL for the raw fact block.</p>' +
    '</div></body></html>'
}

function wantsHtml(req: NextRequest, isSession: boolean): boolean {
  const fmt = new URL(req.url).searchParams.get('format')
  if (fmt === 'html') return true
  if (fmt === 'json') return false
  if (!isSession) return false
  const accept = req.headers.get('accept') || ''
  return accept.indexOf('text/html') !== -1
}

async function handle(req: NextRequest) {
  const auth = await authorizeBriefRequest(req)
  if (!auth.caller) return auth.response as NextResponse

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

  let written = false
  const writeWarnings: string[] = []

  if (!dryRun) {
    try {
      const svc = createServiceClient()
      const { error } = await svc.from('brief_editions').upsert(
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
  }

  if (wantsHtml(req, auth.caller.kind === 'session')) {
    const html = renderInspection(
      writeWarnings.length > 0
        ? { ...facts, warnings: facts.warnings.concat(writeWarnings) }
        : facts,
      written
    )
    return new NextResponse(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    })
  }

  return NextResponse.json({
    dry_run: dryRun,
    written: written,
    write_warnings: writeWarnings,
    caller: auth.caller.kind,
    facts: facts,
  })
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
