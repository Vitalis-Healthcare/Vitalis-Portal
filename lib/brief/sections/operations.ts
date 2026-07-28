// ═════════════════════════════════════════════════════════════════════════
// The Thursday Brief — Compliance, Assessments, Training, Policies (v0.6.31)
//
// Two sections rewritten after the first real edition:
//
//   ASSESSMENTS now reports clients with NO assessment scheduled at all.
//   The v0.6.30 version could only see assessments that exist, so a client
//   nobody had scheduled anything for was invisible — the quietest and
//   worst failure of the lot.
//
//   COMPLIANCE now reports CATEGORIES AND COUNTS, not named individuals,
//   plus a three-window trend. The question the team should be answering
//   every Thursday is "is the backlog shrinking", and a list of four names
//   answers a different and less useful question. Note this is deliberately
//   the opposite treatment from Candidates, where naming people IS the
//   point — one is a shared backlog, the other is an individual's move.
// ═════════════════════════════════════════════════════════════════════════

import type { BriefSection, Item, Metric } from '@/lib/brief/types'
import {
  fetchAll, str, bool, ts, daysSince, nameOf, inRange, field,
  buildTrend, trendCounts, trendMetric,
} from '@/lib/brief/db'

const MAX_ITEMS = 8

function failed(key: string, title: string, reason: string): BriefSection {
  return {
    key: key, title: title,
    headline: [{ label: title, value: null, hint: 'could not be read' }],
    moved: [], stalled: [], orphaned: [], upcoming: [],
    note: null, warnings: [reason],
  }
}

function byDaysDesc(a: Item, b: Item): number { return (b.days || 0) - (a.days || 0) }

