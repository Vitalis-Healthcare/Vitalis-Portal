// ═════════════════════════════════════════════════════════════════════════
// The Thursday Brief — Leads and Marketing (v0.6.31)
//
// Rewritten after the first real edition. Two things it taught us:
//
//   The 43-row list of unvisited influence centers was unreadable, and an
//   unreadable section is worse than no section — it trains people to skip
//   past it, and they skip the four lines above it on the way.
//
//   A metric can be technically correct and still mislead. "0 campaigns
//   sent" was true of the DATA and false of the WORLD: 52 Weeks Marketing
//   has been sending, but nothing has been loaded into the portal since
//   April. The Brief now reports the staleness rather than the zero.
// ═════════════════════════════════════════════════════════════════════════

import type { BriefSection, Item, Metric } from '@/lib/brief/types'
import {
  fetchAll, str, ts, daysSince, nameOf, inRange,
  buildTrend, trendCounts, trendMetric,
} from '@/lib/brief/db'

/** Recurring duties that no table assigns to anybody. Naming an owner here
 *  is a deliberate editorial act: an item with no owner never gets done, and
 *  "somebody should look at this" is how a thing goes 104 days unnoticed. */
const STANDING_OWNERS: Record<string, string> = {
  newsletter_stats: 'Peace Enoch',
}

/** Long lists get truncated. The point is to provoke action on the worst
 *  cases, not to reproduce the database. */
const MAX_ITEMS = 8

/** Visit activity codes as stored. Labels are NOT invented here — an
 *  unmapped code prints as itself rather than as a guess. Fill these in
 *  once the codes are confirmed and the Brief starts using real words. */
const ACTIVITY_LABELS: Record<string, string> = {}

function labelActivity(code: string | null): string {
  if (!code) return 'Visit'
  return ACTIVITY_LABELS[code] || 'Activity ' + code
}

function failed(key: string, title: string, reason: string): BriefSection {
  return {
    key: key, title: title,
    headline: [{ label: title, value: null, hint: 'could not be read' }],
    moved: [], stalled: [], orphaned: [], upcoming: [],
    note: null, warnings: [reason],
  }
}

function byDaysDesc(a: Item, b: Item): number { return (b.days || 0) - (a.days || 0) }

/** Trim a list and say honestly how much was left out. */
function trim(items: Item[], note: string[]): Item[] {
  if (items.length <= MAX_ITEMS) return items
  note.push('Showing the ' + MAX_ITEMS + ' longest-standing of ' + items.length + '.')
  return items.slice(0, MAX_ITEMS)
}

async function profileNames(): Promise<Record<string, string>> {
  const res = await fetchAll('profiles', 'id, full_name, email')
  const out: Record<string, string> = {}
  for (let i = 0; i < res.rows.length; i++) {
    const id = str(res.rows[i], 'id')
    if (id) out[id] = nameOf(res.rows[i], 'Unnamed')
  }
  return out
}

// ── Leads ────────────────────────────────────────────────────────────────

