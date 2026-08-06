// lib/onboarding/gates.ts
//
// The credentialing gates. ONE evaluator, used by both the routes that enforce
// and the pages that explain — so what the coordinator is told is missing is
// computed by the same code that will refuse the request. If the UI and the
// enforcement drifted apart, staff would be told the button is ready and then
// be rejected, which is the "it is not working" complaint we are trying to
// design out.

import {
  CJIS_DOC_TYPE, MBON_DOC_TYPE, ONB_ON_BEHALF_DOCUMENT_TYPES,
  REQUIRED_CANDIDATE_DOC_TYPES,
} from '@/lib/onboarding/staff-documents'
import { normalizeTrack } from '@/lib/onboarding/application'
import { fingerprintStatus, fingerprintLabel, todayISO } from '@/lib/onboarding/fingerprint'

/** Candidate statuses that mean the application is in and under review. */
export const APPLICATION_IN_STATUSES = [
  'application_submitted', 'in_review', 'axiscare_created',
  // A candidate sent for approval still has an application in — omitting this
  // would make the gate refuse the approval itself, citing a missing
  // application that is sitting right there.
  'awaiting_approval',
  'converted',
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
  /** onb_candidates.track — 'full' | 'application_only' | 'documents_only'. */
  track: string | null
  /** Set when a coordinator recorded that a paper application is on file. */
  paperApplicationAt?: string | null
  /** onb_applications.credential_type — 'None', 'CNA', 'GNA', 'CMT', 'LPN', 'RN', … */
  credentialType: string | null
  licenseWaivedAt: string | null
  licenseWaiverReason: string | null
  /** doc_type values currently on file for this candidate. */
  docTypes: string[]
  /** Set when the coordinator has signed off that the documents are adequate. */
  documentsAcceptedAt?: string | null
  /** Set when a signed agreement exists. */
  contractSignedAt?: string | null
  /** Live fingerprinting attestation, if one is open. 'YYYY-MM-DD'. */
  fingerprintSentAt?: string | null
  fingerprintExpectedBy?: string | null
  /** 'YYYY-MM-DD'. Injected only by tests; production reads the real clock. */
  today?: string
}

export interface GateResult {
  ok: boolean
  blockers: Blocker[]
  /**
   * Things that are NOT blocking but that somebody has to keep looking at —
   * today, only a live fingerprinting attestation. Optional so the six existing
   * call sites keep compiling and keep behaving exactly as before; `ok` is
   * still decided by blockers alone. A warning must never close a gate, or the
   * distinction stops meaning anything.
   */
  warnings?: Blocker[]
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
  const warnings: Blocker[] = []
  const has = (t: string) => i.docTypes.includes(t)
  const credsHref = `/candidates/${i.candidateId}/credentials`

  // On the documents-only track a recorded paper application stands in for a
  // submitted online one — that is the whole point of the track. Everything
  // else in this gate (CJIS, license, required documents, acceptance) still
  // applies in full to every track.
  const paperOnFile = normalizeTrack(i.track) === 'documents_only' && !!i.paperApplicationAt
  if (!paperOnFile && !(APPLICATION_IN_STATUSES as readonly string[]).includes(i.candidateStatus || '')) {
    if (normalizeTrack(i.track) === 'documents_only') {
      blockers.push({
        code: 'paper_application_not_recorded',
        label: 'The paper application has not been recorded on file',
        detail:
          'This candidate is on the documents-only track, so there is no online application to wait for. Record that their paper (or prior AxisCare) application is on file, and where it lives, on the candidate page.',
        fixHref: `/candidates/${i.candidateId}`,
        fixLabel: 'Open candidate',
      })
    } else {
      blockers.push({
        code: 'application_not_submitted',
        label: 'The application has not been submitted',
        detail:
          'The candidate still has to finish and submit their application. Until then there is nothing to review, and no position or rate to put on an agreement.',
        fixHref: `/candidates/${i.candidateId}`,
        fixLabel: 'Open candidate',
      })
    }
  }

