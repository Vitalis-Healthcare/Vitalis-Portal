// lib/onboarding/credential-seed.ts
//
// When a candidate becomes a caregiver, the two documents the coordinator
// obtained during credentialing should become tracked credentials — otherwise
// the Credentials board is empty on day one and nothing ever chases the
// expiry of a licence we already hold a copy of.
//
// Three rules this file exists to keep:
//
//  1. SEEDING NEVER BREAKS A CONVERSION. Every failure here is reported and
//     swallowed. A caregiver account that exists with no credential rows is a
//     nuisance; a conversion that dies half-done is a mess.
//
//  2. IT NEVER OVERWRITES AN EXISTING CREDENTIAL. The convert route can link
//     to an ALREADY EXISTING profile ('linked_existing'), and that person may
//     already hold an approved Background Check with real dates on it. An
//     upsert on (user_id, credential_type_id) would quietly replace it with a
//     pending row and null dates. So: insert only where nothing is on file.
//
//  3. IT NEVER INVENTS A DATE. issue_date is left null when we do not know it
//     rather than defaulted to the upload date, and the row is filed as
//     'pending' so the Credentials board shows it as needing attention. A
//     fabricated issue date in a compliance file is worse than a blank one.

import { CJIS_DOC_TYPE, MBON_DOC_TYPE } from '@/lib/onboarding/staff-documents'

/**
 * Which credential type in Settings each onboarding document becomes.
 *
 * Matched by NAME, not by a hardcoded UUID, because the list in Settings is
 * user-editable and ids differ per environment. Note the nursing licence maps
 * to the credential-agnostic "Professional License" — it covers CNA, GNA, CMT,
 * LPN, RN, PT, OT and ST alike, so there is no per-credential mapping to keep
 * in step with the application's CREDENTIAL_TYPES list.
 *
 * If someone renames a type in Settings, the match fails, nothing is seeded,
 * and the reason comes back in `skipped` — it does not fail silently.
 */
export const CREDENTIAL_SEED_MAP: { docType: string; typeName: string; label: string }[] = [
  { docType: CJIS_DOC_TYPE, typeName: 'Background Check',    label: 'CJIS background check' },
  { docType: MBON_DOC_TYPE, typeName: 'Professional License', label: 'MBON license verification' },
]

export interface SeedOutcome {
  seeded: string[]
  skipped: { label: string; reason: string }[]
}

type Svc = {
  from: (t: string) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function seedStaffCredentials(
  svc: Svc,
  candidateId: string,
  profileId: string,
  submittedBy: string | null,
): Promise<SeedOutcome> {
  const out: SeedOutcome = { seeded: [], skipped: [] }

  // ── The documents on file for this candidate ──
  let docs: { doc_type: string; issued_on: string | null; expires_on: string | null }[] = []
  try {
    const { data, error } = await svc
      .from('onb_documents')
      .select('doc_type, issued_on, expires_on')
      .eq('candidate_id', candidateId)
      .in('doc_type', CREDENTIAL_SEED_MAP.map((m) => m.docType))
    if (error) {
      out.skipped.push({ label: 'all', reason: error.message })
      return out
    }
    docs = Array.isArray(data) ? data : []
  } catch (err) {
    out.skipped.push({ label: 'all', reason: String(err) })
    return out
  }

  // ── The credential types configured in Settings ──
  let types: { id: string; name: string; does_not_expire: boolean | null }[] = []
  try {
    const { data, error } = await svc
      .from('credential_types')
      .select('id, name, does_not_expire')
    if (error) {
      out.skipped.push({ label: 'all', reason: error.message })
      return out
    }
    types = Array.isArray(data) ? data : []
  } catch (err) {
    out.skipped.push({ label: 'all', reason: String(err) })
    return out
  }

  const findType = (name: string) =>
    types.find((t) => (t.name || '').trim().toLowerCase() === name.trim().toLowerCase())

  for (const map of CREDENTIAL_SEED_MAP) {
    const doc = docs.find((d) => d.doc_type === map.docType)
    if (!doc) {
      out.skipped.push({ label: map.label, reason: 'no document on file' })
      continue
    }

    const type = findType(map.typeName)
    if (!type) {
      out.skipped.push({
        label: map.label,
        reason: `no credential type named "${map.typeName}" in Settings`,
      })
      continue
    }

    // Rule 2: never replace what is already there.
    try {
      const { data: existing } = await svc
        .from('staff_credentials')
        .select('id')
        .eq('user_id', profileId)
        .eq('credential_type_id', type.id)
        .maybeSingle()
      if (existing?.id) {
        out.skipped.push({ label: map.label, reason: 'this caregiver already has that credential' })
        continue
      }
    } catch (err) {
      out.skipped.push({ label: map.label, reason: String(err) })
      continue
    }

    const doesNotExpire = !!type.does_not_expire
    const missing: string[] = []
    if (!doc.issued_on) missing.push('issue date')
    if (!doesNotExpire && !doc.expires_on) missing.push('expiry date')

    const note = missing.length
      ? `Seeded from the ${map.label} uploaded during onboarding. Still needs the ${missing.join(' and ')} — record it on this credential. The source file is on the candidate's credentialing page.`
      : `Seeded from the ${map.label} uploaded during onboarding. The source file is on the candidate's credentialing page.`

    try {
      const { error } = await svc.from('staff_credentials').insert({
        user_id: profileId,
        credential_type_id: type.id,
        // Rule 3: null, not the upload date.
        issue_date: doc.issued_on || null,
        expiry_date: doesNotExpire ? null : (doc.expires_on || null),
        does_not_expire: doesNotExpire,
        not_applicable: false,
        // Filed for review rather than pre-approved: a credential nobody has
        // looked at should not present as verified.
        review_status: 'pending',
        submitted_notes: note,
        submitted_by: submittedBy,
        // Deliberately no document_url. The onboarding bucket is private and a
        // signed URL would expire, leaving a dead link in a compliance record.
        document_url: null,
      })
      if (error) {
        out.skipped.push({ label: map.label, reason: error.message })
        continue
      }
      out.seeded.push(map.typeName)
    } catch (err) {
      out.skipped.push({ label: map.label, reason: String(err) })
    }
  }

  return out
}
