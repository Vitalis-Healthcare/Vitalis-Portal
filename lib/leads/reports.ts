// ═════════════════════════════════════════════════════════════════════════
// Leads reports — the arithmetic behind /leads/reports (v0.6.52).
//
// PURE. This file receives rows and returns numbers. It never touches the
// database, never renders HTML, and never decides who may see anything —
// the page and the CSV route each fetch, then call buildLeadReport, so the
// screen and the export can never disagree about a figure.
//
// Three deliberate rulings live here, because a report that quietly picks
// a definition is worse than no report:
//
//  1. COHORTS ARE NAMED. "Conversion rate" is ambiguous once stage and
//     status are separate, so there is no metric by that name. There is a
//     WIN RATE (of leads CLOSED in the range, the share won), a SIGN RATE
//     (of agreements PREPARED in the range, the share signed), and a
//     RECORD-LINKED share (of ALL won leads, how many carry a client
//     record). Three questions, three numbers, each labelled.
//
//  2. NO CREATED-COHORT WIN RATE. Asking "of leads created in the last 30
//     days, what share have we won" punishes recent months for the simple
//     reason that their leads have not finished yet. It is not computed.
//
//  3. RESPONSE TIME EXCLUDES MIGRATED LEADS. created_at on a migrated row
//     is when the ROW was made, not when the family called — the same trap
//     as invited_at in July. First-response is measured only for leads
//     created on or after RESPONSE_TIME_FROM, and the excluded count is
//     reported so the gap is visible rather than silent.
//
//  4. AN OUTCOME DATE IS won_date OR lost_date. NOTHING ELSE. (v0.6.53 —
//     this corrected a real bug.) Those columns are written only when a
//     lead TRANSITIONS through the status buttons, so the leads closed by
//     the 5 August migration carry none. v0.6.52 fell back to updated_at,
//     which dated all twenty of them to the migration and made them appear
//     inside every window — 30 days and 90 days returned identical
//     outcomes. Worse, updated_at moves on ANY edit, so a lead won in June
//     would jump into August the moment someone fixed its phone number.
//     A denominator that shifts when an unrelated field is edited is not a
//     denominator. There is now no fallback: an undated closure is counted,
//     named, and EXCLUDED from every bounded window — never dated by guess.
//
//  5. CANCELLED IS NOT AN OUTCOME. It has no date column at all and, in
//     practice, every cancelled lead is also archived. It is reported as a
//     standing count and kept out of the win-rate denominator entirely.
// ═════════════════════════════════════════════════════════════════════════

import {
  LEAD_SOURCES, sourceLabel, lostReasonLabel,
  effectiveProbability, isBelowFloor, isClosedStatus, OPEN_STATUSES,
} from './model'

// ── Ranges ───────────────────────────────────────────────────────────────

export const RANGE_PRESETS = [
  { key: '30',  label: 'Last 30 days' },
  { key: '90',  label: 'Last 90 days' },
  { key: '180', label: 'Last 180 days' },
  { key: 'ytd', label: 'Year to date' },
  { key: 'all', label: 'All time' },
]

export const DEFAULT_RANGE_KEY = '90'

/** Nothing in this agency predates this; it stands in for "the beginning". */
export const ALL_TIME_FROM = '2000-01-01'

/** The stage/status migration. Leads created before this carry import
 *  timestamps, not inquiry timestamps — see ruling 3 above. */
export const RESPONSE_TIME_FROM = '2026-08-05'

