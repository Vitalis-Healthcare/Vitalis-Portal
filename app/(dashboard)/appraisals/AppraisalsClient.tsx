'use client'
// app/(dashboard)/appraisals/AppraisalsClient.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Send, CheckCircle, Clock, FileText, ChevronDown, ChevronUp, X, Printer } from 'lucide-react'

const CLINICAL_ITEMS = [
  { key: 's_patient_care_duties',        label: 'Assists professional staff by performing patient care duties in the home' },
  { key: 's_medications',                label: 'Assists with medications that are ordinarily self-administered' },
  { key: 's_care_conferences',           label: 'Attends and participates in patient care conferences as specified in Agency policy' },
  { key: 's_personal_care',              label: 'Provides personal care and bath as assigned' },
  { key: 's_shampoo',                    label: 'Shampoos hair as ordered/directed as assigned' },
  { key: 's_bed_linen',                  label: 'Bed linen change as needed/patient/family requests and/or is RN directed' },
  { key: 's_vitals',                     label: 'Takes accurate temperature, pulse, respiration, blood pressure' },
  { key: 's_reports_changes',            label: 'Reports any unusual findings, changes in patient\'s condition to RN' },
  { key: 's_height_weight',              label: 'Takes accurate height and weight as assigned' },
  { key: 's_bedpan',                     label: 'Assists with placement of bedpan and urinal' },
  { key: 's_enemas',                     label: 'Administers enemas as assigned by the RN' },
  { key: 's_specimens',                  label: 'Collects specimen as directed by RN' },
  { key: 's_room_order',                 label: 'Leaves patient\'s room in order' },
  { key: 's_household_services',         label: 'Performs household services essential to health care in the home' },
  { key: 's_safety_devices',             label: 'Uses safety rules and regulations regarding assistive ambulatory devices' },
  { key: 's_body_mechanics',             label: 'When assisting patients, uses good body mechanics' },
  { key: 's_therapy_extension',          label: 'Performs simple procedures as an extension of therapy or nursing service' },
  { key: 's_equipment_cleaning',         label: 'Follows Agency policy for cleaning equipment between patient use' },
  { key: 's_documentation',             label: 'Carries out, reports and documents care given in an effective, timely manner' },
  { key: 's_asks_for_help',              label: 'Realizes when help is needed and asks RN for assistance' },
  { key: 's_own_actions',               label: 'Understands responsibility for own actions and omissions' },
  { key: 's_completes_work',             label: 'Completes all work assigned' },
  { key: 's_no_unqualified_assignments', label: 'Does not accept assignments without appropriate training' },
  { key: 's_confidentiality',            label: 'Observes confidentiality and safeguards all patient related information' },
  { key: 's_meetings',                   label: 'Attends staff meetings and patient care conferences as scheduled' },
  { key: 's_chart_documentation',        label: 'Maintains current documentation of status on chart' },
]

const PROFESSIONAL_ITEMS = [
  { key: 's_variance_reporting',         label: 'Any variance, accident or unusual occurrence is reported to the RN' },
  { key: 's_qapi',                       label: 'Participates in QAPI activities as requested' },
  { key: 's_policies_adherence',         label: 'Understands and adheres to established policies/procedures' },
  { key: 's_agency_standards',           label: 'Adheres to Agency standards and consistently performs all assigned responsibilities' },
  { key: 's_attendance',                 label: 'Maintains acceptable attendance status, per Agency policy' },
  { key: 's_tardiness',                  label: 'Maintains acceptable level of tardiness, per Agency policy' },
  { key: 's_reports_incomplete',         label: 'Reports incomplete work assignments to RN' },
  { key: 's_appearance',                 label: 'Appearance is always within Agency standard; is clean and well groomed' },
  { key: 's_time_management',            label: 'Demonstrates effective time management skills' },
  { key: 's_inservices',                 label: 'Attends position related inservices. Attends all mandatory inservice programs: minimally 12 hours/year' },
  { key: 's_clean_environment',          label: 'Maintains clean and neat work environment' },
  { key: 's_judgment',                   label: 'Demonstrates sound judgment and decision making' },
  { key: 's_cpr_certification',          label: 'Maintains current CPR certification, if required' },
  { key: 's_other_duties',              label: 'Performs other duties as assigned' },
]

const ALL_ITEMS = [...CLINICAL_ITEMS, ...PROFESSIONAL_ITEMS]

