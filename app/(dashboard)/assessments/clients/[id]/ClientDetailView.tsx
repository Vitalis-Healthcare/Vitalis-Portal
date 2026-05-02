'use client'
// app/(dashboard)/assessments/clients/[id]/ClientDetailView.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type NurseOption = { id: string; full_name: string; role: string }
type Schedule = {
  id: string; cadence_days: number; is_active: boolean
  nurse_id: string; plan_type: string
  nurse: { id: string; full_name: string; email: string } | null
} | null
type Assessment = {
  id: string; schedule_id: string | null; is_initial: boolean
  scheduled_date: string; completed_date: string | null
  status: string; assessment_type: string; triggers_reset: boolean
  notes: string | null
  nurse: { id: string; full_name: string } | null
  completer: { id: string; full_name: string } | null
}
type Client = {
  id: string; full_name: string; date_of_birth: string | null
  phone: string | null; address: string | null; city: string | null
  state: string; zip: string | null; payer_type: string | null
  axiscare_id: string | null; status: string; notes: string | null
  created_at: string
}
type PlanType = 'clinical' | 'ep_annual'

const CADENCE_OPTIONS = [120, 90, 60, 30]
const PAYER_TYPES = [
  'Private Pay','Medicaid','Medicare','Medicaid Waiver',
  'CareFirst','Wellpoint','United Healthcare','Aetna','BCHD','Other',
]

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function daysUntil(d: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.round((new Date(d + 'T00:00:00').getTime() - today.getTime()) / 86400000)
}
function effStatus(s: string, d: string) {
  if (s === 'completed' || s === 'cancelled') return s
  return daysUntil(d) < 0 ? 'overdue' : s
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, [string, string, string]> = {
    scheduled:  ['#EFF6FF','#1D4ED8','#BFDBFE'],
    completed:  ['#F0FDF4','#15803D','#86EFAC'],
    overdue:    ['#FEF2F2','#B91C1C','#FECACA'],
    cancelled:  ['#F9FAFB','#6B7280','#E5E7EB'],
    active:     ['#F0FDF4','#15803D','#86EFAC'],
    inactive:   ['#FFF7ED','#C2410C','#FED7AA'],
    discharged: ['#F9FAFB','#6B7280','#E5E7EB'],
  }
  const [bg, color, border] = m[status] ?? m.scheduled
  return (
    <span style={{ display:'inline-block', padding:'3px 12px', borderRadius:12, fontSize:12, fontWeight:600, background:bg, color, border:`1px solid ${border}`, textTransform:'capitalize' }}>
      {status}
    </span>
  )
}
function InitialBadge() {
  return <span style={{ fontSize:10, fontWeight:700, color:'#92400E', background:'#FEF3C7', padding:'2px 6px', borderRadius:6, border:'1px solid #FDE68A' }}>INITIAL</span>
}
function PlanBadge({ planType }: { planType: 'clinical'|'ep_annual'|'unknown' }) {
  if (planType === 'ep_annual') {
    return <span style={{ fontSize:10, fontWeight:700, color:'#0E7C7B', background:'#E6F4F4', padding:'2px 6px', borderRadius:6, border:'1px solid #B2E0DF', whiteSpace:'nowrap' }}>EP</span>
  }
  return null
}

