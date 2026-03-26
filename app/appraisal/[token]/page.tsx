'use client'
// app/appraisal/[token]/page.tsx
// Public page — no login required.
// Caregiver reviews their HHA performance appraisal and signs off.

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const SCORE_LABELS: Record<number, string> = { 1: 'Does Not Meet Standards', 2: 'Needs Improvement', 3: 'Meets Standards', 4: 'Exceeds Standards' }
const SCORE_COLOR: Record<number, string> = { 1: '#E63946', 2: '#F4A261', 3: '#457B9D', 4: '#2A9D8F' }
const SCORE_BG:    Record<number, string> = { 1: '#FDE8E9', 2: '#FEF3EA', 3: '#EBF4FF', 4: '#E6F6F4' }

const CLINICAL_ITEMS = [
  { key: 's_patient_care_duties',        label: 'Assists professional staff by performing patient care duties in the home' },
  { key: 's_medications',                label: 'Assists with medications that are ordinarily self-administered' },
  { key: 's_care_conferences',           label: 'Attends and participates in patient care conferences as specified in Agency policy' },
  { key: 's_personal_care',              label: 'Provides personal care and bath as assigned' },
  { key: 's_shampoo',                    label: 'Shampoos hair as ordered/directed as assigned' },
  { key: 's_bed_linen',                  label: 'Bed linen change as needed/patient/family requests and/or is RN directed' },
  { key: 's_vitals',                     label: 'Takes accurate temperature, pulse, respiration, blood pressure' },
  { key: 's_reports_changes',            label: 'Reports any unusual findings, changes in patient\'s condition to RN' },
  { key: 's_height_weight',              label: 'Takes accurate height and weight as assigned. Records on medical record' },
  { key: 's_bedpan',                     label: 'Assists with placement of bedpan and urinal' },
  { key: 's_enemas',                     label: 'Administers enemas as assigned by the RN' },
  { key: 's_specimens',                  label: 'Collects specimen as directed by RN; reports immediately to RN any unusual specimens' },
  { key: 's_room_order',                 label: 'Leaves patient\'s room in order, disposing of papers, cups and other items in trash' },
  { key: 's_household_services',         label: 'Performs household services essential to health care in the home as RN assigned' },
  { key: 's_safety_devices',             label: 'Uses safety rules and regulations regarding assistive ambulatory devices' },
  { key: 's_body_mechanics',             label: 'When assisting patients, uses good body mechanics' },
  { key: 's_therapy_extension',          label: 'Performs simple procedures as an extension of the therapy or nursing service as assigned' },
  { key: 's_equipment_cleaning',         label: 'Follows Agency policy for cleaning equipment between patient use' },
  { key: 's_documentation',             label: 'Carries out, reports and documents care given in an effective, timely manner' },
  { key: 's_asks_for_help',              label: 'Realizes when help is needed and asks RN for assistance when appropriate' },
  { key: 's_own_actions',               label: 'Understands responsibility for own actions and omissions' },
  { key: 's_completes_work',             label: 'Completes all work assigned' },
  { key: 's_no_unqualified_assignments', label: 'Does not accept assignments for a patient with special needs for which he/she has not received appropriate training' },
  { key: 's_confidentiality',            label: 'Observes confidentiality and safeguards all patient related information' },
  { key: 's_meetings',                   label: 'Attends staff meetings and patient care conferences as scheduled' },
  { key: 's_chart_documentation',        label: 'Maintains current documentation of status on chart and gives proper report to RN' },
]

const PROFESSIONAL_ITEMS = [
  { key: 's_variance_reporting',         label: 'Any variance, accident or unusual occurrence is reported to the RN' },
  { key: 's_qapi',                       label: 'Participates in QAPI activities as requested' },
  { key: 's_policies_adherence',         label: 'Understands and adheres to established policies/procedures' },
  { key: 's_agency_standards',           label: 'Adheres to Agency standards and consistently interprets and accurately performs all assigned responsibilities' },
  { key: 's_attendance',                 label: 'Maintains acceptable attendance status, per Agency policy' },
  { key: 's_tardiness',                  label: 'Maintains acceptable level of tardiness, per Agency policy' },
  { key: 's_reports_incomplete',         label: 'Reports incomplete work assignments to RN' },
  { key: 's_appearance',                 label: 'Appearance is always within Agency standard; is clean and well groomed' },
  { key: 's_time_management',            label: 'Demonstrates effective time management skills through daily documentation and infrequent overtime for routine assignments' },
  { key: 's_inservices',                 label: 'Attends position related inservices. Attends all mandatory inservice programs as scheduled: minimally 12 hours/year' },
  { key: 's_clean_environment',          label: 'Maintains clean and neat work environment' },
  { key: 's_judgment',                   label: 'Demonstrates sound judgment and decision making' },
  { key: 's_cpr_certification',          label: 'Maintains current CPR certification, if required' },
  { key: 's_other_duties',              label: 'Performs other duties as assigned' },
]

type AppraisalData = {
  caregiver_name: string
  appraiser_name: string
  appraisal_period: string
  status: string
  comments?: string
  signed_at?: string
  [key: string]: any
}

