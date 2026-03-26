'use client'
// app/(dashboard)/staff/[id]/StaffReferencesCard.tsx
// Shown on caregiver profile page for admin/supervisor/staff.
// Displays all 3 reference slots with status, allows adding/editing referee
// details and resending from the profile page directly.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Plus, RefreshCw, X, CheckCircle } from 'lucide-react'

interface Reference {
  id?:            string
  slot:           number
  reference_type: 'professional' | 'character'
  referee_name?:  string
  referee_email?: string
  referee_phone?: string
  referee_org?:   string
  status?:        string
  sent_at?:       string
  received_at?:   string
  reminder_count?: number
  submission?:    { submitted_at: string; overall_recommendation?: string } | { submitted_at: string; overall_recommendation?: string }[] | null
}

const SLOTS = [
  { slot: 1, type: 'professional' as const, label: 'Professional Reference 1' },
  { slot: 2, type: 'professional' as const, label: 'Professional Reference 2' },
  { slot: 3, type: 'character'    as const, label: 'Character Reference' },
]

interface Props {
  references:  Reference[]
  caregiverId: string
  viewerRole:  string
}

export default function StaffReferencesCard({ references, caregiverId, viewerRole }: Props) {
  const router = useRouter()
  const [editSlot, setEditSlot]     = useState<number | null>(null)
  const [saving, setSaving]         = useState(false)
  const [resending, setResending]   = useState<string | null>(null)
  const [form, setForm] = useState({ referee_name: '', referee_email: '', referee_phone: '', referee_org: '' })

  const canEdit = ['admin', 'supervisor', 'staff'].includes(viewerRole)

  const getRef = (slot: number) => references.find(r => r.slot === slot)

  const statusColor = (s?: string) =>
    s === 'received' ? '#2A9D8F' : s === 'sent' ? '#457B9D' : '#8FA0B0'
  const statusBg = (s?: string) =>
    s === 'received' ? '#E6F6F4' : s === 'sent' ? '#EBF4FF' : '#EFF2F5'
  const statusLabel = (s?: string) =>
    s === 'received' ? '✓ Received' : s === 'sent' ? '⏳ Pending' : '— Not sent'

  const openEdit = (slot: number) => {
    const existing = getRef(slot)
    setForm({
      referee_name:  existing?.referee_name  || '',
      referee_email: existing?.referee_email || '',
      referee_phone: existing?.referee_phone || '',
      referee_org:   existing?.referee_org   || '',
    })
    setEditSlot(slot)
  }

  const handleSave = async () => {
    if (!form.referee_email) { alert('Email is required'); return }
    const slotInfo = SLOTS.find(s => s.slot === editSlot)!
    setSaving(true)

    // We call the send API but override user_id with caregiverId
    const res = await fetch('/api/references/send-for', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caregiverId,
        slot: editSlot,
        reference_type: slotInfo.type,
        ...form,
      }),
    })

    if (res.ok) {
      setEditSlot(null)
      router.refresh()
    } else {
      const d = await res.json()
      alert(d.error || 'Failed to send. Please try again.')
    }
    setSaving(false)
  }

  const handleResend = async (referenceId: string) => {
    setResending(referenceId)
    const res = await fetch('/api/references/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceId }),
    })
    if (res.ok) router.refresh()
    else { const d = await res.json(); alert(d.error || 'Resend failed') }
    setResending(null)
  }

  const receivedCount = references.filter(r => r.status === 'received').length
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>📋 References</span>
          <span style={{ fontSize: 12, color: receivedCount === 3 ? '#2A9D8F' : '#8FA0B0', fontWeight: 600 }}>
            {receivedCount}/3 received
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SLOTS.map(({ slot, label }) => {
            const ref = getRef(slot)
            const sub = Array.isArray(ref?.submission) ? ref?.submission?.[0] : ref?.submission

            return (
              <div key={slot} style={{
                borderRadius: 8,
                border: `1px solid ${ref?.status === 'received' ? '#A7F3D0' : '#EFF2F5'}`,
                background: ref?.status === 'received' ? '#F0FDF9' : '#FAFBFC',
                padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1A2E44' }}>{label}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: statusBg(ref?.status), color: statusColor(ref?.status) }}>
                        {statusLabel(ref?.status)}
                      </span>
                    </div>
                    {ref?.referee_email && (
                      <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 4, lineHeight: 1.6 }}>
                        {ref.referee_name && <span style={{ marginRight: 10 }}>👤 {ref.referee_name}</span>}
                        <span>✉️ {ref.referee_email}</span>
                        {ref.sent_at && <span style={{ marginLeft: 10 }}>· Sent {new Date(ref.sent_at).toLocaleDateString()}</span>}
                        {(ref.reminder_count || 0) > 0 && (
                          <span style={{ marginLeft: 10, color: '#F4A261' }}>· {ref.reminder_count} reminder{ref.reminder_count !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    )}
                    {sub && (
                      <div style={{ fontSize: 11, color: '#2A9D8F', marginTop: 4, fontWeight: 600 }}>
                        ✓ Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                        {sub.overall_recommendation && ` · ${sub.overall_recommendation.replace(/_/g, ' ')}`}
                      </div>
                    )}
                    {!ref?.referee_email && (
                      <div style={{ fontSize: 11, color: '#B0BEC5', marginTop: 4 }}>No referee added yet</div>
                    )}
                  </div>

                  {canEdit && ref?.status !== 'received' && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {ref?.id && ref.status === 'sent' && (
                        <button
                          onClick={() => handleResend(ref.id!)}
                          disabled={resending === ref.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#EBF4FF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#457B9D', opacity: resending === ref.id ? 0.6 : 1 }}
                        >
                          <Send size={10}/> {resending === ref.id ? '…' : 'Resend'}
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(slot)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#EFF2F5', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#4A6070' }}
                      >
                        {ref?.referee_email ? <><RefreshCw size={10}/> Edit</> : <><Plus size={10}/> Add</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Edit modal */}
      {editSlot !== null && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setEditSlot(null) }}
        >
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>
                  {SLOTS.find(s => s.slot === editSlot)?.label}
                </h3>
                <p style={{ fontSize: 12, color: '#8FA0B0', margin: '2px 0 0' }}>Reference request will be emailed immediately</p>
              </div>
              <button onClick={() => setEditSlot(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Full Name</label>
                <input value={form.referee_name} onChange={e => setForm(f => ({ ...f, referee_name: e.target.value }))} style={inp} placeholder="Reference's full name" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Email Address <span style={{ color: '#E63946' }}>*</span></label>
                <input type="email" value={form.referee_email} onChange={e => setForm(f => ({ ...f, referee_email: e.target.value }))} style={inp} placeholder="email@example.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={lbl}>Phone (optional)</label>
                  <input value={form.referee_phone} onChange={e => setForm(f => ({ ...f, referee_phone: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Organisation (optional)</label>
                  <input value={form.referee_org} onChange={e => setForm(f => ({ ...f, referee_org: e.target.value }))} style={inp} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditSlot(null)} style={{ padding: '9px 18px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#4A6070', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !form.referee_email} style={{ padding: '9px 22px', background: form.referee_email ? '#0E7C7B' : '#CBD5E0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: form.referee_email ? 'pointer' : 'not-allowed' }}>
                  {saving ? 'Sending…' : 'Save & Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
