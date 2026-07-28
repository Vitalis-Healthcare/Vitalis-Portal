// ═════════════════════════════════════════════════════════════════════════
// The Thursday Brief — Compliance, Assessments, Training, Policies (v0.6.30)
// ═════════════════════════════════════════════════════════════════════════

import type { BriefSection, Item, Metric } from '@/lib/brief/types'
import { fetchAll, str, bool, ts, daysSince, nameOf, inRange, field } from '@/lib/brief/db'

function failed(key: string, title: string, reason: string): BriefSection {
  return {
    key: key, title: title,
    headline: [{ label: title, value: null, hint: 'could not be read' }],
    moved: [], stalled: [], orphaned: [], upcoming: [],
    note: null, warnings: [reason],
  }
}

function byDaysDesc(a: Item, b: Item): number { return (b.days || 0) - (a.days || 0) }

/** Map profile ids to names once, so every section can name a person
 *  rather than print a uuid at somebody. */
async function profileNames(): Promise<Record<string, string>> {
  const res = await fetchAll('profiles', 'id, full_name, email')
  const out: Record<string, string> = {}
  for (let i = 0; i < res.rows.length; i++) {
    const id = str(res.rows[i], 'id')
    if (id) out[id] = nameOf(res.rows[i], 'Unnamed')
  }
  return out
}

// ── Compliance: credentials and references ───────────────────────────────

export async function collectCompliance(
  closedSince: Date, closedUntil: Date, _aheadSince: Date, aheadUntil: Date
): Promise<BriefSection> {
  const KEY = 'compliance', TITLE = 'Compliance'
  const warnings: string[] = []

  const creds = await fetchAll('staff_credentials')
  if (!creds.ok) return failed(KEY, TITLE, 'Credentials unavailable: ' + (creds.error || 'unknown error'))

  const names = await profileNames()
  const types = await fetchAll('credential_types', 'id, name')
  const typeName: Record<string, string> = {}
  for (let i = 0; i < types.rows.length; i++) {
    const id = str(types.rows[i], 'id')
    if (id) typeName[id] = str(types.rows[i], 'name') || 'Credential'
  }
  if (!types.ok) warnings.push('Credential type names unavailable — showing generic labels')

  const now = closedUntil.getTime()
  const since = closedSince.getTime()
  const aheadEnd = aheadUntil.getTime()

  const moved: Item[] = []
  const stalled: Item[] = []
  const upcoming: Item[] = []
  let expired = 0, pendingReview = 0

  for (let i = 0; i < creds.rows.length; i++) {
    const c = creds.rows[i]
    if (bool(c, 'not_applicable')) continue

    const who = names[str(c, 'user_id') || ''] || 'Unknown staff member'
    const what = typeName[str(c, 'credential_type_id') || ''] || 'Credential'
    const label = who
    const href = '/credentials'

    const review = (str(c, 'review_status') || '').toLowerCase()
    if (review === 'pending') {
      pendingReview++
      stalled.push({
        label: label,
        detail: what + ' submitted and awaiting review',
        days: daysSince(ts(c, 'created_at'), now),
        owner: 'an administrator',
        href: href,
      })
    }
    if (review === 'approved' && inRange(ts(c, 'updated_at'), since, now)) {
      moved.push({ label: label, detail: what + ' approved', days: null, owner: null, href: href })
    }

    if (bool(c, 'does_not_expire')) continue
    const exp = ts(c, 'expiry_date')
    if (isNaN(exp)) continue

    if (exp < now) {
      expired++
      stalled.push({
        label: label,
        detail: what + ' expired',
        days: daysSince(exp, now),
        owner: 'an administrator',
        href: href,
      })
    } else if (exp < aheadEnd) {
      upcoming.push({
        label: label, detail: what + ' expires this coming week',
        days: null, owner: 'an administrator', href: href,
      })
    }
  }

  // Outstanding references.
  const refs = await fetchAll('caregiver_references')
  let refsOutstanding = 0
  if (refs.ok) {
    for (let i = 0; i < refs.rows.length; i++) {
      const completed = field(refs.rows[i], 'completed_at') || field(refs.rows[i], 'responded_at')
      if (!completed) refsOutstanding++
    }
  } else {
    warnings.push('References unavailable: ' + (refs.error || 'unknown error'))
  }

  stalled.sort(byDaysDesc)

  const headline: Metric[] = [
    { label: 'Expired', value: expired, hint: expired > 0 ? 'in force today' : null },
    { label: 'Expiring next week', value: upcoming.length, hint: null },
    { label: 'Awaiting review', value: pendingReview, hint: null },
    { label: 'References outstanding', value: refs.ok ? refsOutstanding : null, hint: refs.ok ? null : 'could not be read' },
  ]

  const quiet = moved.length === 0 && stalled.length === 0 && upcoming.length === 0
  return {
    key: KEY, title: TITLE, headline: headline,
    moved: moved, stalled: stalled, orphaned: [], upcoming: upcoming,
    note: quiet ? 'Nothing expired, nothing expiring, nothing awaiting review.' : null,
    warnings: warnings,
  }
}

