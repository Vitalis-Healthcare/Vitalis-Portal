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

export function isStaffDocType(key: string): boolean {
  return ONB_STAFF_DOCUMENT_TYPES.some((d) => d.key === key)
}

export function staffDocLabel(key: string): string {
  return ONB_STAFF_DOCUMENT_TYPES.find((d) => d.key === key)?.label || key
}
