'use client'
// app/(dashboard)/candidates/[id]/credentials/CredentialGateClient.tsx
// Inline styles only — no Tailwind on onboarding surfaces.

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ONB_STAFF_DOCUMENT_TYPES, CJIS_DOC_TYPE, MBON_DOC_TYPE,
} from '@/lib/onboarding/staff-documents'
import { isLicensedCredential, type Blocker } from '@/lib/onboarding/gates'
import { ACCEPTED_ACCEPT_ATTR } from '@/lib/onboarding/documents'

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

type Doc = {
  id: string
  doc_type: string
  file_name: string
  size_bytes: number | null
  uploaded_at: string
  url: string | null
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
  gateOk,
}: {
  candidate: Candidate
  credentialType: string | null
  blockers: Blocker[]
  gateOk: boolean
}) {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [waiverOpen, setWaiverOpen] = useState(false)
  const [waiverReason, setWaiverReason] = useState('')

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

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
          padding: '12px 16px', color: '#B91C1C', fontSize: 13, marginBottom: 20, lineHeight: 1.6,
        }}>
          {error}
        </div>
      )}

      {ONB_STAFF_DOCUMENT_TYPES.map((t) => {
        const mine = docsFor(t.key)
        const isMbon = t.key === MBON_DOC_TYPE
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
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 12, fontSize: 13, padding: '5px 0',
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
                      </span>
                    </div>
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