// ── Assessments ──────────────────────────────────────────────────────────

export async function collectAssessments(
  closedSince: Date, closedUntil: Date, _aheadSince: Date, aheadUntil: Date
): Promise<BriefSection> {
  const KEY = 'assessments', TITLE = 'Assessments'
  const warnings: string[] = []

  const rows = await fetchAll('assessments')
  if (!rows.ok) return failed(KEY, TITLE, 'Assessments unavailable: ' + (rows.error || 'unknown error'))

  // Discharged clients must be excluded explicitly — `assessments` carries
  // no link to client status. This mirrors lib/assessments/discharged.ts;
  // any new assessment read path has to do the same or it reports on
  // clients who are no longer with the agency.
  const clients = await fetchAll('assessment_clients', 'id, full_name, status')
  const discharged: Record<string, boolean> = {}
  const clientName: Record<string, string> = {}
  for (let i = 0; i < clients.rows.length; i++) {
    const id = str(clients.rows[i], 'id')
    if (!id) continue
    clientName[id] = nameOf(clients.rows[i], 'Unnamed client')
    if ((str(clients.rows[i], 'status') || '').toLowerCase() === 'discharged') discharged[id] = true
  }
  if (!clients.ok) {
    warnings.push(
      'Client list unavailable, so discharged clients could not be excluded — figures suppressed rather than reported wrongly'
    )
    return failed(KEY, TITLE, warnings[0])
  }

  const now = closedUntil.getTime()
  const since = closedSince.getTime()
  const aheadEnd = aheadUntil.getTime()

  const moved: Item[] = []
  const stalled: Item[] = []
  const upcoming: Item[] = []

  for (let i = 0; i < rows.rows.length; i++) {
    const a = rows.rows[i]
    const cid = str(a, 'client_id') || ''
    if (discharged[cid]) continue
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
    if (due < now) {
      stalled.push({
        label: who, detail: 'Assessment overdue',
        days: daysSince(due, now), owner: 'the assigned nurse', href: href,
      })
    } else if (due < aheadEnd) {
      upcoming.push({
        label: who, detail: 'Assessment due this coming week',
        days: null, owner: 'the assigned nurse', href: href,
      })
    }
  }

  stalled.sort(byDaysDesc)

  const headline: Metric[] = [
    { label: 'Completed this week', value: moved.length, hint: null },
    { label: 'Due next week', value: upcoming.length, hint: null },
    { label: 'Overdue', value: stalled.length, hint: stalled.length > 0 ? 'past their scheduled date' : null },
    { label: 'Active clients', value: Object.keys(clientName).length - Object.keys(discharged).length, hint: 'discharged excluded' },
  ]

  const quiet = moved.length === 0 && stalled.length === 0 && upcoming.length === 0
  return {
    key: KEY, title: TITLE, headline: headline,
    moved: moved, stalled: stalled, orphaned: [], upcoming: upcoming,
    note: quiet ? 'No assessment was completed, is overdue, or falls due next week.' : null,
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
    const started = ts(e, 'created_at')
    const age = daysSince(started, now)
    // Assigned a month ago and untouched is a real signal; assigned a month
    // ago and half done is somebody working through it.
    if (age !== null && age >= 30 && (typeof pct !== 'number' || pct === 0)) {
      stalled.push({
        label: who,
        detail: 'Enrolled ' + age + ' days ago and has not started',
        days: age, owner: who, href: '/lms',
      })
    }
  }

  stalled.sort(byDaysDesc)

  const headline: Metric[] = [
    { label: 'Completed this week', value: moved.length, hint: null },
    { label: 'In progress', value: inProgress, hint: null },
    { label: 'Not started', value: stalled.length, hint: stalled.length > 0 ? 'enrolled 30+ days ago' : null },
  ]

  const quiet = moved.length === 0 && stalled.length === 0
  return {
    key: KEY, title: TITLE, headline: headline,
    moved: moved, stalled: stalled, orphaned: [], upcoming: [],
    note: quiet ? 'No module was completed this week and nothing is sitting untouched.' : null,
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
    const who = names[str(a, 'user_id') || ''] || 'A staff member'
    moved.push({
      label: who,
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
    moved: moved, stalled: [], orphaned: [], upcoming: [],
    note: moved.length === 0 ? 'No policy was acknowledged this week.' : null,
    warnings: [],
  }
}
