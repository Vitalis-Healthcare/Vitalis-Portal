'use client'
// components/references/ReferenceSubmissionViewer.tsx
// Modal that shows the full content of a completed reference form.
// Works for both professional employment references and character references.

import { useState, useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'

const RATING_LABELS: Record<string, string> = {
  very_good:    'Very Good',
  satisfactory: 'Satisfactory',
  fair:         'Fair',
  poor:         'Poor',
}

const YN_LABELS: Record<string, string> = {
  yes:       'Yes',
  no:        'No',
  dont_know: "Don't know",
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  highly_recommended: 'Highly Recommended',
  recommended:        'Recommended',
  reservations:       'Recommended, but with reservations',
  not_recommended:    'Not Recommended',
}

const RECOMMENDATION_COLOR: Record<string, string> = {
  highly_recommended: '#2A9D8F',
  recommended:        '#457B9D',
  reservations:       '#F4A261',
  not_recommended:    '#E63946',
}

interface Props {
  referenceId:  string
  refereeName?: string
  refereeType:  'professional' | 'character'
  slot:         number
  caregiverName: string
  isOpen:       boolean
  onClose:      () => void
}

export default function ReferenceSubmissionViewer({
  referenceId, refereeName, refereeType, slot, caregiverName, isOpen, onClose
}: Props) {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !referenceId) return
    setLoading(true)
    fetch(`/api/references/submission?referenceId=${referenceId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [isOpen, referenceId])

  if (!isOpen) return null

  const sub = data?.submission
  const isPro = refereeType === 'professional'
  const slotLabel = slot === 3 ? 'Character Reference' : `Professional Reference ${slot}`

  const row = (label: string, value: any, highlight?: string) => value ? (
    <tr style={{ borderBottom: '1px solid #EFF2F5' }}>
      <td style={{ padding: '8px 12px', fontSize: 12, color: '#8FA0B0', fontWeight: 600, width: '40%', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '8px 12px', fontSize: 13, color: highlight || '#1A2E44', fontWeight: highlight ? 700 : 400 }}>{value}</td>
    </tr>
  ) : null

  const ratingRow = (label: string, value: string) => value ? (
    <tr style={{ borderBottom: '1px solid #EFF2F5' }}>
      <td style={{ padding: '8px 12px', fontSize: 13, color: '#1A2E44', width: '60%' }}>{label}</td>
      <td style={{ padding: '8px 12px' }}>
        <span style={{
          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: value === 'very_good' ? '#E6F6F4' : value === 'satisfactory' ? '#EBF4FF' : value === 'fair' ? '#FFFBEA' : '#FDE8E9',
          color:      value === 'very_good' ? '#2A9D8F' : value === 'satisfactory' ? '#457B9D' : value === 'fair' ? '#C96B15' : '#E63946',
        }}>
          {RATING_LABELS[value] || value}
        </span>
      </td>
    </tr>
  ) : null

  const yndkRow = (label: string, value: string) => value ? (
    <tr style={{ borderBottom: '1px solid #EFF2F5' }}>
      <td style={{ padding: '8px 12px', fontSize: 13, color: '#1A2E44', width: '60%' }}>{label}</td>
      <td style={{ padding: '8px 12px' }}>
        <span style={{
          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: value === 'no' ? '#E6F6F4' : value === 'yes' ? '#FDE8E9' : '#EFF2F5',
          color:      value === 'no' ? '#2A9D8F' : value === 'yes' ? '#E63946' : '#8FA0B0',
        }}>
          {YN_LABELS[value] || value}
        </span>
      </td>
    </tr>
  ) : null

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(0,0,0,0.22)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', margin: 0 }}>{slotLabel}</h3>
            <p style={{ fontSize: 12, color: '#8FA0B0', margin: '3px 0 0' }}>
              {caregiverName} · {refereeName || 'Reference'} · {isPro ? 'Employment Reference' : 'Character Reference'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8FA0B0', fontSize: 14 }}>Loading submission…</div>
          ) : !sub ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8FA0B0', fontSize: 14 }}>No submission data found.</div>
          ) : isPro ? (
            /* ── PROFESSIONAL REFERENCE ── */
            <>
              {/* Overall recommendation banner if ratings suggest it */}
              {sub.submitted_at && (
                <div style={{ background: '#E6F6F4', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#2A9D8F', fontWeight: 600 }}>
                  ✓ Submitted {new Date(sub.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {sub.referee_name && ` by ${sub.referee_name}`}
                  {sub.referee_title && ` · ${sub.referee_title}`}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Employment Details</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #EFF2F5', borderRadius: 8, overflow: 'hidden' }}>
                  <tbody>
                    {row('Employer', sub.employer_name)}
                    {row('Address', sub.employer_address)}
                    {row('Supervisor', sub.supervisor_name)}
                    {row('Supervisor Phone', sub.supervisor_phone)}
                    {row('Supervisor Email', sub.supervisor_email)}
                    {row('Position Held', sub.position_held)}
                    {row('Area Worked', sub.area_worked)}
                    {row('From', sub.employment_from ? new Date(sub.employment_from).toLocaleDateString() : null)}
                    {row('To', sub.employment_to ? new Date(sub.employment_to).toLocaleDateString() : null)}
                    {row('Resigned / Terminated', sub.resigned_or_terminated)}
                    {row('Eligible for Rehire', sub.eligible_for_rehire === 'yes' ? 'Yes' : sub.eligible_for_rehire === 'no' ? 'No' : null)}
                    {row('Reason for Leaving', sub.reason_for_leaving)}
                    {row('Travel Assignment', sub.travel_assignment === true ? 'Yes' : sub.travel_assignment === false ? 'No' : null)}
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Personal Evaluation</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #EFF2F5', borderRadius: 8, overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFB' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratingRow('Quality of Work', sub.rating_quality)}
                    {ratingRow('Flexibility', sub.rating_flexibility)}
                    {ratingRow('Attitude', sub.rating_attitude)}
                    {ratingRow('Emotional Stability', sub.rating_stability)}
                    {ratingRow('Adaptability Under Pressure', sub.rating_pressure)}
                    {ratingRow('Dependability / Attendance / Punctuality', sub.rating_dependability)}
                    {ratingRow('Cooperation / Getting Along with Others', sub.rating_cooperation)}
                  </tbody>
                </table>
              </div>

              {sub.comments && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Comments</div>
                  <div style={{ background: '#F8FAFB', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#1A2E44', lineHeight: 1.6, border: '1px solid #EFF2F5' }}>
                    {sub.comments}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── CHARACTER REFERENCE ── */
            <>
              {sub.submitted_at && (
                <div style={{ background: '#E6F6F4', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#2A9D8F', fontWeight: 600 }}>
                  ✓ Submitted {new Date(sub.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {sub.referee_name && ` by ${sub.referee_name}`}
                  {sub.referee_title && ` · ${sub.referee_title}`}
                </div>
              )}

              {/* Overall recommendation */}
              {sub.overall_recommendation && (
                <div style={{
                  background: RECOMMENDATION_COLOR[sub.overall_recommendation] + '18',
                  border: `1px solid ${RECOMMENDATION_COLOR[sub.overall_recommendation]}40`,
                  borderRadius: 10, padding: '14px 20px', marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Overall Recommendation</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: RECOMMENDATION_COLOR[sub.overall_recommendation] }}>
                      {RECOMMENDATION_LABELS[sub.overall_recommendation]}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>About the Referee</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #EFF2F5', borderRadius: 8, overflow: 'hidden' }}>
                  <tbody>
                    {row('Years Known', sub.years_known)}
                    {row('Context Known', sub.context_known)}
                    {row('Related to Applicant', sub.related_to_applicant === true ? 'Yes' : sub.related_to_applicant === false ? 'No' : null)}
                    {sub.related_to_applicant && row('Relation', sub.relation_explanation)}
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Character Assessment</div>
                <p style={{ fontSize: 12, color: '#8FA0B0', marginBottom: 8 }}>Have you ever had to question the applicant's reputation for:</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #EFF2F5', borderRadius: 8, overflow: 'hidden' }}>
                  <tbody>
                    {yndkRow('Honesty', sub.questioned_honesty)}
                    {yndkRow('Trustworthiness', sub.questioned_trustworthy)}
                    {yndkRow('Diligence', sub.questioned_diligence)}
                    {yndkRow('Reliability', sub.questioned_reliability)}
                    {yndkRow('Good Character', sub.questioned_character)}
                    {yndkRow('Maturity', sub.questioned_maturity)}
                  </tbody>
                </table>
              </div>

              {sub.comments && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Comments</div>
                  <div style={{ background: '#F8FAFB', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#1A2E44', lineHeight: 1.6, border: '1px solid #EFF2F5' }}>
                    {sub.comments}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #EFF2F5', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 24px', background: '#EFF2F5', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#4A6070', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
