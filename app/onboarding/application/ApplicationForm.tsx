'use client'
// app/onboarding/application/ApplicationForm.tsx
// Candidate-facing application form (v0.6.5 expansion). Sectioned inputs +
// optional document uploads (incl. résumé). Save draft any time; submit when
// ready. Read-only when already submitted / under review.
import { useState } from 'react'
import type {
  ApplicationData, WorkExperience, ReferenceEntry, EmergencyContact,
} from '@/lib/onboarding/application'
import {
  CREDENTIAL_TYPES, US_STATES, GENDER_OPTIONS, WILLING_TO_WORK_WITH, EXPERIENCE_WITH,
  WEEK_DAYS, REFERENCE_SLOTS, MAX_WORK_EXPERIENCE, MAX_EMERGENCY_CONTACTS,
} from '@/lib/onboarding/application'
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
const btnPrimary: React.CSSProperties = { padding: '13px 30px', background: 'linear-gradient(135deg,#0E7C7B,#1A9B87)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const btnGhost: React.CSSProperties = { padding: '13px 24px', background: '#fff', border: `1px solid ${C.border}`, color: C.gray, borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14.5, color: C.navy, background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '24px 16px 56px', fontFamily: "'DM Sans','Segoe UI',Arial,sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%)', padding: '22px 28px', borderRadius: '14px 14px 0 0', textAlign: 'center' }}>
          <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#0E7C7B,#F4A261)', borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 10 }}>V+</div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 800 }}>Vitalis Caregiver Application</h1>
        </div>
        <div style={{ background: '#fff', padding: '28px', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 14px 14px' }}>{children}</div>
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
  token: string; firstName: string; initial: ApplicationData
  documents: DocsState; docTypes: DocTypeDef[]; readOnly: boolean; submitted: boolean
}) {
  // Seed repeatable groups so the form always has the right slots.
  const seeded: ApplicationData = {
    ...initial,
    applicant_references: REFERENCE_SLOTS.map((slot, i) => ({
      kind: slot.kind,
      ...(initial.applicant_references?.[i] || {}),
    })),
    work_experience: (initial.work_experience && initial.work_experience.length) ? initial.work_experience : [{}],
    emergency_contacts: (initial.emergency_contacts && initial.emergency_contacts.length) ? initial.emergency_contacts : [{}],
    availability_days: initial.availability_days || {},
  }

  const [form, setForm] = useState<ApplicationData>(seeded)
  const [docs, setDocs] = useState<DocsState>(documents)
  const [uploadType, setUploadType] = useState<string>(docTypes[0]?.key || 'other')
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function set<K extends keyof ApplicationData>(key: K, value: ApplicationData[K]) {
    setForm((f) => ({ ...f, [key]: value })); setNotice(''); setError('')
  }
  function toggleSkill(field: 'willing_to_work_with' | 'experience_with', val: string) {
    setForm((f) => {
      const arr = f[field] || []
      return { ...f, [field]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] }
    }); setNotice(''); setError('')
  }
  function setDay(key: string, value: string) {
    setForm((f) => ({ ...f, availability_days: { ...(f.availability_days || {}), [key]: value } })); setNotice(''); setError('')
  }
  function updateExp(i: number, key: keyof WorkExperience, value: unknown) {
    setForm((f) => { const arr = [...(f.work_experience || [])]; arr[i] = { ...arr[i], [key]: value }; return { ...f, work_experience: arr } }); setNotice(''); setError('')
  }
  function addExp() { setForm((f) => ({ ...f, work_experience: [...(f.work_experience || []), {}] })) }
  function removeExp(i: number) { setForm((f) => ({ ...f, work_experience: (f.work_experience || []).filter((_, j) => j !== i) })) }
  function updateRef(i: number, key: keyof ReferenceEntry, value: string) {
    setForm((f) => { const arr = [...(f.applicant_references || [])]; arr[i] = { ...arr[i], [key]: value }; return { ...f, applicant_references: arr } }); setNotice(''); setError('')
  }
  function updateEmg(i: number, key: keyof EmergencyContact, value: string) {
    setForm((f) => { const arr = [...(f.emergency_contacts || [])]; arr[i] = { ...arr[i], [key]: value }; return { ...f, emergency_contacts: arr } }); setNotice(''); setError('')
  }
  function addEmg() { setForm((f) => ({ ...f, emergency_contacts: [...(f.emergency_contacts || []), {}] })) }
  function removeEmg(i: number) { setForm((f) => ({ ...f, emergency_contacts: (f.emergency_contacts || []).filter((_, j) => j !== i) })) }

  async function onUpload(file: File | null) {
    if (!file) return
    setError(''); setNotice('')
    if (file.size > MAX_FILE_BYTES) { setError(`“${file.name}” is too large. Please upload a file up to ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)} MB.`); return }
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('token', token); fd.append('doc_type', uploadType); fd.append('file', file)
      const res = await fetch('/api/onboarding/documents', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Upload failed. Please try again.'); return }
      setDocs((d) => [data.document as StoredDocument, ...d]); setNotice(`Uploaded ${docTypeLabel(uploadType)}.`)
    } catch { setError('Upload failed. Please check your connection and try again.') } finally { setUploading(false) }
  }
  async function onDeleteDoc(id: string) {
    setError(''); setNotice('')
    try {
      const res = await fetch('/api/onboarding/documents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, id }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not remove that file.'); return }
      setDocs((d) => d.filter((x) => x.id !== id))
    } catch { setError('Could not remove that file. Please try again.') }
  }
  async function save(action: 'save' | 'submit') {
    setBusy(true); setError(''); setNotice('')
    try {
      const res = await fetch('/api/onboarding/application', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, action, application: form }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong. Please try again.'); return }
      if (action === 'submit') { setDone(true); window.scrollTo({ top: 0 }) }
      else { setNotice('Your progress has been saved. You can come back to this link any time.') }
    } catch { setError('Something went wrong. Please check your connection and try again.') } finally { setBusy(false) }
  }

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

  const yesNo = (key: keyof ApplicationData, label: string) => {
    const val = form[key]
    return (
      <Field label={label}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ v: true, t: 'Yes' }, { v: false, t: 'No' }].map(({ v, t }) => {
            const active = val === v
            return (
              <button key={t} type="button" onClick={() => set(key, v as ApplicationData[typeof key])}
                style={{ flex: 1, padding: '10px 0', borderRadius: 9, cursor: 'pointer', fontSize: 14, fontWeight: 700, background: active ? C.tealSoft : '#fff', border: `1.5px solid ${active ? C.tealBtn : C.border}`, color: active ? C.teal : C.gray }}>{t}</button>
            )
          })}
        </div>
      </Field>
    )
  }

  const CheckGrid = ({ options, selected, onToggle }: { options: readonly string[]; selected: string[]; onToggle: (v: string) => void }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const on = selected.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => onToggle(opt)}
            style={{ padding: '8px 14px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', background: on ? C.tealSoft : '#fff', border: `1.5px solid ${on ? C.tealBtn : C.border}`, color: on ? C.teal : C.gray }}>
            {on ? '✓ ' : ''}{opt}
          </button>
        )
      })}
    </div>
  )

  return (
    <Shell>
      <h2 style={{ fontSize: 20, color: C.navy, margin: '0 0 8px' }}>Welcome, {firstName} — let’s finish your application</h2>
      <p style={{ color: C.gray, fontSize: 14.5, lineHeight: 1.7, margin: 0 }}>
        Please complete the sections below and attach any documents you have on hand (including your résumé). You can
        <strong> save your progress</strong> and return to this same link any time before you submit.
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
          <Field label="Gender">
            <select style={inputStyle} value={form.gender || ''} onChange={(e) => set('gender', e.target.value)}>
              <option value="">—</option>
              {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="Mobile phone" required><input style={inputStyle} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Home phone"><input style={inputStyle} value={form.home_phone || ''} onChange={(e) => set('home_phone', e.target.value)} /></Field>
          <Field label="Email" required><input type="email" style={inputStyle} value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="Social Security number"><input style={inputStyle} value={form.ssn || ''} onChange={(e) => set('ssn', e.target.value)} placeholder="XXX-XX-XXXX" /></Field>
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

      <Section title="Driver’s license">
        <Row>
          {yesNo('driver_license_received', 'Do you have a driver’s license?')}
          <Field label="License number"><input style={inputStyle} value={form.driver_license_number || ''} onChange={(e) => set('driver_license_number', e.target.value)} /></Field>
          <Field label="Issuing state">
            <select style={inputStyle} value={form.driver_license_state || ''} onChange={(e) => set('driver_license_state', e.target.value)}>
              <option value="">—</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </Row>
      </Section>

      <Section title="Work eligibility">
        <Row>{yesNo('is_18_or_older', 'Are you 18 or older?')}{yesNo('work_authorized', 'Authorized to work in the U.S.?')}</Row>
        <Row>{yesNo('requires_sponsorship', 'Will you require visa sponsorship?')}{yesNo('has_transportation', 'Do you have reliable transportation?')}</Row>
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

      <Section title="Previous caregiver experience">
        {(form.work_experience || []).map((exp, i) => (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 11, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>Experience {i + 1}</span>
              {(form.work_experience || []).length > 1 && (
                <button type="button" onClick={() => removeExp(i)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
              )}
            </div>
            <Row>
              <Field label="Organization" grow={2}><input style={inputStyle} value={exp.organization || ''} onChange={(e) => updateExp(i, 'organization', e.target.value)} /></Field>
              <Field label="Dates worked"><input style={inputStyle} value={exp.dates_worked || ''} onChange={(e) => updateExp(i, 'dates_worked', e.target.value)} placeholder="e.g. 2019–2022" /></Field>
            </Row>
            <Row>
              <Field label="Contact person"><input style={inputStyle} value={exp.contact_person || ''} onChange={(e) => updateExp(i, 'contact_person', e.target.value)} /></Field>
              <Field label="Telephone"><input style={inputStyle} value={exp.telephone || ''} onChange={(e) => updateExp(i, 'telephone', e.target.value)} /></Field>
              <div style={{ flex: '1 1 200px' }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.gray, marginBottom: 6 }}>May we contact?</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ v: true, t: 'Yes' }, { v: false, t: 'No' }].map(({ v, t }) => {
                    const active = exp.may_contact === v
                    return <button key={t} type="button" onClick={() => updateExp(i, 'may_contact', v)} style={{ flex: 1, padding: '10px 0', borderRadius: 9, cursor: 'pointer', fontSize: 14, fontWeight: 700, background: active ? C.tealSoft : '#fff', border: `1.5px solid ${active ? C.tealBtn : C.border}`, color: active ? C.teal : C.gray }}>{t}</button>
                  })}
                </div>
              </div>
            </Row>
          </div>
        ))}
        {(form.work_experience || []).length < MAX_WORK_EXPERIENCE && (
          <button type="button" onClick={addExp} style={{ ...btnGhost, padding: '9px 18px', fontSize: 14 }}>+ Add another experience</button>
        )}
      </Section>

      <Section title="References">
        <p style={{ color: C.gray, fontSize: 13.5, lineHeight: 1.7, margin: '0 0 14px' }}>Please provide two professional references and one character reference. Do not list family or friends as professional references.</p>
        {REFERENCE_SLOTS.map((slot, i) => (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 11, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 10 }}>{slot.label}</div>
            <Row>
              <Field label="Name"><input style={inputStyle} value={form.applicant_references?.[i]?.name || ''} onChange={(e) => updateRef(i, 'name', e.target.value)} /></Field>
              <Field label="Position / title"><input style={inputStyle} value={form.applicant_references?.[i]?.title || ''} onChange={(e) => updateRef(i, 'title', e.target.value)} /></Field>
            </Row>
            <Row>
              <Field label="Telephone"><input style={inputStyle} value={form.applicant_references?.[i]?.phone || ''} onChange={(e) => updateRef(i, 'phone', e.target.value)} /></Field>
              <Field label="Dates known"><input style={inputStyle} value={form.applicant_references?.[i]?.dates_known || ''} onChange={(e) => updateRef(i, 'dates_known', e.target.value)} /></Field>
            </Row>
          </div>
        ))}
      </Section>

      <Section title="Emergency contacts">
        {(form.emergency_contacts || []).map((c, i) => (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 11, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>Contact {i + 1}</span>
              {(form.emergency_contacts || []).length > 1 && (
                <button type="button" onClick={() => removeEmg(i)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
              )}
            </div>
            <Row>
              <Field label="Full name"><input style={inputStyle} value={c.name || ''} onChange={(e) => updateEmg(i, 'name', e.target.value)} /></Field>
              <Field label="Relationship"><input style={inputStyle} value={c.relationship || ''} onChange={(e) => updateEmg(i, 'relationship', e.target.value)} /></Field>
            </Row>
            <Row>
              <Field label="Phone"><input style={inputStyle} value={c.phone || ''} onChange={(e) => updateEmg(i, 'phone', e.target.value)} /></Field>
              <Field label="Phone type"><input style={inputStyle} value={c.phone_type || ''} onChange={(e) => updateEmg(i, 'phone_type', e.target.value)} placeholder="Mobile / Home / Work" /></Field>
            </Row>
          </div>
        ))}
        {(form.emergency_contacts || []).length < MAX_EMERGENCY_CONTACTS && (
          <button type="button" onClick={addEmg} style={{ ...btnGhost, padding: '9px 18px', fontSize: 14 }}>+ Add another contact</button>
        )}
      </Section>

      <Section title="Skills & preferences">
        <div style={{ marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.gray, marginBottom: 8 }}>Who and what are you willing to work with?</span>
          <CheckGrid options={WILLING_TO_WORK_WITH} selected={form.willing_to_work_with || []} onToggle={(v) => toggleSkill('willing_to_work_with', v)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.gray, marginBottom: 8 }}>What do you have hands-on experience with?</span>
          <CheckGrid options={EXPERIENCE_WITH} selected={form.experience_with || []} onToggle={(v) => toggleSkill('experience_with', v)} />
        </div>
        <Row>
          <Field label="Additional certifications" grow={3}>
            <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={form.additional_certifications || ''} onChange={(e) => set('additional_certifications', e.target.value)} placeholder="List any additional certifications you hold" />
          </Field>
        </Row>
      </Section>

      <Section title="Availability">
        <Row>
          <Field label="When can you start?"><input type="date" style={inputStyle} value={form.earliest_start_date || ''} onChange={(e) => set('earliest_start_date', e.target.value)} /></Field>
          {yesNo('available_all_hours', 'Available for all hours?')}
        </Row>
        {form.available_all_hours !== true && (
          <div style={{ marginBottom: 14 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.gray, marginBottom: 8 }}>Day-by-day availability</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {WEEK_DAYS.map((d) => (
                <label key={d.key} style={{ flex: '1 1 130px' }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.faint, marginBottom: 4 }}>{d.label}</span>
                  <input style={inputStyle} value={form.availability_days?.[d.key] || ''} onChange={(e) => setDay(d.key, e.target.value)} placeholder="e.g. 8a–4p" />
                </label>
              ))}
            </div>
          </div>
        )}
        <Row>
          {yesNo('live_in_interested', 'Interested in live-in care?')}
          {form.live_in_interested === true && (
            <Field label="Max consecutive days"><input style={inputStyle} value={form.live_in_max_days || ''} onChange={(e) => set('live_in_max_days', e.target.value)} placeholder="e.g. 5" /></Field>
          )}
        </Row>
        <Row>
          <Field label="Describe your general availability" grow={3}>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.availability || ''} onChange={(e) => set('availability', e.target.value)} placeholder="Anything else about your availability" />
          </Field>
        </Row>
      </Section>

      <Section title="A few more questions">
        <Row>
          {yesNo('smoker', 'Are you a smoker?')}
          {form.smoker === true && (
            <Field label="If yes, how many per day?"><input style={inputStyle} value={form.smoker_per_day || ''} onChange={(e) => set('smoker_per_day', e.target.value)} /></Field>
          )}
        </Row>
        <Row>
          <Field label="How did you hear about us?" grow={3}><input style={inputStyle} value={form.how_heard || ''} onChange={(e) => set('how_heard', e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="Tell us about your recent caregiving experience" grow={3}>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.recent_experience || ''} onChange={(e) => set('recent_experience', e.target.value)} />
          </Field>
        </Row>
        <Row>
          <Field label="Why do you want to be a caregiver with us?" grow={3}>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.why_caregiver || ''} onChange={(e) => set('why_caregiver', e.target.value)} />
          </Field>
        </Row>
      </Section>

      <Section title="Documents (optional)">
        <p style={{ color: C.gray, fontSize: 13.5, lineHeight: 1.7, margin: '0 0 14px' }}>
          Attach your <strong>résumé</strong> and any of the listed documents if you have them. PDF, JPG, or PNG, up to {(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)} MB each.
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
        <Row><Field label="Type your full name to sign" required><input style={inputStyle} value={form.signature_name || ''} onChange={(e) => set('signature_name', e.target.value)} placeholder="Your full legal name" /></Field></Row>
      </Section>

      {notice && <div style={{ marginTop: 18, padding: '11px 15px', background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}`, borderRadius: 9, fontSize: 13.5, fontWeight: 600 }}>{notice}</div>}
      {error && <div style={{ marginTop: 18, padding: '11px 15px', background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}`, borderRadius: 9, fontSize: 13.5, fontWeight: 600 }}>{error}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginTop: 24 }}>
        <button type="button" onClick={() => save('save')} disabled={busy || uploading} style={{ ...btnGhost, opacity: busy || uploading ? 0.6 : 1 }}>{busy ? 'Saving…' : 'Save and finish later'}</button>
        <button type="button" onClick={() => save('submit')} disabled={busy || uploading} style={{ ...btnPrimary, opacity: busy || uploading ? 0.6 : 1 }}>{busy ? 'Submitting…' : 'Submit application'}</button>
      </div>
    </Shell>
  )
}
