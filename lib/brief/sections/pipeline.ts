// ═════════════════════════════════════════════════════════════════════════
// The Thursday Brief — Leads and Marketing (v0.6.30)
// ═════════════════════════════════════════════════════════════════════════

import type { BriefSection, Item, Metric } from '@/lib/brief/types'
import {
  fetchAll, str, ts, daysSince, nameOf, inRange,
  buildTrend, trendCounts, trendMetric,
} from '@/lib/brief/db'

function failed(key: string, title: string, reason: string): BriefSection {
  return {
    key: key, title: title,
    headline: [{ label: title, value: null, hint: 'could not be read' }],
    moved: [], stalled: [], orphaned: [], upcoming: [],
    note: null, warnings: [reason],
  }
}

function byDaysDesc(a: Item, b: Item): number { return (b.days || 0) - (a.days || 0) }

// ── Leads ────────────────────────────────────────────────────────────────

export async function collectLeads(
  closedSince: Date, closedUntil: Date, _aheadSince: Date, aheadUntil: Date
): Promise<BriefSection> {
  const KEY = 'leads', TITLE = 'Leads and pipeline'
  const res = await fetchAll('leads')
  if (!res.ok) return failed(KEY, TITLE, 'Leads unavailable: ' + (res.error || 'unknown error'))

  const rows = res.rows
  const now = closedUntil.getTime()
  const since = closedSince.getTime()
  const trend = buildTrend(closedSince, closedUntil)

  const moved: Item[] = []
  const stalled: Item[] = []
  const orphaned: Item[] = []
  const upcoming: Item[] = []
  let open = 0, wonThisWeek = 0, lostThisWeek = 0

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const status = (str(r, 'status') || 'new').toLowerCase()
    const closed = status === 'won' || status === 'lost'
    const label = nameOf(r, 'Unnamed lead')
    const href = '/leads'

    if (!closed) open++

    const wonAt = ts(r, 'won_date')
    const lostAt = ts(r, 'lost_date')
    if (inRange(wonAt, since, now)) {
      wonThisWeek++
      moved.push({ label: label, detail: 'Won', days: null, owner: null, href: href })
    } else if (inRange(lostAt, since, now)) {
      lostThisWeek++
      moved.push({ label: label, detail: 'Lost', days: null, owner: null, href: href })
    }

    if (closed) continue

    const owner = str(r, 'assigned_to')
    const followUp = ts(r, 'next_follow_up')

    // Overdue follow-up: the date has passed and nothing closed it.
    if (!isNaN(followUp) && followUp < now) {
      const late = daysSince(followUp, now)
      stalled.push({
        label: label,
        detail: 'Follow-up was due and has not happened',
        days: late,
        owner: owner ? 'assigned' : 'nobody',
        href: href,
      })
    } else if (!isNaN(followUp) && followUp >= now && followUp < aheadUntil.getTime()) {
      upcoming.push({
        label: label, detail: 'Follow-up due', days: null,
        owner: owner ? 'assigned' : 'nobody', href: href,
      })
    }

    // An open lead with nobody on it is the definition of falling through.
    if (!owner) {
      orphaned.push({
        label: label,
        detail: 'Open lead with no one assigned' + (isNaN(followUp) ? ' and no follow-up date set' : ''),
        days: daysSince(ts(r, 'created_at'), now),
        owner: 'nobody',
        href: href,
      })
    }
  }

  stalled.sort(byDaysDesc); orphaned.sort(byDaysDesc)

  const headline: Metric[] = [
    trendMetric('New leads', trendCounts(rows, 'created_at', trend)),
    { label: 'Open', value: open, hint: 'not yet won or lost' },
    { label: 'Won this week', value: wonThisWeek, hint: null },
    { label: 'Lost this week', value: lostThisWeek, hint: null },
    { label: 'Unassigned', value: orphaned.length, hint: orphaned.length > 0 ? 'nobody is on these' : null },
  ]

  const quiet = moved.length === 0 && stalled.length === 0 && orphaned.length === 0
  return {
    key: KEY, title: TITLE, headline: headline,
    moved: moved, stalled: stalled, orphaned: orphaned, upcoming: upcoming,
    note: quiet ? 'No lead changed hands this week and nothing is overdue.' : null,
    warnings: [],
  }
}