function trim(items: Item[], note: string[], what: string): Item[] {
  if (items.length <= MAX_ITEMS) return items
  note.push('Showing ' + MAX_ITEMS + ' of ' + items.length + ' ' + what + '.')
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

// ── Compliance ───────────────────────────────────────────────────────────

export async function collectCompliance(
  closedSince: Date, closedUntil: Date, _aheadSince: Date, aheadUntil: Date
): Promise<BriefSection> {
  const KEY = 'compliance', TITLE = 'Compliance'
  const warnings: string[] = []

  const creds = await fetchAll('staff_credentials')
  if (!creds.ok) return failed(KEY, TITLE, 'Credentials unavailable: ' + (creds.error || 'unknown error'))

  const types = await fetchAll('credential_types', 'id, name')
  const typeName: Record<string, string> = {}
  for (let i = 0; i < types.rows.length; i++) {
    const id = str(types.rows[i], 'id')
    if (id) typeName[id] = str(types.rows[i], 'name') || 'Credential'
  }
  if (!types.ok) warnings.push('Credential type names unavailable — categories shown generically')

  const now = closedUntil.getTime()
  const aheadEnd = aheadUntil.getTime()
  const trend = buildTrend(closedSince, closedUntil)

  // Counts by category, and the distinct people behind each count — the
  // team needs to know how many caregivers are affected, not just how many
  // documents, because one person with three lapsed items is one problem.
  const expiredByType: Record<string, number> = {}
  const expiredPeople: Record<string, Record<string, boolean>> = {}
  const expiringByType: Record<string, number> = {}
  const pendingByType: Record<string, number> = {}
  const affected: Record<string, boolean> = {}

  for (let i = 0; i < creds.rows.length; i++) {
    const c = creds.rows[i]
    if (bool(c, 'not_applicable')) continue
    const what = typeName[str(c, 'credential_type_id') || ''] || 'Uncategorised'
    const who = str(c, 'user_id') || 'unknown'

    if ((str(c, 'review_status') || '').toLowerCase() === 'pending') {
      pendingByType[what] = (pendingByType[what] || 0) + 1
    }

    if (bool(c, 'does_not_expire')) continue
    const exp = ts(c, 'expiry_date')
    if (isNaN(exp)) continue

    if (exp < now) {
      expiredByType[what] = (expiredByType[what] || 0) + 1
      if (!expiredPeople[what]) expiredPeople[what] = {}
      expiredPeople[what][who] = true
      affected[who] = true
    } else if (exp < aheadEnd) {
      expiringByType[what] = (expiringByType[what] || 0) + 1
    }
  }

  /** One row per category: how many documents, how many caregivers. */
  function categoryItems(
    counts: Record<string, number>,
    people: Record<string, Record<string, boolean>> | null,
    verb: string
  ): Item[] {
    const keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] })
    const out: Item[] = []
    for (let i = 0; i < keys.length; i++) {
      const n = counts[keys[i]]
      const heads = people && people[keys[i]] ? Object.keys(people[keys[i]]).length : null
      out.push({
        label: keys[i],
        detail:
          n + ' ' + verb +
          (heads !== null
            ? ' across ' + heads + ' caregiver' + (heads === 1 ? '' : 's')
            : ''),
        days: null,
        owner: 'an administrator',
        href: '/credentials',
      })
    }
    return out
  }

  const stalled = categoryItems(expiredByType, expiredPeople, 'expired')
  const upcoming = categoryItems(expiringByType, null, 'expiring next week')
  const pending = categoryItems(pendingByType, null, 'awaiting review')
  for (let i = 0; i < pending.length; i++) stalled.push(pending[i])

  // Are we clearing it? Approvals across three windows answer that.
  const approvedRows: unknown[] = []
  for (let i = 0; i < creds.rows.length; i++) {
    if ((str(creds.rows[i], 'review_status') || '').toLowerCase() === 'approved') {
      approvedRows.push(creds.rows[i])
    }
  }
  const resolvedTrend = trendCounts(approvedRows, 'updated_at', trend)

  const moved: Item[] = []
  if (resolvedTrend.thisWeek > 0) {
    moved.push({
      label: 'Credentials approved',
      detail: resolvedTrend.thisWeek + ' approved during the week just ended',
      days: null, owner: null, href: '/credentials',
    })
  }

  const refs = await fetchAll('caregiver_references')
  let refsOutstanding = 0
  if (refs.ok) {
    for (let i = 0; i < refs.rows.length; i++) {
      const done = field(refs.rows[i], 'completed_at') || field(refs.rows[i], 'responded_at')
      if (!done) refsOutstanding++
    }
  } else {
    warnings.push('References unavailable: ' + (refs.error || 'unknown error'))
  }

  let totalExpired = 0
  const ek = Object.keys(expiredByType)
  for (let i = 0; i < ek.length; i++) totalExpired += expiredByType[ek[i]]
  let totalPending = 0
  const pk = Object.keys(pendingByType)
  for (let i = 0; i < pk.length; i++) totalPending += pendingByType[pk[i]]
  let totalExpiring = 0
  const xk = Object.keys(expiringByType)
  for (let i = 0; i < xk.length; i++) totalExpiring += expiringByType[xk[i]]

  const headline: Metric[] = [
    {
      label: 'Expired',
      value: totalExpired,
      hint: totalExpired > 0
        ? 'across ' + Object.keys(affected).length + ' caregiver' + (Object.keys(affected).length === 1 ? '' : 's')
        : null,
    },
    trendMetric('Cleared', resolvedTrend),
    { label: 'Expiring next week', value: totalExpiring, hint: null },
    { label: 'Awaiting review', value: totalPending, hint: null },
    { label: 'References outstanding', value: refs.ok ? refsOutstanding : null, hint: refs.ok ? null : 'could not be read' },
  ]

  const quiet = stalled.length === 0 && upcoming.length === 0
  return {
    key: KEY, title: TITLE, headline: headline,
    moved: moved, stalled: stalled, orphaned: [], upcoming: upcoming,
    note: quiet
      ? 'Nothing expired, nothing expiring, nothing awaiting review.'
      : 'Categories, not individuals — the credentials page has the names.',
    warnings: warnings,
  }
}

// ── Assessments ──────────────────────────────────────────────────────────

