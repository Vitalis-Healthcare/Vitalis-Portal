'use client'
// app/(dashboard)/assessments/clients/[id]/ClientDetailView.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type NurseOption = { id: string; full_name: string; role: string }
type Schedule = {
  id: string
  cadence_days: number
  is_active: boolean
  nurse_id: string
  plan_type: string
  nurse: { id: string; full_name: string; email: string } | null
} | null
type Assessment = {
  id: string
  schedule_id: string | null
  is_initial: boolean
  scheduled_date: string
  completed_date: string | null
  status: string
  assessment_type: string
  triggers_reset: boolean
  notes: string | null
  nurse: { id: string; full_name: string } | null
  completer: { id: string; full_name: string } | null
}
type Client = {
  id: string
  full_name: string
  date_of_birth: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string
  zip: string | null
  payer_type: string | null
  axiscare_id: string | null
  status: string
  notes: string | null
  created_at: string
}

type PlanType = 'clinical' | 'ep_annual'

const CADENCE_OPTIONS = [120, 90, 60, 30]
const PAYER_TYPES = [
  'Private Pay', 'Medicaid', 'Medicare', 'Medicaid Waiver',
  'CareFirst', 'Wellpoint', 'United Healthcare', 'Aetna', 'BCHD', 'Other',
]

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.round((new Date(dateStr + 'T00:00:00').getTime() - today.getTime()) / 86400000)
}

