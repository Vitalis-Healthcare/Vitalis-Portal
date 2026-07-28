// lib/onboarding/gates.ts
//
// The credentialing gates. ONE evaluator, used by both the routes that enforce
// and the pages that explain — so what the coordinator is told is missing is
// computed by the same code that will refuse the request. If the UI and the
// enforcement drifted apart, staff would be told the button is ready and then
// be rejected, which is the "it is not working" complaint we are trying to
// design out.

import { CJIS_DOC_TYPE, MBON_DOC_TYPE } from '@/lib/onboarding/staff-documents'

/** Candidate statuses that mean the application is in and under review. */
export const APPLICATION_IN_STATUSES = [
  'application_submitted', 'in_review', 'axiscare_created', 'converted',
] as const

export interface Blocker {
  code: string
  /** One line, shown as the headline of the blocker. */
  label: string
  /** What the coordinator has to do about it, in plain words. */
  detail: string
  /** Where to go to fix it, when there is a single obvious place. */
  fixHref?: string
  fixLabel?: string
}

export interface GateInput {
  candidateId: string
  candidateStatus: string | null
  /** onb_applications.credential_type — 'None', 'CNA', 'GNA', 'CMT', 'LPN', 'RN', … */
  credentialType: string | null
  licenseWaivedAt: string | null
  licenseWaiverReason: string | null
  /** doc_type values currently on file for this candidate. */
  docTypes: string[]
  /** Set when a signed agreement exists. */
  contractSignedAt?: string | null
}

export interface GateResult {
  ok: boolean
  blockers: Blocker[]
}

/**
 * "Licensed" means the candidate told us on their application that they hold a
 * clinical credential. Anything other than an explicit 'None' counts, including
 * a blank — an unanswered question is not evidence of being unlicensed.
 */
export function isLicensedCredential(credentialType: string | null): boolean {
  const c = (credentialType || '').trim()
  if (!c) return false
  return c.toLowerCase() !== 'none'
}

/** True when the person declared a credential but the license was waived anyway. */
export function isWaiverContradictory(i: GateInput): boolean {
  return !!i.licenseWaivedAt && isLicensedCredential(i.credentialType)
}

/**
 * Everything that must be true before an agreement can be sent.
 */
export function evaluateContractGate(i: GateInput): GateResult {
  const blockers: Blocker[] = []
  const has = (t: string) => i.docTypes.includes(t)
  const credsHref = `/candidates/${i.candidateId}/credentials`

  if (!(APPLICATION_IN_STATUSES as readonly string[]).includes(i.candidateStatus || '')) {
    blockers.push({
      code: 'application_not_submitted',
      label: 'The application has not been submitted',
      detail:
        'The candidate still has to finish and submit their application. Until then there is nothing to review, and no position or rate to put on an agreement.',
      fixHref: `/candidates/${i.candidateId}`,
      fixLabel: 'Open candidate',
    })
  }

  if (!has(CJIS_DOC_TYPE)) {
    blockers.push({
      code: 'cjis_missing',
      label: 'CJIS background check is not on file',
      detail:
        'You need to obtain the criminal history record and upload it yourself. This is required for every caregiver and cannot be waived.',
      fixHref: credsHref,
      fixLabel: 'Upload background check',
    })
  }

  if (isWaiverContradictory(i)) {
    // The dangerous case: someone waived the license for a person who told us
    // they are certified. Report it instead of silently honouring the waiver.
    blockers.push({
      code: 'license_waiver_invalid',
      label: `License was waived, but this candidate declared ${i.credentialType}`,
      detail:
        'The waiver only applies to unlicensed aides. Either upload the MBON verification for the credential they claimed, or remove the waiver and correct the application if the credential was entered in error.',
      fixHref: credsHref,
      fixLabel: 'Review license',
    })
  } else if (!has(MBON_DOC_TYPE) && !i.licenseWaivedAt) {
    blockers.push({
      code: 'license_missing',
      label: 'MBON license verification is not on file',
      detail: isLicensedCredential(i.credentialType)
        ? `This candidate declared ${i.credentialType} on their application, so verification is required. It cannot be waived while that credential stands.`
        : 'Upload the Maryland Board of Nursing verification, or waive it if this is an unlicensed aide.',
      fixHref: credsHref,
      fixLabel: 'Upload or waive license',
    })
  }

  return { ok: blockers.length === 0, blockers }
}

/**
 * Everything that must be true before a candidate becomes a caregiver.
 * The contract gate is a precondition, so a signed agreement can never be the
 * only thing standing between an unvetted candidate and a caregiver account.
 */
export function evaluateConvertGate(i: GateInput): GateResult {
  const contract = evaluateContractGate(i)
  const blockers = [...contract.blockers]

  if (!i.contractSignedAt) {
    blockers.push({
      code: 'contract_unsigned',
      label: 'The agreement has not been signed',
      detail:
        'Send the job description and terms of engagement, and wait for the candidate to sign, before converting them to a caregiver.',
      fixHref: `/candidates/${i.candidateId}/contract`,
      fixLabel: 'Open agreement',
    })
  }

  return { ok: blockers.length === 0, blockers }
}

/** Compact one-line summary, for logs and API error messages. */
export function blockerSummary(blockers: Blocker[]): string {
  if (!blockers.length) return ''
  return blockers.map((b) => b.label).join('; ')
}
