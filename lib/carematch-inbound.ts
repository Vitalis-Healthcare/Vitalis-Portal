// ═════════════════════════════════════════════════════════════════════════
// CareMatch360 → Vita inbound mapping (v0.6.25)
//
// CareMatch360 and Vita do not share a vocabulary. Every difference between a
// CM360 `providers` row and Vita's candidate application lives in this file and
// nowhere else, so the receiver route stays about HTTP and the database.
//
// Everything here is a PURE function — no I/O, no Supabase — so the release
// harness can exercise the branching directly. `tsc` proves it compiles; the
// harness proves it decides correctly.
//
// Companion on the CareMatch360 side: lib/vita-outbound.ts (ships separately).
// ═════════════════════════════════════════════════════════════════════════

import type { ApplicationData } from '@/lib/onboarding/application'
import { US_STATES } from '@/lib/onboarding/application'

// ── The wire contract ────────────────────────────────────────────────────
// Anything CareMatch360 does not hold is simply absent. The mapper never
// fabricates a value to fill a gap.
export interface CarematchProvider {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  gender: string | null
  credential_type: string | null
  additional_credentials: string[] | null
  license_number: string | null
  skills: string[] | null
  preferred_days: string[] | null
  shift_preferences: string[] | null
  /** Extracted by CM360 from its `[APPLICATION] Years exp: …` notes prefix. */
  years_experience: string | null
  has_car: boolean | null
}

export interface CarematchEnvelope {
  event: string
  provider: CarematchProvider
  sent_at: string
}

// ── Small shared helpers ─────────────────────────────────────────────────
function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}
function cleanList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => str(x)).filter(Boolean)
}
function pushUnique(arr: string[], value: string): void {
  if (!arr.includes(value)) arr.push(value)
}

/**
 * Loose email check, deliberately matching lib/onboarding/application.ts rather
 * than being stricter. Two different opinions about what an address looks like
 * is how a candidate gets accepted here and rejected at the form.
 */
export function looksLikeEmail(value: string | null | undefined): boolean {
  const s = str(value)
  if (!s || s.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)
}

// ── Name ─────────────────────────────────────────────────────────────────
/**
 * CareMatch360 holds one `name` column; Vita needs first and last separately,
 * both NOT NULL on onb_candidates.
 *
 * The rule is deliberately dumb and stated out loud: the first token is the
 * first name, everything after it is the last name. That is wrong for
 * "Mary Jane Watson", and there is no way to be right without asking — which
 * is why both names stay editable before anything is sent onward.
 *
 * Whitespace is collapsed first. Imported names carry stray spaces (the
 * trailing-space trap that killed a delete confirmation once already).
 *
 * Returns null for a single-token name. The caller refuses the push rather
 * than inventing a surname or writing an empty one.
 */
