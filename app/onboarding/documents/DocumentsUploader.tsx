'use client'
// app/onboarding/documents/DocumentsUploader.tsx
// The documents-only candidate surface: pick a document type, upload a file,
// see and remove what is already in. Talks to the same token-gated
// /api/onboarding/documents route the application form uses, so the rules
// (size, types, storage) can never differ between the two surfaces.
//
// v0.6.58 — the file picker was a bare native input sitting between a bold
// label and a bold green button, so the one thing a candidate had to DO was
// the least visible thing on the page. It is now an explicit drop zone that
// browses on click or on keyboard, accepts a drag-and-drop, and confirms the
// chosen file by name and size before anything is sent. The Upload button is
// disabled until a file is actually attached, so pressing it can no longer
// produce an error message as the candidate's first feedback.
import { useRef, useState } from 'react'
import type { DocTypeDef, StoredDocument } from '@/lib/onboarding/documents'
import { ACCEPTED_ACCEPT_ATTR, MAX_FILE_BYTES, isAcceptedMime } from '@/lib/onboarding/documents'

const C = {
  navy: '#1A2E44', gray: '#4A6070', faint: '#8FA0B0', border: '#D1D9E0',
  teal: '#0E7C7B', red: '#9B3B3B',
}

function fmtSize(n: number | null): string {
  if (!n || n <= 0) return ''
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const MAX_MB = (MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)

export default function DocumentsUploader({
  token, firstName, initialDocuments, docTypes, readOnly,
}: {
  token: string
  firstName: string
  initialDocuments: StoredDocument[]
  docTypes: DocTypeDef[]
  readOnly: boolean
}) {
  const [documents, setDocuments] = useState<StoredDocument[]>(initialDocuments)
  const [docType, setDocType] = useState<string>(docTypes[0]?.key || 'other')
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null)
  // The chosen file is held in state, not read off the input at submit time:
  // a drag-and-drop never touches the input, and the confirmation panel has to
  // re-render when the selection changes.
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const label = (key: string) => docTypes.find((d) => d.key === key)?.label || key
  const hint = docTypes.find((d) => d.key === docType)?.hint

  /** Shared by the browse dialog and the drop handler. */
  function accept(picked: File | null | undefined) {
    if (!picked) return
    if (!isAcceptedMime(picked.type)) {
      setFile(null)
      setBanner({ kind: 'warn', text: 'That file type is not accepted. Please send a PDF, JPG or PNG.' })
      return
    }
    if (picked.size > MAX_FILE_BYTES) {
      setFile(null)
      setBanner({ kind: 'warn', text: `That file is too large. Please upload up to ${MAX_MB} MB.` })
      return
    }
    setBanner(null)
    setFile(picked)
  }

  function clearFile() {
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function upload() {
    if (!file) { setBanner({ kind: 'warn', text: 'Add a file first.' }); return }
    setBusy(true); setBanner(null)
    try {
      const fd = new FormData()
      fd.set('token', token)
      fd.set('doc_type', docType)
      fd.set('file', file)
      const res = await fetch('/api/onboarding/documents', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Upload failed. Please try again.' }); return }
      if (data.document) setDocuments((prev) => [data.document as StoredDocument, ...prev])
      clearFile()
      setBanner({ kind: 'ok', text: `${label(docType)} uploaded. Add another, or you are all set — our team reviews everything you send.` })
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setBusy(true); setBanner(null)
    try {
      const res = await fetch('/api/onboarding/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id }),
      })
      const data = await res.json()
      if (!res.ok) { setBanner({ kind: 'warn', text: data.error || 'Could not remove that file.' }); return }
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setBusy(false)
    }
  }

  const zoneBorder = file ? C.teal : dragging ? C.teal : '#B8C6D2'
  const zoneBg = file ? '#ECF8F6' : dragging ? '#E6F4F3' : '#FFFFFF'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', fontFamily: "'DM Sans','Segoe UI',Arial,sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ background: 'linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%)', padding: '26px 30px', borderRadius: '14px 14px 0 0', textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, background: 'linear-gradient(135deg,#0E7C7B,#F4A261)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 900, color: '#fff', marginBottom: 10 }}>V+</div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 19, fontWeight: 800 }}>Your Caregiver Documents</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '4px 0 0', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Vitalis HealthCare</p>
        </div>

        <div style={{ background: '#fff', padding: '28px 30px', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 14px 14px' }}>
          <h2 style={{ fontSize: 17, color: C.navy, margin: '0 0 8px' }}>Hi {firstName}!</h2>
          <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.7, margin: '0 0 20px' }}>
            {readOnly
              ? 'Your documents are with our team for review. If anything else is needed, we will email you.'
              : 'We have your application on file. Please upload your supporting documents below — a government-issued photo ID plus any certifications you hold. Clear photos or PDFs are both fine.'}
          </p>

          {banner && (
            <div style={{
              padding: '11px 14px', borderRadius: 9, fontSize: 13.5, marginBottom: 16, lineHeight: 1.6,
              background: banner.kind === 'ok' ? '#E6F6EC' : '#FEF3E2',
              color: banner.kind === 'ok' ? '#1B7A43' : '#B26A00',
              border: `1px solid ${banner.kind === 'ok' ? '#BFE6CD' : '#F4D9A8'}`,
            }}>{banner.text}</div>
          )}

          {!readOnly && (
            <div style={{ background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px', marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 6 }}>
                <span style={{ color: C.teal, fontWeight: 800 }}>Step 1.</span> Document type
              </label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} disabled={busy}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, color: C.navy, background: '#fff', boxSizing: 'border-box', marginBottom: hint ? 4 : 14 }}>
                {docTypes.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
              {hint && <div style={{ fontSize: 12, color: C.faint, margin: '0 0 14px' }}>{hint}</div>}

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 6 }}>
                <span style={{ color: C.teal, fontWeight: 800 }}>Step 2.</span> Attach the file
              </label>

              {/* The input itself is hidden; the zone below is the control the
                  candidate actually sees and operates. */}
              <input ref={fileRef} type="file" accept={ACCEPTED_ACCEPT_ATTR} disabled={busy}
                onChange={(e) => accept(e.target.files?.[0])}
                style={{ display: 'none' }} />

              <div
                role="button"
                tabIndex={busy ? -1 : 0}
                aria-label="Add your file here"
                onClick={() => { if (!busy) fileRef.current?.click() }}
                onKeyDown={(e) => {
                  if (busy) return
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click() }
                }}
                onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  if (!busy) accept(e.dataTransfer.files?.[0])
                }}
                style={{
                  border: `2px dashed ${zoneBorder}`, borderRadius: 12, background: zoneBg,
                  padding: '22px 18px', textAlign: 'center', cursor: busy ? 'default' : 'pointer',
                  marginBottom: 14, transition: 'border-color .15s, background .15s',
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {file ? (
                  <div>
                    <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 8 }} aria-hidden="true">✓</div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: C.navy, wordBreak: 'break-all' }}>{file.name}</div>
                    <div style={{ fontSize: 12.5, color: C.gray, marginTop: 3 }}>
                      {fmtSize(file.size)} · ready to upload
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button type="button" disabled={busy}
                        onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                        style={{ padding: '6px 14px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, color: C.gray, fontSize: 12.5, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>
                        Choose a different file
                      </button>
                      <button type="button" disabled={busy}
                        onClick={(e) => { e.stopPropagation(); clearFile() }}
                        style={{ padding: '6px 14px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, color: C.red, fontSize: 12.5, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 26, lineHeight: 1, marginBottom: 8 }} aria-hidden="true">📄</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.teal }}>Add your file here</div>
                    <div style={{ fontSize: 13, color: C.gray, marginTop: 5, lineHeight: 1.6 }}>
                      Tap to take a photo or browse your files<br />
                      <span style={{ color: C.faint, fontSize: 12 }}>PDF, JPG or PNG · up to {MAX_MB} MB</span>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={upload} disabled={busy || !file}
                style={{
                  padding: '11px 26px', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700,
                  width: '100%', boxSizing: 'border-box',
                  background: !file ? '#E2E8F0' : 'linear-gradient(135deg,#0E7C7B,#1A9B87)',
                  color: !file ? '#94A3B8' : '#fff',
                  cursor: busy || !file ? 'default' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                }}>
                {busy ? 'Working…' : file ? 'Upload document' : 'Add a file to continue'}
              </button>
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 700, color: C.gray, marginBottom: 10 }}>
            {documents.length === 0 ? 'Nothing uploaded yet' : `Uploaded (${documents.length})`}
          </div>
          {documents.map((d) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', border: '1px solid #EFF2F5', borderRadius: 10, marginBottom: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label(d.doc_type)}</div>
                <div style={{ fontSize: 12, color: C.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.file_name}{fmtSize(d.size_bytes) ? ` · ${fmtSize(d.size_bytes)}` : ''}
                </div>
              </div>
              {!readOnly && (
                <button onClick={() => remove(d.id)} disabled={busy}
                  style={{ flexShrink: 0, padding: '6px 12px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, color: C.red, fontSize: 12.5, fontWeight: 600, cursor: busy ? 'default' : 'pointer' }}>
                  Remove
                </button>
              )}
            </div>
          ))}

          <p style={{ color: '#94A3B8', fontSize: 12, margin: '18px 0 0', lineHeight: 1.7 }}>
            There is no submit button — everything you upload here is saved immediately and our team
            reviews it. If we need anything else, we will email you. Questions? Contact the Vitalis office.
          </p>
        </div>

        <div style={{ textAlign: 'center', padding: '18px 0', fontSize: 11, color: '#94A3B8', lineHeight: 1.8 }}>
          Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910
        </div>
      </div>
    </div>
  )
}
