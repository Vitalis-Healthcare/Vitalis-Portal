// lib/onboarding/application.ts
// Shared types + constants for the candidate application (Phase 2 + v0.6.5
// expansion). Pure data — safe to import from both the public form (client) and
// the API route (server).

// Statuses at which the candidate may edit the application.
export const APPLICATION_EDITABLE_STATUSES = ['test_passed', 'applying'] as const
// Statuses where the candidate has finished and is awaiting / under staff review.
export const APPLICATION_SUBMITTED_STATUSES = ['application_submitted', 'in_review'] as const

// 'None' replaces the old 'UA' (unlicensed assistant) — clearer for applicants
// who would not recognize the "UA" abbreviation.
export const CREDENTIAL_TYPES = ['None', 'CNA', 'GNA', 'CMT', 'LPN', 'RN', 'PT', 'OT', 'ST'] as const
export type CredentialType = (typeof CREDENTIAL_TYPES)[number]

export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'unspecified', label: 'Prefer not to say' },
] as const

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA',
  'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const

// "Willing to work with" (preferences) and "Experience with" (specialized
// training) checkbox sets — taken from the Vitalis caregiver application.
export const WILLING_TO_WORK_WITH = [
  'Companionship', 'Bathing / Dressing', 'Hoyer Lift', 'Gait Belt', 'Incontinence',
  'Driving', 'Transfer Assist', 'Smoking', "Alzheimer's / Dementia",
  'Males', 'Females', 'Dogs', 'Cats',
] as const

export const EXPERIENCE_WITH = [
  'Hoyer Lift', 'Gait Belt', 'Incontinence', 'Transfer Assist', "Alzheimer's / Dementia",
] as const

