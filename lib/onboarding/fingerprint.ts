// lib/onboarding/fingerprint.ts
//
// The CJIS softening, as pure logic.
//
// The real-world shape: fingerprinting is a physical trip to a Live Scan site,
// and the CJIS record comes back days later. Blocking a ready candidate for
// that whole window helps nobody. What we cannot afford is the requirement
// being forgotten — which, per Okezie on 6 August 2026, is the failure that
// actually happens: candidates DO get fingerprinted, staff forget to chase the
// result.
//
// So the attestation opens the gate for a bounded window and then SLAMS it
// shut. An expired attestation is worse than none, because it means we relied
// on a promise nobody kept. That is deliberate: it is the forcing function.
//
// Pure — no database, no clock of its own. The gate, the credentials page and
// the escalation sweep all call these, so what a coordinator is shown, what
// the gate enforces, and what the sweep escalates cannot drift apart.

/** Days from the form being sent to results being expected. Okezie, 6 Aug 2026. */
export const FINGERPRINT_WINDOW_DAYS = 14

export interface Attestation {
  /** 'YYYY-MM-DD' — the day the fingerprinting form was sent to the candidate. */
  sentAt: string | null
  /** 'YYYY-MM-DD' — when the results are expected. */
  expectedBy: string | null
}

export type FingerprintState =
  /** No attestation on file. The CJIS document is required outright. */
  | 'none'
  /** Recorded and inside the window. The gate is open. */
  | 'pending'
  /** Recorded, the window has passed, and no document arrived. Gate shut. */
  | 'overdue'

export interface FingerprintStatus {
  state: FingerprintState
  /** Days remaining until expected_by. Negative once it has passed. */
  daysRemaining: number | null
  /** Whole days past expected_by, 0 when not overdue. */
  daysOverdue: number
}

/** Parse a 'YYYY-MM-DD' date at UTC midnight. Returns NaN for anything else. */
function dayMs(d: string | null | undefined): number {
  if (!d) return NaN
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d.trim())
  if (!m) return NaN
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/** Today as 'YYYY-MM-DD'. */
export function todayISO(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/** sent_at + the standard window, as 'YYYY-MM-DD'. */
export function defaultExpectedBy(sentAt: string, windowDays: number = FINGERPRINT_WINDOW_DAYS): string {
  const base = dayMs(sentAt)
  if (Number.isNaN(base)) return ''
  return new Date(base + windowDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/**
 * Where this attestation stands today.
 *
 * A row missing either date reads as 'none'. That is deliberate: a half-written
 * attestation must never hold the gate open, because the whole arrangement
 * rests on there being a real date somebody is answerable for.
 */
export function fingerprintStatus(a: Attestation | null, today: string = todayISO()): FingerprintStatus {
  const NONE: FingerprintStatus = { state: 'none', daysRemaining: null, daysOverdue: 0 }
  if (!a) return NONE
  const sent = dayMs(a.sentAt)
  const due = dayMs(a.expectedBy)
  const nowMs = dayMs(today)
  if (Number.isNaN(sent) || Number.isNaN(due) || Number.isNaN(nowMs)) return NONE

  const remaining = Math.round((due - nowMs) / (24 * 60 * 60 * 1000))
  // The due date itself is still inside the window — someone told "expected by
  // the 20th" has the whole of the 20th.
  if (remaining >= 0) {
    return { state: 'pending', daysRemaining: remaining, daysOverdue: 0 }
  }
  return { state: 'overdue', daysRemaining: remaining, daysOverdue: -remaining }
}

/**
 * How loud the escalation should be, by days overdue. Consumed by the sweep in
 * the next release; defined here so the thresholds live with the rest of the
 * rules rather than being buried in a cron.
 *
 *   0 — inside the window, nothing to do
 *   1 — coordinators told, daily
 *   2 — Director of Nursing and Compliance added, plus a banner every member
 *       of staff sees on sign-in
 *   3 — the Chairman, personally
 */
export function escalationTier(daysOverdue: number): 0 | 1 | 2 | 3 {
  if (daysOverdue <= 0) return 0
  if (daysOverdue >= 16) return 3   // day 30 from the form being sent
  if (daysOverdue >= 8) return 2    // day 22
  return 1                          // day 15
}

/** One line for a chip or an email subject. */
export function fingerprintLabel(s: FingerprintStatus, expectedBy: string | null): string {
  if (s.state === 'none') return 'No CJIS on file'
  if (s.state === 'pending') {
    if (s.daysRemaining === 0) return 'CJIS results due today'
    return `CJIS results pending — due ${expectedBy || 'soon'}`
  }
  return `CJIS results OVERDUE by ${s.daysOverdue} day${s.daysOverdue === 1 ? '' : 's'}`
}
