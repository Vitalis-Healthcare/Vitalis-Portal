// lib/onboarding/reminders.ts
//
// WHO is waiting on an application, and HOW LONG they have been quiet.
//
// This module is PURE — rows in, decisions out. It never touches the database
// and never sends anything. The manual staff route, the candidate page and
// (v0.6.61) the cron all call the same functions, so what a coordinator is
// shown and what the scheduler acts on cannot drift apart. Same discipline as
// lib/onboarding/gates.ts.

import { normalizeTrack } from '@/lib/onboarding/application'

/**
 * The cadence, in days of candidate silence.
 *
 * Approved by Okezie on 6 August 2026: two reminders, then set aside. The
 * clock counts silence from the CANDIDATE, not from us — sending a reminder
 * never resets it, or reminder 2 could never arrive. Idempotency comes from
 * the unique index on onb_application_reminders, not from the clock.
 */
export const REMINDER_1_DAY = 3
export const REMINDER_2_DAY = 7
export const SET_ASIDE_DAY = 10

/** Recorded on onb_candidates.withdrawal_reason. */
export type WithdrawalReason = 'not_interested' | 'unresponsive' | 'staff'

/**
 * Statuses that mean "we are waiting on this person to finish an application."
 *
 * Deliberately narrow, per track:
 *  - full            — the test is behind them (test_passed) or the form is
 *                      open (applying). NOT 'invited'/'testing': those people
 *                      are stalled on the TEST, which is a different problem
 *                      with a different email.
 *  - application_only— 'invited' means the application link was sent and never
 *                      opened; 'applying' means it was started.
 *  - documents_only  — never. There is no application to complete.
 */
export function isAwaitingApplication(status: string | null, track: string | null): boolean {
  const s = (status || '').trim()
  const t = normalizeTrack(track)
  if (t === 'documents_only') return false
  if (t === 'application_only') return s === 'invited' || s === 'applying'
  return s === 'test_passed' || s === 'applying'
}

export interface ReminderClockInput {
  status: string | null
  track: string | null
  /** onb_candidates.invited_at — always set. */
  invitedAt: string | null
  /** onb_candidates.test_passed_at. */
  testPassedAt?: string | null
  /** onb_applications.updated_at — the last time they touched the draft. */
  applicationUpdatedAt?: string | null
}

function ms(iso: string | null | undefined): number {
  if (!iso) return 0
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

/**
 * The most recent sign of life from the candidate, as an ISO string.
 * Returns null when nothing is known — the caller should treat that as
 * "no clock", never as "infinitely stale", because acting on an absent
 * timestamp is how a live candidate gets set aside by accident.
 */
export function lastActivityAt(i: ReminderClockInput): string | null {
  const best = Math.max(ms(i.invitedAt), ms(i.testPassedAt), ms(i.applicationUpdatedAt))
  return best > 0 ? new Date(best).toISOString() : null
}

/** Whole days of silence, or null when there is no clock to read. */
export function daysQuiet(i: ReminderClockInput, now: Date = new Date()): number | null {
  const last = lastActivityAt(i)
  if (!last) return null
  const diff = now.getTime() - Date.parse(last)
  if (diff < 0) return 0
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

/**
 * What the scheduler should do with this candidate right now.
 *
 * `sentNumbers` is the set of automatic reminder numbers already recorded.
 * 'nothing' covers both "not due yet" and "already done" — the caller does not
 * need to know which, and the unique index is the real guard either way.
 */
export type ReminderAction =
  | { action: 'nothing'; reason: string }
  | { action: 'send'; reminderNumber: 1 | 2; daysQuiet: number }
  | { action: 'set_aside'; daysQuiet: number }

export function nextReminderAction(
  i: ReminderClockInput,
  sentNumbers: number[],
  now: Date = new Date(),
): ReminderAction {
  if (!isAwaitingApplication(i.status, i.track)) {
    return { action: 'nothing', reason: 'not_awaiting_application' }
  }
  const quiet = daysQuiet(i, now)
  if (quiet === null) return { action: 'nothing', reason: 'no_clock' }

  // Set aside first: a candidate who has gone past the deadline should be
  // retired, not sent the reminder they missed the window for.
  if (quiet >= SET_ASIDE_DAY) return { action: 'set_aside', daysQuiet: quiet }
  if (quiet >= REMINDER_2_DAY && !sentNumbers.includes(2)) {
    return { action: 'send', reminderNumber: 2, daysQuiet: quiet }
  }
  if (quiet >= REMINDER_1_DAY && !sentNumbers.includes(1)) {
    return { action: 'send', reminderNumber: 1, daysQuiet: quiet }
  }
  return { action: 'nothing', reason: 'not_due' }
}

/** Where a reminder for this track should send the candidate. */
export function reminderPathForTrack(track: string | null): string {
  return normalizeTrack(track) === 'application_only' || normalizeTrack(track) === 'full'
    ? '/onboarding/application'
    : '/onboarding/documents'
}
