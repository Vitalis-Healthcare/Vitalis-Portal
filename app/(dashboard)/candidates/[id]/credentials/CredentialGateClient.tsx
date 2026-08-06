'use client'
// app/(dashboard)/candidates/[id]/credentials/CredentialGateClient.tsx
// Inline styles only — no Tailwind on onboarding surfaces.

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ONB_CREDENTIAL_PAGE_TYPES, CJIS_DOC_TYPE, MBON_DOC_TYPE,
  isOnBehalfDocType, REQUIRED_CANDIDATE_DOC_TYPES,
} from '@/lib/onboarding/staff-documents'
import { isLicensedCredential, type Blocker } from '@/lib/onboarding/gates'
import { ACCEPTED_ACCEPT_ATTR } from '@/lib/onboarding/documents'
import {
  FINGERPRINT_WINDOW_DAYS, defaultExpectedBy, fingerprintStatus, todayISO,
} from '@/lib/onboarding/fingerprint'

const TEAL = '#0E7C7B'
const NAVY = '#1A2E44'
const MUTED = '#4A6070'
const LINE = '#E2E8F0'

type Candidate = {
  id: string
  first_name: string
  last_name: string
  status: string | null
  license_waived_at: string | null
  license_waiver_reason: string | null
}

export type Attestation = {
  id: string
  sent_at: string
  expected_by: string
  note: string | null
  extension_reason: string | null
  created_at: string
  created_by: string | null
  cleared_at: string | null
  superseded_at: string | null
}

