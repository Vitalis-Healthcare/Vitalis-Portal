'use client'
// app/(dashboard)/staff/[id]/StaffAppraisalsCard.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Send, Eye, ChevronDown, ChevronUp, X, ExternalLink } from 'lucide-react'

interface Appraisal {
  id: string
  status: string
  appraisal_period?: string
  signed_at?: string
  sent_at?: string
  caregiver_signature?: string
  created_at: string
  [key: string]: any
}

interface Props {
  appraisals:  Appraisal[]
  caregiverId: string
  viewerRole:  string
}

const ALL_SCORE_KEYS = [
  's_patient_care_duties','s_medications','s_care_conferences','s_personal_care',
  's_shampoo','s_bed_linen','s_vitals','s_reports_changes','s_height_weight',
  's_bedpan','s_enemas','s_specimens','s_room_order','s_household_services',
  's_safety_devices','s_body_mechanics','s_therapy_extension','s_equipment_cleaning',
  's_documentation','s_asks_for_help','s_own_actions','s_completes_work',
  's_no_unqualified_assignments','s_confidentiality','s_meetings','s_chart_documentation',
  's_variance_reporting','s_qapi','s_policies_adherence','s_agency_standards',
  's_attendance','s_tardiness','s_reports_incomplete','s_appearance',
  's_time_management','s_inservices','s_clean_environment','s_judgment',
  's_cpr_certification','s_other_duties',
]

export default function StaffAppraisalsCard({ appraisals, caregiverId, viewerRole }: Props) {
  const router = useRouter()
  const [showNew, setShowNew]     = useState(false)
  const [sending, setSending]     = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [period, setPeriod]       = useState(`${new Date().getFullYear()} Annual`)
  const [comments, setComments]   = useState('')

  const canEdit = ['admin', 'supervisor'].includes(viewerRole)

  const statusColor = (s: string) => s === 'signed' ? '#2A9D8F' : s === 'sent' ? '#457B9D' : '#8FA0B0'
  const statusBg    = (s: string) => s === 'signed' ? '#E6F6F4' : s === 'sent' ? '#EBF4FF' : '#EFF2F5'
  const statusLabel = (s: string) => s === 'signed' ? '✓ Signed' : s === 'sent' ? '⏳ Awaiting Sign-off' : '📝 Draft'

  const avg = (a: Appraisal) => {
    const scores = ALL_SCORE_KEYS.map(k => a[k]).filter(Boolean)
    if (!scores.length) return null
    return (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1)
  }

  const handleQuickCreate = async (sendNow: boolean) => {
    setSaving(true)
    const res = await fetch('/api/appraisals/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caregiver_id: caregiverId,
        appraisal_period: period,
        comments,
        scores: {},
      }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Save failed'); setSaving(false); return }

    if (sendNow) {
      await fetch('/api/appraisals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appraisalId: data.appraisal.id }),
      })
    }
    setSaving(false)
    setShowNew(false)
    router.refresh()
  }

  const handleSend = async (id: string) => {
    setSending(id)
    await fetch('/api/appraisals/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appraisalId: id }),
    })
    setSending(null)
    router.refresh()
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>📊 Appraisals</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#8FA0B0', fontWeight: 400 }}>{appraisals.length} total</span>
            {canEdit && (
              <button
                onClick={() => setShowNew(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                <Plus size={11}/> New
              </button>
            )}
          </div>
        </div>

        {appraisals.length === 0 ? (
          <p style={{ color: '#8FA0B0', fontSize: 13 }}>No appraisals on file yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {appraisals.map(a => (
              <div key={a.id} style={{ borderRadius: 8, border: '1px solid #EFF2F5', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#FAFBFC', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E44' }}>{a.appraisal_period || '—'}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: statusBg(a.status), color: statusColor(a.status) }}>
                        {statusLabel(a.status)}
                      </span>
                      {avg(a) && <span style={{ fontSize: 11, color: '#0E7C7B', fontWeight: 600 }}>Avg {avg(a)}/4</span>}
                    </div>
                    {a.signed_at && (
                      <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 3 }}>
                        Signed {new Date(a.signed_at).toLocaleDateString()} · "{a.caregiver_signature}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {a.status === 'draft' && canEdit && (
                      <button
                        onClick={() => handleSend(a.id)}
                        disabled={sending === a.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#0E7C7B', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Send size={10}/> Send
                      </button>
                    )}
                    <a
                      href={`/appraisals`}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#EFF2F5', border: 'none', borderRadius: 6, color: '#4A6070', fontSize: 11, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}
                    >
                      <ExternalLink size={10}/> Full View
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick new appraisal modal */}
      {showNew && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowNew(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>New Appraisal</h3>
                <p style={{ fontSize: 12, color: '#8FA0B0', margin: '2px 0 0' }}>Create a draft — fill scores in Appraisals section</p>
              </div>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }}>Appraisal Period</label>
                <input
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                  placeholder="e.g. 2025 Annual"
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }}>Initial Comments (optional)</label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', minHeight: 70, resize: 'vertical', boxSizing: 'border-box' as const }}
                  placeholder="Overall notes…"
                />
              </div>
              <div style={{ background: '#EBF4FF', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#457B9D' }}>
                💡 To fill in detailed scores, go to <strong>Appraisals</strong> in the sidebar and edit the draft from there.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowNew(false)} style={{ padding: '9px 18px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#4A6070', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => handleQuickCreate(false)} disabled={saving} style={{ padding: '9px 18px', background: '#EFF2F5', border: 'none', borderRadius: 8, color: '#1A2E44', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  Save Draft
                </button>
                <button onClick={() => handleQuickCreate(true)} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#0E7C7B', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  <Send size={12}/> Create & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
