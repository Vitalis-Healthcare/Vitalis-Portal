'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MessageSquare, Calendar, DollarSign,
         Edit3, Save, X, CheckCircle, Clock } from 'lucide-react'

const STAGES = [
  { key: 'new',                  label: 'New',                  color: '#8FA0B0', bg: '#EFF2F5' },
  { key: 'contacted',            label: 'Contacted',            color: '#457B9D', bg: '#EBF4FF' },
  { key: 'assessment_scheduled', label: 'Assessment Scheduled', color: '#7C3AED', bg: '#EDE9FE' },
  { key: 'proposal_sent',        label: 'Proposal Sent',        color: '#D97706', bg: '#FEF3C7' },
  { key: 'won',                  label: 'Won ✓',                color: '#0B6B5C', bg: '#D1FAE5' },
  { key: 'on_hold',              label: 'On Hold',              color: '#92400E', bg: '#FDE68A' },
  { key: 'cold',                 label: 'Cold',                 color: '#6B7280', bg: '#F3F4F6' },
  { key: 'lost',                 label: 'Lost',                 color: '#DC2626', bg: '#FEE2E2' },
]

const ACTIVITY_TYPES = [
  { key: 'call',        label: 'Phone Call',   icon: '📞' },
  { key: 'email',       label: 'Email',        icon: '✉️' },
  { key: 'meeting',     label: 'Meeting',      icon: '🤝' },
  { key: 'assessment',  label: 'Assessment',   icon: '📋' },
  { key: 'follow_up',   label: 'Follow-up',    icon: '🔔' },
  { key: 'note',        label: 'Note',         icon: '📝' },
]

const OUTCOMES = [
  { key: 'positive',       label: '✅ Positive' },
  { key: 'neutral',        label: '➖ Neutral' },
  { key: 'negative',       label: '❌ Negative' },
  { key: 'no_answer',      label: '📵 No Answer' },
  { key: 'left_voicemail', label: '📬 Left Voicemail' },
]

const CARE_TYPES = ['Personal Care', 'Companion Care', 'Skilled Nursing', 'Respite Care', 'Overnight', 'Live-In']

function calcRevenue(hours?: number | null, rate?: number | null) {
  if (!hours || !rate) return null
  const weekly = hours * rate
  return { weekly, monthly: weekly * 4.33, annual: weekly * 52 }
}
function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getName = (v: any) => Array.isArray(v) ? v[0]?.full_name : v?.full_name

interface Lead {
  id: string; full_name: string; client_name?: string; email?: string; phone?: string
  source: string; referral_name?: string; status: string; relationship?: string
  care_types?: string[]; condition_notes?: string; preferred_schedule?: string
  estimated_hours_week?: number; hourly_rate?: number
  expected_start_date?: string; expected_close_date?: string
  won_date?: string; lost_date?: string; lost_reason?: string; notes?: string
  created_at: string; updated_at: string; assigned_to?: string
  assignee?: any; creator?: any
}
interface Activity {
  id: string; lead_id: string; created_at: string
  activity_type: string; content: string; outcome?: string; next_follow_up?: string
  author?: any
}
interface Props {
  lead: Lead; activities: Activity[]; staff: { id: string; full_name: string }[]
  currentUserId: string; currentUserName: string
}

