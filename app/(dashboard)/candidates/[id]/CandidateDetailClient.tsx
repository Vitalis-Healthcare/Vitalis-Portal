'use client'
// app/(dashboard)/candidates/[id]/CandidateDetailClient.tsx
// Staff review screen for one candidate: header + status, competency-test
// summary, read-only application read-out, document list (signed-URL view),
// and the two review actions — "Begin review" and "Request documents".
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, X, ClipboardCheck, Mail, Building2, Pencil, UserCheck, ShieldCheck, Send, Undo2, Trash2, BellRing } from 'lucide-react'
import { docTypeLabel, type DocTypeDef } from '@/lib/onboarding/documents'
import type { Blocker } from '@/lib/onboarding/gates'
import { mapApplicationReferences } from '@/lib/onboarding/application-references'
import { isAwaitingApplication } from '@/lib/onboarding/reminders'

const C = {
  navy: '#1A2E44', teal: '#0A5C5B', tealBtn: '#0E7C7B', tealSoft: '#E6F4F4',
  gray: '#4A6070', faint: '#8FA0B0', border: '#D1D9E0', line: '#EFF2F5', bg: '#F8FAFC',
  green: '#1B7A43', greenBg: '#E6F6EC', greenBorder: '#BFE6CD',
  red: '#9B3B3B', redBg: '#F4EBEB', amber: '#B26A00',
}

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  invited:               { label: 'Invited',            bg: '#FEF3E2', fg: '#B26A00' },
  testing:               { label: 'Testing',            bg: '#E7F0FF', fg: '#1A56B0' },
  test_passed:           { label: 'Test passed',        bg: '#E6F6EC', fg: '#1B7A43' },
  applying:              { label: 'Applying',           bg: '#E6F4F4', fg: '#0A5C5B' },
  application_submitted: { label: 'Application in',      bg: '#E6F4F4', fg: '#0A5C5B' },
  in_review:             { label: 'In review',          bg: '#F0E9FB', fg: '#6B3FA0' },
  awaiting_approval:     { label: 'Awaiting approval',   bg: '#FEF3E2', fg: '#B26A00' },
  axiscare_created:      { label: 'In AxisCare',         bg: '#E6F6EC', fg: '#1B7A43' },
  converted:             { label: 'Converted',          bg: '#EDF0F2', fg: '#4A6070' },
  withdrawn:             { label: 'Withdrawn',          bg: '#F4EBEB', fg: '#9B3B3B' },
}

type Candidate = {
  id: string; first_name: string; last_name: string; email: string; status: string
  track: string
  invited_at: string | null; created_at: string | null
  test_passed_at: string | null; application_submitted_at: string | null; axiscare_pushed_at: string | null
  axiscare_applicant_id: number | null
  axiscare_login_sent_at: string | null
  converted_to_profile_id: string | null
  documents_accepted_at: string | null
  documents_accepted_by: string | null
  documents_accepted_note: string | null
  paper_application_at: string | null
  paper_application_by: string | null
  paper_application_note: string | null
}
type ConversionRequest = {
  id: string
  status: string
  requested_by: string | null
  requested_at: string | null
  requested_note: string | null
  decided_by: string | null
  decided_at: string | null
  decision_note: string | null
}
type AppRow = Record<string, unknown> | null
type DocRow = {
  id: string; doc_type: string; file_name: string; storage_path: string
  mime_type: string | null; size_bytes: number | null; uploaded_at: string
}
type Attempt = {
  first_score: number | null; first_total: number | null
  first_passed: boolean | null; mastery_reached: boolean | null; completed_at: string | null
} | null

// reminder_number 0 with kind 'manual' is a coordinator nudge; 1 and 2 are the
// automatic cadence and are capped by a unique index in the database.
type ReminderRow = {
  id: string
  reminder_number: number
  kind: string
  sent_at: string
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function str(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}
function yesNo(v: unknown): string {
  if (v === true) return 'Yes'
  if (v === false) return 'No'
  return '—'
}
function fmtSize(n: number | null): string {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function Badge({ status }: { status: string }) {
  const m = STATUS_META[status] || { label: status, bg: '#EDF0F2', fg: '#4A6070' }
  return <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: m.bg, color: m.fg, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{m.label}</span>
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid #E2E8F0`, borderRadius: 14, padding: '20px 22px', marginTop: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: C.teal, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</h3>
      {children}
    </div>
  )
}

function Readout({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px 24px' }}>
      {rows.map(([label, value], i) => (
        <div key={`${label}-${i}`}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 14, color: C.navy, lineHeight: 1.5, wordBreak: 'break-word' }}>{value}</div>
        </div>
      ))}
    </div>
  )
}

function ItemBlock({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.teal, marginBottom: 8 }}>{title}</div>
      <Readout rows={rows} />
    </div>
  )
}

// SSN is shown masked (last 4 only) on the staff screen, even though the full
// value is stored server-side and pushed to AxisCare.
function maskSsn(v: unknown): string {
  const digits = (v == null ? '' : String(v)).replace(/\D/g, '')
  if (!digits) return '—'
  return `•••-••-${digits.slice(-4)}`
}
function asArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : []
}
function listStr(v: unknown): string {
  if (Array.isArray(v) && v.length) return v.map((x) => String(x)).join(', ')
  return '—'
}
const DAY_LABELS: [string, string][] = [
  ['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun'],
]
function availDays(v: unknown): string {
  if (!v || typeof v !== 'object') return '—'
  const o = v as Record<string, unknown>
  const parts = DAY_LABELS.filter(([k]) => o[k]).map(([k, l]) => `${l}: ${String(o[k])}`)
  return parts.length ? parts.join(' · ') : '—'
}

