// ═════════════════════════════════════════════════════════════════════════
// The Thursday Brief — shared data helpers (v0.6.30)
//
// Sections are thin because everything repetitive lives here.
//
// ON `select('*')`: several of these tables are marked [VERIFY] in the
// schema notes, meaning the documented column list is not trustworthy.
// Naming a column that does not exist makes PostgREST reject the whole
// query, which would take out an entire section. Selecting everything and
// reading fields defensively in TypeScript costs a little bandwidth on
// tables of a few hundred rows and cannot fail that way. Where a column
// list IS confirmed, it is named explicitly.
// ═════════════════════════════════════════════════════════════════════════

import { createServiceClient } from '@/lib/supabase/service'
import type { Metric, Window } from '@/lib/brief/types'

export interface Fetched<T> {
  rows: T[]
  ok: boolean
  error: string | null
}

/** Read a whole table. Never throws. */
export async function fetchAll<T = Record<string, unknown>>(
  table: string,
  columns?: string
): Promise<Fetched<T>> {
  try {
    const db = createServiceClient()
    const { data, error } = await db.from(table).select(columns || '*').limit(5000)
    if (error) return { rows: [], ok: false, error: error.message }
    return { rows: Array.isArray(data) ? (data as unknown as T[]) : [], ok: true, error: null }
  } catch (e) {
    return { rows: [], ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Read a field that may or may not exist, without assuming its type. */
export function field(row: unknown, name: string): unknown {
  if (!row || typeof row !== 'object') return null
  return (row as Record<string, unknown>)[name]
}

export function str(row: unknown, name: string): string | null {
  const v = field(row, name)
  return typeof v === 'string' && v.length > 0 ? v : null
}

export function bool(row: unknown, name: string): boolean {
  return field(row, name) === true
}

/** Parse a timestamp field to epoch ms, or NaN. */
export function ts(row: unknown, name: string): number {
  const v = field(row, name)
  if (typeof v !== 'string' || v.length === 0) return NaN
  return Date.parse(v)
}

export function inRange(t: number, since: number, until: number): boolean {
  return !isNaN(t) && t >= since && t < until
}

/** Whole days between a timestamp and now, or null. */
export function daysSince(t: number, now: number): number | null {
  if (isNaN(t)) return null
  return Math.floor((now - t) / 86400000)
}

/** A person's name from whatever the row happens to call it. */
export function nameOf(row: unknown, fallback: string): string {
  const full = str(row, 'full_name') || str(row, 'name') || str(row, 'client_name')
  if (full) return full.replace(/\s+/g, ' ').trim()
  const first = str(row, 'first_name') || ''
  const last = str(row, 'last_name') || ''
  const joined = (first + ' ' + last).replace(/\s+/g, ' ').trim()
  if (joined.length > 0) return joined
  return str(row, 'email') || fallback
}

// ── Three-window trend ───────────────────────────────────────────────────
// "Is two new cases a quiet week or a broken funnel?" is unanswerable from
// one number. Three answers it: this week, last week, and the month so far.

export interface Trend {
  thisWeek: Window
  lastWeek: Window
  monthToDate: Window
}

/** Builds the comparison windows from the closed week.
 *  Month to date runs from the first of the closed week's month up to the
 *  same instant the closed week ends, so it never includes the future. */
export function buildTrend(closedSince: Date, closedUntil: Date): Trend {
  const priorSince = new Date(closedSince.getTime() - (closedUntil.getTime() - closedSince.getTime()))
  const end = new Date(closedUntil.getTime() - 1)
  const monthStart = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1, 4, 0, 0))
  return {
    thisWeek: { since: closedSince.toISOString(), until: closedUntil.toISOString() },
    lastWeek: { since: priorSince.toISOString(), until: closedSince.toISOString() },
    monthToDate: { since: monthStart.toISOString(), until: closedUntil.toISOString() },
  }
}

/** Count rows whose `dateField` falls inside each window. */
export function trendCounts(
  rows: unknown[],
  dateField: string,
  trend: Trend
): { thisWeek: number; lastWeek: number; monthToDate: number } {
  const w = [trend.thisWeek, trend.lastWeek, trend.monthToDate]
  const out = [0, 0, 0]
  for (let i = 0; i < rows.length; i++) {
    const t = ts(rows[i], dateField)
    if (isNaN(t)) continue
    for (let k = 0; k < 3; k++) {
      if (t >= Date.parse(w[k].since) && t < Date.parse(w[k].until)) out[k]++
    }
  }
  return { thisWeek: out[0], lastWeek: out[1], monthToDate: out[2] }
}

/** Render a trend as one metric plus its comparison, so the number and its
 *  context always travel together and cannot be quoted apart. */
export function trendMetric(
  label: string,
  counts: { thisWeek: number; lastWeek: number; monthToDate: number }
): Metric {
  return {
    label: label,
    value: counts.thisWeek,
    hint:
      'last week ' + counts.lastWeek + ' · month to date ' + counts.monthToDate,
  }
}
