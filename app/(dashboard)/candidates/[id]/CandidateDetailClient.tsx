'use client'
// app/(dashboard)/candidates/[id]/CandidateDetailClient.tsx
// Staff review screen for one candidate: header + status, competency-test
// summary, read-only application read-out, document list (signed-URL view),
// and the two review actions — "Begin review" and "Request documents".
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, X, ClipboardCheck, Mail, Building2, Pencil } from 'lucide-react'
import { docTypeLabel, type DocTypeDef } from '@/lib/onboarding/documents'

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
  axiscare_created:      { label: 'In AxisCare',         bg: '#E6F6EC', fg: '#1B7A43' },
  converted:             { label: 'Converted',          bg: '#EDF0F2', fg: '#4A6070' },
  withdrawn:             { label: 'Withdrawn',          bg: '#F4EBEB', fg: '#9B3B3B' },
}

type Candidate = {
  id: string; first_name: string; last_name: string; email: string; status: string
  invited_at: string | null; created_at: string | null
  test_passed_at: string | null; application_submitted_at: string | null; axiscare_pushed_at: string | null
  axiscare_applicant_id: number | null
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
  candidate, application, documents, attempt, docTypes,
}: {
  candidate: Candidate
  application: AppRow
  documents: DocRow[]
  attempt: Attempt
  docTypes: DocTypeDef[]
}) {
  const router = useRouter()
  const a = application || {}
  const [status, setStatus] = useState(candidate.status)
  const [axiscareId, setAxiscareId] = useState<number | null>(candidate.axiscare_applicant_id)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null)
  const [showReqModal, setShowReqModal] = useState(false)
  const [reqKeys, setReqKeys] = useState<string[]>([])
  const [reqNote, setReqNote] = useState('')

  const canBeginReview = status === 'application_submitted'
  const canRequestDocs = status === 'application_submitted' || status === 'in_review'
  const canPushAxiscare = !axiscareId && (status === 'application_submitted' || status === 'in_review')
  const canEdit = !!application && (status === 'application_submitted' || status === 'in_review')

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

  async function pushAxisCare() {
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/axiscare`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not push to AxisCare.' }); return }
      const newId = data.axiscare_applicant_id as number
      setAxiscareId(newId)
      setStatus('axiscare_created')
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

  function toggleReq(key: string) {
    setReqKeys((k) => k.includes(key) ? k.filter((x) => x !== key) : [...k, key])
  }

  async function submitRequest() {
    if (reqKeys.length === 0) { setBanner({ kind: 'warn', text: 'Select at least one document to request.' }); return }
    setBusy(true); setBanner(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_documents', doc_keys: reqKeys, note: reqNote.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not send the request.' }); setBusy(false); return }
      setShowReqModal(false); setReqKeys([]); setReqNote('')
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
            <h1 style={{ fontSize: 23, fontWeight: 800, color: C.navy, margin: 0 }}>{candidate.first_name} {candidate.last_name}</h1>
            <Badge status={status} />
          </div>
          <div style={{ color: C.gray, fontSize: 14, marginTop: 6 }}>{candidate.email}</div>
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
        {axiscareId ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}` }}>
            <CheckCircle2 size={16} /> In AxisCare · #{axiscareId}
          </span>
        ) : (
          <button onClick={pushAxisCare} disabled={!canPushAxiscare || busy}
            title={canPushAxiscare ? 'Create this applicant in AxisCare' : 'Available once the application is submitted or in review'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: '#fff', border: `1px solid ${C.border}`, color: C.navy,
              cursor: canPushAxiscare && !busy ? 'pointer' : 'default', opacity: canPushAxiscare && !busy ? 1 : 0.5,
            }}>
            <Building2 size={16} /> Push to AxisCare
          </button>
        )}
        {canEdit && (
          <Link href={`/candidates/${candidate.id}/edit`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#fff', border: `1px solid ${C.border}`, color: C.navy, textDecoration: 'none' }}>
            <Pencil size={16} /> Edit application
          </Link>
        )}
      </div>

      {/* Competency test */}
      <Card title="Competency test">
        <div style={{ fontSize: 14, color: C.navy }}>{testLine}</div>
        {attempt?.completed_at && <div style={{ fontSize: 13, color: C.faint, marginTop: 4 }}>Completed {fmtDate(attempt.completed_at)}</div>}
      </Card>

      {/* Application */}
      {!hasApp ? (
        <Card title="Application">
          <div style={{ fontSize: 14, color: C.faint }}>No application on file yet. The candidate has not started or saved their application.</div>
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
          <Card title="Previous caregiver experience">
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
              ['Why caregiver with us', str(a.why_caregiver)],
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
                Select the documents you need. This reopens the application for the candidate and emails them a secure link to add the items.
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
