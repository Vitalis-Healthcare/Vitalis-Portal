// ═════════════════════════════════════════════════════════════════════════
// Candidate track board (v0.6.27)
//
// One view of where every candidate sits across every step, and — the part
// that earns the page — what each one is waiting on and how long it has been
// waiting.
//
// Two halves, deliberately separated:
//   • buildTrackRow() and everything above it are PURE. No I/O. The harness
//     exercises the branching directly.
//   • loadTrackBoard() does the database work in SIX queries total, whatever
//     the number of candidates. loadGateInput() runs four queries per
//     candidate, which is correct for one record and ruinous for sixty.
//
// The next-action text comes from evaluateConvertGate — the same evaluator the
// convert route enforces with — so the board can never promise something the
// portal would refuse.
// ═════════════════════════════════════════════════════════════════════════

import { createServiceClient } from '@/lib/supabase/service'
import { evaluateConvertGate, type GateInput } from '@/lib/onboarding/gates'
import {
  CJIS_DOC_TYPE, MBON_DOC_TYPE, REQUIRED_CANDIDATE_DOC_TYPES,
} from '@/lib/onboarding/staff-documents'

// ── Shapes ───────────────────────────────────────────────────────────────

/** Whose move it is. The organising idea of the whole board. */
export type Owner = 'candidate' | 'staff' | 'admin' | 'done' | 'closed'

export type MarkState =
  | 'done'      // finished
  | 'partial'   // started, not finished
  | 'waived'    // deliberately not required for this person
  | 'waiting'   // sitting with somebody
  | 'overdue'   // should have happened by now
  | 'none'      // not reached yet

export interface Milestone {
  key: string
  label: string
  state: MarkState
  /** Shown on hover. Never blank — an unexplained mark is worse than no mark. */
  detail: string
}

export interface TrackRow {
  id: string
  firstName: string
  lastName: string
  email: string
  status: string
  source: string | null
  track: string
  invited: boolean
  milestones: Milestone[]
  owner: Owner
  lastMovementAt: string | null
  daysSinceMovement: number
  stalled: boolean
  stallThresholdDays: number
  nextAction: string
  isComplete: boolean
  isClosed: boolean
}

export interface TrackRowInput {
  candidate: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    status: string | null
    source: string | null
    paper_application_at: string | null
    track: string | null
    access_token: string | null
    invited_at: string | null
    created_at: string | null
    test_passed_at: string | null
    application_submitted_at: string | null
    documents_accepted_at: string | null
    license_waived_at: string | null
    axiscare_pushed_at: string | null
    converted_to_profile_id: string | null
  }
  application: { credential_type: string | null; submitted_at: string | null; updated_at: string | null } | null
  attempt: { first_passed: boolean | null; mastery_reached: boolean | null; started_at: string | null; completed_at: string | null } | null
  docTypes: string[]
  docLastUploadedAt: string | null
  contract: { sent_at: string | null; signed_at: string | null } | null
  request: { status: string | null; requested_at: string | null; decided_at: string | null } | null
}

// ── Stall thresholds ─────────────────────────────────────────────────────
/**
 * How long is too long depends entirely on whose move it is. A candidate
 * taking ten days over a competency test is ordinary; an approval request
 * sitting with an administrator for ten days is not. One global number would
 * have to be wrong for one of them.
 */
export const STALL_DAYS: Record<Owner, number> = {
  candidate: 10,
  staff: 5,
  admin: 2,
  done: Number.POSITIVE_INFINITY,
  closed: Number.POSITIVE_INFINITY,
}

// ── Small helpers ────────────────────────────────────────────────────────
function ts(value: string | null | undefined): number {
  if (!value) return 0
  const t = Date.parse(value)
  return Number.isFinite(t) ? t : 0
}

function latest(values: (string | null | undefined)[]): string | null {
  let bestValue: string | null = null
  let best = 0
  for (const v of values) {
    const t = ts(v)
    if (t > best) { best = t; bestValue = v as string }
  }
  return bestValue
}