export default function CandidateDetailClient({
  candidate, application, documents, attempt, docTypes, reminders = [],
  viewerRole = 'staff', pendingRequest = null, lastReturned = null, actorNames = {},
}: {
  candidate: Candidate
  application: AppRow
  documents: DocRow[]
  attempt: Attempt
  docTypes: DocTypeDef[]
  reminders?: ReminderRow[]
  viewerRole?: string
  pendingRequest?: ConversionRequest | null
  lastReturned?: ConversionRequest | null
  actorNames?: Record<string, string>
}) {
  const router = useRouter()
  const a = application || {}
  const [status, setStatus] = useState(candidate.status)
  const [axiscareId, setAxiscareId] = useState<number | null>(candidate.axiscare_applicant_id)
  const [loginSentAt, setLoginSentAt] = useState<string | null>(candidate.axiscare_login_sent_at)
  const [convertedId, setConvertedId] = useState<string | null>(candidate.converted_to_profile_id)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null)
  const [blockers, setBlockers] = useState<Blocker[]>([])
  const [showReqModal, setShowReqModal] = useState(false)
  const [reqKeys, setReqKeys] = useState<string[]>([])
  const [reqNote, setReqNote] = useState('')
  // Reference SLOTS (1-3) the candidate must re-supply contact details for.
  const [reqRefs, setReqRefs] = useState<number[]>([])
  const [docsAcceptedAt, setDocsAcceptedAt] = useState<string | null>(candidate.documents_accepted_at)
  const [docsAcceptedNote, setDocsAcceptedNote] = useState<string | null>(candidate.documents_accepted_note)
  const [track, setTrack] = useState<string>(candidate.track || 'full')
  const [paperAt, setPaperAt] = useState<string | null>(candidate.paper_application_at)
  const [paperNote, setPaperNote] = useState<string | null>(candidate.paper_application_note)
  const [paperOpen, setPaperOpen] = useState(false)
  const [paperDraft, setPaperDraft] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [reminderSending, setReminderSending] = useState(false)
  const [reminderCount, setReminderCount] = useState(reminders.length)
  const [lastReminderAt, setLastReminderAt] = useState<string | null>(reminders[0]?.sent_at || null)
  const [contactFirst, setContactFirst] = useState(candidate.first_name)
  const [contactLast, setContactLast] = useState(candidate.last_name)
  const [contactEmail, setContactEmail] = useState(candidate.email)
  const [editOpen, setEditOpen] = useState(false)
  const [editFirst, setEditFirst] = useState(candidate.first_name)
  const [editLast, setEditLast] = useState(candidate.last_name)
  const [editEmail, setEditEmail] = useState(candidate.email)
  const [editResend, setEditResend] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [acceptNote, setAcceptNote] = useState('')
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnNote, setReturnNote] = useState('')

  const isAdmin = viewerRole === 'admin'
  const awaiting = status === 'awaiting_approval'
  const who = (id: string | null | undefined) => (id && actorNames[id]) || 'a colleague'

  // The three referees off the application, one entry per slot.
  const appRefs = mapApplicationReferences(a.applicant_references)

  // The competency test can be (re)sent on any track until it is completed —
  // deferred testing is the point of the application-only track.
  const testDone = !!attempt && (!!attempt.first_passed || !!attempt.mastery_reached)
  const canSendTest = !testDone && !convertedId && status !== 'withdrawn' && status !== 'converted'
  // Exactly the arbiter the route and the scheduler use — page and server can
  // never disagree about who is waiting on an application.
  const canSendReminder = isAwaitingApplication(status, track) && !convertedId
  const canRecordPaper = track === 'documents_only' && !paperAt && !convertedId && status !== 'withdrawn'
  const canEditContact = !convertedId && status !== 'converted'
  const canDelete = (viewerRole === 'admin' || viewerRole === 'supervisor') && !convertedId && status !== 'converted'
  const editEmailChanged = editEmail.trim().toLowerCase() !== contactEmail.trim().toLowerCase()
  const deleteConfirmed = deleteConfirmText.trim().toLowerCase() === contactFirst.trim().toLowerCase()

  const canBeginReview = status === 'application_submitted'
  const canRequestDocs = status === 'application_submitted' || status === 'in_review'
  // Same signal the route enforces (v0.6.59): AxisCare comes AFTER conversion.
  // If page and route disagreed here, staff would see a live button and be
  // refused by the server.
  const canPushAxiscare = !axiscareId && status === 'converted'
  const canEdit = !!application && (status === 'application_submitted' || status === 'in_review')
  // An admin converts directly; everyone else raises a request for an admin to
  // decide. Both run the same gate, so neither is a shortcut past credentialing.
  const canConvert = isAdmin && !convertedId && (status === 'in_review' || status === 'axiscare_created')
  const canRequestApproval = !isAdmin && !convertedId && (status === 'in_review' || status === 'axiscare_created')

  async function saveContact() {
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_contact',
          first_name: editFirst.trim(), last_name: editLast.trim(), email: editEmail.trim(),
          resend: editEmailChanged && editResend,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not save the changes.' }); return }
      setContactFirst(data.first_name); setContactLast(data.last_name); setContactEmail(data.email)
      setEditOpen(false)
      setBanner(data.emailChanged
        ? (data.emailed
            ? { kind: 'ok', text: `Contact updated. The old emailed links no longer work; a fresh invite went to ${data.email}.` }
            : { kind: 'ok', text: `Contact updated. The old emailed links no longer work — use Invite on the candidates list when you are ready to email ${data.email}.` })
        : { kind: 'ok', text: 'Contact details updated.' })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function deleteCandidate() {
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not delete the candidate.' }); setBusy(false); return }
      router.push('/candidates')
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
      setBusy(false)
    }
  }

  async function changeTrack(next: string) {
    if (next === track) return
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_track', track: next }),
      })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not change the track.' }); return }
      setTrack(data.track)
      setBanner({ kind: 'ok', text: 'Onboarding track updated. Invite emails and candidate pages follow the new track from now on.' })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function recordPaperApplication() {
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'record_paper_application', note: paperDraft.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not record the paper application.' }); return }
      setPaperAt(data.paper_application_at)
      setPaperNote(data.note)
      if (data.status) setStatus(data.status)
      setPaperOpen(false); setPaperDraft('')
      setBanner({ kind: 'ok', text: 'Paper application recorded. It now stands in for a submitted online application.' })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function sendReminder() {
    setReminderSending(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/reminder`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not send the reminder.' }); return }
      setReminderCount((n) => n + 1)
      setLastReminderAt(data.sent_at as string)
      setBanner({ kind: 'ok', text: `Application reminder emailed to ${data.email}. It carries a fresh link and a way for them to tell us they are not interested.` })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setReminderSending(false)
    }
  }

  async function sendTest() {
    setTestSending(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_test' }),
      })
      const data = await res.json()
      setBanner(res.ok && data.emailed
        ? { kind: 'ok', text: `Competency test link emailed to ${candidate.email}. It replaces any older emailed links.` }
        : { kind: 'warn', text: data.error || 'Could not send the test link.' })
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setTestSending(false)
    }
  }

  async function beginReview() {
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'begin_review' }),
      })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not start review.' }); return }
      setStatus('in_review')
      setBanner({ kind: 'ok', text: 'This candidate is now marked In review.' })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setBusy(false)
    }
  }

  // The AxisCare sign-in instructions. Only meaningful once the caregiver
  // account exists AND the AxisCare profile exists — the route enforces both.
  async function sendAxisCareLogin() {
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/axiscare-login`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not send the AxisCare instructions.' }); return }
      setLoginSentAt(data.sent_at as string)
      setBanner({
        kind: 'ok',
        text: data.warning
          ? `AxisCare instructions sent to ${data.email}. ${data.warning}`
          : `AxisCare sign-in instructions sent to ${data.email}.`,
      })
    } catch {
      setBanner({ kind: 'warn', text: 'Could not send the AxisCare instructions.' })
    } finally { setBusy(false) }
  }

  async function pushAxisCare() {
    setBusy(true); setBanner(null); setBlockers([])
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/axiscare`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        // The route now refuses an unconverted candidate with the same
        // { error, blockers:[…] } shape the convert route uses. Render them.
        const list: Blocker[] = Array.isArray(data.blockers) ? data.blockers : []
        setBlockers(list)
        setBanner({ kind: 'warn', text: data.error || 'Could not push to AxisCare.' })
        return
      }
      const newId = data.axiscare_applicant_id as number
      setAxiscareId(newId)
      // No status write here. The candidate is already 'converted' — that is
      // the only status this route accepts — and setting 'axiscare_created'
      // would show a caregiver as having moved backward.
      const base = data.already ? `Already in AxisCare (applicant #${newId}).` : `Pushed to AxisCare — applicant #${newId} created.`
      if (!data.already && data.note_posted === false) {
        setBanner({ kind: 'warn', text: `${base} Note: the "Pushed from Vita" details note could not be added in AxisCare — you may need to add it manually.` })
      } else {
        setBanner({ kind: 'ok', text: data.already ? base : `${base} Application details were added as a "Pushed from Vita" note.` })
      }
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function convertToCaregiver() {
    setBusy(true); setBanner(null); setBlockers([])
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/convert`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        // The convert route returns { error, code:'gate_blocked', blockers:[…] }.
        // Showing only `error` is what made a working gate look like a broken
        // button — the coordinator was told no, and never told why (pitfall #42).
        const list: Blocker[] = Array.isArray(data.blockers) ? data.blockers : []
        setBlockers(list)
        setBanner({
          kind: 'warn',
          text: list.length
            ? 'This candidate is not ready to be converted. What is outstanding is listed below.'
            : (data.error || 'Could not convert this candidate.'),
        })
        return
      }
      setConvertedId(data.profile_id as string)
      setStatus('converted')
      const linked = data.outcome === 'linked_existing'
      setBanner({
        kind: 'ok',
        text: linked
          ? 'Linked to the existing portal account. The candidate is now a caregiver.'
          : data.emailed
            ? 'Converted to caregiver. A welcome email with a password link was sent.'
            : 'Converted to caregiver. The account was created, but the welcome email did not send — they can use “Forgot password?” on the login page.',
      })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function requestApproval() {
    setBusy(true); setBanner(null); setBlockers([])
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/conversion-request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: '' }),
      })
      const data = await res.json()
      if (!res.ok) {
        const list: Blocker[] = Array.isArray(data.blockers) ? data.blockers : []
        setBlockers(list)
        setBanner({
          kind: 'warn',
          text: list.length
            ? 'This candidate is not ready to be sent for approval. What is outstanding is listed below.'
            : (data.error || 'Could not raise the request.'),
        })
        return
      }
      setStatus('awaiting_approval')
      setBanner(data.emailed
        ? { kind: 'ok', text: `Sent for approval. ${(data.notified || []).length} administrator(s) have been emailed.` }
        : { kind: 'warn', text: `Sent for approval, but the notification email did not go out. ${data.email_error || ''} Tell an administrator directly.`.trim() })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally { setBusy(false) }
  }

  async function decideRequest(decision: 'approve' | 'return') {
    setBusy(true); setBanner(null); setBlockers([])
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/conversion-request`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note: decision === 'return' ? returnNote.trim() : '' }),
      })
      const data = await res.json()
      if (!res.ok) {
        const list: Blocker[] = Array.isArray(data.blockers) ? data.blockers : []
        setBlockers(list)
        setBanner({ kind: 'warn', text: list.length ? 'This candidate is no longer ready. See below.' : (data.error || 'Could not record that decision.') })
        return
      }
      if (decision === 'return') {
        setStatus('in_review'); setReturnOpen(false); setReturnNote('')
        setBanner(data.emailed
          ? { kind: 'ok', text: 'Returned to the coordinator, and your reason has been emailed to them.' }
          : { kind: 'warn', text: `Returned, but the email did not reach the coordinator. ${data.email_error || ''} Your reason is on this page, so tell them to look here.`.trim() })
      } else {
        setConvertedId((data.profile_id as string) || null)
        setStatus('converted')
        setBanner(data.requester_emailed === false
          ? { kind: 'warn', text: `Approved and the caregiver account was created, but the coordinator could not be emailed. ${data.requester_email_error || ''}`.trim() }
          : { kind: 'ok', text: 'Approved. The caregiver account has been created and the coordinator has been told.' })
      }
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally { setBusy(false) }
  }

  async function withdrawRequest() {
    if (!confirm('Withdraw this approval request and return the candidate to In review?')) return
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/conversion-request`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not withdraw that.' }); return }
      setStatus('in_review')
      setBanner({ kind: 'ok', text: 'Request withdrawn.' })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally { setBusy(false) }
  }

  function toggleReq(key: string) {
    setReqKeys((k) => k.includes(key) ? k.filter((x) => x !== key) : [...k, key])
  }

  async function acceptDocuments() {
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/documents-accepted`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: acceptNote.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not record that.' }); return }
      setDocsAcceptedAt(data.accepted_at as string)
      setDocsAcceptedNote(acceptNote.trim() || null)
      setAcceptOpen(false); setAcceptNote('')
      setBanner({ kind: 'ok', text: 'Documents recorded as reviewed and accepted.' })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function withdrawAcceptance() {
    if (!confirm('Withdraw your acceptance of these documents? This recloses the gate until you accept again.')) return
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/documents-accepted`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not withdraw that.' }); return }
      setDocsAcceptedAt(null); setDocsAcceptedNote(null)
      setBanner({ kind: 'ok', text: 'Acceptance withdrawn.' })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setBusy(false)
    }
  }

  function toggleReqRef(slot: number) {
    setReqRefs((s) => s.includes(slot) ? s.filter((x) => x !== slot) : [...s, slot])
  }

  async function submitRequest() {
    if (reqKeys.length === 0 && reqRefs.length === 0) {
      setBanner({ kind: 'warn', text: 'Select at least one document or reference to request.' })
      return
    }
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_documents', doc_keys: reqKeys, reference_slots: reqRefs, note: reqNote.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not send the request.' }); setBusy(false); return }
      setShowReqModal(false); setReqKeys([]); setReqRefs([]); setReqNote('')
      // The server clears the sign-off when it reopens the application; reflect
      // that here so the panel does not keep claiming an acceptance that has
      // just been invalidated.
      setDocsAcceptedAt(null); setDocsAcceptedNote(null)
      setStatus('applying')
      setBanner(data.emailed
        ? { kind: 'ok', text: `Request sent to ${candidate.email}. The application is reopened for them to add documents.` }
        : { kind: 'warn', text: 'Status updated, but the email did not send. Please contact the candidate directly.' })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setBusy(false)
    }
  }

  const testLine = attempt
    ? (attempt.first_passed
        ? `Passed on first attempt — ${str(attempt.first_score)} / ${str(attempt.first_total)}`
        : attempt.mastery_reached
          ? `Completed via mastery — first attempt ${str(attempt.first_score)} / ${str(attempt.first_total)}`
          : `In progress — first attempt ${str(attempt.first_score)} / ${str(attempt.first_total)}`)
    : 'No test attempt on record yet.'

  const hasApp = !!application

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1040, margin: '0 auto' }}>
      <Link href="/candidates" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.gray, fontSize: 13.5, fontWeight: 600, textDecoration: 'none', marginBottom: 14 }}>
        <ArrowLeft size={15} /> Back to candidates
      </Link>

      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '22px 24px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: C.navy, margin: 0 }}>{contactFirst} {contactLast}</h1>
            <Badge status={status} />
            <select
              value={track}
              onChange={(e) => changeTrack(e.target.value)}
              disabled={busy || !!convertedId}
              title="Onboarding track. Switching changes which page the candidate's invite links open."
              style={{
                padding: '4px 8px', borderRadius: 999, border: `1px solid ${C.border}`,
                background: '#FDF2E5', color: '#A05A17', fontSize: 12, fontWeight: 700, cursor: convertedId ? 'default' : 'pointer',
              }}>
              <option value="full">Full onboarding</option>
              <option value="application_only">Application only</option>
              <option value="documents_only">Documents only</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.gray, fontSize: 14, marginTop: 6 }}>
            <span>{contactEmail}</span>
            {canEditContact && (
              <button
                onClick={() => { setEditFirst(contactFirst); setEditLast(contactLast); setEditEmail(contactEmail); setEditResend(true); setEditOpen(true); setBanner(null) }}
                title="Edit this candidate's name or email"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 7, color: C.teal, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Pencil size={11} /> Edit
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', fontSize: 13 }}>
          <div><div style={{ color: C.faint, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Invited</div><div style={{ color: C.navy }}>{fmtDate(candidate.invited_at)}</div></div>
          <div><div style={{ color: C.faint, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Test passed</div><div style={{ color: C.navy }}>{fmtDate(candidate.test_passed_at)}</div></div>
          <div><div style={{ color: C.faint, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Submitted</div><div style={{ color: C.navy }}>{fmtDate(candidate.application_submitted_at)}</div></div>
        </div>
      </div>

      {banner && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 0', padding: '12px 16px', borderRadius: 10, fontSize: 14,
          background: banner.kind === 'ok' ? C.greenBg : '#FEF3E2', color: banner.kind === 'ok' ? C.green : C.amber,
          border: `1px solid ${banner.kind === 'ok' ? C.greenBorder : '#F4D9A8'}`,
        }}>
          {banner.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}<span>{banner.text}</span>
        </div>
      )}

      {blockers.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '18px 22px', marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
            Conversion is blocked until credentialing is complete
          </div>
          <div style={{ fontSize: 12.5, color: '#A16207', marginBottom: 14, lineHeight: 1.6 }}>
            {blockers.length === 1 ? 'One thing is outstanding:' : `${blockers.length} things are outstanding:`}
          </div>
          {blockers.map((b) => (
            <div key={b.code} style={{ background: '#fff', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 15px', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{b.label}</div>
              <div style={{ fontSize: 12.5, color: C.gray, lineHeight: 1.65 }}>{b.detail}</div>
              {b.fixHref && (
                <Link href={b.fixHref} style={{ display: 'inline-block', marginTop: 9, fontSize: 12.5, color: C.teal, textDecoration: 'none', fontWeight: 600 }}>
                  {b.fixLabel || 'Fix this'} &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {awaiting && pendingRequest && (
        <div style={{ background: '#FEF3E2', border: '1px solid #F4D9A8', borderRadius: 12, padding: '18px 22px', marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.amber, marginBottom: 5 }}>
            {isAdmin ? 'Waiting on your decision' : 'Sent for approval'}
          </div>
          <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.65 }}>
            Requested by {who(pendingRequest.requested_by)} on {fmtDate(pendingRequest.requested_at)}.
            {!isAdmin && ' An administrator will approve it or send it back with a reason.'}
          </div>
          {pendingRequest.requested_note && (
            <div style={{ fontSize: 12.5, color: C.gray, marginTop: 8, fontStyle: 'italic' }}>{pendingRequest.requested_note}</div>
          )}

          {isAdmin && !returnOpen && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button onClick={() => decideRequest('approve')} disabled={busy}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#1B7A43,#2E9B5B)', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
                <UserCheck size={16} /> Approve and convert
              </button>
              <button onClick={() => setReturnOpen(true)} disabled={busy}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9, background: '#fff', border: `1px solid ${C.border}`, color: C.navy, fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>
                <Undo2 size={16} /> Return to coordinator
              </button>
            </div>
          )}

          {isAdmin && returnOpen && (
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.gray, marginBottom: 6 }}>
                Why are you returning this?
              </label>
              <textarea value={returnNote} onChange={(e) => setReturnNote(e.target.value)}
                placeholder="e.g. The TB result is from 2023 — please get a current one before resubmitting."
                style={{ width: '100%', minHeight: 68, padding: '10px 12px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13.5, color: C.navy, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => decideRequest('return')} disabled={busy || returnNote.trim().length < 5}
                  style={{ padding: '9px 20px', borderRadius: 8, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, background: returnNote.trim().length >= 5 ? C.tealBtn : '#B9C4B4', cursor: returnNote.trim().length >= 5 && !busy ? 'pointer' : 'not-allowed' }}>
                  {busy ? 'Sending…' : 'Send it back'}
                </button>
                <button onClick={() => { setReturnOpen(false); setReturnNote('') }}
                  style={{ padding: '9px 18px', borderRadius: 8, background: '#fff', border: `1px solid ${C.border}`, color: C.gray, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!isAdmin && (
            <button onClick={withdrawRequest} disabled={busy}
              style={{ marginTop: 12, padding: '7px 16px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, color: C.gray, fontSize: 12.5, fontWeight: 600, cursor: busy ? 'default' : 'pointer' }}>
              Withdraw request
            </button>
          )}
        </div>
      )}

      {!awaiting && !convertedId && lastReturned && (
        <div style={{ background: '#F4EBEB', border: '1px solid #E3C9C9', borderRadius: 12, padding: '16px 20px', marginTop: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.red, marginBottom: 5 }}>
            Returned by {who(lastReturned.decided_by)} on {fmtDate(lastReturned.decided_at)}
          </div>
          <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.65 }}>{lastReturned.decision_note}</div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
        <button onClick={beginReview} disabled={!canBeginReview || busy}
          title={canBeginReview ? 'Mark this candidate In review' : 'Available once the application is submitted'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            border: 'none', color: '#fff', cursor: canBeginReview && !busy ? 'pointer' : 'default',
            background: 'linear-gradient(135deg,#0E7C7B,#1A9B87)', opacity: canBeginReview && !busy ? 1 : 0.5,
          }}>
          <ClipboardCheck size={16} /> Begin review
        </button>
        <button onClick={() => { setShowReqModal(true); setBanner(null) }} disabled={!canRequestDocs || busy}
          title={canRequestDocs ? 'Send the candidate back to add documents' : 'Available after the application is submitted'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: '#fff', border: `1px solid ${C.border}`, color: C.teal,
            cursor: canRequestDocs && !busy ? 'pointer' : 'default', opacity: canRequestDocs && !busy ? 1 : 0.5,
          }}>
          <Mail size={16} /> Request documents
        </button>
        {canSendReminder && (
          <button onClick={sendReminder} disabled={busy || reminderSending}
            title={reminderCount > 0
              ? `${reminderCount} reminder${reminderCount === 1 ? '' : 's'} already sent — most recently ${fmtDate(lastReminderAt)}. Sending another emails a fresh link.`
              : 'Email a nudge to finish the application, with a fresh link and a way to tell us they are not interested.'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: '#fff', border: `1px solid ${C.border}`, color: C.teal,
              cursor: busy || reminderSending ? 'default' : 'pointer', opacity: busy || reminderSending ? 0.6 : 1,
            }}>
            <BellRing size={16} />
            {reminderSending
              ? 'Sending…'
              : reminderCount > 0 ? `Remind again (${reminderCount} sent)` : 'Send application reminder'}
          </button>
        )}
        {canSendTest && (
          <button onClick={sendTest} disabled={busy || testSending}
            title="Email the competency-test link. It replaces any older emailed links for this candidate."
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: '#fff', border: `1px solid ${C.border}`, color: C.teal,
              cursor: busy || testSending ? 'default' : 'pointer', opacity: busy || testSending ? 0.6 : 1,
            }}>
            <Send size={16} /> {testSending ? 'Sending…' : 'Send test'}
          </button>
        )}
        {canRecordPaper && (
          <button onClick={() => { setPaperOpen((v) => !v); setBanner(null) }} disabled={busy}
            title="Record that a paper (or prior AxisCare) application is on file — it stands in for a submitted online application"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: '#fff', border: `1px solid ${C.border}`, color: C.navy,
              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1,
            }}>
            <FileText size={16} /> Record paper application
          </button>
        )}
        <Link href={`/candidates/${candidate.id}/credentials`}
          title="Upload the CJIS background check and MBON license verification"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: '#fff', border: `1px solid ${C.border}`, color: C.navy, textDecoration: 'none',
          }}>
          <ShieldCheck size={16} /> Credentials
        </Link>
        {axiscareId ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}` }}>
            <CheckCircle2 size={16} /> In AxisCare · #{axiscareId}
          </span>
        ) : (
          <button onClick={pushAxisCare} disabled={!canPushAxiscare || busy}
            title={canPushAxiscare ? 'Create this applicant in AxisCare' : 'Available after this candidate is converted to a caregiver'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: '#fff', border: `1px solid ${C.border}`, color: C.navy,
              cursor: canPushAxiscare && !busy ? 'pointer' : 'default', opacity: canPushAxiscare && !busy ? 1 : 0.5,
            }}>
            <Building2 size={16} /> Push to AxisCare
          </button>
        )}
        {convertedId && axiscareId && (
          <button onClick={sendAxisCareLogin} disabled={busy}
            title={loginSentAt ? 'Send the AxisCare sign-in instructions again' : 'Email this caregiver their AxisCare sign-in instructions'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: '#fff', border: `1px solid ${loginSentAt ? C.greenBorder : C.border}`,
              color: loginSentAt ? C.green : C.navy,
              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
            }}>
            <Mail size={16} /> {loginSentAt ? 'Resend AxisCare login' : 'Send AxisCare login'}
          </button>
        )}
        {canEdit && (
          <Link href={`/candidates/${candidate.id}/edit`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#fff', border: `1px solid ${C.border}`, color: C.navy, textDecoration: 'none' }}>
            <Pencil size={16} /> Edit application
          </Link>
        )}
        {convertedId ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}` }}>
            <UserCheck size={16} /> Converted to caregiver
          </span>
        ) : canRequestApproval ? (
          <button onClick={requestApproval} disabled={busy}
            title="Send this candidate to an administrator to approve"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', color: '#fff', cursor: busy ? 'default' : 'pointer', background: 'linear-gradient(135deg,#0E7C7B,#1A9B87)', opacity: busy ? 0.6 : 1 }}>
            <Send size={16} /> Request approval
          </button>
        ) : canConvert ? (
          <button onClick={convertToCaregiver} disabled={busy}
            title="Create a caregiver portal account for this candidate"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', color: '#fff', cursor: busy ? 'default' : 'pointer', background: 'linear-gradient(135deg,#1B7A43,#2E9B5B)', opacity: busy ? 0.6 : 1 }}>
            <UserCheck size={16} /> Convert to caregiver
          </button>
        ) : null}
        {canDelete && (
          <button onClick={() => { setDeleteConfirmText(''); setDeleteOpen(true); setBanner(null) }} disabled={busy}
            title="Delete this candidate and everything attached to them. This cannot be undone."
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#fff', border: '1px solid #E3C9C9', color: C.red, cursor: busy ? 'default' : 'pointer' }}>
            <Trash2 size={15} /> Delete
          </button>
        )}
      </div>

      {editOpen && (
        <div onClick={() => !busy && setEditOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(16,30,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 20px 50px rgba(16,30,48,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: 0 }}>Edit candidate</h2>
              <button onClick={() => !busy && setEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.faint }}><X size={20} /></button>
            </div>
            <div style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray, marginBottom: 6 }}>First name</label>
                  <input value={editFirst} onChange={(e) => setEditFirst(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray, marginBottom: 6 }}>Last name</label>
                  <input value={editLast} onChange={(e) => setEditLast(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray, marginBottom: 6 }}>Email</label>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              {editEmailChanged && (
                <div style={{ background: '#FEF3E2', border: '1px solid #F4D9A8', borderRadius: 9, padding: '11px 14px', marginBottom: 4 }}>
                  <div style={{ fontSize: 12.5, color: '#B26A00', lineHeight: 1.6, marginBottom: 8 }}>
                    Changing the email revokes every link that was emailed before — whoever received them
                    loses access the moment you save.
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: C.gray, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editResend} onChange={(e) => setEditResend(e.target.checked)} style={{ marginTop: 2 }} />
                    <span>Email a fresh invite to the new address now</span>
                  </label>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #EFF2F5', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => !busy && setEditOpen(false)}
                style={{ padding: '10px 18px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 9, color: C.gray, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveContact} disabled={busy}
                style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#0E7C7B,#1A9B87)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div onClick={() => !busy && setDeleteOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(16,30,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, boxShadow: '0 20px 50px rgba(16,30,48,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: C.red, margin: 0 }}>Delete this candidate?</h2>
              <button onClick={() => !busy && setDeleteOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.faint }}><X size={20} /></button>
            </div>
            <div style={{ padding: '22px 24px' }}>
              <p style={{ fontSize: 13.5, color: C.gray, lineHeight: 1.7, margin: '0 0 12px' }}>
                This permanently removes <strong>{contactFirst} {contactLast}</strong> and everything attached
                to them — test attempt and certificate, application, uploaded documents and their files,
                agreements, and approval history. <strong>It cannot be undone.</strong>
              </p>
              <p style={{ fontSize: 12.5, color: C.faint, lineHeight: 1.65, margin: '0 0 16px' }}>
                For a candidate who simply stepped away, prefer leaving the record in place — delete is for
                records created by mistake.
              </p>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 6 }}>
                Type the candidate&rsquo;s first name ({contactFirst}) to confirm
              </label>
              <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #EFF2F5', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => !busy && setDeleteOpen(false)}
                style={{ padding: '10px 18px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 9, color: C.gray, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={deleteCandidate} disabled={busy || !deleteConfirmed}
                style={{ padding: '10px 22px', background: deleteConfirmed ? '#9B3B3B' : '#D8B9B9', border: 'none', borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 700, cursor: deleteConfirmed && !busy ? 'pointer' : 'not-allowed' }}>
                {busy ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {paperOpen && canRecordPaper && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 22px', marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 5 }}>Record the paper application</div>
          <div style={{ fontSize: 12.5, color: C.gray, lineHeight: 1.65, marginBottom: 10 }}>
            Say where the application lives, so anyone reading this record later can find it. This stands in
            for a submitted online application and moves the candidate to In review.
          </div>
          <textarea value={paperDraft} onChange={(e) => setPaperDraft(e.target.value)}
            placeholder='e.g. "Paper application filed at the Silver Spring office, July 2026" or "Completed the AxisCare application in 2024 — applicant #1234"'
            style={{ width: '100%', minHeight: 64, padding: '10px 12px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13.5, color: C.navy, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={recordPaperApplication} disabled={busy || paperDraft.trim().length < 5}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, background: paperDraft.trim().length >= 5 ? 'linear-gradient(135deg,#0E7C7B,#1A9B87)' : '#B9C4B4', cursor: paperDraft.trim().length >= 5 && !busy ? 'pointer' : 'not-allowed' }}>
              {busy ? 'Saving…' : 'Record on file'}
            </button>
            <button onClick={() => { setPaperOpen(false); setPaperDraft('') }}
              style={{ padding: '9px 18px', borderRadius: 8, background: '#fff', border: `1px solid ${C.border}`, color: C.gray, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Competency test */}
      <Card title="Competency test">
        <div style={{ fontSize: 14, color: C.navy }}>{testLine}</div>
        {attempt?.completed_at && <div style={{ fontSize: 13, color: C.faint, marginTop: 4 }}>Completed {fmtDate(attempt.completed_at)}</div>}
      </Card>

      {/* Application */}
      {!hasApp ? (
        <Card title="Application">
          {paperAt ? (
            <>
              <div style={{ fontSize: 14, color: C.navy, fontWeight: 700 }}>
                Paper application on file — recorded {fmtDate(paperAt)}{candidate.paper_application_by ? ` by ${who(candidate.paper_application_by)}` : ''}
              </div>
              {paperNote && <div style={{ fontSize: 13.5, color: C.gray, marginTop: 6, lineHeight: 1.65 }}>{paperNote}</div>}
            </>
          ) : track === 'documents_only' ? (
            <div style={{ fontSize: 14, color: C.faint }}>
              Documents-only track: there is no online application to wait for. Use &ldquo;Record paper
              application&rdquo; above once the paper (or prior AxisCare) application is confirmed on file.
            </div>
          ) : (
            <div style={{ fontSize: 14, color: C.faint }}>No application on file yet. The candidate has not started or saved their application.</div>
          )}
        </Card>
      ) : (
        <>
          <Card title="Personal details">
            <Readout rows={[
              ['Legal name', `${str(a.legal_first_name)} ${a.middle_name ? str(a.middle_name) + ' ' : ''}${str(a.legal_last_name)}`.trim()],
              ['Preferred name', str(a.preferred_name)],
              ['Date of birth', fmtDate(a.date_of_birth as string)],
              ['Gender', str(a.gender)],
              ['Mobile phone', str(a.phone)],
              ['Home phone', str(a.home_phone)],
              ['Email', str(a.email)],
              ['Social Security #', maskSsn(a.ssn)],
              ['Address', [a.address_street, a.address_unit, a.address_city, a.address_state, a.address_zip].filter(Boolean).join(', ') || '—'],
            ]} />
          </Card>
          <Card title="Driver's license">
            <Readout rows={[
              ['Has license', yesNo(a.driver_license_received)],
              ['License number', str(a.driver_license_number)],
              ['Issuing state', str(a.driver_license_state)],
            ]} />
          </Card>
          <Card title="Work eligibility">
            <Readout rows={[
              ['18 or older', yesNo(a.is_18_or_older)],
              ['Authorized to work in U.S.', yesNo(a.work_authorized)],
              ['Requires sponsorship', yesNo(a.requires_sponsorship)],
              ['Reliable transportation', yesNo(a.has_transportation)],
            ]} />
          </Card>
          <Card title="Professional background">
            <Readout rows={[
              ['Primary credential', str(a.credential_type)],
              ['License / cert #', str(a.license_number)],
              ['Years of experience', str(a.years_experience)],
              ['Languages', str(a.languages)],
            ]} />
          </Card>
          <Card title="Previous care experience">
            {asArray(a.work_experience).length === 0 ? (
              <div style={{ fontSize: 14, color: C.faint }}>None provided.</div>
            ) : asArray(a.work_experience).map((e, i) => (
              <ItemBlock key={i} title={`Experience ${i + 1}`} rows={[
                ['Organization', str(e.organization)],
                ['Dates worked', str(e.dates_worked)],
                ['Contact person', str(e.contact_person)],
                ['Telephone', str(e.telephone)],
                ['May contact?', yesNo(e.may_contact)],
              ]} />
            ))}
          </Card>
          <Card title="References">
            {asArray(a.applicant_references).length === 0 ? (
              <div style={{ fontSize: 14, color: C.faint }}>None provided.</div>
            ) : asArray(a.applicant_references).map((r, i) => (
              <ItemBlock key={i} title={String(r.kind) === 'character' ? 'Character reference' : 'Professional reference'} rows={[
                ['Name', str(r.name)],
                ['Position / title', str(r.title)],
                ['Email', str(r.email)],
                ['Telephone', str(r.phone)],
                ['Dates known', str(r.dates_known)],
              ]} />
            ))}
          </Card>
          <Card title="Emergency contacts">
            {asArray(a.emergency_contacts).length === 0 ? (
              <div style={{ fontSize: 14, color: C.faint }}>None provided.</div>
            ) : asArray(a.emergency_contacts).map((c, i) => (
              <ItemBlock key={i} title={`Contact ${i + 1}`} rows={[
                ['Name', str(c.name)],
                ['Relationship', str(c.relationship)],
                ['Phone', str(c.phone)],
                ['Phone type', str(c.phone_type)],
              ]} />
            ))}
          </Card>
          <Card title="Skills & preferences">
            <Readout rows={[['Willing to work with', listStr(a.willing_to_work_with)]]} />
          </Card>
          <Card title="Specialized training">
            <Readout rows={[
              ['Experience with', listStr(a.experience_with)],
              ['Additional certifications', str(a.additional_certifications)],
            ]} />
          </Card>
          <Card title="Availability">
            <Readout rows={[
              ['Earliest start', fmtDate(a.earliest_start_date as string)],
              ['Available all hours', yesNo(a.available_all_hours)],
              ['Day-by-day', availDays(a.availability_days)],
              ['Interested in live-in', yesNo(a.live_in_interested)],
              ['Max consecutive days', str(a.live_in_max_days)],
              ['General availability', str(a.availability)],
            ]} />
          </Card>
          <Card title="Additional questions">
            <Readout rows={[
              ['Smoker', yesNo(a.smoker)],
              ['If yes, per day', str(a.smoker_per_day)],
              ['How they heard about us', str(a.how_heard)],
              ['Recent caregiving experience', str(a.recent_experience)],
              ['Why join the care team', str(a.why_caregiver)],
            ]} />
          </Card>
          <Card title="Attestation">
            <Readout rows={[
              ['Certified true & complete', yesNo(a.attested)],
              ['Signature', str(a.signature_name)],
              ['Signed', fmtDate(a.signed_at as string)],
            ]} />
          </Card>
        </>
      )}

      {/* Documents */}
      <Card title={`Documents (${documents.length})`}>
        {docsAcceptedAt ? (
          <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: '13px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <CheckCircle2 size={16} color={C.green} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: C.green }}>
                Reviewed and accepted {fmtDate(docsAcceptedAt)}
              </span>
              <button onClick={withdrawAcceptance} disabled={busy}
                style={{ marginLeft: 'auto', padding: '4px 12px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, color: C.gray, cursor: busy ? 'default' : 'pointer' }}>
                Withdraw
              </button>
            </div>
            {docsAcceptedNote && (
              <div style={{ fontSize: 12.5, color: C.gray, marginTop: 7, lineHeight: 1.6 }}>{docsAcceptedNote}</div>
            )}
          </div>
        ) : acceptOpen ? (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '15px 17px', marginBottom: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.navy, marginBottom: 5 }}>
              Accept these documents
            </div>
            <p style={{ fontSize: 12.5, color: C.gray, lineHeight: 1.6, margin: '0 0 10px' }}>
              Confirm you have opened them and they are legible, current, and belong to this
              person. Your name and the date are recorded against this candidate.
            </p>
            <textarea value={acceptNote} onChange={(e) => setAcceptNote(e.target.value)}
              placeholder="Optional note — e.g. TB result handed over on paper, scanned and filed."
              style={{ width: '100%', minHeight: 58, padding: '9px 11px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.navy, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={acceptDocuments} disabled={busy}
                style={{ padding: '8px 18px', background: C.tealBtn, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                {busy ? 'Saving…' : 'Record acceptance'}
              </button>
              <button onClick={() => { setAcceptOpen(false); setAcceptNote('') }}
                style={{ padding: '8px 16px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, color: C.gray, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '13px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <AlertTriangle size={16} color={C.amber} />
            <span style={{ fontSize: 13.5, color: '#92400E', fontWeight: 600 }}>
              Not yet reviewed and accepted
            </span>
            <button onClick={() => setAcceptOpen(true)} disabled={busy}
              style={{ marginLeft: 'auto', padding: '7px 16px', background: C.tealBtn, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>
              Review and accept
            </button>
          </div>
        )}
        {documents.length === 0 ? (
          <div style={{ fontSize: 14, color: C.faint }}>No documents uploaded.</div>
        ) : (
          documents.map((d) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', border: `1px solid ${C.border}`, borderRadius: 9, marginBottom: 8 }}>
              <FileText size={18} color={C.teal} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.teal }}>{docTypeLabel(d.doc_type)}</div>
                <div style={{ fontSize: 12.5, color: C.gray, wordBreak: 'break-all' }}>{d.file_name} {d.size_bytes ? `· ${fmtSize(d.size_bytes)}` : ''}</div>
              </div>
              <a href={`/api/onboarding/candidates/${candidate.id}/document?doc=${d.id}`} target="_blank" rel="noopener noreferrer"
                style={{ flexShrink: 0, padding: '7px 14px', background: C.tealSoft, color: C.teal, borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                View
              </a>
            </div>
          ))
        )}
      </Card>

      {/* Request-documents modal */}
      {showReqModal && (
        <div onClick={() => !busy && setShowReqModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(16,30,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '88vh', overflow: 'auto', boxShadow: '0 20px 50px rgba(16,30,48,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: 0 }}>Request documents</h2>
              <button onClick={() => !busy && setShowReqModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.faint }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13.5, color: C.gray, lineHeight: 1.6, margin: '0 0 16px' }}>
                Select what you need. This reopens the application for the candidate and emails them a secure link to put it right.
              </p>
              {docTypes.map((d) => {
                const checked = reqKeys.includes(d.key)
                return (
                  <label key={d.key} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 12px', borderRadius: 9, marginBottom: 7, cursor: 'pointer', background: checked ? C.tealSoft : C.bg, border: `1px solid ${checked ? C.tealBtn : 'transparent'}` }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleReq(d.key)} style={{ width: 17, height: 17, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: C.navy, fontWeight: checked ? 700 : 500 }}>{d.label}</span>
                  </label>
                )
              })}
              {appRefs.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.gray, marginBottom: 4 }}>
                    References to correct
                  </div>
                  <p style={{ fontSize: 12.5, color: C.faint, lineHeight: 1.6, margin: '0 0 9px' }}>
                    Tick any referee whose contact details are wrong or incomplete. The candidate
                    is asked to re-enter those, not to find a different person.
                  </p>
                  {appRefs.map((r) => {
                    const checked = reqRefs.includes(r.slot)
                    return (
                      <label key={r.slot} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 12px', borderRadius: 9, marginBottom: 7, cursor: 'pointer', background: checked ? C.tealSoft : C.bg, border: `1px solid ${checked ? C.tealBtn : 'transparent'}` }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleReqRef(r.slot)} style={{ width: 17, height: 17, flexShrink: 0, marginTop: 2 }} />
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 14, color: C.navy, fontWeight: checked ? 700 : 500 }}>
                            {r.label}
                          </span>
                          <span style={{ display: 'block', fontSize: 12.5, color: C.faint, marginTop: 2, wordBreak: 'break-word' }}>
                            {r.name || 'No name given'} — {r.email || 'no email given'}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
              <div style={{ marginTop: 14 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.gray, marginBottom: 6 }}>Note to candidate (optional)</label>
                <textarea value={reqNote} onChange={(e) => setReqNote(e.target.value)} placeholder="e.g. Please make sure the photo ID is not expired."
                  style={{ width: '100%', minHeight: 70, padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.navy, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.line}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => !busy && setShowReqModal(false)} style={{ padding: '10px 18px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 9, color: C.gray, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitRequest} disabled={busy} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#0E7C7B,#1A9B87)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                {busy ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
