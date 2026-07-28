// ═════════════════════════════════════════════════════════════════════════
// The Thursday Brief — CareMatch360 section (v0.6.28)
//
// Vita has no database access to CareMatch360. This section reads the
// aggregate endpoint shipped as CareMatch360 v2.7.23 over HTTP.
//
// Because only aggregates cross that boundary, this section has no per-item
// lists — no names, no case titles. Everything it can say, it says in the
// headline row. That is a deliberate consequence of keeping PII on one side
// of the wall, not an oversight.
//
// WHAT IS DELIBERATELY NOT REPORTED, and why:
//   `providers.status` and `providers.available` are not maintained — on
//   28 July 2026 they read 563 active / 1 inactive and 563 available out of
//   564. Printing them every week would be printing the same two numbers
//   every week, and a section that never changes is a section the team
//   learns to skip. Credential mix, geography and new registrations carry
//   the actual signal on the supply side; the case funnel carries it on the
//   demand side.
// ═════════════════════════════════════════════════════════════════════════

import type { BriefSection, Item, Metric } from '@/lib/brief/types'
import { buildTrend } from '@/lib/brief/db'

const KEY = 'carematch360'
const TITLE = 'CareMatch360'

/** Ten seconds. The Brief must never fail to generate because another
 *  system is slow — a late report is a missing report. */
const TIMEOUT_MS = 10000

interface StatsResponse {
  source?: string
  version?: string
  generated_at?: string
  providers?: {
    total?: number
    by_status?: Record<string, number>
    by_credential?: Record<string, number>
    by_state?: Record<string, number>
    available?: number
    sms_consent?: number
    sent_to_vita?: number
    linked_to_vita?: number
    new_in_window?: number | null
  } | null
  cases?: {
    total?: number
    by_status?: Record<string, number>
    new_in_window?: number | null
  } | null
  warnings?: string[]
}

function sumOf(m: Record<string, number> | undefined, keys: string[]): number {
  if (!m) return 0
  let n = 0
  for (let i = 0; i < keys.length; i++) n += m[keys[i]] || 0
  return n
}

/** "CNA 349, UA 128, CMT 52" — the top few, largest first. */
function topOf(m: Record<string, number> | undefined, limit: number): string {
  if (!m) return '—'
  const pairs: Array<{ k: string; v: number }> = []
  const keys = Object.keys(m)
  for (let i = 0; i < keys.length; i++) pairs.push({ k: keys[i], v: m[keys[i]] })
  pairs.sort(function (a, b) { return b.v - a.v })
  const out: string[] = []
  for (let i = 0; i < pairs.length && i < limit; i++) out.push(pairs[i].k + ' ' + pairs[i].v)
  return out.length > 0 ? out.join(', ') : '—'
}

function unavailable(reason: string): BriefSection {
  return {
    key: KEY,
    title: TITLE,
    headline: [{ label: 'CareMatch360', value: null, hint: 'could not be read' }],
    moved: [],
    stalled: [],
    orphaned: [],
    upcoming: [],
    note: null,
    warnings: ['CareMatch360 figures unavailable: ' + reason],
  }
}

