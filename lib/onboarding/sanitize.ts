// lib/onboarding/sanitize.ts
// Single source of truth for turning a raw application payload into the exact
// column map written to onb_applications. Imported by BOTH the candidate-facing
// route (/api/onboarding/application) and the staff edit route
// (/api/onboarding/candidates/[id]/application) so the two can never drift.
import {
  APPLICATION_FIELDS, APPLICATION_BOOLEAN_FIELDS,
  WILLING_TO_WORK_WITH, EXPERIENCE_WITH, WEEK_DAYS, REFERENCE_SLOTS,
  MAX_WORK_EXPERIENCE, MAX_EMERGENCY_CONTACTS,
} from './application'

const BOOLEAN_SET = new Set<string>(APPLICATION_BOOLEAN_FIELDS as string[])

function trimOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

function sanitizeScalars(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of APPLICATION_FIELDS) {
    if (!(key in input)) continue
    const raw = input[key]
    if (BOOLEAN_SET.has(key as string)) {
      out[key as string] = typeof raw === 'boolean' ? raw : null
    } else if (key === 'live_in_max_days') {
      const n = parseInt(String(raw ?? ''), 10)
      out[key as string] = Number.isFinite(n) ? n : null
    } else {
      out[key as string] = trimOrNull(raw)
    }
  }
  return out
}

function sanitizeStringArray(v: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(v)) return []
  const set = new Set(allowed)
  return v.map((x) => String(x)).filter((x) => set.has(x))
}

function sanitizeWorkExperience(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, MAX_WORK_EXPERIENCE).map((e) => {
    const o = (e || {}) as Record<string, unknown>
    return {
      organization: trimOrNull(o.organization),
      contact_person: trimOrNull(o.contact_person),
      telephone: trimOrNull(o.telephone),
      dates_worked: trimOrNull(o.dates_worked),
      may_contact: typeof o.may_contact === 'boolean' ? o.may_contact : null,
    }
  }).filter((e) => e.organization || e.contact_person || e.telephone || e.dates_worked)
}

function sanitizeReferences(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, REFERENCE_SLOTS.length).map((e, i) => {
    const o = (e || {}) as Record<string, unknown>
    const kind = o.kind === 'character' ? 'character' : REFERENCE_SLOTS[i]?.kind || 'professional'
    return {
      kind,
      name: trimOrNull(o.name),
      title: trimOrNull(o.title),
      phone: trimOrNull(o.phone),
      dates_known: trimOrNull(o.dates_known),
    }
  }).filter((e) => e.name || e.phone)
}

function sanitizeEmergencyContacts(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, MAX_EMERGENCY_CONTACTS).map((e) => {
    const o = (e || {}) as Record<string, unknown>
    return {
      name: trimOrNull(o.name),
      relationship: trimOrNull(o.relationship),
      phone: trimOrNull(o.phone),
      phone_type: trimOrNull(o.phone_type),
    }
  }).filter((e) => e.name || e.phone)
}

function sanitizeAvailabilityDays(v: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!v || typeof v !== 'object') return out
  const o = v as Record<string, unknown>
  for (const d of WEEK_DAYS) {
    const t = trimOrNull(o[d.key])
    if (t) out[d.key] = t
  }
  return out
}

// Full sanitized column map (no candidate_id / timestamps / status — callers add those).
export function buildApplicationRow(input: Record<string, unknown>): Record<string, unknown> {
  return {
    ...sanitizeScalars(input),
    willing_to_work_with: sanitizeStringArray(input.willing_to_work_with, WILLING_TO_WORK_WITH),
    experience_with: sanitizeStringArray(input.experience_with, EXPERIENCE_WITH),
    work_experience: sanitizeWorkExperience(input.work_experience),
    applicant_references: sanitizeReferences(input.applicant_references),
    emergency_contacts: sanitizeEmergencyContacts(input.emergency_contacts),
    availability_days: sanitizeAvailabilityDays(input.availability_days),
  }
}