export default function LeadDetailClient({ lead: initialLead, activities: initialActivities, staff, currentUserId, currentUserName }: Props) {
  const router = useRouter()
  const [lead, setLead] = useState(initialLead)
  const [activities, setActivities] = useState(initialActivities)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ ...initialLead, estimated_hours_week: initialLead.estimated_hours_week?.toString() || '', hourly_rate: initialLead.hourly_rate?.toString() || '' })
  const [actForm, setActForm] = useState({ activity_type: 'call', content: '', outcome: '', next_follow_up: '' })
  const setE = (k: string, v: any) => setEditForm(f => ({ ...f, [k]: v }))
  const setA = (k: string, v: any) => setActForm(f => ({ ...f, [k]: v }))

  const rev = calcRevenue(lead.estimated_hours_week, lead.hourly_rate)
  const stage = STAGES.find(s => s.key === lead.status)

  const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 7, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: 4 }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      ...editForm,
      id: lead.id,
      previousStatus: lead.status,
      estimated_hours_week: editForm.estimated_hours_week ? parseFloat(editForm.estimated_hours_week as string) : null,
      hourly_rate: editForm.hourly_rate ? parseFloat(editForm.hourly_rate as string) : null,
    }
    const res = await fetch('/api/leads/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const { lead: updated } = await res.json()
      setLead(updated); setEditing(false); router.refresh()
    } else {
      alert('Failed to save changes')
    }
    setSaving(false)
  }

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actForm.content.trim()) return
    setSaving(true)
    const res = await fetch('/api/leads/activity', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id, ...actForm }),
    })
    if (res.ok) {
      const { activity } = await res.json()
      const enriched = { ...activity, author: [{ full_name: currentUserName }] }
      setActivities(prev => [enriched, ...prev])
      setActForm({ activity_type: 'call', content: '', outcome: '', next_follow_up: '' })
      setLogOpen(false)
    } else {
      alert('Failed to log activity')
    }
    setSaving(false)
  }

  const handleEditActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingActivity || !actForm.content.trim()) return
    setSaving(true)
    const res = await fetch('/api/leads/update-activity', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingActivity.id, ...actForm }),
    })
    if (res.ok) {
      const { activity } = await res.json()
      setActivities(prev => prev.map(a => a.id === editingActivity.id
        ? { ...a, ...activity } : a))
      setEditingActivity(null)
      setActForm({ activity_type: 'call', content: '', outcome: '', next_follow_up: '' })
    } else { alert('Failed to update activity') }
    setSaving(false)
  }

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Delete this activity log entry?')) return
    setDeletingActivityId(id)
    const res = await fetch('/api/leads/delete-activity', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setActivities(prev => prev.filter(a => a.id !== id))
    else alert('Failed to delete activity')
    setDeletingActivityId(null)
  }

  const openEditActivity = (a: Activity) => {
    setEditingActivity(a)
    setActForm({ activity_type: a.activity_type, content: a.content, outcome: a.outcome || '', next_follow_up: a.next_follow_up || '' })
    setLogOpen(true)
  }

  const handleArchive = async () => {
    if (!confirm('Archive this lead? It will be hidden from the main pipeline but all data will be preserved. You can restore it by changing the stage.')) return
    setSaving(true)
    const res = await fetch('/api/leads/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, action: 'archive' }),
    })
    if (res.ok) {
      router.push('/leads')
    } else {
      const d = await res.json(); alert(d.error || 'Failed to archive lead')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('⚠️ Permanently delete this lead and ALL its activity history? This cannot be undone.')) return
    if (!confirm('Are you absolutely sure? This will delete all calls, notes, and activity logs for this lead.')) return
    setSaving(true)
    const res = await fetch('/api/leads/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, action: 'delete' }),
    })
    if (res.ok) {
      router.push('/leads')
    } else {
      const d = await res.json(); alert(d.error || 'Failed to delete lead')
    }
    setSaving(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true)
    const res = await fetch('/api/leads/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, status: newStatus, previousStatus: lead.status }),
    })
    if (res.ok) {
      const { lead: updated } = await res.json()
      setLead(updated)
      const statusActivity: Activity = {
        id: Date.now().toString(), lead_id: lead.id,
        created_at: new Date().toISOString(), activity_type: 'status_change',
        content: `Status changed to ${STAGES.find(s => s.key === newStatus)?.label}`,
        author: [{ full_name: currentUserName }]
      }
      setActivities(prev => [statusActivity, ...prev])
    }
    setSaving(false)
  }

  const actIcon = (type: string) => ACTIVITY_TYPES.find(a => a.key === type)?.icon || '📝'
  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Back */}
      <div style={{ marginBottom: 16 }}>
        <Link href="/leads" style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <ArrowLeft size={13}/> All Leads
        </Link>
      </div>

      {/* Archived banner */}
      {lead.status === 'archived' && (
        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📦</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>This lead is archived</div>
              <div style={{ fontSize: 12, color: '#B45309' }}>It is hidden from the main pipeline. Restore it by selecting an active stage below.</div>
            </div>
          </div>
          <button onClick={handleDelete} style={{ padding: '7px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            🗑️ Delete Permanently
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: '12px 12px 0 0', border: '1px solid #E2E8F0', borderBottom: 'none', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: stage?.bg, color: stage?.color }}>
                {stage?.label}
              </span>
              <span style={{ fontSize: 12, color: '#8FA0B0' }}>Added {fmtDate(lead.created_at)}</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E44', margin: '0 0 4px' }}>
              {lead.client_name || lead.full_name}
            </h1>
            {lead.client_name && (
              <div style={{ fontSize: 13, color: '#8FA0B0' }}>Enquired by {lead.full_name}</div>
            )}
            <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#457B9D', textDecoration: 'none', fontWeight: 600 }}>
                  <Phone size={13}/> {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#457B9D', textDecoration: 'none', fontWeight: 600 }}>
                  <Mail size={13}/> {lead.email}
                </a>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <button onClick={() => setLogOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#457B9D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <MessageSquare size={13}/> Log Activity
            </button>
            <button onClick={() => setEditing(!editing)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: editing ? '#E63946' : '#EFF2F5', color: editing ? '#fff' : '#4A6070', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {editing ? <><X size={13}/> Cancel</> : <><Edit3 size={13}/> Edit</>}
            </button>
            {editing && (
              <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                <Save size={13}/> {saving ? 'Saving…' : 'Save'}
              </button>
            )}
            {!editing && lead.status !== 'archived' && (
              <button onClick={handleArchive} disabled={saving} title="Archive this lead"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
                📦 Archive
              </button>
            )}
            {!editing && (
              <button onClick={handleDelete} disabled={saving} title="Permanently delete this lead"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
                🗑️ Delete
              </button>
            )}
          </div>
        </div>

        {/* Stage pipeline stepper */}
        <div style={{ marginTop: 20, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STAGES.slice(0, 5).map(s => {
            const isCurrent = lead.status === s.key
            return (
              <button key={s.key} onClick={() => !isCurrent && handleStatusChange(s.key)} disabled={saving}
                style={{ padding: '6px 12px', borderRadius: 20, border: `2px solid ${isCurrent ? s.color : '#E2E8F0'}`, background: isCurrent ? s.bg : '#fff', color: isCurrent ? s.color : '#8FA0B0', fontSize: 12, fontWeight: isCurrent ? 800 : 500, cursor: isCurrent ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                {s.label}
              </button>
            )
          })}
          <div style={{ width: 1, background: '#E2E8F0', margin: '0 4px' }}/>
          {STAGES.slice(5).map(s => {
            const isCurrent = lead.status === s.key
            return (
              <button key={s.key} onClick={() => !isCurrent && handleStatusChange(s.key)} disabled={saving}
                style={{ padding: '6px 12px', borderRadius: 20, border: `2px solid ${isCurrent ? s.color : '#E2E8F0'}`, background: isCurrent ? s.bg : '#fff', color: isCurrent ? s.color : '#8FA0B0', fontSize: 12, fontWeight: isCurrent ? 800 : 500, cursor: isCurrent ? 'default' : 'pointer' }}>
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Body: 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 12px 12px', background: '#fff', overflow: 'hidden' }}>

        {/* LEFT — Activity log */}
        <div style={{ borderRight: '1px solid #EFF2F5', padding: '20px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1A2E44', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={15} color="#8FA0B0"/> Activity Log
            <span style={{ fontSize: 12, fontWeight: 500, color: '#8FA0B0' }}>({activities.length})</span>
          </h3>

          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#CBD5E0', fontSize: 13 }}>
              No activities logged yet.<br/>
              <button onClick={() => setLogOpen(true)} style={{ marginTop: 10, background: 'none', border: 'none', color: '#0B6B5C', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Log your first activity →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activities.map((a, i) => {
                const isStatusChange = a.activity_type === 'status_change'
                return (
                  <div key={a.id} style={{ display: 'flex', gap: 12, paddingBottom: 18 }}>
                    {/* Timeline dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: isStatusChange ? '#EDE9FE' : '#EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        {isStatusChange ? '🔄' : actIcon(a.activity_type)}
                      </div>
                      {i < activities.length - 1 && <div style={{ width: 1, flex: 1, background: '#EFF2F5', marginTop: 4, minHeight: 16 }}/>}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, paddingTop: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A2E44' }}>
                            {ACTIVITY_TYPES.find(t => t.key === a.activity_type)?.label || a.activity_type}
                          </span>
                          {a.outcome && (
                            <span style={{ fontSize: 11, color: '#8FA0B0' }}>
                              {OUTCOMES.find(o => o.key === a.outcome)?.label || a.outcome}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: '#CBD5E0', whiteSpace: 'nowrap' }}>{fmtDateTime(a.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#4A6070', margin: '0 0 4px', lineHeight: 1.6 }}>{a.content}</p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        {a.next_follow_up && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: a.next_follow_up < today ? '#DC2626' : '#457B9D' }}>
                            {a.next_follow_up < today ? '⚠️' : '📅'} Follow up: {fmtDate(a.next_follow_up)}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: '#CBD5E0' }}>by {getName(a.author) || 'Unknown'}</span>
                        {!isStatusChange && (
                          <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                            <button onClick={() => openEditActivity(a)} style={{ padding: '3px 8px', background: '#EFF2F5', border: 'none', borderRadius: 5, fontSize: 11, color: '#4A6070', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                            <button onClick={() => handleDeleteActivity(a.id)} disabled={deletingActivityId === a.id} style={{ padding: '3px 8px', background: '#FEE2E2', border: 'none', borderRadius: 5, fontSize: 11, color: '#DC2626', cursor: 'pointer', fontWeight: 600 }}>
                              {deletingActivityId === a.id ? '…' : 'Delete'}
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT — Lead details */}
        <div style={{ padding: '20px 20px', overflowY: 'auto' }}>

          {/* Revenue */}
          {rev && (
            <div style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Revenue Projection</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[{ label: 'Weekly', val: rev.weekly }, { label: 'Monthly', val: rev.monthly }, { label: 'Annual', val: rev.annual }].map(x => (
                  <div key={x.label}>
                    <div style={{ fontSize: 10, color: '#065F46', fontWeight: 600 }}>{x.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#064E3B' }}>{fmtMoney(x.val)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editing ? (
            /* Edit form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={lbl}>Full Name</label><input value={editForm.full_name} onChange={e => setE('full_name', e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Client Name</label><input value={editForm.client_name || ''} onChange={e => setE('client_name', e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Phone</label><input value={editForm.phone || ''} onChange={e => setE('phone', e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Email</label><input type="email" value={editForm.email || ''} onChange={e => setE('email', e.target.value)} style={inp}/></div>
              <div>
                <label style={lbl}>Care Types</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CARE_TYPES.map(ct => {
                    const active = (editForm.care_types || []).includes(ct)
                    return (
                      <button key={ct} type="button"
                        onClick={() => setE('care_types', active ? (editForm.care_types || []).filter((x: string) => x !== ct) : [...(editForm.care_types || []), ct])}
                        style={{ padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${active ? '#0B6B5C' : '#D1D9E0'}`, background: active ? '#D1FAE5' : '#fff', color: active ? '#0B6B5C' : '#4A6070', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        {ct}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Hours / Week</label><input type="number" value={editForm.estimated_hours_week} onChange={e => setE('estimated_hours_week', e.target.value)} style={inp} min="0" step="0.5"/></div>
                <div><label style={lbl}>Hourly Rate ($)</label><input type="number" value={editForm.hourly_rate} onChange={e => setE('hourly_rate', e.target.value)} style={inp} min="0" step="0.25"/></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Close Date</label><input type="date" value={editForm.expected_close_date || ''} onChange={e => setE('expected_close_date', e.target.value)} style={inp}/></div>
                <div><label style={lbl}>Start Date</label><input type="date" value={editForm.expected_start_date || ''} onChange={e => setE('expected_start_date', e.target.value)} style={inp}/></div>
              </div>
              <div>
                <label style={lbl}>Assigned To</label>
                <select value={editForm.assigned_to || ''} onChange={e => setE('assigned_to', e.target.value)} style={inp}>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Condition / Situation Notes</label><textarea value={editForm.condition_notes || ''} onChange={e => setE('condition_notes', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }}/></div>
              <div><label style={lbl}>Preferred Schedule</label><input value={editForm.preferred_schedule || ''} onChange={e => setE('preferred_schedule', e.target.value)} placeholder="e.g. Mon–Fri 8am–2pm" style={inp}/></div>
              <div><label style={lbl}>Notes</label><textarea value={editForm.notes || ''} onChange={e => setE('notes', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }}/></div>
              {lead.status === 'lost' && (
                <div><label style={lbl}>Lost Reason</label><input value={editForm.lost_reason || ''} onChange={e => setE('lost_reason', e.target.value)} style={inp}/></div>
              )}
            </div>
          ) : (
            /* Read-only details */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Source', value: lead.source.replace(/_/g, ' ') + (lead.referral_name ? ` — ${lead.referral_name}` : '') },
                { label: 'Relationship', value: lead.relationship?.replace(/_/g, ' ') },
                { label: 'Care Types', value: (lead.care_types || []).join(', ') || '—' },
                { label: 'Hours / Week', value: lead.estimated_hours_week ? `${lead.estimated_hours_week} hrs` : '—' },
                { label: 'Hourly Rate', value: lead.hourly_rate ? `$${lead.hourly_rate}/hr` : '—' },
                { label: 'Expected Close', value: fmtDate(lead.expected_close_date) },
                { label: 'Expected Start', value: fmtDate(lead.expected_start_date) },
                { label: 'Assigned To', value: getName(lead.assignee) || '—' },
                { label: 'Schedule', value: lead.preferred_schedule || '—' },
              ].map(row => (
                <div key={row.label}>
                  <div style={lbl}>{row.label}</div>
                  <div style={{ fontSize: 13, color: '#1A2E44', textTransform: row.label === 'Source' || row.label === 'Relationship' ? 'capitalize' : 'none' }}>
                    {row.value || '—'}
                  </div>
                </div>
              ))}
              {lead.condition_notes && (
                <div><div style={lbl}>Situation Notes</div><div style={{ fontSize: 13, color: '#1A2E44', lineHeight: 1.6 }}>{lead.condition_notes}</div></div>
              )}
              {lead.notes && (
                <div><div style={lbl}>General Notes</div><div style={{ fontSize: 13, color: '#1A2E44', lineHeight: 1.6 }}>{lead.notes}</div></div>
              )}
              {lead.lost_reason && (
                <div><div style={lbl}>Lost Reason</div><div style={{ fontSize: 13, color: '#DC2626' }}>{lead.lost_reason}</div></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Log Activity Modal ── */}
      {logOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setLogOpen(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>{editingActivity ? 'Edit Activity' : 'Log Activity'}</h3>
              <button onClick={() => { setLogOpen(false); setEditingActivity(null); setActForm({ activity_type: 'call', content: '', outcome: '', next_follow_up: '' }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}><X size={18}/></button>
            </div>
            <form onSubmit={editingActivity ? handleEditActivity : handleLogActivity} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Activity Type</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {ACTIVITY_TYPES.map(t => (
                    <button key={t.key} type="button" onClick={() => setA('activity_type', t.key)}
                      style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${actForm.activity_type === t.key ? '#457B9D' : '#E2E8F0'}`, background: actForm.activity_type === t.key ? '#EBF4FF' : '#fff', color: actForm.activity_type === t.key ? '#457B9D' : '#4A6070', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Notes / Summary <span style={{ color: '#E63946' }}>*</span></label>
                <textarea value={actForm.content} onChange={e => setA('content', e.target.value)} required rows={4} placeholder="What happened? Key points from the conversation…" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}/>
              </div>
              <div>
                <label style={lbl}>Outcome</label>
                <select value={actForm.outcome} onChange={e => setA('outcome', e.target.value)} style={inp}>
                  <option value="">— Select outcome —</option>
                  {OUTCOMES.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Next Follow-Up Date</label>
                <input type="date" value={actForm.next_follow_up} onChange={e => setA('next_follow_up', e.target.value)} min={today} style={inp}/>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '11px', background: '#457B9D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editingActivity ? '💾 Save Changes' : '📝 Log Activity'}
                </button>
                <button type="button" onClick={() => { setLogOpen(false); setEditingActivity(null); setActForm({ activity_type: 'call', content: '', outcome: '', next_follow_up: '' }) }} style={{ padding: '11px 18px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#4A6070' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