export async function collectAssessments(
  closedSince: Date, closedUntil: Date, _aheadSince: Date, _aheadUntil: Date
): Promise<BriefSection> {
  const KEY = 'assessments', TITLE = 'Assessments'
  const warnings: string[] = []

  const rows = await fetchAll('assessments')
  if (!rows.ok) return failed(KEY, TITLE, 'Assessments unavailable: ' + (rows.error || 'unknown error'))

  const clients = await fetchAll('assessment_clients', 'id, full_name, status')
  if (!clients.ok) {
    return failed(
      KEY, TITLE,
      'Client list unavailable, so discharged clients could not be excluded — figures suppressed rather than reported wrongly'
    )
  }

  // Discharged clients must be excluded explicitly: `assessments` carries no
  // link to client status.
  const discharged: Record<string, boolean> = {}
  const clientName: Record<string, string> = {}
  for (let i = 0; i < clients.rows.length; i++) {
    const id = str(clients.rows[i], 'id')
    if (!id) continue
    clientName[id] = nameOf(clients.rows[i], 'Unnamed client')
    if ((str(clients.rows[i], 'status') || '').toLowerCase() === 'discharged') discharged[id] = true
  }

  const now = closedUntil.getTime()
  const since = closedSince.getTime()
  const DAY = 86400000
  const trend = buildTrend(closedSince, closedUntil)

  const moved: Item[] = []
  const overdueUnder30: Item[] = []
  const overdueOver30: Item[] = []
  const dueIn30: Item[] = []
  const hasAny: Record<string, boolean> = {}
  const hasFuture: Record<string, boolean> = {}

  for (let i = 0; i < rows.rows.length; i++) {
    const a = rows.rows[i]
    const cid = str(a, 'client_id') || ''
    if (discharged[cid]) continue
    hasAny[cid] = true
    const who = clientName[cid] || 'Unnamed client'
    const href = '/assessments'

    const done = ts(a, 'completed_date')
    if (inRange(done, since, now)) {
      moved.push({ label: who, detail: 'Assessment completed', days: null, owner: null, href: href })
      continue
    }
    if (!isNaN(done)) continue

    const due = ts(a, 'scheduled_date')
    if (isNaN(due)) continue

    if (due >= now) {
      hasFuture[cid] = true
      if (due < now + 30 * DAY) {
        dueIn30.push({
          label: who, detail: 'Due in ' + (daysSince(now, due) || 0) + ' days',
          days: null, owner: 'the assigned nurse', href: href,
        })
      }
      continue
    }

    const late = daysSince(due, now) || 0
    const item: Item = {
      label: who,
      detail: 'Overdue by ' + late + ' days',
      days: late, owner: 'the assigned nurse', href: href,
    }
    if (late > 30) overdueOver30.push(item)
    else overdueUnder30.push(item)
  }

  // Clients with nothing scheduled at all. Invisible to v0.6.30 because it
  // could only see assessments that exist.
  const unscheduled: Item[] = []
  const clientIds = Object.keys(clientName)
  for (let i = 0; i < clientIds.length; i++) {
    const cid = clientIds[i]
    if (discharged[cid]) continue
    if (!hasAny[cid]) {
      unscheduled.push({
        label: clientName[cid],
        detail: 'No assessment has ever been scheduled for this client',
        days: null, owner: 'nobody', href: '/assessments',
      })
    } else if (!hasFuture[cid] && !overdueOver30.concat(overdueUnder30).some(function (x) { return x.label === clientName[cid] })) {
      // Has history, nothing outstanding, nothing ahead.
      unscheduled.push({
        label: clientName[cid],
        detail: 'No assessment currently scheduled',
        days: null, owner: 'nobody', href: '/assessments',
      })
    }
  }

  overdueOver30.sort(byDaysDesc); overdueUnder30.sort(byDaysDesc)
  const stalled = overdueOver30.concat(overdueUnder30)
  const notes: string[] = []
  const stalledOut = trim(stalled, notes, 'overdue assessments')
  const unscheduledOut = trim(unscheduled, notes, 'clients')

  const activeCount = clientIds.length - Object.keys(discharged).length

  const headline: Metric[] = [
    trendMetric('Completed', trendCounts(rows.rows as unknown[], 'completed_date', trend)),
    { label: 'Due within 30 days', value: dueIn30.length, hint: null },
    { label: 'Overdue up to 30 days', value: overdueUnder30.length, hint: null },
    {
      label: 'Overdue over 30 days',
      value: overdueOver30.length,
      hint: overdueOver30.length > 0 ? 'the ones that will not fix themselves' : null,
    },
    {
      label: 'Nothing scheduled',
      value: unscheduled.length,
      hint: unscheduled.length > 0 ? 'of ' + activeCount + ' active clients' : null,
    },
  ]

  const quiet = moved.length === 0 && stalled.length === 0 && unscheduled.length === 0 && dueIn30.length === 0
  return {
    key: KEY, title: TITLE, headline: headline,
    moved: moved.slice(0, MAX_ITEMS),
    stalled: stalledOut,
    orphaned: unscheduledOut,
    upcoming: dueIn30.slice(0, MAX_ITEMS),
    note: quiet ? 'No assessment was completed, is overdue, or falls due.' : (notes.join(' ') || null),
    warnings: warnings,
  }
}

