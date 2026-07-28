// lib/onboarding/staff-documents.ts
//
// Documents the CARE COORDINATOR obtains and uploads on the candidate's behalf.
//
// Deliberately a SEPARATE catalog from ONB_DOCUMENT_TYPES. The candidate-facing
// upload route validates against that other list and coerces anything unknown
// to 'other', so a candidate cannot upload a file that presents itself as their
// own background check. Keeping the two catalogs apart is what makes that true;
// merging them would quietly remove the protection.

import type { DocTypeDef } from '@/lib/onboarding/documents'

export const CJIS_DOC_TYPE = 'cjis_background'
export const MBON_DOC_TYPE = 'mbon_license'

// ── Staff-exclusive. A candidate can never file one of these. ───────────────
export const ONB_STAFF_DOCUMENT_TYPES: DocTypeDef[] = [
  {
    key: CJIS_DOC_TYPE,
    label: 'CJIS background check',
    hint: 'Criminal history record from the Maryland CJIS Central Repository. Required for every caregiver — cannot be waived.',
  },
  {
    key: MBON_DOC_TYPE,
    label: 'MBON license verification',
    hint: 'Maryland Board of Nursing certification (CNA, GNA, CMT, LPN, RN). Can be waived only for an unlicensed aide.',
  },
]

// ── Candidate documents the coordinator may file ON THE CANDIDATE'S BEHALF ──
//
// These keys are drawn from ONB_DOCUMENT_TYPES, not invented here, so the same
// file means the same thing whoever uploaded it. This exists because the three
// are REQUIRED by the gate: without a staff path, a candidate who handed their
// TB result over on paper could never satisfy it, and the gate would be a trap
// rather than a check.
//
// Note the asymmetry, which is the point: staff may file a candidate document,
// a candidate may never file a staff document.
export const PHOTO_ID_DOC_TYPE = 'photo_id'
export const CPR_DOC_TYPE = 'cpr'
export const TB_TEST_DOC_TYPE = 'tb_test'

export const ONB_ON_BEHALF_DOCUMENT_TYPES: DocTypeDef[] = [
  {
    key: PHOTO_ID_DOC_TYPE,
    label: 'Government-issued photo ID',
    hint: 'Driver’s license or state ID. Upload here only if the candidate handed it over in person or by email rather than through their application.',
  },
  {
    key: CPR_DOC_TYPE,
    label: 'CPR / First Aid certification',
    hint: 'Record the expiration printed on the card — this is what starts expiry tracking once they become a caregiver.',
  },
  {
    key: TB_TEST_DOC_TYPE,
    label: 'TB test (PPD) result',
    hint: 'Record the test date and the date it lapses.',
  },
]

/** The three the gate insists on before an agreement can go out. */
export const REQUIRED_CANDIDATE_DOC_TYPES: string[] = [
  PHOTO_ID_DOC_TYPE, CPR_DOC_TYPE, TB_TEST_DOC_TYPE,
]

/** Everything the credentials page shows, in the order it shows it. */
export const ONB_CREDENTIAL_PAGE_TYPES: DocTypeDef[] = [
  ...ONB_STAFF_DOCUMENT_TYPES,
  ...ONB_ON_BEHALF_DOCUMENT_TYPES,
]

export function isStaffDocType(key: string): boolean {
  return ONB_STAFF_DOCUMENT_TYPES.some((d) => d.key === key)
}

export function isOnBehalfDocType(key: string): boolean {
  return ONB_ON_BEHALF_DOCUMENT_TYPES.some((d) => d.key === key)
}

/** Anything the staff upload route will accept. */
export function isStaffUploadableDocType(key: string): boolean {
  return isStaffDocType(key) || isOnBehalfDocType(key)
}

export function staffDocLabel(key: string): string {
  return ONB_CREDENTIAL_PAGE_TYPES.find((d) => d.key === key)?.label || key
}