export interface ReportRange {
  key: string
  label: string
  from: string   // YYYY-MM-DD inclusive
  to: string     // YYYY-MM-DD inclusive
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function shiftDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function resolveRange(key?: string | null, from?: string | null, to?: string | null): ReportRange {
  const today = todayISO()

  if (key === 'custom' && from && to && ISO_DATE.test(from) && ISO_DATE.test(to)) {
    const lo = from <= to ? from : to
    const hi = from <= to ? to : from
    return { key: 'custom', label: `${lo} to ${hi}`, from: lo, to: hi }
  }
  if (key === 'all') {
    return { key: 'all', label: 'All time', from: ALL_TIME_FROM, to: today }
  }
  if (key === 'ytd') {
    return { key: 'ytd', label: 'Year to date', from: today.slice(0, 4) + '-01-01', to: today }
  }

  const days = key === '30' ? 30 : key === '180' ? 180 : 90
  const resolved = String(days)
  const preset = RANGE_PRESETS.find(p => p.key === resolved)
  return {
    key: resolved,
    label: preset ? preset.label : `Last ${days} days`,
    // Inclusive of today, so "last 30 days" is 30 days of data, not 31.
    from: shiftDays(today, -(days - 1)),
    to: today,
  }
}

// ── Row shapes (only what the report reads) ──────────────────────────────

export interface ReportLead {
  id: string
  full_name: string | null
  client_name?: string | null
  source: string | null
  status: string | null
  stage?: string | null
  created_at: string | null
  updated_at?: string | null
  won_date: string | null
  lost_date: string | null
  lost_reason_code: string | null
  lost_reason?: string | null
  archived_at: string | null
  estimated_hours_week: number | null
  hourly_rate: number | null
  close_probability: number | null
  assessment_client_id?: string | null
  consent_status?: string | null
  assignee?: any
}

export interface ReportActivity {
  lead_id: string
  activity_type: string | null
  created_at: string | null
}

export interface ReportEmail {
  lead_id: string
  created_at: string | null
}

export interface ReportConsent {
  lead_id: string
  status: string | null
  created_at: string | null
  signed_at: string | null
}

export interface ReportInput {
  leads: ReportLead[]
  activities: ReportActivity[]
  emails: ReportEmail[]
  consents: ReportConsent[]
  range: ReportRange
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** The care recipient's name. client_name is the person receiving care;
 *  full_name is whoever made the inquiry, who is often a daughter, a social
 *  worker or a discharge planner. Every other surface in this module — the
 *  conversion RPC, the assessment modal, the email templates — resolves the
 *  recipient as client_name || full_name. v0.6.52 had it backwards here,
 *  which is why one lead read "N/A" on the reports page while carrying a
 *  perfectly good client name. (Corrected v0.6.56.) */
export function recipientName(l: { client_name?: string | null; full_name?: string | null }): string {
  const c = (l.client_name || '').trim()
  if (c) return c
  const f = (l.full_name || '').trim()
  return f || 'Unnamed lead'
}

export function nameOf(v: any): string {
  if (!v) return ''
  if (Array.isArray(v)) return v[0]?.full_name || ''
  return v.full_name || ''
}

/** A timestamptz or a date column, reduced to YYYY-MM-DD. */
function dayOf(ts: string | null | undefined): string | null {
  if (!ts) return null
  return ts.slice(0, 10)
}

function inRange(day: string | null, r: ReportRange): boolean {
  if (!day) return false
  return day >= r.from && day <= r.to
}

/** When a lead reached its outcome — the real recorded date, or nothing.
 *  There is deliberately NO fallback: see ruling 4 in the header. Cancelled
 *  leads never have a date and are not an outcome (ruling 5). */
export function outcomeDay(l: ReportLead): string | null {
  const s = (l.status || '').toLowerCase()
  if (s === 'won') return dayOf(l.won_date)
  if (s === 'lost') return dayOf(l.lost_date)
  return null
}

/** A won or lost lead with no recorded outcome date. These exist because
 *  the 5 August migration set status directly in SQL; the route that writes
 *  the dates only runs on a status TRANSITION. They are real closures and
 *  must be counted somewhere — just never inside a bounded window. */
export function isUndatedClosure(l: ReportLead): boolean {
  const s = (l.status || '').toLowerCase()
  if (s === 'won') return !l.won_date
  if (s === 'lost') return !l.lost_date
  return false
}

function weeklyRevenue(l: ReportLead): number {
  const h = l.estimated_hours_week || 0
  const r = l.hourly_rate || 0
  if (h <= 0 || r <= 0) return 0
  return h * r
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const v = [...values].sort((a, b) => a - b)
  const mid = Math.floor(v.length / 2)
  return v.length % 2 === 1 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

function pct(part: number, whole: number): number | null {
  if (whole <= 0) return null
  return Math.round((part / whole) * 1000) / 10
}

/** A first touch is a CALL, TEXT, MEETING or EMAIL logged against the lead,
 *  or an outbound email sent from the workspace. A NOTE is not contact with
 *  a family; counting it would flatter the number. Shared by the page and
 *  the CSV export so both measure the same thing. */
export function firstTouchMap(activities: ReportActivity[], emails: ReportEmail[]): Record<string, number> {
  const CONTACT_TYPES = ['call', 'email', 'meeting', 'text']
  const out: Record<string, number> = {}
  const consider = (leadId: string, ts: string | null) => {
    if (!ts) return
    const t = new Date(ts).getTime()
    if (isNaN(t)) return
    if (out[leadId] === undefined || t < out[leadId]) out[leadId] = t
  }
  for (const a of activities) {
    if (!a.activity_type || CONTACT_TYPES.indexOf(a.activity_type) === -1) continue
    consider(a.lead_id, a.created_at)
  }
  for (const e of emails) consider(e.lead_id, e.created_at)
  return out
}

// ── Fact block ───────────────────────────────────────────────────────────

export interface SourceRow {
  key: string
  label: string
  created: number
  closed: number
  won: number
  lost: number
  winRate: number | null
  weeklyRevenueWon: number
  weeklyRevenueLost: number
}

export interface LossRow {
  code: string
  label: string
  count: number
  share: number | null
}

export interface MonthRow {
  key: string        // YYYY-MM
  label: string      // 'Jul 2026'
  won: number
  lost: number
  revenueWon: number
  revenueLost: number
}

export interface BucketRow {
  label: string
  count: number
  share: number | null
}

export interface ResponseOffender {
  id: string
  name: string
  hours: number
  owner: string
}

export interface LeadReportFacts {
  range: ReportRange
  generated_at: string
  created: { total: number }
  outcomes: {
    closed: number
    won: number
    lost: number
    winRate: number | null              // won ÷ (won + lost)
    weeklyRevenueWon: number
    weeklyRevenueLost: number
    medianDaysToWin: number | null
    timedWins: number                   // wins that had a real won_date
    undatedExcluded: number             // undated closures kept OUT of this window
    undatedIncluded: boolean            // true only on All time
    cancelledAllTime: number
  }
  losses: LossRow[]
  sources: SourceRow[]
  response: {
    measured: number
    awaiting: number
    excludedLegacy: number
    medianHours: number | null
    withinOneDay: number | null
    slowest: ResponseOffender[]
  }
  pipeline: {
    open: number
    ongoing: number
    standby: number
    weeklyHours: number
    weeklyRevenue: number
    weightedMonthlyRevenue: number
    belowMin: number
    belowMinShare: number | null
    noHoursOrRate: number
  }
  agreements: {
    prepared: number
    signed: number
    live: number
    voided: number
    signRate: number | null
    medianHoursToSign: number | null
  }
  months: MonthRow[]
  responseBuckets: BucketRow[]
  hygiene: {
    wonTotal: number
    withClientRecord: number
    missingClientRecord: number
  }
}

export function buildLeadReport(input: ReportInput): LeadReportFacts {
  const { leads, activities, emails, consents, range } = input

  const live = leads.filter(l => !l.archived_at)

  // ── Created cohort ─────────────────────────────────────────────────────
  const createdCohort = live.filter(l => inRange(dayOf(l.created_at), range))

  // ── Closed cohort — the win-rate denominator ───────────────────────────
  // Won and lost only (ruling 5). A bounded window takes leads whose
  // recorded outcome date falls inside it. "All time" has no boundary to
  // fail, so it takes every closure including the undated ones — otherwise
  // twenty real closures would be invisible on every view of the page.
  const closedLive = live.filter(l => {
    const s = (l.status || '').toLowerCase()
    return s === 'won' || s === 'lost'
  })
  const undatedAll = closedLive.filter(isUndatedClosure)
  const isAllTime = range.key === 'all'

  const closedCohort = isAllTime
    ? closedLive
    : closedLive.filter(l => !isUndatedClosure(l) && inRange(outcomeDay(l), range))

  const won = closedCohort.filter(l => (l.status || '') === 'won')
  const lost = closedCohort.filter(l => (l.status || '') === 'lost')
  const cancelledAllTime = live.filter(l => (l.status || '') === 'cancelled').length

  // Only leads with a REAL won_date can be timed. An undated closure has no
  // duration, and inventing one would be the same bug in a new place.
  const daysToWin: number[] = []
  for (const l of won) {
    const start = dayOf(l.created_at)
    const end = dayOf(l.won_date)
    if (!start || !end || end < start) continue
    const ms = new Date(end + 'T12:00:00Z').getTime() - new Date(start + 'T12:00:00Z').getTime()
    daysToWin.push(Math.round(ms / 86400000))
  }

  // ── Loss reasons ───────────────────────────────────────────────────────
  const lossCounts: Record<string, number> = {}
  for (const l of lost) {
    const code = l.lost_reason_code || 'unspecified'
    lossCounts[code] = (lossCounts[code] || 0) + 1
  }
  const losses: LossRow[] = Object.keys(lossCounts)
    .map(code => ({
      code,
      label: code === 'unspecified' ? 'No reason recorded' : (lostReasonLabel(code) || code),
      count: lossCounts[code],
      share: pct(lossCounts[code], lost.length),
    }))
    .sort((a, b) => b.count - a.count)

  // ── Source performance ─────────────────────────────────────────────────
  const sourceKeys: string[] = []
  const pushKey = (k: string | null) => {
    const key = k || 'unspecified'
    if (sourceKeys.indexOf(key) === -1) sourceKeys.push(key)
  }
  for (const l of createdCohort) pushKey(l.source)
  for (const l of closedCohort) pushKey(l.source)

  const sources: SourceRow[] = sourceKeys.map(key => {
    const matches = (l: ReportLead) => (l.source || 'unspecified') === key
    const c = createdCohort.filter(matches)
    const cl = closedCohort.filter(matches)
    const w = cl.filter(l => (l.status || '') === 'won')
    const lo = cl.filter(l => (l.status || '') === 'lost')
    return {
      key,
      label: key === 'unspecified' ? 'No source recorded' : sourceLabel(key),
      created: c.length,
      closed: cl.length,
      won: w.length,
      lost: lo.length,
      winRate: pct(w.length, cl.length),
      weeklyRevenueWon: w.reduce((sum, l) => sum + weeklyRevenue(l), 0),
      weeklyRevenueLost: lo.reduce((sum, l) => sum + weeklyRevenue(l), 0),
    }
  }).sort((a, b) => (b.won - a.won) || (b.created - a.created))

  // ── First response ─────────────────────────────────────────────────────
  const firstTouch = firstTouchMap(activities, emails)

  const responseEligible = createdCohort.filter(l => (dayOf(l.created_at) || '') >= RESPONSE_TIME_FROM)
  const excludedLegacy = createdCohort.length - responseEligible.length

  const responseHours: number[] = []
  const offenders: ResponseOffender[] = []
  let awaiting = 0
  for (const l of responseEligible) {
    const created = l.created_at ? new Date(l.created_at).getTime() : NaN
    const touch = firstTouch[l.id]
    if (isNaN(created)) continue
    if (touch === undefined) { awaiting++; continue }
    const hours = (touch - created) / 3600000
    if (hours < 0) continue
    responseHours.push(hours)
    offenders.push({
      id: l.id,
      name: recipientName(l),
      hours: Math.round(hours * 10) / 10,
      owner: nameOf(l.assignee) || 'Unassigned',
    })
  }
  offenders.sort((a, b) => b.hours - a.hours)

  // ── Pipeline, as of now (not range-bound — a pipeline has no history) ──
  const open = live.filter(l => OPEN_STATUSES.indexOf((l.status || '').toLowerCase()) !== -1)
  const pipelineWeeklyHours = open.reduce((s, l) => s + (l.estimated_hours_week || 0), 0)
  const pipelineWeeklyRevenue = open.reduce((s, l) => s + weeklyRevenue(l), 0)
  const weightedMonthly = open.reduce((s, l) => {
    return s + weeklyRevenue(l) * 4.33 * (effectiveProbability(l.close_probability) / 100)
  }, 0)
  const belowMin = open.filter(l => isBelowFloor(l.estimated_hours_week, l.hourly_rate))

  // ── Agreements ─────────────────────────────────────────────────────────
  const consentCohort = consents.filter(c => inRange(dayOf(c.created_at), range))
  const signedConsents = consentCohort.filter(c => (c.status || '') === 'signed')
  const hoursToSign: number[] = []
  for (const c of signedConsents) {
    if (!c.created_at || !c.signed_at) continue
    const ms = new Date(c.signed_at).getTime() - new Date(c.created_at).getTime()
    if (isNaN(ms) || ms < 0) continue
    hoursToSign.push(ms / 3600000)
  }

  // ── Hygiene: won leads carrying a client record (ALL time, on purpose) ─
  const allWon = live.filter(l => (l.status || '') === 'won')
  const withRecord = allWon.filter(l => !!l.assessment_client_id)

  // ── Closures by month — the shape of the window, not just its total ────
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthMap: Record<string, MonthRow> = {}
  const touchMonth = (day: string | null): MonthRow | null => {
    if (!day) return null
    const key = day.slice(0, 7)
    if (!monthMap[key]) {
      const mi = parseInt(key.slice(5, 7), 10) - 1
      monthMap[key] = {
        key,
        label: `${MONTH_NAMES[mi] || key.slice(5, 7)} ${key.slice(0, 4)}`,
        won: 0, lost: 0, revenueWon: 0, revenueLost: 0,
      }
    }
    return monthMap[key]
  }
  for (const l of closedCohort) {
    const m = touchMonth(outcomeDay(l))
    if (!m) continue   // undated closures (All time only) have no month to sit in
    if ((l.status || '') === 'won') { m.won++; m.revenueWon += weeklyRevenue(l) }
    else { m.lost++; m.revenueLost += weeklyRevenue(l) }
  }
  const months = Object.keys(monthMap).sort().map(k => monthMap[k])

  // ── Response-time distribution ─────────────────────────────────────────
  const bucketDefs: { label: string; test: (h: number) => boolean }[] = [
    { label: 'Under 1 hour',  test: h => h < 1 },
    { label: '1–4 hours',     test: h => h >= 1 && h < 4 },
    { label: '4–24 hours',    test: h => h >= 4 && h < 24 },
    { label: '1–3 days',      test: h => h >= 24 && h < 72 },
    { label: 'Over 3 days',   test: h => h >= 72 },
  ]
  const responseBuckets: BucketRow[] = bucketDefs.map(b => {
    const n = responseHours.filter(b.test).length
    return { label: b.label, count: n, share: pct(n, responseHours.length) }
  })

  const medianResponse = median(responseHours)
  const withinDay = responseHours.length > 0
    ? pct(responseHours.filter(h => h <= 24).length, responseHours.length)
    : null

  return {
    range,
    generated_at: new Date().toISOString(),
    created: { total: createdCohort.length },
    outcomes: {
      closed: closedCohort.length,
      won: won.length,
      lost: lost.length,
      winRate: pct(won.length, closedCohort.length),
      weeklyRevenueWon: won.reduce((s, l) => s + weeklyRevenue(l), 0),
      weeklyRevenueLost: lost.reduce((s, l) => s + weeklyRevenue(l), 0),
      medianDaysToWin: median(daysToWin),
      timedWins: daysToWin.length,
      undatedExcluded: isAllTime ? 0 : undatedAll.length,
      undatedIncluded: isAllTime,
      cancelledAllTime,
    },
    losses,
    sources,
    response: {
      measured: responseHours.length,
      awaiting,
      excludedLegacy,
      medianHours: medianResponse === null ? null : Math.round(medianResponse * 10) / 10,
      withinOneDay: withinDay,
      slowest: offenders.slice(0, 5),
    },
    pipeline: {
      open: open.length,
      ongoing: open.filter(l => (l.status || '') === 'ongoing').length,
      standby: open.filter(l => (l.status || '') === 'standby').length,
      weeklyHours: Math.round(pipelineWeeklyHours * 10) / 10,
      weeklyRevenue: Math.round(pipelineWeeklyRevenue),
      weightedMonthlyRevenue: Math.round(weightedMonthly),
      belowMin: belowMin.length,
      belowMinShare: pct(belowMin.length, open.length),
      noHoursOrRate: open.filter(l => !l.estimated_hours_week || !l.hourly_rate).length,
    },
    agreements: {
      prepared: consentCohort.length,
      signed: signedConsents.length,
      live: consentCohort.filter(c => ['sent', 'viewed'].indexOf(c.status || '') !== -1).length,
      voided: consentCohort.filter(c => (c.status || '') === 'void').length,
      signRate: pct(signedConsents.length, consentCohort.length),
      medianHoursToSign: (() => {
        const m = median(hoursToSign)
        return m === null ? null : Math.round(m * 10) / 10
      })(),
    },
    months,
    responseBuckets,
    hygiene: {
      wonTotal: allWon.length,
      withClientRecord: withRecord.length,
      missingClientRecord: allWon.length - withRecord.length,
    },
  }
}

/** Every source key the picker knows about, for an empty-state hint. */
export const KNOWN_SOURCE_KEYS = LEAD_SOURCES.map(s => s.key)

// ── Per-lead rows (the CSV export) ───────────────────────────────────────
// One row per lead that was created OR closed inside the window. Built from
// the same helpers as the fact block, so an exported figure and a displayed
// figure are the same figure.

export interface LeadDetailRow {
  id: string
  name: string
  inquirer: string
  source: string
  status: string
  stage: string
  owner: string
  created_day: string
  outcome_day: string
  lost_reason_code: string
  lost_reason: string
  hours_week: number | null
  hourly_rate: number | null
  weekly_revenue: number
  below_minimum: string
  close_probability: number | null
  consent_status: string
  client_record_linked: string
  first_response_hours: number | null
  counted_as: string
  outcome_date_recorded: string
}

export function buildLeadRows(input: ReportInput): LeadDetailRow[] {
  const { leads, activities, emails, range } = input
  const touch = firstTouchMap(activities, emails)
  const live = leads.filter(l => !l.archived_at)

  const rows: LeadDetailRow[] = []
  const isAllTime = range.key === 'all'
  for (const l of live) {
    const createdDay = dayOf(l.created_at)
    const outDay = outcomeDay(l)
    const closedStatus = isClosedStatus(l.status)
    const createdIn = inRange(createdDay, range)
    // Same rule as the fact block: bounded windows take dated closures only;
    // All time takes every closure, undated included.
    const closedIn = closedStatus && (
      isAllTime ? true : (!isUndatedClosure(l) && inRange(outDay, range))
    )
    if (!createdIn && !closedIn) continue

    let firstHours: number | null = null
    const createdMs = l.created_at ? new Date(l.created_at).getTime() : NaN
    const t = touch[l.id]
    if (!isNaN(createdMs) && t !== undefined && (createdDay || '') >= RESPONSE_TIME_FROM) {
      const h = (t - createdMs) / 3600000
      if (h >= 0) firstHours = Math.round(h * 10) / 10
    }

    rows.push({
      id: l.id,
      name: recipientName(l),
      inquirer: l.full_name || '',
      source: l.source ? sourceLabel(l.source) : '',
      status: l.status || '',
      stage: l.stage || '',
      owner: nameOf(l.assignee),
      created_day: createdDay || '',
      outcome_day: outDay || '',
      lost_reason_code: l.lost_reason_code || '',
      lost_reason: l.lost_reason || '',
      hours_week: l.estimated_hours_week ?? null,
      hourly_rate: l.hourly_rate ?? null,
      weekly_revenue: weeklyRevenue(l),
      below_minimum: isBelowFloor(l.estimated_hours_week, l.hourly_rate) ? 'yes' : 'no',
      close_probability: l.close_probability ?? null,
      consent_status: l.consent_status || '',
      client_record_linked: l.assessment_client_id ? 'yes' : 'no',
      first_response_hours: firstHours,
      counted_as: createdIn && closedIn ? 'created and closed'
        : createdIn ? 'created' : 'closed',
      outcome_date_recorded: closedStatus ? (isUndatedClosure(l) ? 'no' : 'yes') : '',
    })
  }

  rows.sort((a, b) => (b.created_day || '').localeCompare(a.created_day || ''))
  return rows
}

export interface UndatedClosureRow {
  id: string
  name: string
  status: string
  source: string
  owner: string
  created_day: string
  weekly_revenue: number
  client_record_linked: string
}

/** The closures with no recorded outcome date, listed so they can be seen
 *  and fixed rather than quietly dropped from every window. */
export function buildUndatedClosures(leads: ReportLead[]): UndatedClosureRow[] {
  return leads
    .filter(l => !l.archived_at && isUndatedClosure(l))
    .map(l => ({
      id: l.id,
      name: recipientName(l),
      status: l.status || '',
      source: l.source ? sourceLabel(l.source) : '',
      owner: nameOf(l.assignee),
      created_day: dayOf(l.created_at) || '',
      weekly_revenue: weeklyRevenue(l),
      client_record_linked: l.assessment_client_id ? 'yes' : 'no',
    }))
    .sort((a, b) => (b.created_day || '').localeCompare(a.created_day || ''))
}
