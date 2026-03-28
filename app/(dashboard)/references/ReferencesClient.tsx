'use client'
// app/(dashboard)/references/ReferencesClient.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Send, RefreshCw, CheckCircle, Clock, AlertTriangle, X, Eye } from 'lucide-react'
import ReferenceSubmissionViewer from '@/components/references/ReferenceSubmissionViewer'

interface Reference {
  id:             string
  slot:           number
  reference_type: 'professional' | 'character'
  referee_name?:  string
  referee_email:  string
  referee_phone?: string
  referee_org?:   string
  status:         string
  sent_at?:       string
  received_at?:   string
  reminder_count: number
  caregiver?:     { full_name: string; id: string }
  submission?:    { id: string; submitted_at: string; overall_recommendation?: string } | { id: string; submitted_at: string; overall_recommendation?: string }[]
}

const SLOTS = [
  { slot: 1, type: 'professional', label: 'Professional Reference 1', desc: 'Former employer or direct supervisor' },
  { slot: 2, type: 'professional', label: 'Professional Reference 2', desc: 'Former employer or direct supervisor' },
  { slot: 3, type: 'character',    label: 'Character Reference',       desc: 'Not a family member or employer' },
]

export default function ReferencesClient({ refs, caregivers = [], userId, fullName, isAdmin }: {
  refs: Reference[]; caregivers?: { id: string; full_name: string }[]; userId: string; fullName: string; isAdmin: boolean
}) {
  const router = useRouter()
  const [editSlot, setEditSlot] = useState<number | null>(null)
  const [saving, setSaving]     = useState(false)
  const [resending, setResending] = useState<string | null>(null)
  const [viewSub, setViewSub]     = useState<{ id: string; type: 'professional'|'character'; slot: number; name?: string; caregiverName: string } | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCaregiver, setFilterCaregiver] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState({ referee_name: '', referee_email: '', referee_phone: '', referee_org: '' })

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }

  const getRef = (slot: number) => refs.find(r => r.slot === slot)

  const getSubmission = (ref: Reference) => {
    if (!ref.submission) return null
    return Array.isArray(ref.submission) ? ref.submission[0] : ref.submission
  }

  // For admin: build full grid of all caregiver × 3 slots, filling in from refs
  const SLOTS_DEF = [
    { slot: 1, reference_type: 'professional', label: 'Professional 1' },
    { slot: 2, reference_type: 'professional', label: 'Professional 2' },
    { slot: 3, reference_type: 'character',    label: 'Character' },
  ]

  const allRows: Array<{
    caregiver_id: string; caregiver_name: string
    slot: number; reference_type: string; slot_label: string
    ref: Reference | null
  }> = []

  if (isAdmin) {
    for (const cg of caregivers) {
      for (const slotDef of SLOTS_DEF) {
        const ref = refs.find(r =>
          (Array.isArray(r.caregiver) ? r.caregiver[0]?.id : (r.caregiver as any)?.id) === cg.id &&
          r.slot === slotDef.slot
        ) || null
        allRows.push({ caregiver_id: cg.id, caregiver_name: cg.full_name, slot: slotDef.slot, reference_type: slotDef.reference_type, slot_label: slotDef.label, ref })
      }
    }
  }

  // Apply filters
  const filteredRows = allRows.filter(row => {
    const status = row.ref?.status || 'not_sent'
    if (filterStatus !== 'all' && status !== filterStatus) return false
    if (filterCaregiver !== 'all' && row.caregiver_id !== filterCaregiver) return false
    if (filterType !== 'all' && row.reference_type !== filterType) return false
    return true
  })

  // Summary counts
  const totalSlots    = allRows.length
  const notSentCount  = allRows.filter(r => !r.ref || r.ref.status === 'not_sent').length
  const sentCount     = allRows.filter(r => r.ref?.status === 'sent' || r.ref?.status === 'pending').length
  const receivedCount = allRows.filter(r => r.ref?.status === 'received').length

  const statusColor = (s: string) =>
    s === 'received' ? '#2A9D8F' : s === 'sent' ? '#457B9D' : s === 'expired' ? '#E63946' : '#8FA0B0'
  const statusBg = (s: string) =>
    s === 'received' ? '#E6F6F4' : s === 'sent' ? '#EBF4FF' : s === 'expired' ? '#FDE8E9' : '#EFF2F5'
  const statusLabel = (s: string) =>
    s === 'received' ? '✓ Received' : s === 'sent' ? '⏳ Awaiting Response' : s === 'expired' ? '✗ Expired' : '— Not sent'

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
    if (!form.referee_email) { alert('Email address is required'); return }
    const slotInfo = SLOTS.find(s => s.slot === editSlot)!
    setSaving(true)

    const res = await fetch('/api/references/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
    if (res.ok) { router.refresh() }
    else { const d = await res.json(); alert(d.error || 'Resend failed') }
    setResending(null)
  }

  const myReceivedCount = refs.filter(r => r.status === 'received').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>
            {isAdmin ? 'Reference Management' : 'My References'}
          </h1>
          <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>
            {isAdmin ? 'Track reference status for all caregivers' : '2 professional references and 1 character reference required'}
          </p>
        </div>
        {!isAdmin && (
          <div style={{ background: '#fff', borderRadius: 10, padding: '12px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: myReceivedCount === 3 ? '#2A9D8F' : '#F4A261' }}>{myReceivedCount}/3</div>
            <div style={{ fontSize: 11, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Received</div>
          </div>
        )}
      </div>

      {/* ── CAREGIVER VIEW ── */}
      {!isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SLOTS.map(({ slot, type, label, desc }) => {
            const ref = getRef(slot)
            const sub = ref ? getSubmission(ref) : null
            const hasRef = !!ref

            return (
              <div key={slot} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: ref?.status === 'received' ? '1px solid #A7F3D0' : '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44' }}>{label}</div>
                      {hasRef && (
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusBg(ref.status), color: statusColor(ref.status) }}>
                          {statusLabel(ref.status)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#8FA0B0', marginTop: 2 }}>{desc}</div>
                    {hasRef && ref.status !== 'received' && (
                      <div style={{ fontSize: 12, color: '#4A6070', marginTop: 6 }}>
                        {ref.referee_name && <span style={{ marginRight: 12 }}>👤 {ref.referee_name}</span>}
                        <span>✉️ {ref.referee_email}</span>
                        {ref.sent_at && <span style={{ marginLeft: 12, color: '#8FA0B0' }}>Sent {new Date(ref.sent_at).toLocaleDateString()}</span>}
                        {ref.reminder_count > 0 && <span style={{ marginLeft: 12, color: '#F4A261' }}>· {ref.reminder_count} reminder{ref.reminder_count !== 1 ? 's' : ''} sent</span>}
                      </div>
                    )}
                    {sub && (
                      <div style={{ fontSize: 12, color: '#2A9D8F', marginTop: 6 }}>
                        ✓ Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                        {sub.overall_recommendation && ` · ${sub.overall_recommendation.replace('_', ' ')}`}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ref?.status !== 'received' && (
                      <button
                        onClick={() => openEdit(slot)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: hasRef ? '#EFF2F5' : '#0E7C7B', color: hasRef ? '#4A6070' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {hasRef ? <><RefreshCw size={13}/> Update</> : <><Plus size={13}/> Add</>}
                      </button>
                    )}
                    {hasRef && (ref.status === 'sent' || ref.status === 'pending') && (
                      <button
                        onClick={() => handleResend(ref.id)}
                        disabled={resending === ref.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#EBF4FF', color: '#457B9D', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: resending === ref.id ? 'not-allowed' : 'pointer', opacity: resending === ref.id ? 0.6 : 1 }}
                      >
                        <Send size={13}/> {resending === ref.id ? 'Sending…' : 'Resend'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div style={{ background: '#EBF4FF', border: '1px solid #457B9D', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#1E3A5F' }}>
            ℹ️ Each reference will receive an email with a form link. They do not need to log in. You will be notified when references are received.
          </div>
        </div>
      )}

      {/* ── ADMIN VIEW ── */}
      {isAdmin && (
        <div>
          {/* Summary stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
            {[
              { label:'Total Slots',    value: totalSlots,    color:'#1A2E44' },
              { label:'Not Sent',       value: notSentCount,  color:'#8FA0B0' },
              { label:'Sent / Pending', value: sentCount,     color:'#457B9D' },
              { label:'Received',       value: receivedCount, color:'#2A9D8F' },
            ].map((s,i) => (
              <div key={i} style={{ background:'#fff', borderRadius:12, padding:'16px 18px', borderLeft:`4px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize:28, fontWeight:800, color:'#1A2E44', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter panel */}
          <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.5px' }}>Filter:</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding:'7px 12px', borderRadius:7, border:'1.5px solid #D1D9E0', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', cursor:'pointer' }}>
              <option value="all">All Statuses</option>
              <option value="not_sent">Not Sent</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
              <option value="expired">Expired</option>
            </select>
            <select value={filterCaregiver} onChange={e => setFilterCaregiver(e.target.value)}
              style={{ padding:'7px 12px', borderRadius:7, border:'1.5px solid #D1D9E0', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', cursor:'pointer' }}>
              <option value="all">All Caregivers</option>
              {caregivers.map(cg => <option key={cg.id} value={cg.id}>{cg.full_name}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ padding:'7px 12px', borderRadius:7, border:'1.5px solid #D1D9E0', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', cursor:'pointer' }}>
              <option value="all">All Types</option>
              <option value="professional">Professional</option>
              <option value="character">Character</option>
            </select>
            {(filterStatus !== 'all' || filterCaregiver !== 'all' || filterType !== 'all') && (
              <button onClick={() => { setFilterStatus('all'); setFilterCaregiver('all'); setFilterType('all') }}
                style={{ padding:'7px 12px', background:'#EFF2F5', border:'none', borderRadius:7, fontSize:12, fontWeight:600, color:'#4A6070', cursor:'pointer' }}>
                Clear filters
              </button>
            )}
            <span style={{ marginLeft:'auto', fontSize:12, color:'#8FA0B0' }}>{filteredRows.length} of {totalSlots} slots</span>
          </div>

          {/* Table */}
          <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F8FAFB', borderBottom:'1px solid #EFF2F5' }}>
                  {['Caregiver','Slot','Type','Referee','Status','Sent','Action'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'12px 16px', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#8FA0B0', fontSize:14 }}>No references match these filters.</td></tr>
                ) : filteredRows.map((row, i) => {
                  const ref = row.ref
                  const status = ref?.status || 'not_sent'
                  const sub = ref ? getSubmission(ref) : null
                  return (
                    <tr key={`${row.caregiver_id}-${row.slot}`} style={{ borderBottom:'1px solid #EFF2F5', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                      <td style={{ padding:'12px 16px', fontWeight:600, color:'#1A2E44' }}><Link href={`/staff/${row.caregiver_id}`} style={{ color:'#1A2E44', textDecoration:'none' }} onMouseEnter={e=>(e.currentTarget.style.color='#0E7C7B')} onMouseLeave={e=>(e.currentTarget.style.color='#1A2E44')}>{row.caregiver_name}</Link></td>
                      <td style={{ padding:'12px 16px', color:'#4A6070' }}>{row.slot_label}</td>
                      <td style={{ padding:'12px 16px', color:'#4A6070', textTransform:'capitalize' }}>{row.reference_type}</td>
                      <td style={{ padding:'12px 16px' }}>
                        {ref?.referee_name
                          ? <><div style={{ color:'#1A2E44', fontWeight:600 }}>{ref.referee_name}</div><div style={{ fontSize:11, color:'#8FA0B0' }}>{ref.referee_email}</div></>
                          : <span style={{ color:'#D1D9E0' }}>No referee added</span>
                        }
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:statusBg(status), color:statusColor(status) }}>
                          {status === 'not_sent' ? '— Not Sent' : statusLabel(status)}
                        </span>
                        {sub && <div style={{ fontSize:11, color:'#2A9D8F', marginTop:3 }}>{sub.overall_recommendation?.replace(/_/g,' ')}</div>}
                        {ref && ref.reminder_count > 0 && <div style={{ fontSize:11, color:'#F4A261', marginTop:2 }}>{ref.reminder_count} reminder{ref.reminder_count !== 1 ? 's' : ''} sent</div>}
                      </td>
                      <td style={{ padding:'12px 16px', color:'#8FA0B0', fontSize:12 }}>
                        {ref?.sent_at ? new Date(ref.sent_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        {ref && status !== 'received' && (
                          <button onClick={() => handleResend(ref.id)} disabled={resending === ref.id}
                            style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#EFF2F5', border:'none', borderRadius:7, color:'#4A6070', fontSize:12, fontWeight:600, cursor:'pointer', opacity: resending === ref.id ? 0.6 : 1 }}>
                            <Send size={11}/> {resending === ref.id ? 'Sending…' : 'Resend'}
                          </button>
                        )}
                        {status === 'received' && ref && (
                          <button
                            onClick={() => setViewSub({ id: ref.id, type: ref.reference_type, slot: ref.slot, name: ref.referee_name, caregiverName: row.caregiver_name })}
                            style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#E6F6F4', border:'none', borderRadius:7, color:'#2A9D8F', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            <Eye size={11}/> View Response
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editSlot !== null && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setEditSlot(null) }}
        >
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', margin: 0 }}>
                  {SLOTS.find(s => s.slot === editSlot)?.label}
                </h3>
                <p style={{ fontSize: 12, color: '#8FA0B0', margin: '2px 0 0' }}>
                  An email with a form link will be sent to your reference
                </p>
              </div>
              <button onClick={() => setEditSlot(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Full Name</label>
                <input value={form.referee_name} onChange={e => setForm(f => ({ ...f, referee_name: e.target.value }))} style={inp} placeholder="Reference's full name" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Email Address <span style={{ color: '#E63946' }}>*</span></label>
                <input type="email" value={form.referee_email} onChange={e => setForm(f => ({ ...f, referee_email: e.target.value }))} style={inp} placeholder="email@example.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Phone (optional)</label>
                  <input value={form.referee_phone} onChange={e => setForm(f => ({ ...f, referee_phone: e.target.value }))} style={inp} placeholder="+1 (xxx) xxx-xxxx" />
                </div>
                <div>
                  <label style={lbl}>Organisation (optional)</label>
                  <input value={form.referee_org} onChange={e => setForm(f => ({ ...f, referee_org: e.target.value }))} style={inp} placeholder="Employer or org name" />
                </div>
              </div>
              <div style={{ background: '#EBF4FF', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#457B9D' }}>
                📧 An email will be sent immediately with a secure link to the reference form. They do not need to create an account.
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
      {viewSub && (
        <ReferenceSubmissionViewer
          referenceId={viewSub.id}
          refereeName={viewSub.name}
          refereeType={viewSub.type}
          slot={viewSub.slot}
          caregiverName={viewSub.caregiverName}
          isOpen={true}
          onClose={() => setViewSub(null)}
        />
      )}
    </div>
  )
}