export default function ClientDetailView({
  client: initialClient, clinicalSchedule, epSchedule,
  assessments: initialAssessments, nurses,
  currentUserId, currentUserRole, currentUserCanBeAssigned,
}: {
  client: Client; clinicalSchedule: Schedule; epSchedule: Schedule
  assessments: Assessment[]; nurses: NurseOption[]
  currentUserId: string; currentUserRole: string
  currentUserCanBeAssigned: boolean
}) {
  const router = useRouter()
  const [client, setClient] = useState(initialClient)
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  // Admin-only: assign schedules, edit client, emergency assessment, archive, delete
  const canEdit = currentUserRole === 'admin'

  // Admin OR any profile with can_be_assigned = true: mark own assessments complete
  const canComplete = currentUserRole === 'admin' || currentUserCanBeAssigned

  // Schedule modal state
  const [editingPlan, setEditingPlan]               = useState<PlanType | null>(null)
  const [newNurseId, setNewNurseId]                 = useState('')
  const [newCadence, setNewCadence]                 = useState(120)
  const [newFirstDue, setNewFirstDue]               = useState('')
  const [isInitialCheck, setIsInitialCheck]         = useState(false)
  const [origIsInitial, setOrigIsInitial]           = useState(false)
  const [nextAssessmentId, setNextAssessmentId]     = useState<string | null>(null)
  const [nextAssessmentDate, setNextAssessmentDate] = useState('')
  const [origNextDate, setOrigNextDate]             = useState('')

  // Other modals
  const [showComplete, setShowComplete]       = useState<string | null>(null)
  const [completeNotes, setCompleteNotes]     = useState('')
  const [showEmergency, setShowEmergency]     = useState(false)
  const [emergencyNotes, setEmergencyNotes]   = useState('')
  const [showArchive, setShowArchive]         = useState(false)
  const [showDelete, setShowDelete]           = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  // Edit client state
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

  const inp: React.CSSProperties = { width:'100%', padding:'8px 12px', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, color:'#1A2E44', background:'#fff', boxSizing:'border-box' }
  const lbl: React.CSSProperties = { display:'block', fontSize:12, fontWeight:600, color:'#4A6070', marginBottom:4 }
  const eBtn: React.CSSProperties = { padding:'3px 10px', background:'transparent', border:'1px solid #D1D9E0', color:'#0E7C7B', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer' }

  const targetSchedule = editingPlan === 'clinical' ? clinicalSchedule : epSchedule
  const isNewSchedule  = !targetSchedule

  const pendingAssessments = initialAssessments.filter(a => ['scheduled','overdue'].includes(a.status))
  const pastAssessments    = initialAssessments.filter(a => !['scheduled','overdue'].includes(a.status))

  const getPlan = (a: Assessment): 'clinical'|'ep_annual'|'unknown' => {
    if (a.schedule_id === clinicalSchedule?.id) return 'clinical'
    if (a.schedule_id === epSchedule?.id)       return 'ep_annual'
    return 'unknown'
  }

  const openScheduleModal = (planType: PlanType) => {
    const target = planType === 'clinical' ? clinicalSchedule : epSchedule
    const nextPending = pendingAssessments
      .filter(a => getPlan(a) === planType)
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0] ?? null
    setEditingPlan(planType)
    setNewNurseId(target?.nurse_id ?? '')
    setNewCadence(planType === 'ep_annual' ? 365 : (target?.cadence_days ?? 120))
    setNewFirstDue('')
    const iv = nextPending?.is_initial ?? false
    setIsInitialCheck(iv); setOrigIsInitial(iv)
    setNextAssessmentId(nextPending?.id ?? null)
    setNextAssessmentDate(nextPending?.scheduled_date ?? '')
    setOrigNextDate(nextPending?.scheduled_date ?? '')
    setErr(null)
  }

  const saveEdit = async () => {
    if (!editName.trim()) { setErr('Client name is required.'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`/api/assessments/clients/${client.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ full_name:editName.trim(), date_of_birth:editDob||null, phone:editPhone||null, address:editAddress||null, city:editCity||null, state:editState||'MD', zip:editZip||null, payer_type:editPayer||null, axiscare_id:editAxisId||null, notes:editNotes||null, status:editStatus }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed to save.'); return }
      setClient(data.data); setShowEdit(false); router.refresh()
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  const markComplete = async (id: string) => {
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`/api/assessments/${id}/complete`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ notes: completeNotes || null }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed.'); return }
      setShowComplete(null); setCompleteNotes(''); router.refresh()
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  const scheduleEmergency = async () => {
    if (!clinicalSchedule) { setErr('No active clinical schedule.'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/assessments/emergency', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ client_id:client.id, schedule_id:clinicalSchedule.id, nurse_id:clinicalSchedule.nurse_id, notes:emergencyNotes||null }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed.'); return }
      setShowEmergency(false); setEmergencyNotes(''); router.refresh()
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  const assignSchedule = async () => {
    if (!newNurseId || (isNewSchedule && !newFirstDue)) { setErr('Nurse and first due date are required.'); return }
    setBusy(true); setErr(null)
    try {
      const method = targetSchedule ? 'PATCH' : 'POST'
      const url    = targetSchedule ? `/api/assessments/schedules/${targetSchedule.id}` : '/api/assessments/schedules'
      const body   = targetSchedule
        ? { nurse_id:newNurseId, cadence_days:newCadence }
        : { client_id:client.id, nurse_id:newNurseId, cadence_days:newCadence, first_due_date:newFirstDue, plan_type:editingPlan, is_initial:isInitialCheck }
      const res  = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed.'); return }
      if (targetSchedule && nextAssessmentId) {
        const dateChanged    = nextAssessmentDate && nextAssessmentDate !== origNextDate
        const initialChanged = isInitialCheck !== origIsInitial
        if (dateChanged || initialChanged) {
          const pb: Record<string,unknown> = {}
          if (dateChanged)    pb.scheduled_date = nextAssessmentDate
          if (initialChanged) pb.is_initial     = isInitialCheck
          const ar = await fetch(`/api/assessments/${nextAssessmentId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(pb) })
          const ad = await ar.json()
          if (!ar.ok) { setErr(ad.error ?? 'Schedule saved but assessment update failed.'); return }
        }
      }
      setEditingPlan(null); router.refresh()
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  const archiveClient = async () => {
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`/api/assessments/clients/${client.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ status:'discharged' }),
      })
      if (!res.ok) { const d = await res.json(); setErr(d.error ?? 'Failed.'); return }
      router.push('/assessments/clients')
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  const deleteClient = async () => {
    if (deleteConfirmName !== client.full_name) return
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`/api/assessments/clients/${client.id}`, { method:'DELETE' })
      if (!res.ok) { const d = await res.json(); setErr(d.error ?? 'Failed.'); return }
      router.push('/assessments/clients')
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  const modalTitle = editingPlan
    ? `${targetSchedule ? 'Edit' : 'Assign'} ${editingPlan === 'ep_annual' ? 'EP Annual Plan' : 'Clinical Schedule'}`
    : ''

  const ScheduleSection = ({ label, planType, sched }: { label: string; planType: PlanType; sched: Schedule }) => {
    const isEP = planType === 'ep_annual'
    const pendingForPlan = pendingAssessments.filter(a => getPlan(a) === planType).sort((a,b) => a.scheduled_date.localeCompare(b.scheduled_date))
    const next = pendingForPlan[0] ?? null
    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color: isEP ? '#4A6070' : '#0E7C7B' }}>{label}</div>
          {canEdit && <button onClick={() => openScheduleModal(planType)} style={eBtn}>{sched ? 'Edit' : 'Assign'}</button>}
        </div>
        {sched ? (
          <>
            {([['Assigned Nurse', sched.nurse?.full_name ?? '—'], ['Cadence', isEP ? 'Annual (365 days)' : `${sched.cadence_days}-day`]] as [string,string][]).map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:12, color:'#8FA0B0' }}>{l}</span>
                <span style={{ fontSize:13, color:'#1A2E44', fontWeight:500 }}>{v}</span>
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
            ⚠ No {isEP ? 'EP plan' : 'clinical schedule'}.{canEdit ? ' Click "Assign" to set up.' : ' Contact your administrator.'}
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
          {canEdit && (
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setShowEdit(true); setErr(null) }} style={{ padding:'8px 16px', background:'#F8FAFC', border:'1px solid #D1D9E0', color:'#1A2E44', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                ✎ Edit Client
              </button>
              {pendingAssessments.length > 0 && (
                <button onClick={() => { setShowEmergency(true); setErr(null) }} style={{ padding:'8px 16px', background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  + Emergency Assessment
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {err && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 16px', color:'#B91C1C', fontSize:13, marginBottom:20 }}>{err}</div>}

      {/* Info + Schedules */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'20px 22px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#4A6070', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:14 }}>Client Information</div>
          {([
            ['Date of Birth', fmt(client.date_of_birth)],
            ['Phone', client.phone ?? '—'],
            ['Address', [client.address, client.city, client.state, client.zip].filter(Boolean).join(', ') || '—'],
            ['Payer', client.payer_type ?? '—'],
            ['AxisCare ID', client.axiscare_id ?? '—'],
          ] as [string,string][]).map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:12, color:'#8FA0B0' }}>{l}</span>
              <span style={{ fontSize:13, color:'#1A2E44', fontWeight:500, textAlign:'right', maxWidth:'65%' }}>{v}</span>
            </div>
          ))}
          {client.notes && <div style={{ marginTop:12, padding:'10px 12px', background:'#F8FAFC', borderRadius:7, fontSize:12, color:'#4A6070' }}>{client.notes}</div>}
        </div>
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'20px 22px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#4A6070', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:16 }}>Assessment Schedules</div>
          <ScheduleSection label="Clinical" planType="clinical" sched={clinicalSchedule} />
          <div style={{ borderTop:'1px solid #F1F5F9', margin:'16px 0' }} />
          <ScheduleSection label="EP Annual Plan" planType="ep_annual" sched={epSchedule} />
        </div>
      </div>

      {/* Pending Assessments */}
      {pendingAssessments.length > 0 && (
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, overflow:'hidden', marginBottom:20 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #E2E8F0', fontSize:14, fontWeight:700, color:'#1A2E44' }}>Pending Assessments</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                {['Due Date','Plan','Type','Nurse','Status', ...(canComplete ? [''] : [])].map(h => (
                  <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#4A6070', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #E2E8F0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingAssessments.map((a, idx) => {
                // Admin can complete any; assignable users only their own
                const thisCanComplete = canComplete && (
                  currentUserRole === 'admin' || a.nurse?.id === currentUserId
                )
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
                    <td style={{ padding:'12px 16px' }}><PlanBadge planType={getPlan(a)} /></td>
                    <td style={{ padding:'12px 16px', color:'#4A6070', textTransform:'capitalize' }}>{a.assessment_type}</td>
                    <td style={{ padding:'12px 16px', color:'#4A6070' }}>{a.nurse?.full_name ?? '—'}</td>
                    <td style={{ padding:'12px 16px' }}><StatusBadge status={effStatus(a.status, a.scheduled_date)} /></td>
                    {canComplete && (
                      <td style={{ padding:'12px 16px' }}>
                        {thisCanComplete ? (
                          <button
                            onClick={() => { setShowComplete(a.id); setCompleteNotes(''); setErr(null) }}
                            style={{ padding:'5px 12px', background:'#F0FDF4', border:'1px solid #86EFAC', color:'#15803D', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}
                          >
                            Mark Complete
                          </button>
                        ) : (
                          <span style={{ fontSize:11, color:'#C0CAD4' }}>—</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assessment History */}
      {pastAssessments.length > 0 && (
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, overflow:'hidden', marginBottom:24 }}>
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
                  <td style={{ padding:'12px 16px' }}><PlanBadge planType={getPlan(a)} /></td>
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

      {/* Admin-only danger zone */}
      {canEdit && (
        <div style={{ padding:'20px 24px', background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#92400E', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>Client Management</div>
          <div style={{ display:'flex', gap:10, marginBottom:10 }}>
            <button onClick={() => { setShowArchive(true); setErr(null) }} style={{ padding:'8px 16px', background:'#FEF3C7', border:'1px solid #FDE68A', color:'#92400E', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer' }}>📦 Archive Client</button>
            <button onClick={() => { setShowDelete(true); setDeleteConfirmName(''); setErr(null) }} style={{ padding:'8px 16px', background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer' }}>🗑 Delete Client</button>
          </div>
          <div style={{ fontSize:11, color:'#B45309' }}>
            <strong>Archive</strong> moves client to Discharged — all records preserved, reversible. &nbsp;
            <strong>Delete</strong> permanently removes the client and all assessment history.
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEdit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,46,68,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:600, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#1A2E44', margin:'0 0 20px' }}>Edit Client</h2>
            <div style={{ marginBottom:14 }}><label style={lbl}>Full Name *</label><input style={inp} value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={lbl}>Date of Birth</label><input type="date" style={inp} value={editDob} onChange={e => setEditDob(e.target.value)} /></div>
              <div><label style={lbl}>Phone</label><input style={inp} value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(301) 555-0100" /></div>
            </div>
            <div style={{ marginBottom:14 }}><label style={lbl}>Street Address</label><input style={inp} value={editAddress} onChange={e => setEditAddress(e.target.value)} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={lbl}>City</label><input style={inp} value={editCity} onChange={e => setEditCity(e.target.value)} /></div>
              <div><label style={lbl}>State</label><input style={inp} value={editState} onChange={e => setEditState(e.target.value)} /></div>
              <div><label style={lbl}>ZIP</label><input style={inp} value={editZip} onChange={e => setEditZip(e.target.value)} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={lbl}>Payer Type</label>
                <select style={inp} value={editPayer} onChange={e => setEditPayer(e.target.value)}>
                  <option value="">— Select —</option>{PAYER_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Status</label>
                <select style={inp} value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  <option value="active">Active</option><option value="inactive">Inactive</option><option value="discharged">Discharged</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom:14 }}><label style={lbl}>AxisCare ID</label><input style={inp} value={editAxisId} onChange={e => setEditAxisId(e.target.value)} placeholder="Optional" /></div>
            <div style={{ marginBottom:20 }}><label style={lbl}>Notes</label><textarea style={{ ...inp, minHeight:72, resize:'vertical' }} value={editNotes} onChange={e => setEditNotes(e.target.value)} /></div>
            {err && <div style={{ color:'#B91C1C', fontSize:12, marginBottom:14 }}>{err}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setShowEdit(false); setErr(null) }} disabled={busy} style={{ padding:'8px 18px', background:'#F8FAFC', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={saveEdit} disabled={busy} style={{ padding:'8px 22px', background: busy ? '#5BA8A8' : '#0E7C7B', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor: busy ? 'not-allowed' : 'pointer' }}>{busy ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Complete Modal */}
      {showComplete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,46,68,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:440, maxWidth:'90vw' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#1A2E44', margin:'0 0 8px' }}>Mark Assessment Complete</h2>
            <p style={{ fontSize:13, color:'#4A6070', margin:'0 0 18px' }}>Records today as the completion date and schedules the next assessment automatically.</p>
            <label style={lbl}>Notes (optional)</label>
            <textarea style={{ ...inp, minHeight:80, resize:'vertical', marginBottom:20 }} value={completeNotes} onChange={e => setCompleteNotes(e.target.value)} placeholder="Clinical notes, observations…" />
            {err && <div style={{ color:'#B91C1C', fontSize:12, marginBottom:12 }}>{err}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setShowComplete(null)} disabled={busy} style={{ padding:'8px 16px', background:'#F8FAFC', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={() => markComplete(showComplete)} disabled={busy} style={{ padding:'8px 20px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor: busy ? 'not-allowed' : 'pointer' }}>{busy ? 'Saving…' : 'Confirm Complete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Assessment Modal */}
      {showEmergency && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,46,68,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:440, maxWidth:'90vw' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#B91C1C', margin:'0 0 8px' }}>Schedule Emergency Assessment</h2>
            <p style={{ fontSize:13, color:'#4A6070', margin:'0 0 6px' }}>For hospitalizations or sudden health declines. Scheduled for today.</p>
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#B91C1C', marginBottom:18 }}>
              ⚠ When completed, this resets the next due date to today + {clinicalSchedule?.cadence_days ?? '—'} days.
            </div>
            <label style={lbl}>Reason / Notes</label>
            <textarea style={{ ...inp, minHeight:80, resize:'vertical', marginBottom:20 }} value={emergencyNotes} onChange={e => setEmergencyNotes(e.target.value)} placeholder="Reason for emergency assessment…" />
            {err && <div style={{ color:'#B91C1C', fontSize:12, marginBottom:12 }}>{err}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setShowEmergency(false)} disabled={busy} style={{ padding:'8px 16px', background:'#F8FAFC', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={scheduleEmergency} disabled={busy} style={{ padding:'8px 20px', background:'#B91C1C', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor: busy ? 'not-allowed' : 'pointer' }}>{busy ? 'Scheduling…' : 'Schedule Emergency'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign / Edit Schedule Modal */}
      {editingPlan && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,46,68,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:460, maxWidth:'90vw' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#1A2E44', margin:'0 0 18px' }}>{modalTitle}</h2>
            <label style={lbl}>Assigned Nurse Monitor</label>
            <select style={{ ...inp, marginBottom:14 }} value={newNurseId} onChange={e => setNewNurseId(e.target.value)}>
              <option value="">— Select nurse monitor —</option>
              {nurses.map(n => <option key={n.id} value={n.id}>{n.full_name}</option>)}
            </select>
            {editingPlan === 'ep_annual' ? (
              <div style={{ marginBottom:14 }}><label style={lbl}>Cadence</label>
                <div style={{ padding:'8px 12px', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, color:'#4A6070', background:'#F8FAFC' }}>Annual (365 days) — fixed for EP plans</div>
              </div>
            ) : (
              <div style={{ marginBottom:14 }}><label style={lbl}>Cadence</label>
                <select style={inp} value={newCadence} onChange={e => setNewCadence(Number(e.target.value))}>
                  {CADENCE_OPTIONS.map(d => <option key={d} value={d}>{d}-day</option>)}
                </select>
              </div>
            )}
            {isNewSchedule && (
              <div style={{ marginBottom:14 }}><label style={lbl}>First Assessment Due Date</label>
                <input type="date" style={inp} value={newFirstDue} onChange={e => setNewFirstDue(e.target.value)} />
              </div>
            )}
            {!isNewSchedule && nextAssessmentId && (
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Next Assessment Date</label>
                <input type="date" style={inp} value={nextAssessmentDate} onChange={e => setNextAssessmentDate(e.target.value)} />
                <div style={{ fontSize:11, color:'#8FA0B0', marginTop:4 }}>Adjust if the schedule requires a different date.</div>
              </div>
            )}
            {editingPlan === 'clinical' && (isNewSchedule || nextAssessmentId) && (
              <div style={{ marginBottom:18, display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8 }}>
                <input type="checkbox" id="is-initial-check" checked={isInitialCheck} onChange={e => setIsInitialCheck(e.target.checked)}
                  style={{ width:16, height:16, marginTop:2, accentColor:'#92400E', cursor:'pointer', flexShrink:0 }} />
                <label htmlFor="is-initial-check" style={{ fontSize:13, color:'#92400E', fontWeight:600, cursor:'pointer', margin:0 }}>
                  This is an Initial Assessment
                  <div style={{ fontSize:11, color:'#B45309', fontWeight:400, marginTop:2 }}>
                    {isNewSchedule ? "Check for clients whose first assessment has not happened yet." : "Check or uncheck to correct the initial flag on the next pending visit."}
                  </div>
                </label>
              </div>
            )}
            {err && <div style={{ color:'#B91C1C', fontSize:12, marginBottom:12 }}>{err}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setEditingPlan(null); setErr(null) }} disabled={busy} style={{ padding:'8px 16px', background:'#F8FAFC', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={assignSchedule} disabled={busy} style={{ padding:'8px 20px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor: busy ? 'not-allowed' : 'pointer' }}>{busy ? 'Saving…' : 'Save Schedule'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchive && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,46,68,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:440, maxWidth:'90vw' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#92400E', margin:'0 0 10px' }}>📦 Archive {client.full_name}?</h2>
            <p style={{ fontSize:13, color:'#4A6070', margin:'0 0 18px', lineHeight:1.6 }}>
              This client will be moved to <strong>Discharged</strong> status. All assessment history is preserved and this can be reversed via Edit Client.
            </p>
            {err && <div style={{ color:'#B91C1C', fontSize:12, marginBottom:12 }}>{err}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setShowArchive(false)} disabled={busy} style={{ padding:'8px 16px', background:'#F8FAFC', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={archiveClient} disabled={busy} style={{ padding:'8px 20px', background: busy ? '#D9B05A' : '#92400E', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor: busy ? 'not-allowed' : 'pointer' }}>{busy ? 'Archiving…' : 'Archive Client'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,46,68,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:460, maxWidth:'90vw' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#B91C1C', margin:'0 0 10px' }}>🗑 Permanently Delete Client?</h2>
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'12px 14px', fontSize:13, color:'#B91C1C', marginBottom:18, lineHeight:1.6 }}>
              This permanently deletes <strong>{client.full_name}</strong> and ALL associated assessment history. This cannot be undone.
            </div>
            <p style={{ fontSize:13, color:'#4A6070', margin:'0 0 10px' }}>Type the client&apos;s full name to confirm:</p>
            <input
              style={{ ...inp, marginBottom:6, borderColor: deleteConfirmName && deleteConfirmName !== client.full_name ? '#FECACA' : '#D1D9E0' }}
              value={deleteConfirmName} onChange={e => setDeleteConfirmName(e.target.value)} placeholder={client.full_name}
            />
            {deleteConfirmName && deleteConfirmName !== client.full_name && <div style={{ fontSize:11, color:'#B91C1C', marginBottom:14 }}>Name does not match — check capitalisation.</div>}
            {!deleteConfirmName && <div style={{ marginBottom:14 }} />}
            {err && <div style={{ color:'#B91C1C', fontSize:12, marginBottom:12 }}>{err}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setShowDelete(false); setDeleteConfirmName('') }} disabled={busy} style={{ padding:'8px 16px', background:'#F8FAFC', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={deleteClient} disabled={busy || deleteConfirmName !== client.full_name}
                style={{ padding:'8px 20px', background: (busy || deleteConfirmName !== client.full_name) ? '#E0A0A0' : '#B91C1C', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor: (busy || deleteConfirmName !== client.full_name) ? 'not-allowed' : 'pointer' }}>
                {busy ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