function fmt(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

// ── Derivation ───────────────────────────────────────────────────────────
export function buildTrackRow(input: TrackRowInput, now: Date = new Date()): TrackRow {
  const c = input.candidate
  const status = c.status || ''
  const invited = !!c.access_token
  const has = (t: string) => input.docTypes.includes(t)

  const converted = !!c.converted_to_profile_id
  const pushed = !!c.axiscare_pushed_at
  const isClosed = status === 'withdrawn'
  const isComplete = converted && pushed

  // ── Whose move ──
  let owner: Owner
  if (isClosed) owner = 'closed'
  else if (isComplete) owner = 'done'
  else if (status === 'awaiting_approval') owner = 'admin'
  else if (!invited) owner = 'staff'
  else if (converted && !pushed) owner = 'staff'
  else if (status === 'application_submitted' || status === 'in_review') owner = 'staff'
  else owner = 'candidate'

  // ── Last real movement ──
  // Deliberately NOT onb_candidates.updated_at: that is bumped by housekeeping
  // — a re-push from CareMatch360, a status correction — and would mask a
  // candidate who has actually done nothing for three weeks.
  const lastMovementAt = latest([
    c.created_at,
    invited ? c.invited_at : null,
    input.attempt?.started_at,
    input.attempt?.completed_at,
    c.test_passed_at,
    input.application?.updated_at,
    c.application_submitted_at,
    input.docLastUploadedAt,
    c.documents_accepted_at,
    input.contract?.sent_at,
    input.contract?.signed_at,
    input.request?.requested_at,
    input.request?.decided_at,
    c.axiscare_pushed_at,
  ])

  const daysSinceMovement = lastMovementAt
    ? Math.max(0, Math.floor((now.getTime() - ts(lastMovementAt)) / 86400000))
    : 0
  const stallThresholdDays = STALL_DAYS[owner]
  const stalled = Number.isFinite(stallThresholdDays) && daysSinceMovement >= stallThresholdDays

  // ── Milestones ──
  const testStarted = !!input.attempt
  const testPassed = !!c.test_passed_at || input.attempt?.first_passed === true || input.attempt?.mastery_reached === true

  const docsHeld = REQUIRED_CANDIDATE_DOC_TYPES.filter(has)
  const docsAll = docsHeld.length === REQUIRED_CANDIDATE_DOC_TYPES.length

  const appStarted = !!input.application
  const appSubmitted = !!c.application_submitted_at || !!input.application?.submitted_at

  const contractSent = !!input.contract?.sent_at
  const contractSigned = !!input.contract?.signed_at

  const approvalPending = status === 'awaiting_approval'
  const approvalReturned = input.request?.status === 'returned'
  const approvalDone = converted || input.request?.status === 'approved'

  const milestones: Milestone[] = [
    {
      key: 'invite', label: 'Invite',
      state: invited ? 'done' : 'none',
      detail: invited ? `Invited ${fmt(c.invited_at)}` : 'No invitation has been sent',
    },
    {
      key: 'test', label: 'Test',
      state: testPassed ? 'done'
        : testStarted ? 'partial'
        : invited && stalled ? 'overdue'
        : 'none',
      detail: testPassed ? `Passed ${fmt(c.test_passed_at || input.attempt?.completed_at)}`
        : testStarted ? `Started ${fmt(input.attempt?.started_at)}, not finished`
        : invited ? 'Test never started'
        : 'Not reached yet',
    },
    {
      key: 'application', label: 'App',
      state: appSubmitted ? 'done' : appStarted ? 'partial' : 'none',
      detail: appSubmitted ? `Submitted ${fmt(c.application_submitted_at || input.application?.submitted_at)}`
        : appStarted ? 'Started, not submitted'
        : 'Not started',
    },
    {
      key: 'documents', label: 'Docs',
      state: docsAll ? 'done' : docsHeld.length > 0 ? 'partial' : 'none',
      detail: docsAll ? 'Photo ID, CPR and TB test all on file'
        : `${docsHeld.length} of ${REQUIRED_CANDIDATE_DOC_TYPES.length} required documents on file`,
    },
    {
      key: 'cjis', label: 'CJIS',
      state: has(CJIS_DOC_TYPE) ? 'done' : 'none',
      detail: has(CJIS_DOC_TYPE) ? 'Background check on file' : 'Background check not on file',
    },
    {
      key: 'mbon', label: 'MBON',
      state: has(MBON_DOC_TYPE) ? 'done' : c.license_waived_at ? 'waived' : 'none',
      detail: has(MBON_DOC_TYPE) ? 'Licence verification on file'
        : c.license_waived_at ? `Waived ${fmt(c.license_waived_at)} — unlicensed aide`
        : 'Licence verification not on file, and not waived',
    },
    {
      key: 'accepted', label: 'Accepted',
      state: c.documents_accepted_at ? 'done' : 'none',
      detail: c.documents_accepted_at
        ? `Signed off ${fmt(c.documents_accepted_at)}`
        : 'Nobody has recorded that they reviewed the documents',
    },
    {
      key: 'contract', label: 'Contract',
      state: contractSigned ? 'done' : contractSent ? 'waiting' : 'none',
      detail: contractSigned ? `Signed ${fmt(input.contract?.signed_at)}`
        : contractSent ? `Sent ${fmt(input.contract?.sent_at)}, awaiting signature`
        : 'Not sent',
    },
    {
      key: 'approval', label: 'Approval',
      state: approvalDone ? 'done'
        : approvalReturned ? 'overdue'
        : approvalPending ? 'waiting'
        : 'none',
      detail: approvalDone ? 'Approved'
        : approvalReturned ? `Returned ${fmt(input.request?.decided_at)} — a reason is on the candidate page`
        : approvalPending ? `With an administrator since ${fmt(input.request?.requested_at)}`
        : 'Not yet requested',
    },
    {
      key: 'converted', label: 'Hired',
      state: converted ? 'done' : 'none',
      detail: converted ? 'Caregiver account created' : 'Not yet a caregiver',
    },
    {
      key: 'axiscare', label: 'AxisCare',
      state: pushed ? 'done' : converted ? 'partial' : 'none',
      detail: pushed ? `Pushed ${fmt(c.axiscare_pushed_at)}`
        : converted ? 'Converted but never pushed to AxisCare'
        : 'Not reached yet',
    },
  ]

  // ── Next action ──
  const nextAction = deriveNextAction({
    input, status, invited, testStarted, testPassed, appSubmitted,
    converted, pushed, isClosed, approvalPending, approvalReturned,
    stalled, daysSinceMovement,
  })

  return {
    id: c.id,
    firstName: c.first_name || '',
    lastName: c.last_name || '',
    email: c.email || '',
    status,
    source: c.source ?? null,
    track: c.track || 'full',
    invited,
    milestones,
    owner,
    lastMovementAt,
    daysSinceMovement,
    stalled,
    stallThresholdDays,
    nextAction,
    isComplete,
    isClosed,
  }
}

interface NextArgs {
  input: TrackRowInput
  status: string
  invited: boolean
  testStarted: boolean
  testPassed: boolean
  appSubmitted: boolean
  converted: boolean
  pushed: boolean
  isClosed: boolean
  approvalPending: boolean
  approvalReturned: boolean
  stalled: boolean
  daysSinceMovement: number
}

function deriveNextAction(a: NextArgs): string {
  const { input, status } = a

  if (a.isClosed) return 'Withdrawn — nothing further will happen'
  if (a.converted && a.pushed) return 'Complete'
  if (a.converted && !a.pushed) return 'Push to AxisCare'
  if (a.approvalPending) return `With an administrator since ${fmt(input.request?.requested_at)}`
  if (a.approvalReturned && status === 'in_review') {
    return 'Returned by an administrator — the reason is on the candidate page'
  }
  if (!a.invited) return 'Send the invite'

  if (!a.testPassed) {
    if (!a.testStarted) {
      return a.stalled
        ? `Never opened the test — invited ${plural(a.daysSinceMovement, 'day')} ago`
        : `Waiting on them — invited ${plural(a.daysSinceMovement, 'day')} ago`
    }
    return a.stalled
      ? `Part-way through the test since ${fmt(input.attempt?.started_at)}`
      : 'Taking the test'
  }

  if (!a.appSubmitted) {
    return a.stalled
      ? `Application unfinished for ${plural(a.daysSinceMovement, 'day')}`
      : 'Waiting on their application'
  }

  if (status === 'application_submitted') return 'Begin review'

  // From here the gate knows better than any status does. Reuse the evaluator
  // rather than restating its rules, so the board and the buttons agree.
  const gate = evaluateConvertGate(toGateInput(input))
  if (gate.ok) return 'Ready to send for approval'
  return gate.blockers[0].label
}

function toGateInput(input: TrackRowInput): GateInput {
  return {
    candidateId: input.candidate.id,
    candidateStatus: input.candidate.status ?? null,
    track: input.candidate.track ?? null,
    paperApplicationAt: input.candidate.paper_application_at ?? null,
    credentialType: input.application?.credential_type ?? null,
    licenseWaivedAt: input.candidate.license_waived_at ?? null,
    licenseWaiverReason: null,
    documentsAcceptedAt: input.candidate.documents_accepted_at ?? null,
    docTypes: input.docTypes,
    contractSignedAt: input.contract?.signed_at ?? null,
  }
}

// ── The batch loader ─────────────────────────────────────────────────────
/**
 * Six queries, whatever the number of candidates. Each child table is fetched
 * once for the whole set and grouped in memory, rather than four queries per
 * candidate as loadGateInput does — correct for a single record, ruinous here.
 */
export async function loadTrackBoard(): Promise<TrackRow[]> {
  const svc = createServiceClient()

  let candidates: TrackRowInput['candidate'][] = []
  try {
    const { data } = await svc
      .from('onb_candidates')
      .select('id, first_name, last_name, email, status, source, track, paper_application_at, access_token, invited_at, created_at, test_passed_at, application_submitted_at, documents_accepted_at, license_waived_at, axiscare_pushed_at, converted_to_profile_id')
      .order('created_at', { ascending: false })
    candidates = Array.isArray(data) ? (data as TrackRowInput['candidate'][]) : []
  } catch {
    return []
  }

  const ids = candidates.map((c) => c.id)
  // PostgREST rejects an empty in.() list, and there is nothing to group anyway.
  if (!ids.length) return []

  const applications = new Map<string, NonNullable<TrackRowInput['application']>>()
  try {
    const { data } = await svc
      .from('onb_applications')
      .select('candidate_id, credential_type, submitted_at, updated_at')
      .in('candidate_id', ids)
    for (const r of Array.isArray(data) ? data : []) {
      applications.set(String(r.candidate_id), {
        credential_type: r.credential_type ?? null,
        submitted_at: r.submitted_at ?? null,
        updated_at: r.updated_at ?? null,
      })
    }
  } catch { /* an absent application simply reads as not started */ }

  const attempts = new Map<string, NonNullable<TrackRowInput['attempt']>>()
  try {
    const { data } = await svc
      .from('onb_attempts')
      .select('candidate_id, first_passed, mastery_reached, started_at, completed_at')
      .in('candidate_id', ids)
      .order('created_at', { ascending: false })
    for (const r of Array.isArray(data) ? data : []) {
      const key = String(r.candidate_id)
      // Ordered newest first, so the first one seen is the one that counts.
      if (!attempts.has(key)) {
        attempts.set(key, {
          first_passed: r.first_passed ?? null,
          mastery_reached: r.mastery_reached ?? null,
          started_at: r.started_at ?? null,
          completed_at: r.completed_at ?? null,
        })
      }
    }
  } catch { /* no attempt reads as not started */ }

  const docTypes = new Map<string, string[]>()
  const docLast = new Map<string, string>()
  try {
    const { data } = await svc
      .from('onb_documents')
      .select('candidate_id, doc_type, uploaded_at')
      .in('candidate_id', ids)
    for (const r of Array.isArray(data) ? data : []) {
      const key = String(r.candidate_id)
      if (!docTypes.has(key)) docTypes.set(key, [])
      if (r.doc_type) docTypes.get(key)!.push(String(r.doc_type))
      const prev = docLast.get(key)
      if (r.uploaded_at && (!prev || ts(r.uploaded_at) > ts(prev))) docLast.set(key, r.uploaded_at)
    }
  } catch { /* an empty document list keeps the gate closed, which is the safe failure */ }

  const contracts = new Map<string, NonNullable<TrackRowInput['contract']>>()
  try {
    const { data } = await svc
      .from('onb_contracts')
      .select('candidate_id, sent_at, signed_at')
      .in('candidate_id', ids)
      .order('sent_at', { ascending: false })
    for (const r of Array.isArray(data) ? data : []) {
      const key = String(r.candidate_id)
      const existing = contracts.get(key)
      // A signed agreement always wins over a superseded unsigned one.
      if (!existing || (!existing.signed_at && r.signed_at)) {
        contracts.set(key, { sent_at: r.sent_at ?? null, signed_at: r.signed_at ?? null })
      }
    }
  } catch { /* no contract reads as not sent */ }

  const requests = new Map<string, NonNullable<TrackRowInput['request']>>()
  try {
    const { data } = await svc
      .from('onb_conversion_requests')
      .select('candidate_id, status, requested_at, decided_at')
      .in('candidate_id', ids)
      .order('requested_at', { ascending: false })
    for (const r of Array.isArray(data) ? data : []) {
      const key = String(r.candidate_id)
      if (!requests.has(key)) {
        requests.set(key, {
          status: r.status ?? null,
          requested_at: r.requested_at ?? null,
          decided_at: r.decided_at ?? null,
        })
      }
    }
  } catch { /* no request reads as not yet asked */ }

  const now = new Date()
  return candidates.map((candidate) => buildTrackRow({
    candidate,
    application: applications.get(candidate.id) ?? null,
    attempt: attempts.get(candidate.id) ?? null,
    docTypes: docTypes.get(candidate.id) ?? [],
    docLastUploadedAt: docLast.get(candidate.id) ?? null,
    contract: contracts.get(candidate.id) ?? null,
    request: requests.get(candidate.id) ?? null,
  }, now))
}

/** Headline counts for the strip above the board. */
export function summarise(rows: TrackRow[]): {
  stalled: number; withYou: number; withAdmin: number; inFlight: number
} {
  const live = rows.filter((r) => !r.isComplete && !r.isClosed)
  return {
    stalled: live.filter((r) => r.stalled).length,
    withYou: live.filter((r) => r.owner === 'staff').length,
    withAdmin: live.filter((r) => r.owner === 'admin').length,
    inFlight: live.length,
  }
}
