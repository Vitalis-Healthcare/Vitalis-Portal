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

// ── Minimum viable engagement (business floor, v0.6.39) ──────────────────
// Vitalis does not bid below 4-hour shifts × 3/week at $32.50/hr. New leads
// START at the floor; edits below it demand explicit confirmation and the
// lead is flagged below-minimum in the UI. Derived, never stored — a flag
// column could go stale, arithmetic cannot.

export const MIN_HOURS_WEEK = 12
export const MIN_HOURLY_RATE = 32.5

export function isBelowFloor(hours?: number | null, rate?: number | null): boolean {
  if (hours != null && hours > 0 && hours < MIN_HOURS_WEEK) return true
  if (rate != null && rate > 0 && rate < MIN_HOURLY_RATE) return true
  return false
}

// ── Next actions (v0.6.39) ───────────────────────────────────────────────
// The rule: no open lead without a next action. The action lives ON the
// lead (type + due date + note); logging an activity with a follow-up date
// replaces it. For Standby leads the wake-up date IS the next action.

export const NEXT_ACTION_TYPES = [
  { key: 'call',                label: 'Call',                     icon: '📞' },
  { key: 'email',               label: 'Email',                    icon: '✉️' },
  { key: 'text',                label: 'Text message',             icon: '💬' },
  { key: 'send_consent',        label: 'Send consent / contract',  icon: '📄' },
  { key: 'follow_up_consent',   label: 'Follow up on consent',     icon: '🔁' },
  { key: 'schedule_assessment', label: 'Schedule assessment',      icon: '📋' },
  { key: 'verify_staffing',     label: 'Verify staffing',          icon: '👥' },
  { key: 'contact_referrer',    label: 'Contact referral source',  icon: '🤝' },
  { key: 'internal_review',     label: 'Internal review',          icon: '🗂️' },
  { key: 'follow_up',           label: 'Follow up',                icon: '🔔' },
  { key: 'other',               label: 'Other',                    icon: '📝' },
] as const

export function nextActionLabel(key: string | null | undefined): string {
  if (!key) return 'Next action'
  const t = NEXT_ACTION_TYPES.find(x => x.key === key)
  return t ? t.label : prettyKey(key)
}

/** The date a lead is due for attention: the next action for Ongoing,
 *  the wake-up date for Standby. Null means it sits in No Next Action. */
export function attentionDate(lead: { status?: string | null; next_action_due?: string | null; standby_until?: string | null }): string | null {
  if ((lead.status || '') === 'standby') return lead.standby_until || lead.next_action_due || null
  return lead.next_action_due || null
}

// ── Consent milestone (v0.6.41) ──────────────────────────────────────────
// Manually tracked in Ship 3 (the panel exists; the automated sender is a
// future design). Every change is logged to the lead's timeline. 'signed'
// will become a conversion-readiness input in Ship 4.

export const CONSENT_STATUSES = [
  { key: 'not_started', label: 'Not started', color: '#8FA0B0', bg: '#EFF2F5' },
  { key: 'preparing',   label: 'Preparing',   color: '#457B9D', bg: '#EBF4FF' },
  { key: 'sent',        label: 'Sent',        color: '#D97706', bg: '#FEF3C7' },
  { key: 'signed',      label: 'Signed \u2713', color: '#065F46', bg: '#A7F3D0' },
  { key: 'declined',    label: 'Declined',    color: '#DC2626', bg: '#FEE2E2' },
] as const

export function consentMeta(status: string | null | undefined) {
  const s = (status || 'not_started').toLowerCase()
  return CONSENT_STATUSES.find(x => x.key === s) || CONSENT_STATUSES[0]
}

// ── Display helpers ──────────────────────────────────────────────────────

export function prettyKey(key: string | null | undefined): string {
  if (!key) return '\u2014'
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
