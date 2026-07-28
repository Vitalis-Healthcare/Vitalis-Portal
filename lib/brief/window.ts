// ═════════════════════════════════════════════════════════════════════════
// The Thursday Brief — the week (v0.6.28)
//
// The agency week runs THURSDAY to WEDNESDAY, because that is how the
// Maryland Medicaid Waiver period runs. Everything in this file exists to
// express that correctly in Eastern time while the server thinks in UTC.
//
// Note this is NOT the cashflow module's week. `cf_settings.week_start_dow`
// is 6 — weeks starting Saturday and ending FRIDAY. The two are deliberately
// independent for now; when the cashflow rebuild on QuickBooks and AxisCare
// lands, that setting moves to 4 and the two agree. Until then no code in
// this module reads cf_settings, so neither can quietly corrupt the other.
//
// Everything here is PURE — no I/O, no Date.now() except where a caller
// passes it in — so the whole of it can be exercised directly.
// ═════════════════════════════════════════════════════════════════════════

const TZ = 'America/New_York'
const DAY_MS = 86400000

/** Thursday, in `Date.getUTCDay()` numbering (Sun = 0). */
export const WEEK_START_DOW = 4

export interface EtParts {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
  /** Sun = 0 … Sat = 6, in Eastern time. */
  weekday: number
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

const PARTS_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
  hour12: false,
})

/** Break an instant into Eastern-time wall-clock parts. */
export function etParts(at: Date): EtParts {
  const parts = PARTS_FORMAT.formatToParts(at)
  const get = (t: string): string => {
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].type === t) return parts[i].value
    }
    return ''
  }
  // `hour12: false` yields 24 for midnight in some ICU versions. Normalise.
  let hour = parseInt(get('hour'), 10)
  if (hour === 24) hour = 0
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour: hour,
    minute: parseInt(get('minute'), 10),
    weekday: WEEKDAY_INDEX[get('weekday')] ?? 0,
  }
}

/** Eastern offset from UTC, in minutes, at a given instant.
 *  Negative — EST is -300, EDT is -240. */
function etOffsetMinutes(at: Date): number {
  const p = etParts(at)
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, 0)
  // Round to the minute; seconds are identical in both renderings.
  return Math.round((asIfUtc - Math.floor(at.getTime() / 60000) * 60000) / 60000)
}

/** The UTC instant of midnight, Eastern time, on a given Eastern calendar date.
 *
 *  Two passes: guess the offset using the naive instant, then re-read the
 *  offset at the corrected instant. The second pass is what makes the days
 *  either side of a daylight-saving change come out right.
 *
 *  Midnight is always unambiguous in the United States — the clocks move at
 *  02:00 local — so there is no ambiguous-hour case to handle here. */
export function etMidnightUtc(year: number, month: number, day: number): Date {
  const naive = Date.UTC(year, month - 1, day, 0, 0, 0)
  const pass1 = new Date(naive - etOffsetMinutes(new Date(naive)) * 60000)
  const pass2 = new Date(naive - etOffsetMinutes(pass1) * 60000)
  return pass2
}

/** Midnight Eastern on the most recent Thursday at or before `at`.
 *
 *  This is the pivot the whole Brief turns on. Run at 09:00 ET on a Thursday
 *  it returns that same morning's midnight, so the closed week is the seven
 *  days that just finished and the coming week starts today. */
export function anchorThursday(at: Date): Date {
  const p = etParts(at)
  const back = (p.weekday - WEEK_START_DOW + 7) % 7
  const midnightToday = etMidnightUtc(p.year, p.month, p.day)
  if (back === 0) return midnightToday
  // Step back whole days from a midday instant, so a DST shift cannot push
  // the arithmetic across a date boundary.
  const probe = new Date(midnightToday.getTime() + 12 * 3600000 - back * DAY_MS)
  const q = etParts(probe)
  return etMidnightUtc(q.year, q.month, q.day)
}

/** Add whole Eastern days to an Eastern midnight, staying on midnight
 *  across daylight-saving changes (a naive `+ n * DAY_MS` lands at 23:00 or
 *  01:00 twice a year). */
export function addEtDays(midnightUtc: Date, days: number): Date {
  const probe = new Date(midnightUtc.getTime() + 12 * 3600000 + days * DAY_MS)
  const p = etParts(probe)
  return etMidnightUtc(p.year, p.month, p.day)
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "23 July – 29 July 2026" — the closed week, as a reader would say it.
 *  `until` is exclusive, so the last day shown is the day before it. */
export function windowLabel(since: Date, until: Date): string {
  const a = etParts(since)
  const b = etParts(new Date(until.getTime() - DAY_MS))
  const left = a.day + ' ' + MONTHS[a.month - 1]
  const right = b.day + ' ' + MONTHS[b.month - 1] + ' ' + b.year
  return left + ' \u2013 ' + right
}

/** ISO-8601 week-numbering week, used only to build a stable edition key. */
function isoWeek(d: Date): { year: number; week: number } {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = (t.getUTCDay() + 6) % 7 // Mon = 0
  t.setUTCDate(t.getUTCDate() - dayNum + 3) // nearest Thursday
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4))
  const fdNum = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fdNum + 3)
  const week = 1 + Math.round((t.getTime() - firstThursday.getTime()) / (7 * DAY_MS))
  return { year: t.getUTCFullYear(), week: week }
}

export interface BriefWindows {
  anchor: Date
  closed: { since: Date; until: Date }
  ahead: { since: Date; until: Date }
  weekKey: string
  label: string
}

/** The complete set of boundaries for one edition.
 *
 *  Half-open throughout. `closed.until` and `ahead.since` are the SAME
 *  instant, so no day is counted in both weeks and no day falls between
 *  them. */
export function briefWindows(at: Date): BriefWindows {
  const anchor = anchorThursday(at)
  const closedSince = addEtDays(anchor, -7)
  const aheadUntil = addEtDays(anchor, 7)
  const iso = isoWeek(anchor)
  const wk = iso.week < 10 ? '0' + iso.week : String(iso.week)
  return {
    anchor: anchor,
    closed: { since: closedSince, until: anchor },
    ahead: { since: anchor, until: aheadUntil },
    weekKey: iso.year + '-W' + wk + '-THU',
    label: windowLabel(closedSince, anchor),
  }
}