/** One call to the aggregate endpoint for one window. */
async function fetchWindow(
  base: string,
  secret: string,
  since: Date,
  until: Date
): Promise<StatsResponse | string> {
  const url =
    base +
    (base.indexOf('?') === -1 ? '?' : '&') +
    'since=' + encodeURIComponent(since.toISOString()) +
    '&until=' + encodeURIComponent(until.toISOString())

  try {
    const controller = new AbortController()
    const timer = setTimeout(function () { controller.abort() }, TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + secret },
        cache: 'no-store',
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
    if (!res.ok) return 'the stats endpoint returned HTTP ' + res.status
    return (await res.json()) as StatsResponse
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

export async function collectCarematch(
  closedSince: Date,
  closedUntil: Date
): Promise<BriefSection> {
  const base = process.env.CAREMATCH_STATS_URL
  const secret = process.env.VITA_STATS_SECRET

  if (!base) return unavailable('CAREMATCH_STATS_URL is not configured')
  if (!secret) return unavailable('VITA_STATS_SECRET is not configured')

  // Three windows in parallel. The endpoint is cheap and read-only, so
  // three calls cost less than adding a multi-window mode to CareMatch360
  // and redeploying it.
  const t = buildTrend(closedSince, closedUntil)
  const settled = await Promise.all([
    fetchWindow(base, secret, new Date(t.thisWeek.since), new Date(t.thisWeek.until)),
    fetchWindow(base, secret, new Date(t.lastWeek.since), new Date(t.lastWeek.until)),
    fetchWindow(base, secret, new Date(t.monthToDate.since), new Date(t.monthToDate.until)),
  ])

  if (typeof settled[0] === 'string') return unavailable(settled[0])
  const body = settled[0] as StatsResponse
  const prior = typeof settled[1] === 'string' ? null : (settled[1] as StatsResponse)
  const mtd = typeof settled[2] === 'string' ? null : (settled[2] as StatsResponse)

  const warnings: string[] = []
  if (typeof settled[1] === 'string' || typeof settled[2] === 'string') {
    warnings.push('CareMatch360: comparison figures unavailable, so this week has no context')
  }

  /** "last week 4 - month to date 11", or null when we could not get them. */
  const compare = function (pick: (r: StatsResponse) => number | null | undefined): string | null {
    if (!prior || !mtd) return null
    const a = pick(prior)
    const b = pick(mtd)
    if (typeof a !== 'number' || typeof b !== 'number') return null
    return 'last week ' + a + ' \u00b7 month to date ' + b
  }
  if (Array.isArray(body.warnings)) {
    for (let i = 0; i < body.warnings.length; i++) {
      warnings.push('CareMatch360: ' + body.warnings[i])
    }
  }

  const p = body.providers || null
  const c = body.cases || null

  const headline: Metric[] = []

  // ── Demand side first. This is the part that should provoke a question. ──
  if (c) {
    const byStatus = c.by_status || {}
    const total = typeof c.total === 'number' ? c.total : 0
    const live = sumOf(byStatus, ['lead', 'open', 'matching', 'matched'])
    const assigned = sumOf(byStatus, ['assigned'])
    const cancelled = sumOf(byStatus, ['cancelled'])
    const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : null

    headline.push({
      label: 'New cases this week',
      value: typeof c.new_in_window === 'number' ? c.new_in_window : null,
      hint:
        c.new_in_window === null
          ? 'not available'
          : compare(function (r) { return r.cases ? r.cases.new_in_window : null }),
    })
    headline.push({ label: 'Cases in play', value: live, hint: 'lead, open, matching or matched' })
    headline.push({ label: 'Assigned', value: assigned, hint: 'of ' + total + ' cases ever created' })
    headline.push({
      label: 'Cancelled',
      value: cancelRate === null ? cancelled : cancelled + ' (' + cancelRate + '%)',
      hint: 'of all cases created to date',
    })
  } else {
    warnings.push('CareMatch360: case figures were not returned')
  }

  // ── Supply side, as context for the above. ──
  if (p) {
    headline.push({
      label: 'New providers this week',
      value: typeof p.new_in_window === 'number' ? p.new_in_window : null,
      hint:
        p.new_in_window === null
          ? 'not available'
          : compare(function (r) { return r.providers ? r.providers.new_in_window : null }),
    })
    headline.push({
      label: 'Provider pool',
      value: typeof p.total === 'number' ? p.total : null,
      hint: topOf(p.by_credential, 3),
    })
    headline.push({
      label: 'Maryland',
      value: (p.by_state && p.by_state['MD']) || 0,
      hint: 'of ' + (p.total || 0) + ' registered',
    })
  } else {
    warnings.push('CareMatch360: provider figures were not returned')
  }

  // The only genuinely per-item thing that crosses the boundary is the count
  // of providers pushed into Vita, which is a Vita-side event anyway.
  const moved: Item[] = []
  if (p && typeof p.sent_to_vita === 'number' && p.sent_to_vita > 0) {
    moved.push({
      label: 'Providers pushed into Vita',
      detail:
        String(p.sent_to_vita) +
        ' provider' + (p.sent_to_vita === 1 ? '' : 's') +
        ' sent through to onboarding to date',
      days: null,
      owner: null,
      href: '/candidates',
    })
  }

  return {
    key: KEY,
    title: TITLE,
    headline: headline,
    moved: moved,
    stalled: [],
    orphaned: [],
    upcoming: [],
    note:
      'Aggregate figures only — CareMatch360 holds its own client and provider records, ' +
      'and no personal detail crosses between the two systems.',
    warnings: warnings,
  }
}