// ── Training ─────────────────────────────────────────────────────────────

export async function collectTraining(
  closedSince: Date, closedUntil: Date
): Promise<BriefSection> {
  const KEY = 'training', TITLE = 'Training'
  const res = await fetchAll('course_enrollments')
  if (!res.ok) return failed(KEY, TITLE, 'Training records unavailable: ' + (res.error || 'unknown error'))

  const names = await profileNames()
  const now = closedUntil.getTime()
  const since = closedSince.getTime()

  const moved: Item[] = []
  const stalled: Item[] = []
  let inProgress = 0

  for (let i = 0; i < res.rows.length; i++) {
    const e = res.rows[i]
    const who = names[str(e, 'user_id') || ''] || 'Unknown staff member'
    const done = ts(e, 'completed_at')

    if (inRange(done, since, now)) {
      moved.push({ label: who, detail: 'Completed a module', days: null, owner: null, href: '/lms' })
      continue
    }
    if (!isNaN(done)) continue

    inProgress++
    const pct = field(e, 'progress_pct')
    const age = daysSince(ts(e, 'created_at'), now)
    if (age !== null && age >= 30 && (typeof pct !== 'number' || pct === 0)) {
      stalled.push({
        label: who,
        detail: 'Enrolled ' + age + ' days ago and has not started',
        days: age, owner: who, href: '/lms',
      })
    }
  }

  stalled.sort(byDaysDesc)
  const notes: string[] = []
  const stalledOut = trim(stalled, notes, 'enrolments')

  const headline: Metric[] = [
    { label: 'Completed this week', value: moved.length, hint: null },
    { label: 'In progress', value: inProgress, hint: null },
    { label: 'Not started', value: stalled.length, hint: stalled.length > 0 ? 'enrolled 30+ days ago' : null },
  ]

  return {
    key: KEY, title: TITLE, headline: headline,
    moved: moved.slice(0, MAX_ITEMS), stalled: stalledOut, orphaned: [], upcoming: [],
    note: moved.length === 0 && stalled.length === 0
      ? 'No module was completed this week and nothing is sitting untouched.'
      : (notes.join(' ') || null),
    warnings: [],
  }
}

// ── Policies ─────────────────────────────────────────────────────────────

export async function collectPolicies(
  closedSince: Date, closedUntil: Date
): Promise<BriefSection> {
  const KEY = 'policies', TITLE = 'Policies'
  const acks = await fetchAll('pp_acknowledgments')
  if (!acks.ok) return failed(KEY, TITLE, 'Acknowledgments unavailable: ' + (acks.error || 'unknown error'))

  const names = await profileNames()
  const now = closedUntil.getTime()
  const since = closedSince.getTime()

  const moved: Item[] = []
  let total = 0

  for (let i = 0; i < acks.rows.length; i++) {
    const a = acks.rows[i]
    const at = ts(a, 'acknowledged_at')
    if (isNaN(at)) continue
    total++
    if (!inRange(at, since, now)) continue
    moved.push({
      label: names[str(a, 'user_id') || ''] || 'A staff member',
      detail: 'Acknowledged ' + (str(a, 'doc_id') || 'a policy'),
      days: null, owner: null, href: '/pp',
    })
  }

  const headline: Metric[] = [
    { label: 'Acknowledged this week', value: moved.length, hint: null },
    { label: 'Acknowledgments on file', value: total, hint: 'all time' },
  ]

  return {
    key: KEY, title: TITLE, headline: headline,
    moved: moved.slice(0, MAX_ITEMS), stalled: [], orphaned: [], upcoming: [],
    note: moved.length === 0 ? 'No policy was acknowledged this week.' : null,
    warnings: [],
  }
}