const SCORE_LABELS: Record<number, string> = { 1: 'Does Not Meet', 2: 'Needs Improvement', 3: 'Meets Standards', 4: 'Exceeds Standards' }
const SCORE_COLOR: Record<number, string>  = { 1: '#E63946', 2: '#F4A261', 3: '#457B9D', 4: '#2A9D8F' }
const SCORE_BG:    Record<number, string>  = { 1: '#FDE8E9', 2: '#FEF3EA', 3: '#EBF4FF', 4: '#E6F6F4' }

interface Caregiver { id: string; full_name: string }
interface Appraisal {
  id: string; status: string; appraisal_period?: string; comments?: string
  signed_at?: string; caregiver_signature?: string; sent_at?: string; created_at: string
  caregiver?: { full_name: string } | { full_name: string }[]
  appraiser?: { full_name: string } | { full_name: string }[]
  [key: string]: any
}

const getName = (v: any) => Array.isArray(v) ? v[0]?.full_name : v?.full_name


  function StatusToggle({ value, onChange, counts }: {
    value: 'all' | 'active' | 'inactive'
    onChange: (v: 'all' | 'active' | 'inactive') => void
    counts: { all: number; active: number; inactive: number }
  }) {
    const opts = [
      { key: 'all',      label: 'All',      color: '#1A2E44', bg: '#EFF2F5' },
      { key: 'active',   label: 'Active',   color: '#0E7C7B', bg: '#E6F4F4' },
      { key: 'inactive', label: 'Inactive', color: '#8FA0B0', bg: '#F8F8F8' },
    ] as const
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {opts.map(o => (
          <button key={o.key} onClick={() => onChange(o.key)}
            style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${value === o.key ? o.color : '#E0E0E0'}`,
              background: value === o.key ? o.bg : '#fff', color: value === o.key ? o.color : '#AAA',
              fontSize: 12, fontWeight: value === o.key ? 700 : 500, cursor: 'pointer' }}>
            {o.label} ({counts[o.key]})
          </button>
        ))}
      </div>
    )
  }

export default function AppraisalsClient({ caregivers, appraisals, currentUserId }: {
  caregivers: Caregiver[]; appraisals: Appraisal[]; currentUserId: string
}) {
  const router = useRouter()
  const [view, setView]       = useState<'list'|'new'|'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const initScores = () => Object.fromEntries(ALL_ITEMS.map(i => [i.key, 0]))

  const [form, setForm] = useState<{ caregiver_id: string; appraisal_period: string; comments: string; [key: string]: any }>({
    caregiver_id: '', appraisal_period: `${new Date().getFullYear()} Annual`, comments: '',
    ...initScores()
  })

  const openNew = () => {
    setForm({ caregiver_id: '', appraisal_period: `${new Date().getFullYear()} Annual`, comments: '', ...initScores() })
    setEditingId(null)
    setView('new')
  }

  const openEdit = (a: Appraisal) => {
    const scores = Object.fromEntries(ALL_ITEMS.map(i => [i.key, a[i.key] || 0]))
    setForm({ caregiver_id: a.caregiver_id || '', appraisal_period: a.appraisal_period || '', comments: a.comments || '', ...scores })
    setEditingId(a.id)
    setView('edit')
  }

  const handleSave = async (sendAfter = false) => {
    if (!form.caregiver_id) { alert('Please select a caregiver'); return }
    setSaving(true)

    const scores = Object.fromEntries(ALL_ITEMS.map(i => [i.key, form[i.key] || null]))
    const res = await fetch('/api/appraisals/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caregiver_id: form.caregiver_id,
        appraisal_period: form.appraisal_period,
        comments: form.comments,
        scores,
        appraisalId: editingId,
      }),
    })

    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Save failed'); setSaving(false); return }

    if (sendAfter) {
      const sendRes = await fetch('/api/appraisals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appraisalId: data.appraisal.id }),
      })
      if (!sendRes.ok) { const e = await sendRes.json(); alert(e.error || 'Send failed') }
    }

    setSaving(false)
    setView('list')
    router.refresh()
  }

  const handleSend = async (appraisalId: string) => {
    setSending(appraisalId)
    const res = await fetch('/api/appraisals/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appraisalId }),
    })
    if (!res.ok) { const e = await res.json(); alert(e.error || 'Send failed') }
    setSending(null)
    router.refresh()
  }

  const statusColor = (s: string) => s === 'signed' ? '#2A9D8F' : s === 'sent' ? '#457B9D' : '#8FA0B0'
  const statusBg    = (s: string) => s === 'signed' ? '#E6F6F4' : s === 'sent' ? '#EBF4FF' : '#EFF2F5'
  const statusLabel = (s: string) => s === 'signed' ? '✓ Signed' : s === 'sent' ? '⏳ Awaiting Sign-off' : '📝 Draft'

  const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 7, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }

  const scoreInput = (key: string, label: string) => (
    <tr key={key} style={{ borderBottom: '1px solid #F3F4F6' }}>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#1A2E44', lineHeight: 1.5, width: '60%' }}>{label}</td>
      <td style={{ padding: '8px 14px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1,2,3,4].map(s => (
            <button
              key={s}
              onClick={() => setForm(f => ({ ...f, [key]: f[key] === s ? 0 : s }))}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: 6, border: `1.5px solid ${form[key] === s ? SCORE_COLOR[s] : '#E2E8F0'}`,
                background: form[key] === s ? SCORE_BG[s] : '#fff',
                color: form[key] === s ? SCORE_COLOR[s] : '#8FA0B0',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </td>
    </tr>
  )

  if (view === 'new' || view === 'edit') {
    const scoredCount = ALL_ITEMS.filter(i => form[i.key] > 0).length
    const totalScore  = ALL_ITEMS.reduce((sum, i) => sum + (form[i.key] || 0), 0)
    const avg = scoredCount > 0 ? (totalScore / scoredCount).toFixed(1) : '—'

    return (
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0E7C7B', fontSize: 13, fontWeight: 600 }}>← Back</button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E44', margin: 0 }}>
            {editingId ? 'Edit Appraisal' : 'New Performance Appraisal'}
          </h1>
        </div>

        {/* Form header */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }}>Caregiver <span style={{ color: '#E63946' }}>*</span></label>
            <select value={form.caregiver_id} onChange={e => setForm(f => ({ ...f, caregiver_id: e.target.value }))} style={inp} disabled={!!editingId}>
              <option value="">Select caregiver…</option>
              {caregivers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }}>Appraisal Period</label>
            <input value={form.appraisal_period} onChange={e => setForm(f => ({ ...f, appraisal_period: e.target.value }))} style={inp} placeholder="e.g. 2025 Annual" />
          </div>
        </div>

        {/* Score legend */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B0' }}>RATING:</div>
          {[1,2,3,4].map(s => (
            <span key={s} style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: SCORE_BG[s], color: SCORE_COLOR[s] }}>
              {s} — {SCORE_LABELS[s]}
            </span>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700 }}>
            {scoredCount}/{ALL_ITEMS.length} rated
            {scoredCount > 0 && <span style={{ color: '#0E7C7B', marginLeft: 8 }}>Avg: {avg}</span>}
          </div>
        </div>

        {/* Clinical section */}
        <div style={{ background: '#fff', borderRadius: 12, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', background: '#F8FAFB', borderBottom: '1px solid #EFF2F5' }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: '#1A2E44', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clinical Duties</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFB' }}>
                <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #EFF2F5', width: '60%' }}>Competency</th>
                <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #EFF2F5' }}>1 — 2 — 3 — 4</th>
              </tr>
            </thead>
            <tbody>{CLINICAL_ITEMS.map(i => scoreInput(i.key, i.label))}</tbody>
          </table>
        </div>

        {/* Professional section */}
        <div style={{ background: '#fff', borderRadius: 12, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', background: '#F8FAFB', borderBottom: '1px solid #EFF2F5' }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: '#1A2E44', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Professional Conduct</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFB' }}>
                <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #EFF2F5', width: '60%' }}>Competency</th>
                <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #EFF2F5' }}>1 — 2 — 3 — 4</th>
              </tr>
            </thead>
            <tbody>{PROFESSIONAL_ITEMS.map(i => scoreInput(i.key, i.label))}</tbody>
          </table>
        </div>

        {/* Comments */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 6 }}>Comments (optional)</label>
          <textarea
            value={form.comments}
            onChange={e => setForm(f => ({ ...f, comments: e.target.value }))}
            placeholder="Overall performance summary, areas for improvement, goals…"
            style={{ ...inp, minHeight: 100, resize: 'vertical' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={() => setView('list')} style={{ padding: '10px 20px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#4A6070', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => handleSave(false)} disabled={saving} style={{ padding: '10px 22px', background: '#EFF2F5', color: '#1A2E44', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : '💾 Save Draft'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 24px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            <Send size={14}/> {saving ? 'Sending…' : 'Save & Send to Caregiver'}
          </button>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Performance Appraisals</h1>
          <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>HHA performance evaluations — fill, send, and track caregiver sign-offs</p>
          <div style={{ marginTop: 10 }}>
            <StatusToggle value={statusFilter} onChange={setStatusFilter} counts={{
              all: caregivers.length,
              active: caregivers.filter(c => c.status === 'active').length,
              inactive: caregivers.filter(c => c.status !== 'active').length,
            }} />
          </div>
        </div>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16}/> New Appraisal
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total', value: appraisals.length, color: '#1A2E44' },
          { label: 'Awaiting Sign-off', value: appraisals.filter(a => a.status === 'sent').length, color: '#457B9D' },
          { label: 'Signed', value: appraisals.filter(a => a.status === 'signed').length, color: '#2A9D8F' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', borderLeft: `4px solid ${s.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#1A2E44', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Appraisals list */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {appraisals.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#8FA0B0', fontSize: 14 }}>
            <FileText size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
            No appraisals yet. Click "New Appraisal" to get started.
          </div>
        ) : appraisals.map((a, i) => {
          const isExpanded = expandedId === a.id
          const scoredItems = ALL_ITEMS.filter(item => a[item.key])
          const avg = scoredItems.length > 0
            ? (scoredItems.reduce((sum, item) => sum + a[item.key], 0) / scoredItems.length).toFixed(1)
            : '—'

          return (
            <div key={a.id} style={{ borderBottom: i < appraisals.length - 1 ? '1px solid #EFF2F5' : 'none' }}>
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Link href={`/staff/${a.caregiver_id}`} style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', textDecoration: 'none' }} onMouseEnter={e=>(e.currentTarget.style.color='#0E7C7B')} onMouseLeave={e=>(e.currentTarget.style.color='#1A2E44')}>{getName(a.caregiver)}</Link>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusBg(a.status), color: statusColor(a.status) }}>
                      {statusLabel(a.status)}
                    </span>
                    {avg !== '—' && (
                      <span style={{ fontSize: 12, color: '#0E7C7B', fontWeight: 600 }}>Avg: {avg}/4.0</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#8FA0B0', marginTop: 3 }}>
                    {a.appraisal_period || '—'}
                    {a.sent_at && ` · Sent ${new Date(a.sent_at).toLocaleDateString()}`}
                    {a.signed_at && ` · Signed ${new Date(a.signed_at).toLocaleDateString()}`}
                    {a.caregiver_signature && ` · "${a.caregiver_signature}"`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {a.status === 'draft' && (
                    <>
                      <button onClick={() => openEdit(a)} style={{ padding: '7px 14px', background: '#EFF2F5', border: 'none', borderRadius: 7, color: '#4A6070', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleSend(a.id)} disabled={sending === a.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#0E7C7B', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: sending === a.id ? 0.6 : 1 }}>
                        <Send size={11}/> {sending === a.id ? 'Sending…' : 'Send'}
                      </button>
                    </>
                  )}
                  {a.status === 'sent' && (
                    <button onClick={() => handleSend(a.id)} disabled={sending === a.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#EBF4FF', border: 'none', borderRadius: 7, color: '#457B9D', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <Send size={11}/> Resend
                    </button>
                  )}
                  <a
                    href={`/api/appraisals/print?appraisalId=${a.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 7, color: '#4A6070', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                  >
                    <Printer size={12}/> Print
                  </a>
                  <button onClick={() => setExpandedId(isExpanded ? null : a.id)} style={{ padding: '7px 10px', background: '#F8FAFB', border: 'none', borderRadius: 7, color: '#8FA0B0', cursor: 'pointer' }}>
                    {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </button>
                </div>
              </div>

              {/* Expanded scores */}
              {isExpanded && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid #EFF2F5' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8, marginTop: 16 }}>
                    {ALL_ITEMS.filter(item => a[item.key]).map(item => (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, background: '#F8FAFB', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#4A6070', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: SCORE_BG[a[item.key]], color: SCORE_COLOR[a[item.key]], flexShrink: 0 }}>
                          {a[item.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                  {a.comments && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#F8FAFB', borderRadius: 8, fontSize: 13, color: '#4A6070', border: '1px solid #EFF2F5' }}>
                      {a.comments}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