export async function collectLeads(
  closedSince: Date, closedUntil: Date, _aheadSince: Date, aheadUntil: Date
): Promise<BriefSection> {
  const KEY = 'leads', TITLE = 'Leads and pipeline'
  const res = await fetchAll('leads')
  if (!res.ok) return failed(KEY, TITLE, 'Leads unavailable: ' + (res.error || 'unknown error'))

  const names = await profileNames()
  const acts = await fetchAll('lead_activities', 'lead_id, activity_type, created_by, created_at')
  const warnings: string[] = []
  if (!acts.ok) warnings.push('Lead activity history unavailable — "last action" is not shown')

  // Latest activity per lead, and how many actions each has had.
  const lastAct: Record<string, number> = {}
  const lastActType: Record<string, string> = {}
  const actCount: Record<string, number> = {}
  for (let i = 0; i < acts.rows.length; i++) {
    const lid = str(acts.rows[i], 'lead_id')
    if (!lid) continue
    actCount[lid] = (actCount[lid] || 0) + 1
    const t = ts(acts.rows[i], 'created_at')
    if (isNaN(t)) continue
    if (!lastAct[lid] || t > lastAct[lid]) {
      lastAct[lid] = t
      lastActType[lid] = str(acts.rows[i], 'activity_type') || 'activity'
    }
  }

  const now = closedUntil.getTime()
  const since = closedSince.getTime()
  const trend = buildTrend(closedSince, closedUntil)

  const moved: Item[] = []
  const stalled: Item[] = []
  const orphaned: Item[] = []
  const upcoming: Item[] = []
  let open = 0, wonThisWeek = 0, lostThisWeek = 0, neverActioned = 0

  for (let i = 0; i < res.rows.length; i++) {
    const r = res.rows[i]
    const id = str(r, 'id') || ''
    // ── v0.6.38: stage/status split. `status` is now the five-value
    // operational vocabulary; archived leads carry `archived_at` and are
    // out of the Brief entirely (before the split they wrongly counted as
    // open). Pre-migration values degrade safely: anything not in the
    // closed set reads as open, exactly as before.
    if (str(r, 'archived_at')) continue
    const status = (str(r, 'status') || 'ongoing').toLowerCase()
    const closed = status === 'won' || status === 'lost' || status === 'cancelled'
    const label = nameOf(r, 'Unnamed lead')
    const href = '/leads'
    const loggedBy = names[str(r, 'created_by') || ''] || null
    const source = str(r, 'source')

    /** "logged by Marie · from Facebook" — who put it in and where it came
     *  from, so a stalled lead can be traced back to a person. */
    const provenance =
      (loggedBy ? 'logged by ' + loggedBy : 'logged by nobody recorded') +
      (source ? ' \u00b7 from ' + source : '')

    if (!closed) open++

    const wonAt = ts(r, 'won_date')
    const lostAt = ts(r, 'lost_date')
    if (inRange(wonAt, since, now)) {
      wonThisWeek++
      moved.push({ label: label, detail: 'Won \u00b7 ' + provenance, days: null, owner: loggedBy, href: href })
    } else if (inRange(lostAt, since, now)) {
      lostThisWeek++
      moved.push({ label: label, detail: 'Lost \u00b7 ' + provenance, days: null, owner: loggedBy, href: href })
    } else if (lastAct[id] && lastAct[id] >= since && lastAct[id] < now) {
      moved.push({
        label: label,
        detail: labelActivity(lastActType[id]) + ' \u00b7 ' + provenance,
        days: null, owner: loggedBy, href: href,
      })
    }

    if (closed) continue

    const assigned = str(r, 'assigned_to')
    const followUp = ts(r, 'next_follow_up')
    const created = ts(r, 'created_at')
    const lastTouch = lastAct[id] || created
    const quiet = daysSince(lastTouch, now)
    const actions = actCount[id] || 0

    if (actions === 0) neverActioned++

    if (!isNaN(followUp) && followUp >= now && followUp < aheadUntil.getTime()) {
      upcoming.push({
        label: label, detail: 'Follow-up due \u00b7 ' + provenance,
        days: null, owner: assigned ? names[assigned] || 'assigned' : 'nobody', href: href,
      })
    }

    // Overdue follow-up, or simply nothing has happened for a fortnight.
    const overdueFollowUp = !isNaN(followUp) && followUp < now
    if (overdueFollowUp || (quiet !== null && quiet >= 14)) {
      stalled.push({
        label: label,
        detail:
          (actions === 0
            ? 'No action ever recorded'
            : labelActivity(lastActType[id]) + ' was the last action') +
          ' \u00b7 ' + provenance,
        days: quiet,
        owner: assigned ? names[assigned] || 'assigned' : 'nobody',
        href: href,
      })
    }

    if (!assigned) {
      orphaned.push({
        label: label,
        detail: 'Open lead with nobody assigned \u00b7 ' + provenance,
        days: quiet, owner: 'nobody', href: href,
      })
    }
  }

  stalled.sort(byDaysDesc); orphaned.sort(byDaysDesc); moved.sort(byDaysDesc)
  const notes: string[] = []
  const stalledOut = trim(stalled, notes)
  const orphanedOut = trim(orphaned, notes)

  const headline: Metric[] = [
    trendMetric('New leads', trendCounts(res.rows as unknown[], 'created_at', trend)),
    { label: 'Open', value: open, hint: 'not yet won or lost' },
    { label: 'Won this week', value: wonThisWeek, hint: null },
    { label: 'Lost this week', value: lostThisWeek, hint: null },
    {
      label: 'Never actioned',
      value: neverActioned,
      hint: neverActioned > 0 ? 'open, with no activity ever recorded' : null,
    },
    { label: 'Unassigned', value: orphaned.length, hint: orphaned.length > 0 ? 'nobody is on these' : null },
  ]

  const nothing = moved.length === 0 && stalled.length === 0 && orphaned.length === 0
  return {
    key: KEY, title: TITLE, headline: headline,
    moved: moved.slice(0, MAX_ITEMS), stalled: stalledOut, orphaned: orphanedOut, upcoming: upcoming.slice(0, MAX_ITEMS),
    note: nothing ? 'No lead changed hands this week and nothing is overdue.' : (notes.join(' ') || null),
    warnings: warnings,
  }
}