type Doc = {
  id: string
  doc_type: string
  file_name: string
  size_bytes: number | null
  uploaded_at: string
  url: string | null
  /** null when the candidate filed it themselves. */
  uploaded_by: string | null
  issued_on: string | null
  expires_on: string | null
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CredentialGateClient({
  candidate,
  credentialType,
  blockers,
  warnings = [],
  attestations = [],
  liveAttestation = null,
  actorNames = {},
  gateOk,
}: {
  candidate: Candidate
  credentialType: string | null
  blockers: Blocker[]
  warnings?: Blocker[]
  attestations?: Attestation[]
  liveAttestation?: Attestation | null
  actorNames?: Record<string, string>
  gateOk: boolean
}) {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [dateEdits, setDateEdits] = useState<Record<string, { issued: string; expires: string }>>({})
  const [waiverOpen, setWaiverOpen] = useState(false)
  const [waiverReason, setWaiverReason] = useState('')

  // Fingerprinting attestation form. sentAt defaults to today because the
  // overwhelmingly common case is a coordinator recording it the same day.
  const [fpOpen, setFpOpen] = useState(false)
  const [fpSentAt, setFpSentAt] = useState(todayISO())
  const [fpExpectedBy, setFpExpectedBy] = useState(defaultExpectedBy(todayISO()))
  const [fpNote, setFpNote] = useState('')
  const [fpReason, setFpReason] = useState('')
  const fpStatus = fingerprintStatus(
    liveAttestation
      ? { sentAt: liveAttestation.sent_at, expectedBy: liveAttestation.expected_by }
      : null,
  )
  const cjisOnFile = docs.some((d) => d.doc_type === CJIS_DOC_TYPE)

  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})
  const licensed = isLicensedCredential(credentialType)
  const waived = !!candidate.license_waived_at

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/staff-documents`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not load documents.')
      setDocs(json.documents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [candidate.id])

  useEffect(() => { load() }, [load])

  const upload = async (docType: string, file: File) => {
    setBusy(docType); setError(null)
    try {
      const fd = new FormData()
      fd.append('doc_type', docType)
      fd.append('file', file)
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/staff-documents`, {
        method: 'POST', body: fd,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Upload failed.')
      await load()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const recordFingerprint = async () => {
    setBusy('fingerprint'); setError(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/fingerprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sent_at: fpSentAt,
          expected_by: fpExpectedBy,
          note: fpNote,
          extension_reason: fpReason,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not record the attestation.')
      setFpOpen(false); setFpNote(''); setFpReason('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const saveDates = async (docId: string) => {
    const e = dateEdits[docId]
    if (!e) return
    setBusy(`dates:${docId}`); setError(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/staff-documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: docId,
          issued_on: e.issued || null,
          expires_on: e.expires || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not save those dates.')
      setDateEdits((m) => { const c = { ...m }; delete c[docId]; return c })
      await load()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const removeDoc = async (docId: string) => {
    setBusy(docId); setError(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/staff-documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not remove that document.')
      await load()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const applyWaiver = async () => {
    setBusy('waiver'); setError(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/license-waiver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: waiverReason.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not record the waiver.')
      setWaiverOpen(false); setWaiverReason('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const removeWaiver = async () => {
    setBusy('waiver'); setError(null)
    try {
      const res = await fetch(`/api/onboarding/candidates/${candidate.id}/license-waiver`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not remove the waiver.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const docsFor = (t: string) => docs.filter((d) => d.doc_type === t)

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 880, margin: '0 auto' }}>

      <div style={{ marginBottom: 26 }}>
        <Link href={`/candidates/${candidate.id}`} style={{ color: TEAL, textDecoration: 'none', fontSize: 13 }}>
          ← {candidate.first_name} {candidate.last_name}
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, margin: '8px 0 4px' }}>
          Credentialing
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.6 }}>
          These two are yours to obtain, not the candidate&rsquo;s. Both must be settled
          before an agreement can be sent.
        </p>
      </div>

      {/* Gate summary — same evaluator the routes enforce with */}
      <div style={{
        background: gateOk ? '#F0FDF4' : '#FFFBEB',
        border: `1px solid ${gateOk ? '#86EFAC' : '#FDE68A'}`,
        borderRadius: 12, padding: '16px 20px', marginBottom: 24,
      }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: gateOk ? '#065F46' : '#92400E', marginBottom: gateOk ? 0 : 10,
        }}>
          {gateOk
            ? '✓ Ready — an agreement can be sent'
            : `${blockers.length} thing${blockers.length === 1 ? '' : 's'} still to settle before an agreement can be sent`}
        </div>
        {!gateOk && (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#92400E', lineHeight: 1.75 }}>
            {blockers.map((b) => <li key={b.code}>{b.label}</li>)}
          </ul>
        )}
      </div>

      {/* ── Fingerprinting attestation ──────────────────────────────────────
          Shown only while the CJIS record is genuinely absent. Once the
          document lands the attestation is cleared automatically and this
          whole panel disappears, which is the point: the thing we were waiting
          for is the thing that closes it. */}
      {!cjisOnFile && (
        <div style={{
          background: fpStatus.state === 'overdue' ? '#FEF2F2' : fpStatus.state === 'pending' ? '#FFFBEB' : '#F8FAFC',
          border: `1px solid ${fpStatus.state === 'overdue' ? '#FECACA' : fpStatus.state === 'pending' ? '#FDE68A' : LINE}`,
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700, marginBottom: 8,
            color: fpStatus.state === 'overdue' ? '#B91C1C' : fpStatus.state === 'pending' ? '#92400E' : NAVY,
          }}>
            {fpStatus.state === 'overdue'
              ? `CJIS results overdue by ${fpStatus.daysOverdue} day${fpStatus.daysOverdue === 1 ? '' : 's'}`
              : fpStatus.state === 'pending'
                ? `Fingerprinting form sent — results pending, due ${liveAttestation?.expected_by}`
                : 'Waiting on fingerprinting?'}
          </div>

          {fpStatus.state === 'none' && (
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 12px', lineHeight: 1.7 }}>
              If you have sent this candidate the fingerprinting form and are waiting on the CJIS
              record to come back, record it here. That keeps the agreement and conversion moving
              for {FINGERPRINT_WINDOW_DAYS} days. After that the gate closes again and the
              overdue chase begins — so this defers the requirement, it does not remove it.
            </p>
          )}

          {fpStatus.state === 'pending' && liveAttestation && (
            <p style={{ fontSize: 13, color: '#92400E', margin: '0 0 12px', lineHeight: 1.7 }}>
              Form sent {fmtDate(liveAttestation.sent_at)}
              {liveAttestation.created_by && actorNames[liveAttestation.created_by]
                ? ` by ${actorNames[liveAttestation.created_by]}` : ''}
              {liveAttestation.note ? ` — ${liveAttestation.note}` : ''}.
              {' '}Upload the CJIS record here as soon as it arrives and this closes itself.
            </p>
          )}

          {fpStatus.state === 'overdue' && liveAttestation && (
            <p style={{ fontSize: 13, color: '#B91C1C', margin: '0 0 12px', lineHeight: 1.7 }}>
              Results were expected by {fmtDate(liveAttestation.expected_by)} and have not arrived.
              This candidate is blocked again until the record is uploaded. Chase the result — and
              if it is genuinely still coming, extend below and say why. Extensions are recorded.
            </p>
          )}

          {warnings.map((w) => (
            <div key={w.code} style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.7, margin: '0 0 12px' }}>
              {w.detail}
            </div>
          ))}

          {!fpOpen ? (
            <button onClick={() => { setFpOpen(true); setError(null) }}
              style={{
                padding: '9px 16px', borderRadius: 8, border: `1px solid ${LINE}`, background: '#fff',
                color: NAVY, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
              {fpStatus.state === 'none' ? 'Record fingerprinting sent' : 'Extend the expected date'}
            </button>
          ) : (
            <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 16px' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: MUTED, marginBottom: 5 }}>
                Date the fingerprinting form was sent
              </label>
              <input type="date" value={fpSentAt} max={todayISO()}
                onChange={(e) => {
                  setFpSentAt(e.target.value)
                  // Keep the expected date in step unless it has been edited
                  // away from the standard window.
                  setFpExpectedBy(defaultExpectedBy(e.target.value))
                }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: `1px solid ${LINE}`, fontSize: 13.5, marginBottom: 12, boxSizing: 'border-box' }} />

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: MUTED, marginBottom: 5 }}>
                Results expected by <span style={{ fontWeight: 400 }}>(defaults to {FINGERPRINT_WINDOW_DAYS} days)</span>
              </label>
              <input type="date" value={fpExpectedBy} min={fpSentAt}
                onChange={(e) => setFpExpectedBy(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: `1px solid ${LINE}`, fontSize: 13.5, marginBottom: 12, boxSizing: 'border-box' }} />

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: MUTED, marginBottom: 5 }}>
                Note <span style={{ fontWeight: 400 }}>(which site, receipt or tracking number)</span>
              </label>
              <textarea value={fpNote} onChange={(e) => setFpNote(e.target.value)} rows={2}
                placeholder="e.g. Live Scan at Wheaton, receipt #48221"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: `1px solid ${LINE}`, fontSize: 13.5, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />

              {liveAttestation && (
                <>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#B91C1C', marginBottom: 5 }}>
                    Why is this being extended? <span style={{ fontWeight: 400 }}>(required — recorded and reviewed)</span>
                  </label>
                  <textarea value={fpReason} onChange={(e) => setFpReason(e.target.value)} rows={2}
                    placeholder="e.g. CJIS confirmed a backlog; candidate's receipt verified"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #FECACA', fontSize: 13.5, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
                </>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={recordFingerprint}
                  disabled={busy === 'fingerprint' || !fpSentAt || !fpExpectedBy || (!!liveAttestation && !fpReason.trim())}
                  style={{
                    padding: '9px 18px', borderRadius: 8, border: 'none',
                    background: (busy === 'fingerprint' || (!!liveAttestation && !fpReason.trim())) ? '#E2E8F0' : TEAL,
                    color: (busy === 'fingerprint' || (!!liveAttestation && !fpReason.trim())) ? '#94A3B8' : '#fff',
                    fontSize: 13, fontWeight: 700,
                    cursor: busy === 'fingerprint' ? 'default' : 'pointer',
                  }}>
                  {busy === 'fingerprint' ? 'Saving…' : liveAttestation ? 'Record the extension' : 'Record it'}
                </button>
                <button onClick={() => { setFpOpen(false); setFpReason('') }}
                  style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${LINE}`, background: '#fff', color: MUTED, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {attestations.length > 1 && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, marginBottom: 6 }}>
                Earlier attestations ({attestations.length - 1})
              </div>
              {attestations.filter((a) => a.id !== liveAttestation?.id).map((a) => (
                <div key={a.id} style={{ fontSize: 12, color: MUTED, lineHeight: 1.7, marginBottom: 4 }}>
                  Sent {fmtDate(a.sent_at)}, expected {fmtDate(a.expected_by)}
                  {a.created_by && actorNames[a.created_by] ? ` · ${actorNames[a.created_by]}` : ''}
                  {a.cleared_at ? ' · cleared' : a.superseded_at ? ' · extended' : ''}
                  {a.extension_reason ? ` — ${a.extension_reason}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
          padding: '12px 16px', color: '#B91C1C', fontSize: 13, marginBottom: 20, lineHeight: 1.6,
        }}>
          {error}
        </div>
      )}

      {ONB_CREDENTIAL_PAGE_TYPES.map((t) => {
        const mine = docsFor(t.key)
        const isMbon = t.key === MBON_DOC_TYPE
        const onBehalf = isOnBehalfDocType(t.key)
        const required = REQUIRED_CANDIDATE_DOC_TYPES.includes(t.key)
        const satisfied = mine.length > 0 || (isMbon && waived && !licensed)

        return (
          <div key={t.key} style={{
            background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12,
            padding: '22px 24px', marginBottom: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{t.label}</span>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11,
                    fontWeight: 700, letterSpacing: '.03em',
                    background: satisfied ? '#F0FDF4' : '#FEF2F2',
                    color: satisfied ? '#15803D' : '#B91C1C',
                  }}>
                    {satisfied ? 'ON FILE' : 'REQUIRED'}
                  </span>
                  {t.key === CJIS_DOC_TYPE && (
                    <span style={{ fontSize: 11, color: '#8FA0B0' }}>cannot be waived</span>
                  )}
                  {onBehalf && required && (
                    <span style={{ fontSize: 11, color: '#8FA0B0' }}>candidate normally supplies this</span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6 }}>{t.hint}</div>
              </div>

              <div style={{ flexShrink: 0 }}>
                <input
                  ref={(el) => { fileInputs.current[t.key] = el }}
                  type="file"
                  accept={ACCEPTED_ACCEPT_ATTR}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) upload(t.key, f)
                    e.target.value = ''
                  }}
                />
                <button
                  onClick={() => fileInputs.current[t.key]?.click()}
                  disabled={busy === t.key}
                  style={{
                    padding: '9px 18px', background: busy === t.key ? '#9DBDBD' : TEAL, color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: busy === t.key ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {busy === t.key ? 'Uploading…' : mine.length ? 'Replace' : 'Upload'}
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ fontSize: 12.5, color: '#8FA0B0', marginTop: 14 }}>Loading…</div>
            ) : mine.length > 0 && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
                {mine.map((d) => (
                  <div key={d.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    gap: 12, fontSize: 13, padding: '7px 0',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      {d.url ? (
                        <a href={d.url} target="_blank" rel="noopener noreferrer"
                          style={{ color: TEAL, textDecoration: 'none', fontWeight: 600 }}>
                          {d.file_name} ↗
                        </a>
                      ) : (
                        <span style={{ color: NAVY }}>{d.file_name}</span>
                      )}
                      <span style={{ color: '#8FA0B0', marginLeft: 8, fontSize: 12 }}>
                        {fmtDate(d.uploaded_at)} {fmtSize(d.size_bytes)}
                        {!d.uploaded_by && ' · uploaded by the candidate'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
                        <label style={{ fontSize: 11.5, color: '#8FA0B0', fontWeight: 600 }}>Issued</label>
                        <input
                          type="date"
                          value={dateEdits[d.id]?.issued ?? d.issued_on ?? ''}
                          onChange={(ev) => setDateEdits((m) => ({
                            ...m,
                            [d.id]: {
                              issued: ev.target.value,
                              expires: m[d.id]?.expires ?? d.expires_on ?? '',
                            },
                          }))}
                          style={{
                            padding: '4px 8px', border: '1px solid #D1D9E0', borderRadius: 6,
                            fontSize: 12, color: NAVY,
                          }}
                        />
                        <label style={{ fontSize: 11.5, color: '#8FA0B0', fontWeight: 600 }}>Expires</label>
                        <input
                          type="date"
                          value={dateEdits[d.id]?.expires ?? d.expires_on ?? ''}
                          onChange={(ev) => setDateEdits((m) => ({
                            ...m,
                            [d.id]: {
                              issued: m[d.id]?.issued ?? d.issued_on ?? '',
                              expires: ev.target.value,
                            },
                          }))}
                          style={{
                            padding: '4px 8px', border: '1px solid #D1D9E0', borderRadius: 6,
                            fontSize: 12, color: NAVY,
                          }}
                        />
                        {dateEdits[d.id] && (
                          <button
                            onClick={() => saveDates(d.id)}
                            disabled={busy === `dates:${d.id}`}
                            style={{
                              padding: '4px 12px', background: TEAL, color: '#fff', border: 'none',
                              borderRadius: 6, fontSize: 12, fontWeight: 600,
                              cursor: busy === `dates:${d.id}` ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {busy === `dates:${d.id}` ? 'Saving…' : 'Save dates'}
                          </button>
                        )}
                      </div>
                    </div>
                    {d.uploaded_by || !isOnBehalfDocType(d.doc_type) ? (
                      <button
                        onClick={() => removeDoc(d.id)}
                        disabled={busy === d.id}
                        style={{
                          padding: '3px 10px', background: '#fff', border: '1px solid #D1D9E0',
                          borderRadius: 6, fontSize: 12, color: MUTED,
                          cursor: busy === d.id ? 'not-allowed' : 'pointer', flexShrink: 0,
                        }}
                      >
                        {busy === d.id ? '…' : 'Remove'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11.5, color: '#8FA0B0', flexShrink: 0 }}>
                        theirs — use Request documents
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Waiver lives with the license, and only there */}
            {isMbon && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>
                {waived ? (
                  <div style={{
                    background: licensed ? '#FEF2F2' : '#F8FAFC',
                    border: `1px solid ${licensed ? '#FECACA' : LINE}`,
                    borderRadius: 8, padding: '12px 16px',
                  }}>
                    <div style={{
                      fontSize: 12.5, fontWeight: 700, color: licensed ? '#B91C1C' : MUTED, marginBottom: 4,
                    }}>
                      {licensed
                        ? `Waiver contradicts the application — ${credentialType} was declared`
                        : 'Waived — unlicensed aide'}
                    </div>
                    {candidate.license_waiver_reason && (
                      <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6, marginBottom: 8 }}>
                        &ldquo;{candidate.license_waiver_reason}&rdquo;
                        {candidate.license_waived_at && (
                          <span style={{ color: '#8FA0B0' }}> · {fmtDate(candidate.license_waived_at)}</span>
                        )}
                      </div>
                    )}
                    <button
                      onClick={removeWaiver}
                      disabled={busy === 'waiver'}
                      style={{
                        padding: '5px 14px', background: '#fff', border: '1px solid #D1D9E0',
                        borderRadius: 6, fontSize: 12, color: MUTED,
                        cursor: busy === 'waiver' ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {busy === 'waiver' ? '…' : 'Remove waiver'}
                    </button>
                  </div>
                ) : licensed ? (
                  <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6 }}>
                    This candidate declared <strong>{credentialType}</strong> on their application,
                    so verification is required and cannot be waived. If that was entered in error,
                    correct the application first.
                  </div>
                ) : waiverOpen ? (
                  <div>
                    <label style={{
                      display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
                      textTransform: 'uppercase', color: MUTED, marginBottom: 6,
                    }}>
                      Reason for the waiver
                    </label>
                    <input
                      type="text"
                      value={waiverReason}
                      onChange={(e) => setWaiverReason(e.target.value)}
                      placeholder="e.g. Unlicensed companion care aide — no MBON credential claimed"
                      style={{
                        width: '100%', padding: '9px 12px', border: '1px solid #D1D9E0',
                        borderRadius: 8, fontSize: 13, color: NAVY, marginBottom: 10,
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={applyWaiver}
                        disabled={busy === 'waiver' || waiverReason.trim().length < 5}
                        style={{
                          padding: '7px 18px',
                          background: waiverReason.trim().length >= 5 ? TEAL : '#9DBDBD',
                          color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
                          cursor: waiverReason.trim().length >= 5 ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {busy === 'waiver' ? 'Saving…' : 'Record waiver'}
                      </button>
                      <button
                        onClick={() => { setWaiverOpen(false); setWaiverReason('') }}
                        style={{
                          padding: '7px 16px', background: '#fff', border: '1px solid #D1D9E0',
                          borderRadius: 7, fontSize: 13, color: MUTED, cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setWaiverOpen(true)}
                    style={{
                      padding: '6px 14px', background: '#fff', border: '1px solid #D1D9E0',
                      borderRadius: 7, fontSize: 12.5, color: MUTED, cursor: 'pointer',
                    }}
                  >
                    Waive — unlicensed aide
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 24 }}>
        <Link
          href={`/candidates/${candidate.id}/contract`}
          style={{
            display: 'inline-block', padding: '10px 22px',
            background: gateOk ? TEAL : '#E2E8F0',
            color: gateOk ? '#fff' : '#8FA0B0',
            textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
          }}
        >
          {gateOk ? 'Continue to agreement →' : 'Agreement (blocked)'}
        </Link>
      </div>
    </div>
  )
}