export const WEEK_DAYS = [
  { key: 'mon', label: 'Monday' }, { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' }, { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' }, { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
] as const

export const MAX_WORK_EXPERIENCE = 4
export const MAX_EMERGENCY_CONTACTS = 3

// ── Repeatable-group shapes ──
export type WorkExperience = {
  organization?: string
  contact_person?: string
  telephone?: string
  dates_worked?: string
  may_contact?: boolean | null
}
export type ReferenceKind = 'professional' | 'character'
export type ReferenceEntry = {
  kind: ReferenceKind
  name?: string
  title?: string
  phone?: string
  dates_known?: string
}
export type EmergencyContact = {
  name?: string
  relationship?: string
  phone?: string
  phone_type?: string
}
export type AvailabilityDays = Record<string, string>

// The three fixed reference slots (2 professional + 1 character).
export const REFERENCE_SLOTS: { kind: ReferenceKind; label: string }[] = [
  { kind: 'professional', label: 'Professional reference 1' },
  { kind: 'professional', label: 'Professional reference 2' },
  { kind: 'character', label: 'Character reference' },
]

// The full editable shape. All optional so a draft can be saved partially;
// required fields are checked at submit time only (see the API route).
export type ApplicationData = {
  // Personal
  legal_first_name?: string
  middle_name?: string
  legal_last_name?: string
  preferred_name?: string
  date_of_birth?: string
  gender?: string
  ssn?: string
  phone?: string
  home_phone?: string
  email?: string
  address_street?: string
  address_unit?: string
  address_city?: string
  address_state?: string
  address_zip?: string

  // Driver's license
  driver_license_received?: boolean | null
  driver_license_number?: string
  driver_license_state?: string

  // Eligibility
  work_authorized?: boolean | null
  requires_sponsorship?: boolean | null
  is_18_or_older?: boolean | null
  has_transportation?: boolean | null

  // Professional
  credential_type?: string
  license_number?: string
  years_experience?: string
  languages?: string

  // Availability
  availability?: string
  earliest_start_date?: string
  available_all_hours?: boolean | null
  availability_days?: AvailabilityDays
  live_in_interested?: boolean | null
  live_in_max_days?: string

  // Skills & training
  willing_to_work_with?: string[]
  experience_with?: string[]
  additional_certifications?: string

  // Repeatable groups
  work_experience?: WorkExperience[]
  applicant_references?: ReferenceEntry[]
  emergency_contacts?: EmergencyContact[]

  // Additional questions
  smoker?: boolean | null
  smoker_per_day?: string
  how_heard?: string
  recent_experience?: string
  why_caregiver?: string

  // Attestation
  attested?: boolean
  signature_name?: string
}

// Scalar (non-array, non-jsonb-group) fields the API accepts directly.
export const APPLICATION_FIELDS: (keyof ApplicationData)[] = [
  'legal_first_name', 'middle_name', 'legal_last_name', 'preferred_name',
  'date_of_birth', 'gender', 'ssn', 'phone', 'home_phone', 'email',
  'address_street', 'address_unit', 'address_city', 'address_state', 'address_zip',
  'driver_license_received', 'driver_license_number', 'driver_license_state',
  'work_authorized', 'requires_sponsorship', 'is_18_or_older', 'has_transportation',
  'credential_type', 'license_number', 'years_experience', 'languages',
  'availability', 'earliest_start_date', 'available_all_hours',
  'live_in_interested', 'live_in_max_days',
  'additional_certifications',
  'smoker', 'smoker_per_day', 'how_heard', 'recent_experience', 'why_caregiver',
  'attested', 'signature_name',
]

// Boolean scalar fields (so the route coerces them correctly).
export const APPLICATION_BOOLEAN_FIELDS: (keyof ApplicationData)[] = [
  'driver_license_received', 'work_authorized', 'requires_sponsorship',
  'is_18_or_older', 'has_transportation', 'available_all_hours',
  'live_in_interested', 'smoker',
]

// Map a saved onb_applications row (or null) into editable form values. Used by
// BOTH the candidate application page and the staff edit page so the two stay
// identical. `fallback` supplies name/email defaults from the candidate record.
export function applicationRowToData(
  appRow: Record<string, unknown> | null,
  fallback: { first_name?: string; last_name?: string; email?: string },
): ApplicationData {
  const a = (appRow || {}) as Record<string, unknown>
  const s = (v: unknown, fb = ''): string => (v == null ? fb : String(v))
  const b = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null)
  const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
  return {
    legal_first_name: s(a.legal_first_name, fallback.first_name || ''),
    middle_name: s(a.middle_name),
    legal_last_name: s(a.legal_last_name, fallback.last_name || ''),
    preferred_name: s(a.preferred_name),
    date_of_birth: s(a.date_of_birth),
    gender: s(a.gender),
    ssn: s(a.ssn),
    phone: s(a.phone),
    home_phone: s(a.home_phone),
    email: s(a.email, fallback.email || ''),
    address_street: s(a.address_street),
    address_unit: s(a.address_unit),
    address_city: s(a.address_city),
    address_state: s(a.address_state),
    address_zip: s(a.address_zip),
    driver_license_received: b(a.driver_license_received),
    driver_license_number: s(a.driver_license_number),
    driver_license_state: s(a.driver_license_state),
    work_authorized: b(a.work_authorized),
    requires_sponsorship: b(a.requires_sponsorship),
    is_18_or_older: b(a.is_18_or_older),
    has_transportation: b(a.has_transportation),
    credential_type: s(a.credential_type),
    license_number: s(a.license_number),
    years_experience: s(a.years_experience),
    languages: s(a.languages),
    availability: s(a.availability),
    earliest_start_date: s(a.earliest_start_date),
    available_all_hours: b(a.available_all_hours),
    availability_days: (a.availability_days as AvailabilityDays) || {},
    live_in_interested: b(a.live_in_interested),
    live_in_max_days: a.live_in_max_days != null ? String(a.live_in_max_days) : '',
    willing_to_work_with: arr(a.willing_to_work_with) as string[],
    experience_with: arr(a.experience_with) as string[],
    additional_certifications: s(a.additional_certifications),
    work_experience: arr(a.work_experience) as WorkExperience[],
    applicant_references: arr(a.applicant_references) as ReferenceEntry[],
    emergency_contacts: arr(a.emergency_contacts) as EmergencyContact[],
    smoker: b(a.smoker),
    smoker_per_day: s(a.smoker_per_day),
    how_heard: s(a.how_heard),
    recent_experience: s(a.recent_experience),
    why_caregiver: s(a.why_caregiver),
    attested: a.attested === true,
    signature_name: s(a.signature_name),
  }
}
