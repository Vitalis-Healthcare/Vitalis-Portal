// lib/onboarding/application-references.ts
//
// The candidate already gave us their three referees on their application.
// Until v0.6.23 nothing read them back, so staff retyped name, email and phone
// that were sitting in the database — and retyping is where a good email
// address becomes a bad one.
//
// The link is `onb_candidates.converted_to_profile_id`: a caregiver profile
// points back to the candidate record it came from, and the application hangs
// off that. A caregiver who was never a Vita candidate (added directly to the
// portal) simply has nothing to prefill, which is not an error.

import { REFERENCE_SLOTS } from '@/lib/onboarding/application'

export interface PrefillReference {
  /** 1-based, matching caregiver_references.slot. */
  slot: number
  kind: string
  label: string
  name: string
  email: string
  phone: string
}

type Svc = {
  from: (t: string) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/**
 * Turn the application's `applicant_references` jsonb array into one entry per
 * reference slot. Always returns exactly REFERENCE_SLOTS.length entries, with
 * blanks where the application had nothing — the caller renders slots, not
 * whatever length the array happened to be.
 */
export function mapApplicationReferences(raw: unknown): PrefillReference[] {
  const list = Array.isArray(raw) ? raw : []
  return REFERENCE_SLOTS.map((slot, i) => {
    const r = (list[i] || {}) as Record<string, unknown>
    return {
      slot: i + 1,
      kind: slot.kind,
      label: slot.label,
      name: str(r.name),
      email: str(r.email),
      phone: str(r.phone),
    }
  })
}

/** Load the referees a CONVERTED caregiver gave on their candidate application. */
export async function loadApplicationReferences(
  svc: Svc,
  profileId: string,
): Promise<PrefillReference[]> {
  try {
    const { data: cand } = await svc
      .from('onb_candidates')
      .select('id')
      .eq('converted_to_profile_id', profileId)
      .maybeSingle()
    if (!cand?.id) return []

    const { data: app } = await svc
      .from('onb_applications')
      .select('applicant_references')
      .eq('candidate_id', cand.id)
      .maybeSingle()
    if (!app) return []

    return mapApplicationReferences(app.applicant_references)
  } catch {
    // Prefill is a convenience. If it fails, the form is simply blank — never
    // let it take down the caregiver profile page.
    return []
  }
}
