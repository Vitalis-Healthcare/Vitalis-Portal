// ═════════════════════════════════════════════════════════════════════════
// Leads model — the single source of truth for the stage/status split
// (v0.6.38).
//
// One column used to do three jobs. Now:
//   stage       — WHERE in the journey (configurable, lives in lead_stages)
//   status      — IS IT ALIVE (exactly five values, fixed here)
//   archived_at — DOES IT EXIST in working views (a timestamp, not a status)
//
// Every reader and writer of leads.status imports from this file. Do not
// re-declare status vocabularies, lost-reason lists, or the legacy wire
// translation anywhere else.
// ═════════════════════════════════════════════════════════════════════════

export const LEAD_STATUSES = [
  { key: 'ongoing',   label: 'Ongoing',   color: '#0B6B5C', bg: '#D1FAE5' },
  { key: 'standby',   label: 'Standby',   color: '#92400E', bg: '#FDE68A' },
  { key: 'won',       label: 'Won \u2713', color: '#065F46', bg: '#A7F3D0' },
  { key: 'lost',      label: 'Lost',      color: '#DC2626', bg: '#FEE2E2' },
  { key: 'cancelled', label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6' },
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]['key']

export const OPEN_STATUSES: string[] = ['ongoing', 'standby']
export const CLOSED_STATUSES: string[] = ['won', 'lost', 'cancelled']

export function isOpenStatus(status: string | null | undefined): boolean {
  return OPEN_STATUSES.includes((status || '').toLowerCase())
}
export function isClosedStatus(status: string | null | undefined): boolean {
  return CLOSED_STATUSES.includes((status || '').toLowerCase())
}

export function statusMeta(status: string | null | undefined) {
  const s = (status || '').toLowerCase()
  return LEAD_STATUSES.find(x => x.key === s) || null
}

// ── Lost reasons ─────────────────────────────────────────────────────────
// Fixed codes so losses can be COUNTED. The free-text leads.lost_reason
// column stays as the explanatory note alongside the code.

export const LOST_REASONS = [
  { key: 'another_provider', label: 'Selected another provider' },
  { key: 'rate',             label: 'Rate / affordability' },
  { key: 'payer',            label: 'Insurance / payer issue' },
  { key: 'staffing',         label: 'Unable to staff' },
  { key: 'service_area',     label: 'Outside service area' },
  { key: 'unreachable',      label: 'Could not reach' },
  { key: 'not_needed',       label: 'Services no longer needed' },
  { key: 'hospitalization',  label: 'Hospitalization' },
  { key: 'moved',            label: 'Moved away' },
  { key: 'duplicate',        label: 'Duplicate lead' },
  { key: 'client_cancelled', label: 'Client / family cancelled' },
  { key: 'other',            label: 'Other' },
] as const

export function lostReasonLabel(code: string | null | undefined): string | null {
  if (!code) return null
  const r = LOST_REASONS.find(x => x.key === code)
  return r ? r.label : code
}

// ── Probability of closing ───────────────────────────────────────────────
// Stored as an integer percent (0–100), nullable. A null probability is
// treated as DEFAULT_PROBABILITY when computing the weighted pipeline so
// unrated leads count at even odds rather than vanishing from the number.

export const DEFAULT_PROBABILITY = 50
export const PROBABILITY_OPTIONS = [10, 25, 50, 75, 90]

export function effectiveProbability(p: number | null | undefined): number {
  if (p === null || p === undefined || isNaN(p)) return DEFAULT_PROBABILITY
  return Math.min(100, Math.max(0, Math.round(p)))
}

// ── Revenue ──────────────────────────────────────────────────────────────

export function calcRevenue(hours?: number | null, rate?: number | null) {
  if (!hours || !rate) return null
  const weekly = hours * rate
  return { weekly, monthly: weekly * 4.33, annual: weekly * 52 }
}

// ── Legacy wire translation (CareMatch360 stays byte-compatible) ─────────
// CareMatch360's receiver was built against the pre-split vocabulary where
// stage and outcome shared one string. The webhook keeps SENDING that
// vocabulary so CareMatch360 needs zero changes and zero coordinated
// deploys. Translation happens only at the wire, never in our own tables.

export function legacyWireStatus(lead: { status?: string | null; stage?: string | null }): string {
  const status = (lead.status || '').toLowerCase()
  if (status === 'won') return 'won'
  if (status === 'lost') return 'lost'
  if (status === 'cancelled') return 'cold'
  if (status === 'standby') return 'on_hold'
  // ongoing → the journey stage IS the legacy status
  return (lead.stage || 'new').toLowerCase()
}

// ── Display helpers ──────────────────────────────────────────────────────

export function prettyKey(key: string | null | undefined): string {
  if (!key) return '\u2014'
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