function effStatus(dbStatus: string, scheduledDate: string): string {
  if (dbStatus === 'completed' || dbStatus === 'cancelled') return dbStatus
  return daysUntil(scheduledDate) < 0 ? 'overdue' : dbStatus
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    scheduled:  { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    completed:  { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
    overdue:    { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
    cancelled:  { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' },
    active:     { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
    inactive:   { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    discharged: { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' },
  }
  const s = map[status] ?? map.scheduled
  return (
    <span style={{ display:'inline-block', padding:'3px 12px', borderRadius:12, fontSize:12, fontWeight:600, background:s.bg, color:s.color, border:`1px solid ${s.border}`, textTransform:'capitalize' }}>
      {status}
    </span>
  )
}

function InitialBadge() {
  return (
    <span style={{ fontSize:10, fontWeight:700, color:'#92400E', background:'#FEF3C7', padding:'2px 6px', borderRadius:6, border:'1px solid #FDE68A' }}>
      INITIAL
    </span>
  )
}

function PlanBadge({ planType }: { planType: 'clinical' | 'ep_annual' | 'unknown' }) {
  if (planType === 'ep_annual') {
    return <span style={{ fontSize:10, fontWeight:700, color:'#0E7C7B', background:'#E6F4F4', padding:'2px 6px', borderRadius:6, border:'1px solid #B2E0DF', whiteSpace:'nowrap' }}>EP</span>
  }
  return null
}

export default function ClientDetailView({
  client: initialClient,
  clinicalSchedule,
  epSchedule,
  assessments: initialAssessments,
  nurses,
  currentUserId,
  currentUserRole,
}: {
  client: Client
  clinicalSchedule: Schedule
  epSchedule: Schedule
  assessments: Assessment[]
  nurses: NurseOption[]
  currentUserId: string
  currentUserRole: string
}) {
  const router = useRouter()
  const [client, setClient] = useState(initialClient)
  const [assessments]       = useState(initialAssessments)
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  // Schedule modal
  const [editingPlan, setEditingPlan]               = useState<PlanType | null>(null)
  const [newNurseId, setNewNurseId]                 = useState('')
  const [newCadence, setNewCadence]                 = useState(120)
  const [newFirstDue, setNewFirstDue]               = useState('')
  // Initial flag — shown in both Assign and Edit (clinical only)
  const [isInitialCheck, setIsInitialCheck]         = useState(false)
  const [origIsInitial, setOrigIsInitial]           = useState(false)
  // Next assessment rescheduling
  const [nextAssessmentId, setNextAssessmentId]     = useState<string | null>(null)
  const [nextAssessmentDate, setNextAssessmentDate] = useState('')
  const [origNextDate, setOrigNextDate]             = useState('')

  // Other modals
  const [showComplete, setShowComplete]     = useState<string | null>(null)
  const [completeNotes, setCompleteNotes]   = useState('')
  const [showEmergency, setShowEmergency]   = useState(false)
  const [emergencyNotes, setEmergencyNotes] = useState('')

  // Edit client
  const [showEdit, setShowEdit]       = useState(false)
  const [editName, setEditName]       = useState(client.full_name)
  const [editDob, setEditDob]         = useState(client.date_of_birth ?? '')
  const [editPhone, setEditPhone]     = useState(client.phone ?? '')
  const [editAddress, setEditAddress] = useState(client.address ?? '')
  const [editCity, setEditCity]       = useState(client.city ?? '')
  const [editState, setEditState]     = useState(client.state ?? 'MD')
  const [editZip, setEditZip]         = useState(client.zip ?? '')
  const [editPayer, setEditPayer]     = useState(client.payer_type ?? '')
  const [editAxisId, setEditAxisId]   = useState(client.axiscare_id ?? '')
  const [editNotes, setEditNotes]     = useState(client.notes ?? '')
  const [editStatus, setEditStatus]   = useState(client.status)

  const canEdit = ['admin', 'supervisor'].includes(currentUserRole)

  const inputStyle = { width:'100%', padding:'8px 12px', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, color:'#1A2E44', background:'#fff', boxSizing:'border-box' as const }
  const labelStyle = { display:'block', fontSize:12, fontWeight:600 as const, color:'#4A6070', marginBottom:4 }
  const editBtnStyle = { padding:'3px 10px', background:'transparent', border:'1px solid #D1D9E0', color:'#0E7C7B', borderRadius:6, fontSize:11, fontWeight:600 as const, cursor:'pointer' }

  const targetSchedule = editingPlan === 'clinical' ? clinicalSchedule : epSchedule
  const isNewSchedule  = !targetSchedule

  const pendingAssessments = assessments.filter(a => ['scheduled','overdue'].includes(a.status))
  const pastAssessments    = assessments.filter(a => !['scheduled','overdue'].includes(a.status))

  const getAssessmentPlan = (a: Assessment): 'clinical' | 'ep_annual' | 'unknown' => {
    if (a.schedule_id === clinicalSchedule?.id) return 'clinical'
    if (a.schedule_id === epSchedule?.id)       return 'ep_annual'
    return 'unknown'
  }

  const openScheduleModal = (planType: PlanType) => {
    const target = planType === 'clinical' ? clinicalSchedule : epSchedule
    const nextPending = pendingAssessments
      .filter(a => getAssessmentPlan(a) === planType)
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0] ?? null

    setEditingPlan(planType)
    setNewNurseId(target?.nurse_id ?? '')
    setNewCadence(planType === 'ep_annual' ? 365 : (target?.cadence_days ?? 120))
    setNewFirstDue('')
    // Pre-fill Initial checkbox from the next pending assessment's current value
    const initialVal = nextPending?.is_initial ?? false
    setIsInitialCheck(initialVal)
    setOrigIsInitial(initialVal)
    setNextAssessmentId(nextPending?.id ?? null)
    setNextAssessmentDate(nextPending?.scheduled_date ?? '')
    setOrigNextDate(nextPending?.scheduled_date ?? '')
    setErr(null)
  }

  // ── Save client edits ─────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editName.trim()) { setErr('Client name is required.'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`/api/assessments/clients/${client.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name:editName.trim(), date_of_birth:editDob||null, phone:editPhone||null, address:editAddress||null, city:editCity||null, state:editState||'MD', zip:editZip||null, payer_type:editPayer||null, axiscare_id:editAxisId||null, notes:editNotes||null, status:editStatus }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed to save.'); return }
      setClient(data.data); setShowEdit(false); router.refresh()
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  // ── Mark Complete ─────────────────────────────────────────────────────────
  const markComplete = async (assessmentId: string) => {
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: completeNotes || null }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed to mark complete.'); return }
      setShowComplete(null); setCompleteNotes(''); router.refresh()
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  // ── Emergency Assessment ──────────────────────────────────────────────────
  const scheduleEmergency = async () => {
    if (!clinicalSchedule) { setErr('No active clinical schedule.'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/assessments/emergency', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id:client.id, schedule_id:clinicalSchedule.id, nurse_id:clinicalSchedule.nurse_id, notes:emergencyNotes||null }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed to schedule emergency.'); return }
      setShowEmergency(false); setEmergencyNotes(''); router.refresh()
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  // ── Assign / Edit Schedule ────────────────────────────────────────────────
  const assignSchedule = async () => {
    if (!newNurseId || (isNewSchedule && !newFirstDue)) {
      setErr('Nurse and first due date are required.'); return
    }
    setBusy(true); setErr(null)
    try {
      // 1. Save the schedule (create or update nurse/cadence)
      const method = targetSchedule ? 'PATCH' : 'POST'
      const url    = targetSchedule ? `/api/assessments/schedules/${targetSchedule.id}` : '/api/assessments/schedules'
      const body   = targetSchedule
        ? { nurse_id: newNurseId, cadence_days: newCadence }
        : { client_id: client.id, nurse_id: newNurseId, cadence_days: newCadence, first_due_date: newFirstDue, plan_type: editingPlan, is_initial: isInitialCheck }
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed to save schedule.'); return }

      // 2. If editing an existing schedule, PATCH the next assessment if date or is_initial changed
      if (targetSchedule && nextAssessmentId) {
        const dateChanged    = nextAssessmentDate && nextAssessmentDate !== origNextDate
        const initialChanged = isInitialCheck !== origIsInitial
        if (dateChanged || initialChanged) {
          const patchBody: Record<string, unknown> = {}
          if (dateChanged)    patchBody.scheduled_date = nextAssessmentDate
          if (initialChanged) patchBody.is_initial     = isInitialCheck
          const assRes  = await fetch(`/api/assessments/${nextAssessmentId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchBody),
          })
          const assData = await assRes.json()
          if (!assRes.ok) { setErr(assData.error ?? 'Schedule saved but assessment update failed.'); return }
        }
      }

      setEditingPlan(null); router.refresh()
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  const modalTitle = editingPlan
    ? `${targetSchedule ? 'Edit' : 'Assign'} ${editingPlan === 'ep_annual' ? 'EP Annual Plan' : 'Clinical Schedule'}`
    : ''

  // ── Schedule sub-section ──────────────────────────────────────────────────
  const ScheduleSection = ({ label, planType, sched }: { label: string; planType: PlanType; sched: Schedule }) => {
    const isEP = planType === 'ep_annual'
    const pendingForPlan = pendingAssessments
      .filter(a => getAssessmentPlan(a) === planType)
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
    const next = pendingForPlan[0] ?? null
    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.5px', color: isEP ? '#4A6070' : '#0E7C7B' }}>{label}</div>
          {canEdit && <button onClick={() => openScheduleModal(planType)} style={editBtnStyle}>{sched ? 'Edit' : 'Assign'}</button>}
        </div>
        {sched ? (
          <>
            {([['Assigned Nurse', sched.nurse?.full_name ?? '—'], ['Cadence', isEP ? 'Annual (365 days)' : `${sched.cadence_days}-day`]] as [string,string][]).map(([lbl,val]) => (
              <div key={lbl} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:12, color:'#8FA0B0' }}>{lbl}</span>
                <span style={{ fontSize:13, color:'#1A2E44', fontWeight:500 }}>{val}</span>
              </div>
            ))}
            {next && (
              <div style={{ marginTop:10, padding:'8px 12px', background: isEP ? '#F8FAFC' : '#EFF6FF', borderRadius:7, border:`1px solid ${isEP ? '#E2E8F0' : '#BFDBFE'}` }}>
                <div style={{ fontSize:11, color: isEP ? '#4A6070' : '#1D4ED8', fontWeight:600, marginBottom:3 }}>
                  {next.is_initial ? 'INITIAL ASSESSMENT' : `NEXT ${isEP ? 'EP ' : ''}ASSESSMENT`}
                </div>
                <div style={{ fontSize:13, color:'#1A2E44', fontWeight:700 }}>{fmt(next.scheduled_date)}</div>
                <div style={{ fontSize:11, color:'#4A6070', marginTop:2 }}>
                  {(() => {
                    const d = daysUntil(next.scheduled_date)
                    if (d < 0) return <span style={{ color:'#B91C1C', fontWeight:600 }}>{Math.abs(d)} days overdue</span>
                    if (d === 0) return <span style={{ color:'#D97706', fontWeight:600 }}>Due today</span>
                    return `in ${d} day${d !== 1 ? 's' : ''}`
                  })()}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ color:'#D97706', fontSize:13, padding:'4px 0' }}>
            ⚠ No {isEP ? 'EP plan' : 'clinical schedule'}. {canEdit ? 'Click "Assign" to set up.' : 'Contact your supervisor.'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding:'32px 32px 64px', maxWidth:960, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <Link href="/assessments/clients" style={{ color:'#0E7C7B', textDecoration:'none', fontSize:13 }}>← Clients</Link>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>{client.full_name}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6 }}>
              <StatusBadge status={client.status} />
              {client.payer_type && <span style={{ fontSize:12, color:'#4A6070' }}>{client.payer_type}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {canEdit && (
              <button onClick={() => { setShowEdit(true); setErr(null) }} style={{ padding:'8px 16px', background:'#F8FAFC', border:'1px solid #D1D9E0', color:'#1A2E44', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                ✎ Edit Client
              </button>
            )}
            {canEdit && pendingAssessments.length > 0 && (
              <button onClick={() => { setShowEmergency(true); setErr(null) }} style={{ padding:'8px 16px', background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                + Emergency Assessment
              </button>
            )}
          </div>
        </div>
      </div>

      {err && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 16px', color:'#B91C1C', fontSize:13, marginBottom:20 }}>{err}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        {/* Client info */}
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'20px 22px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#4A6070', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:14 }}>Client Information</div>
          {([
            ['Date of Birth', fmt(client.date_of_birth)],
            ['Phone', client.phone ?? '—'],
            ['Address', [client.address, client.city, client.state, client.zip].filter(Boolean).join(', ') || '—'],
            ['Payer', client.payer_type ?? '—'],
            ['AxisCare ID', client.axiscare_id ?? '—'],
          ] as [string,string][]).map(([label, value]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:12, color:'#8FA0B0' }}>{label}</span>
              <span style={{ fontSize:13, color:'#1A2E44', fontWeight:500, textAlign:'right', maxWidth:'65%' }}>{value}</span>
            </div>
          ))}
          {client.notes && <div style={{ marginTop:12, padding:'10px 12px', background:'#F8FAFC', borderRadius:7, fontSize:12, color:'#4A6070' }}>{client.notes}</div>}
        </div>

        {/* Schedules */}
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'20px 22px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#4A6070', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:16 }}>Assessment Schedules</div>
          <ScheduleSection label="Clinical" planType="clinical" sched={clinicalSchedule} />
          <div style={{ borderTop:'1px solid #F1F5F9', margin:'16px 0' }} />
          <ScheduleSection label="EP Annual Plan" planType="ep_annual" sched={epSchedule} />
        </div>
      </div>

      {/* Pending assessments */}
      {pendingAssessments.length > 0 && (
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, overflow:'hidden', marginBottom:20 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #E2E8F0', fontSize:14, fontWeight:700, color:'#1A2E44' }}>Pending Assessments</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                {['Due Date','Plan','Type','Nurse','Status',''].map(h => (
                  <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#4A6070', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #E2E8F0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingAssessments.map((a, idx) => {
                const plan = getAssessmentPlan(a)
                return (
                  <tr key={a.id} style={{ borderBottom: idx < pendingAssessments.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <td style={{ padding:'12px 16px', fontWeight:600, color:'#1A2E44' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        {fmt(a.scheduled_date)}
                        {a.is_initial && <InitialBadge />}
                      </div>
                      {daysUntil(a.scheduled_date) < 0 && (
                        <div style={{ fontSize:11, color:'#B91C1C', fontWeight:600, marginTop:2 }}>{Math.abs(daysUntil(a.scheduled_date))}d overdue</div>
                      )}
                    </td>
                    <td style={{ padding:'12px 16px' }}><PlanBadge planType={plan} /></td>
                    <td style={{ padding:'12px 16px', color:'#4A6070', textTransform:'capitalize' }}>{a.assessment_type}</td>
                    <td style={{ padding:'12px 16px', color:'#4A6070' }}>{a.nurse?.full_name ?? '—'}</td>
                    <td style={{ padding:'12px 16px' }}><StatusBadge status={effStatus(a.status, a.scheduled_date)} /></td>
                    <td style={{ padding:'12px 16px' }}>
                      <button onClick={() => { setShowComplete(a.id); setCompleteNotes(''); setErr(null) }}
                        style={{ padding:'5px 12px', background:'#F0FDF4', border:'1px solid #86EFAC', color:'#15803D', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        Mark Complete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assessment history */}
      {pastAssessments.length > 0 && (
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #E2E8F0', fontSize:14, fontWeight:700, color:'#1A2E44' }}>Assessment History</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                {['Scheduled','Plan','Completed','Type','Nurse','Completed By','Status'].map(h => (
                  <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#4A6070', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #E2E8F0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pastAssessments.map((a, idx) => (
                <tr key={a.id} style={{ borderBottom: idx < pastAssessments.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <td style={{ padding:'12px 16px', color:'#4A6070' }}>{fmt(a.scheduled_date)}</td>
                  <td style={{ padding:'12px 16px' }}><PlanBadge planType={getAssessmentPlan(a)} /></td>
                  <td style={{ padding:'12px 16px', color:'#1A2E44', fontWeight:500 }}>{fmt(a.completed_date)}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ color:'#4A6070', textTransform:'capitalize' }}>{a.assessment_type}</span>
                      {a.is_initial && <InitialBadge />}
                      {a.triggers_reset && <span style={{ fontSize:10, color:'#B91C1C', fontWeight:700 }}>RESET</span>}
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', color:'#4A6070' }}>{a.nurse?.full_name ?? '—'}</td>
                  <td style={{ padding:'12px 16px', color:'#4A6070' }}>{a.completer?.full_name ?? '—'}</td>
                  <td style={{ padding:'12px 16px' }}><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit Client Modal ────────────────────────────────────────────── */}
      {showEdit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,46,68,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:600, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#1A2E44', margin:'0 0 20px' }}>Edit Client</h2>
            <div style={{ marginBottom:14 }}><label style={labelStyle}>Full Name <span style={{ color:'#B91C1C' }}>*</span></label><input style={inputStyle} value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={labelStyle}>Date of Birth</label><input type="date" style={inputStyle} value={editDob} onChange={e => setEditDob(e.target.value)} /></div>
              <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(301) 555-0100" /></div>
            </div>
            <div style={{ marginBottom:14 }}><label style={labelStyle}>Street Address</label><input style={inputStyle} value={editAddress} onChange={e => setEditAddress(e.target.value)} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={labelStyle}>City</label><input style={inputStyle} value={editCity} onChange={e => setEditCity(e.target.value)} /></div>
              <div><label style={labelStyle}>State</label><input style={inputStyle} value={editState} onChange={e => setEditState(e.target.value)} /></div>
              <div><label style={labelStyle}>ZIP</label><input style={inputStyle} value={editZip} onChange={e => setEditZip(e.target.value)} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={labelStyle}>Payer Type</label><select style={inputStyle} value={editPayer} onChange={e => setEditPayer(e.target.value)}><option value="">— Select —</option>{PAYER_TYPES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              <div><label style={labelStyle}>Status</label><select style={inputStyle} value={editStatus} onChange={e => setEditStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="discharged">Discharged</option></select></div>
            </div>
            <div style={{ marginBottom:14 }}><label style={labelStyle}>AxisCare ID</label><input style={inputStyle} value={editAxisId} onChange={e => setEditAxisId(e.target.value)} placeholder="Optional" /></div>
            <div style={{ marginBottom:20 }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, minHeight:72, resize:'vertical' }} value={editNotes} onChange={e => setEditNotes(e.target.value)} /></div>
            {err && <div style={{ color:'#B91C1C', fontSize:12, marginBottom:14 }}>{err}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setShowEdit(false); setErr(null) }} disabled={busy} style={{ padding:'8px 18px', background:'#F8FAFC', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={saveEdit} disabled={busy} style={{ padding:'8px 22px', background: busy ? '#5BA8A8' : '#0E7C7B', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                {busy ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Complete Modal ──────────────────────────────────────────── */}
      {showComplete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,46,68,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:440, maxWidth:'90vw' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#1A2E44', margin:'0 0 8px' }}>Mark Assessment Complete</h2>
            <p style={{ fontSize:13, color:'#4A6070', margin:'0 0 18px' }}>Records today as the completion date and schedules the next assessment automatically.</p>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea style={{ ...inputStyle, minHeight:80, resize:'vertical', marginBottom:20 }} value={completeNotes} onChange={e => setCompleteNotes(e.target.value)} placeholder="Clinical notes, observations…" />
            {err && <div style={{ color:'#B91C1C', fontSize:12, marginBottom:12 }}>{err}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setShowComplete(null)} disabled={busy} style={{ padding:'8px 16px', background:'#F8FAFC', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={() => markComplete(showComplete)} disabled={busy} style={{ padding:'8px 20px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                {busy ? 'Saving…' : 'Confirm Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Emergency Assessment Modal ───────────────────────────────────── */}
      {showEmergency && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,46,68,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:440, maxWidth:'90vw' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#B91C1C', margin:'0 0 8px' }}>Schedule Emergency Assessment</h2>
            <p style={{ fontSize:13, color:'#4A6070', margin:'0 0 6px' }}>For hospitalizations or sudden health declines. Scheduled for today.</p>
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#B91C1C', marginBottom:18 }}>
              ⚠ When completed, this resets the next due date to today + {clinicalSchedule?.cadence_days ?? '—'} days.
            </div>
            <label style={labelStyle}>Reason / Notes</label>
            <textarea style={{ ...inputStyle, minHeight:80, resize:'vertical', marginBottom:20 }} value={emergencyNotes} onChange={e => setEmergencyNotes(e.target.value)} placeholder="Reason for emergency assessment…" />
            {err && <div style={{ color:'#B91C1C', fontSize:12, marginBottom:12 }}>{err}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setShowEmergency(false)} disabled={busy} style={{ padding:'8px 16px', background:'#F8FAFC', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={scheduleEmergency} disabled={busy} style={{ padding:'8px 20px', background:'#B91C1C', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                {busy ? 'Scheduling…' : 'Schedule Emergency'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign / Edit Schedule Modal ─────────────────────────────────── */}
      {editingPlan && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,46,68,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:460, maxWidth:'90vw' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#1A2E44', margin:'0 0 18px' }}>{modalTitle}</h2>

            <label style={labelStyle}>Assigned Nurse</label>
            <select style={{ ...inputStyle, marginBottom:14 }} value={newNurseId} onChange={e => setNewNurseId(e.target.value)}>
              <option value="">— Select nurse —</option>
              {nurses.map(n => <option key={n.id} value={n.id}>{n.full_name} ({n.role})</option>)}
            </select>

            {editingPlan === 'ep_annual' ? (
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Cadence</label>
                <div style={{ padding:'8px 12px', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, color:'#4A6070', background:'#F8FAFC' }}>Annual (365 days) — fixed for EP plans</div>
              </div>
            ) : (
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Cadence</label>
                <select style={inputStyle} value={newCadence} onChange={e => setNewCadence(Number(e.target.value))}>
                  {CADENCE_OPTIONS.map(d => <option key={d} value={d}>{d}-day</option>)}
                </select>
              </div>
            )}

            {/* NEW SCHEDULE: first assessment due date */}
            {isNewSchedule && (
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>First Assessment Due Date</label>
                <input type="date" style={inputStyle} value={newFirstDue} onChange={e => setNewFirstDue(e.target.value)} />
              </div>
            )}

            {/* EXISTING SCHEDULE: reschedule next assessment date */}
            {!isNewSchedule && nextAssessmentId && (
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Next Assessment Date</label>
                <input type="date" style={inputStyle} value={nextAssessmentDate} onChange={e => setNextAssessmentDate(e.target.value)} />
                <div style={{ fontSize:11, color:'#8FA0B0', marginTop:4 }}>
                  Adjust if the nurse&apos;s schedule requires a different date.
                </div>
              </div>
            )}

            {/* INITIAL CHECKBOX — clinical only, both Assign and Edit modes */}
            {editingPlan === 'clinical' && (isNewSchedule || nextAssessmentId) && (
              <div style={{ marginBottom:18, display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8 }}>
                <input
                  type="checkbox"
                  id="is-initial-check"
                  checked={isInitialCheck}
                  onChange={e => setIsInitialCheck(e.target.checked)}
                  style={{ width:16, height:16, marginTop:2, accentColor:'#92400E', cursor:'pointer', flexShrink:0 }}
                />
                <label htmlFor="is-initial-check" style={{ fontSize:13, color:'#92400E', fontWeight:600, cursor:'pointer', margin:0 }}>
                  This is an Initial Assessment
                  <div style={{ fontSize:11, color:'#B45309', fontWeight:400, marginTop:2 }}>
                    {isNewSchedule
                      ? "Check for clients whose first assessment has not happened yet."
                      : "Check or uncheck to correct the initial assessment flag on the next pending visit."}
                  </div>
                </label>
              </div>
            )}

            {err && <div style={{ color:'#B91C1C', fontSize:12, marginBottom:12 }}>{err}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setEditingPlan(null); setErr(null) }} disabled={busy} style={{ padding:'8px 16px', background:'#F8FAFC', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={assignSchedule} disabled={busy} style={{ padding:'8px 20px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                {busy ? 'Saving…' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
