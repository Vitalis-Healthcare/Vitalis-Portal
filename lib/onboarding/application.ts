// lib/onboarding/application.ts
// Shared types + constants for the candidate application (Phase 2 / v0.6.3).
// Pure data — safe to import from both the public form (client) and the API
// route (server).

// The candidate statuses at which the application form is editable by the
// candidate. Anything past this is read-only on the candidate side.
export const APPLICATION_EDITABLE_STATUSES = ['test_passed', 'applying'] as const
// Statuses where the candidate has finished and is awaiting / under staff review.
export const APPLICATION_SUBMITTED_STATUSES = ['application_submitted', 'in_review'] as const

// Credential set — mirrors the provider credential vocabulary used elsewhere.
export const CREDENTIAL_TYPES = ['UA', 'CNA', 'GNA', 'CMT', 'LPN', 'RN', 'PT', 'OT', 'ST'] as const
export type CredentialType = (typeof CREDENTIAL_TYPES)[number]

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA',
  'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const

// The full editable shape, as the form submits it and the API persists it.
// All optional so a draft can be saved partially; required fields are checked
// at submit time only (see the API route).
export type ApplicationData = {
  legal_first_name?: string
  middle_name?: string
  legal_last_name?: string
  preferred_name?: string
  date_of_birth?: string        // YYYY-MM-DD
  phone?: string
  email?: string
  address_street?: string
  address_unit?: string
  address_city?: string
  address_state?: string
  address_zip?: string

  work_authorized?: boolean | null
  requires_sponsorship?: boolean | null
  is_18_or_older?: boolean | null
  has_transportation?: boolean | null

  credential_type?: string
  license_number?: string
  years_experience?: string
  languages?: string

  availability?: string
  earliest_start_date?: string  // YYYY-MM-DD

  emergency_name?: string
  emergency_relationship?: string
  emergency_phone?: string

  reference1_name?: string
  reference1_relationship?: string
  reference1_contact?: string
  reference2_name?: string
  reference2_relationship?: string
  reference2_contact?: string

  attested?: boolean
  signature_name?: string
}

// Whitelist of columns the API accepts from the client. Keeps the upsert tight
// and prevents a rogue body from setting workflow columns (status, *_at, etc.).
export const APPLICATION_FIELDS: (keyof ApplicationData)[] = [
  'legal_first_name', 'middle_name', 'legal_last_name', 'preferred_name',
  'date_of_birth', 'phone', 'email',
  'address_street', 'address_unit', 'address_city', 'address_state', 'address_zip',
  'work_authorized', 'requires_sponsorship', 'is_18_or_older', 'has_transportation',
  'credential_type', 'license_number', 'years_experience', 'languages',
  'availability', 'earliest_start_date',
  'emergency_name', 'emergency_relationship', 'emergency_phone',
  'reference1_name', 'reference1_relationship', 'reference1_contact',
  'reference2_name', 'reference2_relationship', 'reference2_contact',
  'attested', 'signature_name',
]