// ── Marketing ────────────────────────────────────────────────────────────

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

  const moved: Item[] = []
  const orphaned: Item[] = []

  // Visits made this week.
  for (let i = 0; i < visits.rows.length; i++) {
    const v = visits.rows[i]
    if (!inRange(ts(v, 'visit_date'), since, now)) continue
    const rel = (v as Record<string, unknown>)['marketing_influence_centers']
    const relName = Array.isArray(rel)
      ? str(rel[0], 'name')
      : str(rel, 'name')
    moved.push({
      label: relName || 'Visit logged',
      detail: str(v, 'activity_type') || 'Visit',
      days: null, owner: null, href: '/marketing',
    })
  }

  // Campaigns sent this week.
  for (let i = 0; i < campaigns.rows.length; i++) {
    const c = campaigns.rows[i]
    if (!inRange(ts(c, 'campaign_date'), since, now)) continue
    const sent = (c as Record<string, unknown>)['total_sent']
    const rate = (c as Record<string, unknown>)['open_rate']
    moved.push({
      label: 'Email campaign',
      detail:
        (typeof sent === 'number' ? String(sent) + ' sent' : 'Sent') +
        (typeof rate === 'number' ? ' · ' + Math.round(rate) + '% opened' : ''),
      days: null, owner: null, href: '/marketing',
    })
  }

  // Influence centers nobody has visited in a long time. Sixty days is a
  // deliberate choice, not a computed one - a referral relationship that
  // has gone two months without contact has effectively lapsed.
  const lastVisitByCenter: Record<string, number> = {}
  for (let i = 0; i < visits.rows.length; i++) {
    const cid = str(visits.rows[i], 'influence_center_id')
    if (!cid) continue
    const t = ts(visits.rows[i], 'visit_date')
    if (isNaN(t)) continue
    if (!lastVisitByCenter[cid] || t > lastVisitByCenter[cid]) lastVisitByCenter[cid] = t
  }
  for (let i = 0; i < centers.rows.length; i++) {
    const c = centers.rows[i]
    const id = str(c, 'id')
    if (!id) continue
    const last = lastVisitByCenter[id]
    const gap = last ? daysSince(last, now) : null
    if (last && gap !== null && gap >= 60) {
      orphaned.push({
        label: nameOf(c, 'Influence center'),
        detail: 'No visit logged in ' + gap + ' days',
        days: gap, owner: 'nobody', href: '/marketing',
      })
    } else if (!last) {
      orphaned.push({
        label: nameOf(c, 'Influence center'),
        detail: 'Never visited',
        days: null, owner: 'nobody', href: '/marketing',
      })
    }
  }
  orphaned.sort(byDaysDesc)

  const headline: Metric[] = [
    trendMetric('Visits logged', trendCounts(visits.rows, 'visit_date', trend)),
    trendMetric('Campaigns sent', trendCounts(campaigns.rows, 'campaign_date', trend)),
    { label: 'Influence centers', value: centers.rows.length, hint: 'on the books' },
    {
      label: 'Lapsed',
      value: orphaned.length,
      hint: orphaned.length > 0 ? 'no contact in 60+ days, or never' : null,
    },
  ]

  const quiet = moved.length === 0 && orphaned.length === 0
  return {
    key: KEY, title: TITLE, headline: headline,
    moved: moved, stalled: [], orphaned: orphaned, upcoming: [],
    note: quiet ? 'No marketing activity was logged this week.' : null,
    warnings: warnings,
  }
}