export default function AppraisalSignPage() {
  const params = useParams()
  const token  = params?.token as string

  const [data, setData]         = useState<AppraisalData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [signature, setSignature] = useState('')
  const [signing, setSigning]   = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`/api/appraisals/info?token=${token}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Unable to load this appraisal.'); setLoading(false) })
  }, [token])

  const handleSign = async () => {
    if (!signature.trim()) { alert('Please type your full name as your signature.'); return }
    setSigning(true)
    const res = await fetch('/api/appraisals/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, caregiver_signature: signature }),
    })
    const d = await res.json()
    if (res.ok) { setDone(true) }
    else { setError(d.error || 'Sign-off failed. Please try again.'); setSigning(false) }
  }

  const scoreRow = (item: { key: string; label: string }, score: number) => (
    <tr key={item.key} style={{ borderBottom: '1px solid #F3F4F6' }}>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#1A2E44', lineHeight: 1.5 }}>{item.label}</td>
      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
        {score ? (
          <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: SCORE_BG[score], color: SCORE_COLOR[score] }}>
            {score} — {SCORE_LABELS[score]}
          </span>
        ) : <span style={{ color: '#D1D9E0', fontSize: 12 }}>—</span>}
      </td>
    </tr>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#8FA0B0', fontSize: 14 }}>Loading appraisal…</div>
    </div>
  )

  if (error && !data) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, maxWidth: 480, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ fontSize: 18, color: '#1A2E44', marginBottom: 8 }}>Link Not Found</h2>
        <p style={{ color: '#8FA0B0', fontSize: 14 }}>{error}</p>
      </div>
    </div>
  )

  if (done || data?.status === 'signed') return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, maxWidth: 480, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E44', marginBottom: 8 }}>
          {done ? 'Appraisal Signed' : 'Already Signed'}
        </h2>
        <p style={{ color: '#4A6070', fontSize: 14, lineHeight: 1.6 }}>
          {done
            ? `Thank you, ${data?.caregiver_name}. Your performance appraisal has been signed and submitted to Vitalis Healthcare Services.`
            : `This appraisal has already been signed on ${data?.signed_at ? new Date(data.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'a previous date'}.`
          }
        </p>
        <div style={{ marginTop: 24, padding: '12px 16px', background: '#F8FAFB', borderRadius: 8, fontSize: 12, color: '#8FA0B0' }}>
          Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910
        </div>
      </div>
    </div>
  )

  const scored = [...CLINICAL_ITEMS, ...PROFESSIONAL_ITEMS].filter(i => data?.[i.key])
  const totalScore = scored.reduce((sum, i) => sum + (data?.[i.key] || 0), 0)
  const maxScore   = scored.length * 4
  const avgScore   = scored.length > 0 ? (totalScore / scored.length).toFixed(1) : '—'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%)', padding: '24px 32px', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0E7C7B,#F4A261)', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 10 }}>V+</div>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 20, fontWeight: 800 }}>Vitalis Healthcare Services</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '4px 0 0', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Performance Appraisal / Evaluation — Home Health Aide</p>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 16px' }}>
        {/* Info card */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Employee</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44' }}>{data?.caregiver_name}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Supervisor</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2E44' }}>{data?.appraiser_name}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Appraisal Period</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2E44' }}>{data?.appraisal_period || '—'}</div>
          </div>
        </div>

        {/* Score legend */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B0' }}>RATING SCALE:</div>
          {[1,2,3,4].map(s => (
            <span key={s} style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: SCORE_BG[s], color: SCORE_COLOR[s] }}>
              {s} — {SCORE_LABELS[s]}
            </span>
          ))}
          {scored.length > 0 && (
            <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: '#1A2E44' }}>
              Average: <span style={{ color: '#0E7C7B' }}>{avgScore}/4.0</span>
            </div>
          )}
        </div>

        {/* Clinical section */}
        <div style={{ background: '#fff', borderRadius: 12, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', background: '#F8FAFB', borderBottom: '1px solid #EFF2F5' }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: '#1A2E44', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clinical Duties</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFB' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #EFF2F5', width: '70%' }}>Competency</th>
                <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #EFF2F5' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {CLINICAL_ITEMS.map(item => scoreRow(item, data?.[item.key]))}
            </tbody>
          </table>
        </div>

        {/* Professional section */}
        <div style={{ background: '#fff', borderRadius: 12, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', background: '#F8FAFB', borderBottom: '1px solid #EFF2F5' }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: '#1A2E44', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Professional Conduct</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFB' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #EFF2F5', width: '70%' }}>Competency</th>
                <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #EFF2F5' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {PROFESSIONAL_ITEMS.map(item => scoreRow(item, data?.[item.key]))}
            </tbody>
          </table>
        </div>

        {/* Comments */}
        {data?.comments && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: '#1A2E44', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comments from Supervisor</h2>
            <p style={{ color: '#4A6070', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{data.comments}</p>
          </div>
        )}

        {/* Sign-off */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1.5px solid #0E7C7B' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', marginBottom: 8 }}>Employee Sign-Off</h2>
          <p style={{ color: '#4A6070', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            By typing your full name below and clicking "Sign Appraisal", you confirm that you have reviewed this performance appraisal. Your signature does not necessarily indicate agreement with the ratings — it confirms receipt and review.
          </p>
          {error && (
            <div style={{ background: '#FDE8E9', border: '1px solid #E63946', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#E63946' }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#4A6070', display: 'block', marginBottom: 6 }}>
              Type your full name as your electronic signature <span style={{ color: '#E63946' }}>*</span>
            </label>
            <input
              value={signature}
              onChange={e => setSignature(e.target.value)}
              placeholder={data?.caregiver_name || 'Your full name'}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 15, outline: 'none', fontFamily: "'Segoe UI', Arial, sans-serif", boxSizing: 'border-box', fontStyle: 'italic' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSign}
              disabled={signing || !signature.trim()}
              style={{ padding: '13px 36px', background: signature.trim() && !signing ? '#0E7C7B' : '#CBD5E0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: signature.trim() && !signing ? 'pointer' : 'not-allowed' }}
            >
              {signing ? 'Signing…' : 'Sign Appraisal →'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 11, color: '#B0BEC5' }}>
          Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br/>
          Tel: 267.474.8578 · Fax: 240.266.0650
        </div>
      </div>
    </div>
  )
}