export function splitName(raw: string | null | undefined): { first: string; last: string } | null {
  const parts = str(raw).split(/\s+/).filter(Boolean)
  if (parts.length < 2) return null
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

// ── Credential ───────────────────────────────────────────────────────────
// CareMatch360 says 'UA' where Vita says 'None' — v0.6.6 renamed it because
// applicants did not recognise the abbreviation.
const CREDENTIAL_MAP: Record<string, string> = {
  UA: 'None', NONE: 'None',
  CNA: 'CNA', GNA: 'GNA', CMT: 'CMT', LPN: 'LPN',
  RN: 'RN', PT: 'PT', OT: 'OT', ST: 'ST',
}

/**
 * An unrecognised code maps to BLANK rather than passing through unchanged.
 * This matters more than it looks: `evaluateContractGate` treats anything other
 * than an explicit 'None' — blank included — as licensed, and therefore demands
 * an MBON licence. Wrongly asking a coordinator for a licence costs them thirty
 * seconds. Wrongly skipping one is a compliance hole. Blank is the safe way to
 * be wrong.
 */
export function mapCredentialType(raw: string | null | undefined): string {
  return CREDENTIAL_MAP[str(raw).toUpperCase()] ?? ''
}

// ── Gender ───────────────────────────────────────────────────────────────
/**
 * CareMatch360 allows 'non_binary'; Vita's application does not. It maps to
 * 'unspecified' — the honest answer about what Vita can hold. Rewriting it to
 * male or female would be worse than admitting the gap.
 */
export function mapGender(raw: string | null | undefined): string {
  const v = str(raw).toLowerCase()
  if (v === 'male' || v === 'female' || v === 'unspecified') return v
  if (v === 'non_binary') return 'unspecified'
  return ''
}

// ── State ────────────────────────────────────────────────────────────────
/**
 * Vita's form renders a two-letter select. CareMatch360's admin form is a free
 * text input defaulting to 'MD', so anything can be in there. A value that is
 * not a recognised abbreviation is left blank for the candidate to pick rather
 * than written into a field whose select has no matching option.
 */
export function mapState(raw: string | null | undefined): string {
  const v = str(raw).toUpperCase()
  return (US_STATES as readonly string[]).includes(v) ? v : ''
}

// ── Skills ───────────────────────────────────────────────────────────────
// CareMatch360 carries 47 canonical skills. Vita has two short lists plus a
// free-text languages field. Eleven CM360 skills have a home; the remaining 36
// — clinical procedures, specialties, most ADLs — have none, so they are
// written verbatim into `additional_certifications`. Dropping them silently
// would lose real information about the applicant.

/**
 * Vita values that appear in BOTH of Vita's lists. A CM360 skill is a claim of
 * experience; ticking the matching willingness box is the same single fact
 * recorded in the two places Vita records it, not a fresh inference.
 */
const SKILL_TO_BOTH: Record<string, string> = {
  'Hoyer lift': 'Hoyer Lift',
  'Transfer assist': 'Transfer Assist',
  'Incontinence care': 'Incontinence',
  'Dementia Care': "Alzheimer's / Dementia",
  "Alzheimer's": "Alzheimer's / Dementia", // collapses onto the same Vita value
}

/** Vita values that exist only on the willingness list. */
const SKILL_TO_WILLING: Record<string, string> = {
  'Bathing assistance (tub/shower)': 'Bathing / Dressing',
  'Dressing assistance': 'Bathing / Dressing', // also collapses
}

/** Language skills belong in Vita's free-text `languages` field. */
const SKILL_TO_LANGUAGE: Record<string, string> = {
  'Spanish speaking': 'Spanish',
  'French speaking': 'French',
  'Sign language': 'Sign language',
}

/**
 * Owning a car is not the same as consenting to drive clients, and Vita's
 * "Driving" chip sits under *willing to work with*. This sets the transport
 * flag only.
 */
const SKILL_TRANSPORT = 'Has a car'

export interface MappedSkills {
  willing_to_work_with: string[]
  experience_with: string[]
  languages: string[]
  has_transportation: boolean
  /** Skills with no Vita equivalent, preserved verbatim for the free-text field. */
  unmapped: string[]
}

export function mapSkills(raw: string[] | null | undefined): MappedSkills {
  const willing: string[] = []
  const experience: string[] = []
  const languages: string[] = []
  const unmapped: string[] = []
  let hasTransportation = false

  for (const skill of cleanList(raw)) {
    if (skill === SKILL_TRANSPORT) { hasTransportation = true; continue }

    const both = SKILL_TO_BOTH[skill]
    if (both) { pushUnique(experience, both); pushUnique(willing, both); continue }

    const willingOnly = SKILL_TO_WILLING[skill]
    if (willingOnly) { pushUnique(willing, willingOnly); continue }

    const language = SKILL_TO_LANGUAGE[skill]
    if (language) { pushUnique(languages, language); continue }

    pushUnique(unmapped, skill)
  }

  return { willing_to_work_with: willing, experience_with: experience, languages, has_transportation: hasTransportation, unmapped }
}

// ── Availability ─────────────────────────────────────────────────────────
const SHIFT_LABELS: Record<string, string> = {
  morning: 'Morning (6am-12pm)',
  afternoon: 'Afternoon (12pm-6pm)',
  evening: 'Evening (6pm-12am)',
  overnight: 'Overnight (12am-6am)',
}

/**
 * Vita's `availability_days` holds real hours per day ("9am-5pm"). CareMatch360
 * only knows which days and which shift bands were preferred, so writing
 * "Available" into an hours field would be inventing content. Both go into the
 * free-text `availability` line instead, and the candidate enters real hours
 * when they reach the form.
 */
export function mapAvailability(
  days: string[] | null | undefined,
  shifts: string[] | null | undefined,
): string {
  const d = cleanList(days)
  const s = cleanList(shifts).map((x) => SHIFT_LABELS[x.toLowerCase()] || x)
  const parts: string[] = []
  if (d.length) parts.push(`Preferred days: ${d.join(', ')}.`)
  if (s.length) parts.push(`Preferred shifts: ${s.join(', ')}.`)
  return parts.join(' ')
}

// ── Free-text carry-over ─────────────────────────────────────────────────
/**
 * Everything CareMatch360 knows that Vita has no field for, gathered into one
 * readable block. Prefixed so a coordinator can tell at a glance that the
 * candidate did not type it.
 */
export function buildAdditionalCertifications(
  additionalCredentials: string[] | null | undefined,
  unmappedSkills: string[],
): string {
  const lines: string[] = []
  const creds = cleanList(additionalCredentials)
  if (creds.length) lines.push(`Additional credentials: ${creds.join(', ')}.`)
  if (unmappedSkills.length) lines.push(`Skills recorded in CareMatch360: ${unmappedSkills.join(', ')}.`)
  if (!lines.length) return ''
  return `[From CareMatch360] ${lines.join(' ')}`
}

// ── The assembler ────────────────────────────────────────────────────────
/**
 * Build the application fields this provider can populate. Keys with no value
 * are OMITTED entirely rather than set blank, so the receiver's fill-blanks-only
 * merge never has to distinguish "CareMatch360 said nothing" from
 * "CareMatch360 said empty".
 */
export function mapProviderToApplication(p: CarematchProvider): Partial<ApplicationData> {
  const out: Record<string, unknown> = {}
  const set = (key: string, value: unknown) => {
    if (value === '' || value === null || value === undefined) return
    if (Array.isArray(value) && value.length === 0) return
    out[key] = value
  }

  const name = splitName(p.name)
  if (name) {
    set('legal_first_name', name.first)
    set('legal_last_name', name.last)
  }

  set('email', str(p.email))
  set('phone', str(p.phone))
  set('address_street', str(p.address))
  set('address_city', str(p.city))
  set('address_state', mapState(p.state))
  set('address_zip', str(p.zip))
  set('gender', mapGender(p.gender))
  set('credential_type', mapCredentialType(p.credential_type))
  set('license_number', str(p.license_number))
  set('years_experience', str(p.years_experience))

  const skills = mapSkills(p.skills)
  set('willing_to_work_with', skills.willing_to_work_with)
  set('experience_with', skills.experience_with)
  set('languages', skills.languages.join(', '))
  // The boolean column is authoritative; the skill chip is the fallback signal.
  if (p.has_car === true || skills.has_transportation) out.has_transportation = true

  set('availability', mapAvailability(p.preferred_days, p.shift_preferences))
  set('additional_certifications', buildAdditionalCertifications(p.additional_credentials, skills.unmapped))

  return out as Partial<ApplicationData>
}

// ── Merge ────────────────────────────────────────────────────────────────
/**
 * True when the existing column holds nothing a person would recognise as an
 * answer. Empty arrays and empty objects count as blank — `buildApplicationRow`
 * always emits the six array/jsonb keys, so an existing row that has never been
 * touched carries `[]` and `{}` rather than nulls.
 */
export function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

/**
 * Fill blanks only. A field the candidate (or a coordinator) has already
 * answered is never overwritten by an inbound push.
 *
 * This is the guard that stops a second "Send to Vita" click wiping a
 * part-completed application. `buildApplicationRow` unconditionally returns the
 * six array and jsonb keys defaulted to `[]` / `{}`, so a blind upsert of its
 * output would erase references and work experience the candidate had typed.
 */
export function mergeBlanksOnly(
  existing: Record<string, unknown> | null,
  incoming: Record<string, unknown>,
): { row: Record<string, unknown>; filled: string[]; skipped: string[] } {
  const row: Record<string, unknown> = {}
  const filled: string[] = []
  const skipped: string[] = []

  for (const [key, value] of Object.entries(incoming)) {
    if (isBlank(value)) continue
    if (existing && !isBlank(existing[key])) { skipped.push(key); continue }
    row[key] = value
    filled.push(key)
  }

  return { row, filled, skipped }
}