  // ── CJIS, and the one thing that may stand in for it ─────────────────────
  // Softened v0.6.61. Fingerprinting is a physical trip and the record follows
  // days later; freezing a ready candidate for that window helps nobody. A
  // recorded attestation that the form went out opens the gate — but only
  // until the expected date. After that the gate shuts HARDER than before,
  // because we have now relied on a promise nobody kept.
  if (!has(CJIS_DOC_TYPE)) {
    const fp = fingerprintStatus(
      { sentAt: i.fingerprintSentAt ?? null, expectedBy: i.fingerprintExpectedBy ?? null },
      i.today || todayISO(),
    )
    if (fp.state === 'pending') {
      warnings.push({
        code: 'cjis_results_pending',
        label: fingerprintLabel(fp, i.fingerprintExpectedBy ?? null),
        detail:
          'The fingerprinting form has been sent and the results are not back yet. This candidate may proceed meanwhile, but the CJIS record must be uploaded as soon as it arrives — the moment the expected date passes, this stops being a note and becomes a block.',
        fixHref: credsHref,
        fixLabel: 'Open credentials',
      })
    } else if (fp.state === 'overdue') {
      blockers.push({
        code: 'cjis_attestation_overdue',
        label: fingerprintLabel(fp, i.fingerprintExpectedBy ?? null),
        detail:
          'The fingerprinting form was sent and the results were expected by now. Chase the result and upload the CJIS record. If there is a genuine reason it is late, extend the attestation on the credentials page and say why — extensions are recorded and reviewed.',
        fixHref: credsHref,
        fixLabel: 'Chase or extend',
      })
    } else {
      blockers.push({
        code: 'cjis_missing',
        label: 'CJIS background check is not on file',
        detail:
          'Upload the criminal history record. If the candidate has been sent for fingerprinting and you are waiting on the result, record that on the credentials page instead — that keeps things moving for a bounded period without losing the requirement.',
        fixHref: credsHref,
        fixLabel: 'Upload or record fingerprinting',
      })
    }
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

  // ── The document half of the gate ────────────────────────────────────────
  // Until v0.6.21 this was not checked at all: a candidate with ZERO uploads
  // passed silently (pitfall #44). Every candidate document is optional at
  // upload time by design, so "required" is enforced here at the gate rather
  // than in the upload route — that keeps the candidate's own form forgiving
  // while still refusing to move an incomplete file forward.
  for (const key of REQUIRED_CANDIDATE_DOC_TYPES) {
    if (has(key)) continue
    const def = ONB_ON_BEHALF_DOCUMENT_TYPES.find((d) => d.key === key)
    blockers.push({
      code: `doc_missing_${key}`,
      label: `${def ? def.label : key} is not on file`,
      detail:
        'The candidate can add it by reopening their application through Request documents, or you can upload it here yourself if they gave it to you on paper.',
      fixHref: credsHref,
      fixLabel: 'Upload on their behalf',
    })
  }

  // ── The human half of the document check ─────────────────────────────────
  // The three required uploads above are machine-checkable. Whether the file is
  // actually adequate is a judgement, and judgements cannot be derived — so the
  // gate reads an explicit sign-off rather than inferring satisfaction from the
  // presence of files. Cleared automatically whenever Request documents reopens
  // the application, so approval of one set never silently covers a later one.
  if (!i.documentsAcceptedAt) {
    blockers.push({
      code: 'documents_not_accepted',
      label: 'The documents have not been reviewed and accepted',
      detail:
        'Open the documents, check they are legible, current and belong to this person, then record your acceptance on the candidate page. This is the step that says a human looked, not just that files exist.',
      fixHref: `/candidates/${i.candidateId}`,
      fixLabel: 'Review the documents',
    })
  }

  return { ok: blockers.length === 0, blockers, warnings }
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

  // Warnings ride along unchanged: a pending attestation is just as worth
  // seeing on the convert screen as on the agreement screen.
  return { ok: blockers.length === 0, blockers, warnings: contract.warnings || [] }
}

/** Compact one-line summary, for logs and API error messages. */
export function blockerSummary(blockers: Blocker[]): string {
  if (!blockers.length) return ''
  return blockers.map((b) => b.label).join('; ')
}