// ── Marketing ────────────────────────────────────────────────────────────

/** A campaign upload older than this is treated as a process failure rather
 *  than a quiet week. Two weeks is generous for a weekly newsletter. */
const CAMPAIGN_STALE_DAYS = 14

export async function collectMarketing(
  closedSince: Date, closedUntil: Date
): Promise<BriefSection> {
  const KEY = 'marketing', TITLE = 'Marketing'
  const warnings: string[] = []

  const visits = await fetchAll('marketing_visit_logs')
  const centers = await fetchAll('marketing_influence_centers')
  const campaigns = await fetchAll('marketing_email_campaigns')

  if (!visits.ok && !centers.ok && !campaigns.ok) {
    return failed(KEY, TITLE, 'Marketing unavailable: ' + (visits.error || 'unknown error'))
  }
  if (!visits.ok) warnings.push('Visit logs unavailable: ' + (visits.error || 'unknown error'))
  if (!centers.ok) warnings.push('Influence centers unavailable: ' + (centers.error || 'unknown error'))
  if (!campaigns.ok) warnings.push('Email campaigns unavailable: ' + (campaigns.error || 'unknown error'))

  const now = closedUntil.getTime()
  const since = closedSince.getTime()
  const trend = buildTrend(closedSince, closedUntil)

  // Centre id -> name, resolved here rather than through an embedded join.
  // v0.6.30 asked PostgREST for `marketing_influence_centers(name)` while
  // fetching with select('*'), which never returns embedded relations — so
  // every visit rendered as the fallback label "Visit logged".
  const centerName: Record<string, string> = {}
  for (let i = 0; i < centers.rows.length; i++) {
    const id = str(centers.rows[i], 'id')
    if (id) centerName[id] = nameOf(centers.rows[i], 'Influence center')
  }

  const moved: Item[] = []
  const orphaned: Item[] = []

  // Last visit per centre.
  const lastVisit: Record<string, number> = {}
  const activityTally: Record<string, number> = {}
  for (let i = 0; i < visits.rows.length; i++) {
    const v = visits.rows[i]
    const cid = str(v, 'influence_center_id')
    const t = ts(v, 'visit_date')
    const code = str(v, 'activity_type') || ''
    if (code) activityTally[code] = (activityTally[code] || 0) + 1
    if (cid && !isNaN(t) && (!lastVisit[cid] || t > lastVisit[cid])) lastVisit[cid] = t

    if (inRange(t, since, now)) {
      moved.push({
        label: (cid && centerName[cid]) || 'Unrecorded location',
        detail: labelActivity(code),
        days: null, owner: null, href: '/marketing',
      })
    }
  }

  // The coverage bands you asked for, in place of the wall of names.
  let within30 = 0, over30 = 0, never = 0
  for (let i = 0; i < centers.rows.length; i++) {
    const id = str(centers.rows[i], 'id')
    if (!id) continue
    const last = lastVisit[id]
    if (!last) {
      never++
      orphaned.push({
        label: centerName[id] || 'Influence center',
        detail: 'Never visited', days: null, owner: 'nobody', href: '/marketing',
      })
      continue
    }
    const gap = daysSince(last, now)
    if (gap !== null && gap <= 30) { within30++; continue }
    over30++
    if (gap !== null && gap >= 90) {
      orphaned.push({
        label: centerName[id] || 'Influence center',
        detail: 'No visit in ' + gap + ' days', days: gap, owner: 'nobody', href: '/marketing',
      })
    }
  }

  // ── The newsletter gap ────────────────────────────────────────────────
  // Reporting "0 campaigns" would be true of the table and false of the
  // world. What is actually wrong is that nobody owns loading the figures.
  let lastCampaign = NaN
  for (let i = 0; i < campaigns.rows.length; i++) {
    const t = ts(campaigns.rows[i], 'campaign_date')
    if (!isNaN(t) && (isNaN(lastCampaign) || t > lastCampaign)) lastCampaign = t
  }
  const campaignAge = daysSince(lastCampaign, now)
  const campaignsStale = campaignAge !== null && campaignAge > CAMPAIGN_STALE_DAYS

  if (campaigns.ok && campaignsStale) {
    orphaned.unshift({
      label: 'Newsletter statistics',
      detail:
        'No campaign figures have been loaded into the portal for ' + campaignAge +
        ' days. The newsletter is going out; the numbers are not being recorded, ' +
        'so open rates cannot be reported and nobody is accountable for them.',
      days: campaignAge,
      owner: STANDING_OWNERS.newsletter_stats,
      href: '/marketing',
    })
  }

  // Rows recorded with no send count are unusable, and silently averaging
  // them would understate every rate that follows.
  let brokenRows = 0
  for (let i = 0; i < campaigns.rows.length; i++) {
    const c = campaigns.rows[i] as Record<string, unknown>
    const sent = c['total_sent']
    const opened = c['total_opened']
    if (typeof sent === 'number' && sent === 0 && typeof opened === 'number' && opened > 0) brokenRows++
  }
  if (brokenRows > 0) {
    warnings.push(
      brokenRows + ' campaign record' + (brokenRows === 1 ? ' shows' : 's show') +
      ' opens against zero sends, so open rate cannot be calculated for ' +
      (brokenRows === 1 ? 'it.' : 'them.')
    )
  }

  const notes: string[] = []
  const orphanedOut = trim(orphaned, notes)

  /** "F 215 · D 125 · X 2" — the visit-log summary. */
  const tallyKeys = Object.keys(activityTally).sort(function (a, b) {
    return activityTally[b] - activityTally[a]
  })
  const tallyParts: string[] = []
  for (let i = 0; i < tallyKeys.length; i++) {
    tallyParts.push(labelActivity(tallyKeys[i]) + ' ' + activityTally[tallyKeys[i]])
  }

  const headline: Metric[] = [
    trendMetric('Visits logged', trendCounts(visits.rows as unknown[], 'visit_date', trend)),
    { label: 'Visited within 30 days', value: within30, hint: 'of ' + centers.rows.length + ' centers' },
    { label: 'Not visited in 30+ days', value: over30, hint: null },
    { label: 'Never visited', value: never, hint: null },
    {
      label: 'Newsletter data',
      value: campaignAge === null ? null : campaignAge + ' days old',
      hint: campaignsStale ? 'nobody has loaded the figures' : 'up to date',
    },
    { label: 'All visits on record', value: visits.rows.length, hint: tallyParts.join(' \u00b7 ') || null },
  ]

  const quiet = moved.length === 0 && orphaned.length === 0
  return {
    key: KEY, title: TITLE, headline: headline,
    moved: moved.slice(0, MAX_ITEMS), stalled: [], orphaned: orphanedOut, upcoming: [],
    note: quiet ? 'No marketing activity was logged this week.' : (notes.join(' ') || null),
    warnings: warnings,
  }
}
