'use client'
// app/onboarding/application/ApplicationForm.tsx
// Candidate-facing application form. Sectioned inputs + optional document
// uploads. Save draft any time; submit when ready (basic required-field check).
// When read-only (already submitted / under review), renders a summary banner
// and disables all inputs.
import { useState } from 'react'
import type { ApplicationData } from '@/lib/onboarding/application'
import { CREDENTIAL_TYPES, US_STATES } from '@/lib/onboarding/application'
import {
  ACCEPTED_ACCEPT_ATTR, MAX_FILE_BYTES, docTypeLabel,
  type DocTypeDef, type StoredDocument,
} from '@/lib/onboarding/documents'

const C = {
  navy: '#1A2E44', teal: '#0A5C5B', tealBtn: '#0E7C7B', tealSoft: '#E6F4F4',
  gray: '#4A6070', faint: '#8FA0B0', border: '#D1D9E0', line: '#EFF2F5', bg: '#F8FAFC',
  green: '#1B7A43', greenBg: '#E6F6EC', greenBorder: '#BFE6CD',
  red: '#9B3B3B', redBg: '#FBEAEA', redBorder: '#E6C3C3', amber: '#B26A00',
}

const btnPrimary: React.CSSProperties = {
  padding: '13px 30px', background: 'linear-gradient(135deg,#0E7C7B,#1A9B87)', color: '#fff',
  border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  padding: '13px 24px', background: '#fff', border: `1px solid ${C.border}`, color: C.gray,
  borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${C.border}`,
  fontSize: 14.5, color: C.navy, background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit',
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '24px 16px 56px', fontFamily: "'DM Sans','Segoe UI',Arial,sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%)', padding: '22px 28px', borderRadius: '14px 14px 0 0', textAlign: 'center' }}>
          <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#0E7C7B,#F4A261)', borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 10 }}>V+</div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 800 }}>Vitalis Caregiver Application</h1>
        </div>
        <div style={{ background: '#fff', padding: '28px', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 14px 14px' }}>
          {children}
        </div>
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: '#94A3B8', lineHeight: 1.8 }}>
          Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 26 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: C.teal, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</h3>
      <div style={{ height: 2, background: C.line, marginBottom: 16 }} />
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>{children}</div>
}

function Field({ label, required, children, grow = 1 }: { label: string; required?: boolean; children: React.ReactNode; grow?: number }) {
  return (
    <label style={{ flex: `${grow} 1 200px`, display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.gray, marginBottom: 6 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </span>
      {children}
    </label>
  )
}

type DocsState = StoredDocument[]

export default function ApplicationForm({
  token, firstName, initial, documents, docTypes, readOnly, submitted,
}: {
  token: string
  firstName: string
  initial: ApplicationData
  documents: DocsState
  docTypes: DocTypeDef[]
  readOnly: boolean
  submitted: boolean
}) {
  const [form, setForm] = useState<ApplicationData>(initial)
  const [docs, setDocs] = useState<DocsState>(documents)
  const [uploadType, setUploadType] = useState<string>(docTypes[0]?.key || 'other')
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function set<K extends keyof ApplicationData>(key: K, value: ApplicationData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setNotice(''); setError('')
  }

  // ── document upload / delete ──
  async function onUpload(file: File | null) {
    if (!file) return
    setError(''); setNotice('')
    if (file.size > MAX_FILE_BYTES) {
      setError(`“${file.name}” is too large. Please upload a file up to ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)} MB.`)
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('token', token)
      fd.append('doc_type', uploadType)
      fd.append('file', file)
      const res = await fetch('/api/onboarding/documents', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Upload failed. Please try again.'); return }
      setDocs((d) => [data.document as StoredDocument, ...d])
      setNotice(`Uploaded ${docTypeLabel(uploadType)}.`)
    } catch {
      setError('Upload failed. Please check your connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  async function onDeleteDoc(id: string) {
    setError(''); setNotice('')
    try {
      const res = await fetch('/api/onboarding/documents', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not remove that file.'); return }
      setDocs((d) => d.filter((x) => x.id !== id))
    } catch {
      setError('Could not remove that file. Please try again.')
    }
  }

  // ── save / submit ──
  async function save(action: 'save' | 'submit') {
    setBusy(true); setError(''); setNotice('')
    try {
      const res = await fetch('/api/onboarding/application', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action, application: form }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      if (action === 'submit') { setDone(true); window.scrollTo({ top: 0 }) }
      else { setNotice('Your progress has been saved. You can come back to this link any time.') }
    } catch {
      setError('Something went wrong. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  // ── read-only / submitted views ──
  if (done || submitted) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: C.greenBg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 30 }}>✅</div>
          <h2 style={{ fontSize: 22, color: C.navy, margin: '0 0 10px' }}>Application received</h2>
          <p style={{ color: C.gray, fontSize: 15, lineHeight: 1.7, margin: '0 auto', maxWidth: 460 }}>
            Thank you, {firstName}. Your application is with the Vitalis team for review. If we need anything else —
            including any missing documents — we will email you a link to add it. You can close this page.
          </p>
        </div>
        {docs.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: C.teal, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.4 }}>Documents on file</h3>
            {docs.map((d) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 9, marginBottom: 8, fontSize: 13.5, color: C.navy }}>
                <span style={{ fontWeight: 700, color: C.teal }}>{docTypeLabel(d.doc_type)}</span>
                <span style={{ color: C.faint }}>·</span>
                <span style={{ color: C.gray, wordBreak: 'break-all' }}>{d.file_name}</span>
              </div>
            ))}
          </div>
        )}
      </Shell>
    )
  }

  // ── editable form ──
  const yesNo = (key: keyof ApplicationData, label: string) => {
    const val = form[key]
    return (
      <Field label={label}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ v: true, t: 'Yes' }, { v: false, t: 'No' }].map(({ v, t }) => {
            const active = val === v
            return (
              <button key={t} type="button" onClick={() => set(key, v as ApplicationData[typeof key])}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 9, cursor: 'pointer', fontSize: 14, fontWeight: 700,
                  background: active ? C.tealSoft : '#fff', border: `1.5px solid ${active ? C.tealBtn : C.border}`,
                  color: active ? C.teal : C.gray,
                }}>{t}</button>
            )
          })}
        </div>
      </Field>
    )
  }

  return (
    <Shell>
      <h2 style={{ fontSize: 20, color: C.navy, margin: '0 0 8px' }}>Welcome, {firstName} — let’s finish your application</h2>
      <p style={{ color: C.gray, fontSize: 14.5, lineHeight: 1.7, margin: 0 }}>
        Please complete the sections below and attach any documents you have on hand. You can <strong>save your
        progress</strong> and return to this same link any time before you submit. Documents are optional — if anything
        is missing, we will follow up.
      </p>

      <Section title="Personal details">
        <Row>
          <Field label="Legal first name" required><input style={inputStyle} value={form.legal_first_name || ''} onChange={(e) => set('legal_first_name', e.target.value)} /></Field>
          <Field label="Middle name"><input style={inputStyle} value={form.middle_name || ''} onChange={(e) => set('middle_name', e.target.value)} /></Field>
          <Field label="Legal last name" required><input style={inputStyle} value={form.legal_last_name || ''} onChange={(e) => set('legal_last_name', e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="Preferred name"><input style={inputStyle} value={form.preferred_name || ''} onChange={(e) => set('preferred_name', e.target.value)} /></Field>
          <Field label="Date of birth"><input type="date" style={inputStyle} value={form.date_of_birth || ''} onChange={(e) => set('date_of_birth', e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="Phone" required><input style={inputStyle} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Email" required><input type="email" style={inputStyle} value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="Street address" grow={2}><input style={inputStyle} value={form.address_street || ''} onChange={(e) => set('address_street', e.target.value)} /></Field>
          <Field label="Apt / Unit"><input style={inputStyle} value={form.address_unit || ''} onChange={(e) => set('address_unit', e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="City"><input style={inputStyle} value={form.address_city || ''} onChange={(e) => set('address_city', e.target.value)} /></Field>
          <Field label="State">
            <select style={inputStyle} value={form.address_state || ''} onChange={(e) => set('address_state', e.target.value)}>
              <option value="">—</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="ZIP"><input style={inputStyle} value={form.address_zip || ''} onChange={(e) => set('address_zip', e.target.value)} /></Field>
        </Row>
      </Section>

      <Section title="Work eligibility">
        <Row>
          {yesNo('is_18_or_older', 'Are you 18 or older?')}
          {yesNo('work_authorized', 'Authorized to work in the U.S.?')}
        </Row>
        <Row>
          {yesNo('requires_sponsorship', 'Will you require visa sponsorship?')}
          {yesNo('has_transportation', 'Do you have reliable transportation?')}
        </Row>
      </Section>

      <Section title="Professional background">
        <Row>
          <Field label="Primary credential">
            <select style={inputStyle} value={form.credential_type || ''} onChange={(e) => set('credential_type', e.target.value)}>
              <option value="">—</option>
              {CREDENTIAL_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="License / certificate number"><input style={inputStyle} value={form.license_number || ''} onChange={(e) => set('license_number', e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="Years of caregiving experience"><input style={inputStyle} value={form.years_experience || ''} onChange={(e) => set('years_experience', e.target.value)} placeholder="e.g. 3" /></Field>
          <Field label="Languages spoken"><input style={inputStyle} value={form.languages || ''} onChange={(e) => set('languages', e.target.value)} placeholder="e.g. English, Spanish" /></Field>
        </Row>
      </Section>

      <Section title="Availability">
        <Row>
          <Field label="When can you start?"><input type="date" style={inputStyle} value={form.earliest_start_date || ''} onChange={(e) => set('earliest_start_date', e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="Describe your general availability" grow={3}>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.availability || ''} onChange={(e) => set('availability', e.target.value)} placeholder="Days, shifts, hours per week, etc." />
          </Field>
        </Row>
      </Section>

      <Section title="Emergency contact">
        <Row>
          <Field label="Full name"><input style={inputStyle} value={form.emergency_name || ''} onChange={(e) => set('emergency_name', e.target.value)} /></Field>
          <Field label="Relationship"><input style={inputStyle} value={form.emergency_relationship || ''} onChange={(e) => set('emergency_relationship', e.target.value)} /></Field>
          <Field label="Phone"><input style={inputStyle} value={form.emergency_phone || ''} onChange={(e) => set('emergency_phone', e.target.value)} /></Field>
        </Row>
      </Section>

      <Section title="References">
        <Row>
          <Field label="Reference 1 — name"><input style={inputStyle} value={form.reference1_name || ''} onChange={(e) => set('reference1_name', e.target.value)} /></Field>
          <Field label="Relationship"><input style={inputStyle} value={form.reference1_relationship || ''} onChange={(e) => set('reference1_relationship', e.target.value)} /></Field>
          <Field label="Phone or email"><input style={inputStyle} value={form.reference1_contact || ''} onChange={(e) => set('reference1_contact', e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="Reference 2 — name"><input style={inputStyle} value={form.reference2_name || ''} onChange={(e) => set('reference2_name', e.target.value)} /></Field>
          <Field label="Relationship"><input style={inputStyle} value={form.reference2_relationship || ''} onChange={(e) => set('reference2_relationship', e.target.value)} /></Field>
          <Field label="Phone or email"><input style={inputStyle} value={form.reference2_contact || ''} onChange={(e) => set('reference2_contact', e.target.value)} /></Field>
        </Row>
      </Section>

      <Section title="Documents (optional)">
        <p style={{ color: C.gray, fontSize: 13.5, lineHeight: 1.7, margin: '0 0 14px' }}>
          Attach any of the following if you have them. PDF, JPG, or PNG, up to {(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)} MB each.
          You can submit without these — we will request anything missing later.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', marginBottom: 14 }}>
          <label style={{ flex: '2 1 220px' }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.gray, marginBottom: 6 }}>Document type</span>
            <select style={inputStyle} value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
              {docTypes.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </label>
          <label style={{ flex: '1 1 160px' }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.gray, marginBottom: 6 }}>&nbsp;</span>
            <span style={{ ...btnGhost, display: 'inline-block', textAlign: 'center', width: '100%', boxSizing: 'border-box', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? 'Uploading…' : 'Choose file…'}
              <input type="file" accept={ACCEPTED_ACCEPT_ATTR} disabled={uploading} onChange={(e) => { onUpload(e.target.files?.[0] || null); e.target.value = '' }} style={{ display: 'none' }} />
            </span>
          </label>
        </div>

        {docs.length === 0 ? (
          <div style={{ padding: '14px 16px', background: C.bg, borderRadius: 9, fontSize: 13.5, color: C.faint }}>No documents attached yet.</div>
        ) : (
          docs.map((d) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 9, marginBottom: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: C.teal }}>{docTypeLabel(d.doc_type)}</span>
              <span style={{ color: C.faint }}>·</span>
              <span style={{ fontSize: 13.5, color: C.gray, wordBreak: 'break-all', flex: 1 }}>{d.file_name}</span>
              <button type="button" onClick={() => onDeleteDoc(d.id)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
            </div>
          ))
        )}
      </Section>

      <Section title="Attestation">
        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '12px 14px', background: C.bg, borderRadius: 10 }}>
          <input type="checkbox" checked={!!form.attested} onChange={(e) => set('attested', e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, color: C.gray, lineHeight: 1.65 }}>
            I certify that the information I have provided is true and complete to the best of my knowledge. I understand
            that any false statement may disqualify me from employment or be grounds for dismissal.
          </span>
        </label>
        <Row>
          <Field label="Type your full name to sign" required><input style={inputStyle} value={form.signature_name || ''} onChange={(e) => set('signature_name', e.target.value)} placeholder="Your full legal name" /></Field>
        </Row>
      </Section>

      {notice && <div style={{ marginTop: 18, padding: '11px 15px', background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}`, borderRadius: 9, fontSize: 13.5, fontWeight: 600 }}>{notice}</div>}
      {error && <div style={{ marginTop: 18, padding: '11px 15px', background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}`, borderRadius: 9, fontSize: 13.5, fontWeight: 600 }}>{error}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginTop: 24 }}>
        <button type="button" onClick={() => save('save')} disabled={busy || uploading} style={{ ...btnGhost, opacity: busy || uploading ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Save and finish later'}
        </button>
        <button type="button" onClick={() => save('submit')} disabled={busy || uploading} style={{ ...btnPrimary, opacity: busy || uploading ? 0.6 : 1 }}>
          {busy ? 'Submitting…' : 'Submit application'}
        </button>
      </div>
    </Shell>
  )
}
