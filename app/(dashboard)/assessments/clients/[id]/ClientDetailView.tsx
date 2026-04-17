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
  nurse: { id: string; full_name: string; email: string } | null
} | null
type Assessment = {
  id: string
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

const CADENCE_OPTIONS = [120, 90, 60, 30]

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const due   = new Date(dateStr + 'T00:00:00')
  return Math.round((due.getTime() - today.getTime()) / 86400000)
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
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: 12, fontSize: 12,
      fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  )
}

export default function ClientDetailView({
  client: initialClient,
  schedule: initialSchedule,
  assessments: initialAssessments,
  nurses,
  currentUserId,
  currentUserRole,
}: {
  client: Client
  schedule: Schedule
  assessments: Assessment[]
  nurses: NurseOption[]
  currentUserId: string
  currentUserRole: string
}) {
  const router = useRouter()
  const [client, setClient]           = useState(initialClient)
  const [schedule, setSchedule]       = useState(initialSchedule)
  const [assessments, setAssessments] = useState(initialAssessments)
  const [busy, setBusy]               = useState(false)
  const [err, setErr]                 = useState<string | null>(null)

  // Modal states
  const [showComplete, setShowComplete]   = useState<string | null>(null) // assessment id
  const [completeNotes, setCompleteNotes] = useState('')
  const [showEmergency, setShowEmergency] = useState(false)
  const [emergencyNotes, setEmergencyNotes] = useState('')
  const [showAssignSchedule, setShowAssignSchedule] = useState(false)
  const [newNurseId, setNewNurseId]       = useState(schedule?.nurse_id ?? '')
  const [newCadence, setNewCadence]       = useState(schedule?.cadence_days ?? 120)
  const [newFirstDue, setNewFirstDue]     = useState('')

  const canEdit = ['admin', 'supervisor'].includes(currentUserRole)

  const reload = () => router.refresh()

  const markComplete = async (assessmentId: string) => {
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: completeNotes || null }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed to mark complete.'); return }
      setShowComplete(null)
      setCompleteNotes('')
      // Optimistically reload
      router.refresh()
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  const scheduleEmergency = async () => {
    if (!schedule) { setErr('No active schedule — assign a nurse first.'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/assessments/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:   client.id,
          schedule_id: schedule.id,
          nurse_id:    schedule.nurse_id,
          notes:       emergencyNotes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed to schedule emergency assessment.'); return }
      setShowEmergency(false)
      setEmergencyNotes('')
      router.refresh()
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  const assignSchedule = async () => {
    if (!newNurseId || !newFirstDue) { setErr('Nurse and first due date are required.'); return }
    setBusy(true); setErr(null)
    try {
      const method = schedule ? 'PATCH' : 'POST'
      const url    = schedule
        ? `/api/assessments/schedules/${schedule.id}`
        : '/api/assessments/schedules'
      const body = schedule
        ? { nurse_id: newNurseId, cadence_days: newCadence }
        : { client_id: client.id, nurse_id: newNurseId, cadence_days: newCadence, first_due_date: newFirstDue }

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed to save schedule.'); return }
      setShowAssignSchedule(false)
      router.refresh()
    } catch { setErr('Unexpected error.') } finally { setBusy(false) }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #D1D9E0', borderRadius: 7,
    fontSize: 13, color: '#1A2E44', background: '#fff', boxSizing: 'border-box' as const,
  }

  const pendingAssessments = assessments.filter(a => ['scheduled', 'overdue'].includes(a.status))
  const pastAssessments    = assessments.filter(a => !['scheduled', 'overdue'].includes(a.status))

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/assessments/clients" style={{ color: '#0E7C7B', textDecoration: 'none', fontSize: 13 }}>
          ← Clients
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>{client.full_name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <StatusBadge status={client.status} />
              {client.payer_type && <span style={{ fontSize: 12, color: '#4A6070' }}>{client.payer_type}</span>}
            </div>
          </div>
          {canEdit && pendingAssessments.length > 0 && (
            <button
              onClick={() => { setShowEmergency(true); setErr(null) }}
              style={{
                padding: '8px 16px', background: '#FEF2F2', border: '1px solid #FECACA',
                color: '#B91C1C', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              + Emergency Assessment
            </button>
          )}
        </div>
      </div>

      {err && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
          padding: '10px 16px', color: '#B91C1C', fontSize: 13, marginBottom: 20,
        }}>
          {err}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Client Info */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
            Client Information
          </div>
          {[
            ['Date of Birth', fmt(client.date_of_birth)],
            ['Phone', client.phone ?? '—'],
            ['Address', [client.address, client.city, client.state, client.zip].filter(Boolean).join(', ') || '—'],
            ['AxisCare ID', client.axiscare_id ?? '—'],
          ].map(([label, value]) => (
            <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#8FA0B0' }}>{label}</span>
              <span style={{ fontSize: 13, color: '#1A2E44', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
            </div>
          ))}
          {client.notes && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: '#F8FAFC', borderRadius: 7, fontSize: 12, color: '#4A6070' }}>
              {client.notes}
            </div>
          )}
        </div>

        {/* Schedule */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Assessment Schedule
            </div>
            {canEdit && (
              <button
                onClick={() => { setShowAssignSchedule(true); setErr(null) }}
                style={{
                  padding: '4px 10px', background: 'transparent', border: '1px solid #D1D9E0',
                  color: '#0E7C7B', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {schedule ? 'Edit' : 'Assign'}
              </button>
            )}
          </div>
          {schedule ? (
            <>
              {[
                ['Assigned Nurse', schedule.nurse?.full_name ?? '—'],
                ['Cadence', `${schedule.cadence_days}-day`],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#8FA0B0' }}>{label}</span>
                  <span style={{ fontSize: 13, color: '#1A2E44', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
              {pendingAssessments[0] && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#EFF6FF', borderRadius: 7 }}>
                  <div style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 600, marginBottom: 3 }}>NEXT ASSESSMENT</div>
                  <div style={{ fontSize: 13, color: '#1A2E44', fontWeight: 700 }}>
                    {fmt(pendingAssessments[0].scheduled_date)}
                  </div>
                  <div style={{ fontSize: 11, color: '#4A6070', marginTop: 2 }}>
                    {(() => {
                      const d = daysUntil(pendingAssessments[0].scheduled_date)
                      if (d < 0) return <span style={{ color: '#B91C1C', fontWeight: 600 }}>{Math.abs(d)} days overdue</span>
                      if (d === 0) return <span style={{ color: '#D97706', fontWeight: 600 }}>Due today</span>
                      return `in ${d} day${d !== 1 ? 's' : ''}`
                    })()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#D97706', fontSize: 13, padding: '8px 0' }}>
              ⚠ No active schedule. {canEdit ? 'Click "Assign" to set up.' : 'Contact your supervisor.'}
            </div>
          )}
        </div>
      </div>

      {/* Pending assessments */}
      {pendingAssessments.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', fontSize: 14, fontWeight: 700, color: '#1A2E44' }}>
            Pending Assessments
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Due Date', 'Type', 'Nurse', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingAssessments.map((a, idx) => (
                <tr key={a.id} style={{ borderBottom: idx < pendingAssessments.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1A2E44' }}>{fmt(a.scheduled_date)}</td>
                  <td style={{ padding: '12px 16px', color: '#4A6070', textTransform: 'capitalize' }}>{a.assessment_type}</td>
                  <td style={{ padding: '12px 16px', color: '#4A6070' }}>{a.nurse?.full_name ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={a.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => { setShowComplete(a.id); setCompleteNotes(''); setErr(null) }}
                      style={{
                        padding: '5px 12px', background: '#F0FDF4', border: '1px solid #86EFAC',
                        color: '#15803D', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Mark Complete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assessment history */}
      {pastAssessments.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', fontSize: 14, fontWeight: 700, color: '#1A2E44' }}>
            Assessment History
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Scheduled', 'Completed', 'Type', 'Nurse', 'Completed By', 'Status'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pastAssessments.map((a, idx) => (
                <tr key={a.id} style={{ borderBottom: idx < pastAssessments.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <td style={{ padding: '12px 16px', color: '#4A6070' }}>{fmt(a.scheduled_date)}</td>
                  <td style={{ padding: '12px 16px', color: '#1A2E44', fontWeight: 500 }}>{fmt(a.completed_date)}</td>
                  <td style={{ padding: '12px 16px', color: '#4A6070', textTransform: 'capitalize' }}>
                    {a.assessment_type}
                    {a.triggers_reset && <span style={{ fontSize: 10, marginLeft: 6, color: '#B91C1C', fontWeight: 700 }}>RESET</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4A6070' }}>{a.nurse?.full_name ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#4A6070' }}>{a.completer?.full_name ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Mark Complete Modal ──────────────────────────────────────── */}
      {showComplete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(26,46,68,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 440, maxWidth: '90vw' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A2E44', margin: '0 0 8px' }}>Mark Assessment Complete</h2>
            <p style={{ fontSize: 13, color: '#4A6070', margin: '0 0 18px' }}>
              This will record today as the completion date and schedule the next assessment automatically.
            </p>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A6070', marginBottom: 5 }}>
              Notes (optional)
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginBottom: 20 }}
              value={completeNotes} onChange={e => setCompleteNotes(e.target.value)}
              placeholder="Clinical notes, observations…"
            />
            {err && <div style={{ color: '#B91C1C', fontSize: 12, marginBottom: 12 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowComplete(null)} disabled={busy} style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => markComplete(showComplete)} disabled={busy} style={{ padding: '8px 20px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                {busy ? 'Saving…' : 'Confirm Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Emergency Assessment Modal ───────────────────────────────── */}
      {showEmergency && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,46,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 440, maxWidth: '90vw' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#B91C1C', margin: '0 0 8px' }}>Schedule Emergency Assessment</h2>
            <p style={{ fontSize: 13, color: '#4A6070', margin: '0 0 6px' }}>
              Use this for hospitalizations or sudden health declines. The assessment will be scheduled for today.
            </p>
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#B91C1C', marginBottom: 18 }}>
              ⚠ When marked complete, this assessment will reset the next due date to today + the client's cadence ({schedule?.cadence_days ?? '—'} days).
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A6070', marginBottom: 5 }}>
              Reason / Notes
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginBottom: 20 }}
              value={emergencyNotes} onChange={e => setEmergencyNotes(e.target.value)}
              placeholder="Reason for emergency assessment (e.g. hospitalization on 04/15)…"
            />
            {err && <div style={{ color: '#B91C1C', fontSize: 12, marginBottom: 12 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEmergency(false)} disabled={busy} style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={scheduleEmergency} disabled={busy} style={{ padding: '8px 20px', background: '#B91C1C', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                {busy ? 'Scheduling…' : 'Schedule Emergency'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign / Edit Schedule Modal ────────────────────────────── */}
      {showAssignSchedule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,46,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 440, maxWidth: '90vw' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A2E44', margin: '0 0 18px' }}>
              {schedule ? 'Edit Schedule' : 'Assign Schedule'}
            </h2>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A6070', marginBottom: 5 }}>
              Assigned Nurse
            </label>
            <select style={{ ...inputStyle, marginBottom: 14 }} value={newNurseId} onChange={e => setNewNurseId(e.target.value)}>
              <option value="">— Select nurse —</option>
              {nurses.map(n => <option key={n.id} value={n.id}>{n.full_name} ({n.role})</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A6070', marginBottom: 5 }}>Cadence</label>
            <select style={{ ...inputStyle, marginBottom: 14 }} value={newCadence} onChange={e => setNewCadence(Number(e.target.value))}>
              {CADENCE_OPTIONS.map(d => <option key={d} value={d}>{d}-day</option>)}
            </select>

            {!schedule && (
              <>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A6070', marginBottom: 5 }}>First Assessment Due Date</label>
                <input type="date" style={{ ...inputStyle, marginBottom: 18 }} value={newFirstDue} onChange={e => setNewFirstDue(e.target.value)} />
              </>
            )}

            {err && <div style={{ color: '#B91C1C', fontSize: 12, marginBottom: 12 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAssignSchedule(false)} disabled={busy} style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={assignSchedule} disabled={busy} style={{ padding: '8px 20px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                {busy ? 'Saving…' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
