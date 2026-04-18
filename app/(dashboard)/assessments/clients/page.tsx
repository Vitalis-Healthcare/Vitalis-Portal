// app/(dashboard)/assessments/clients/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function normRel<T>(rel: T | T[] | null): T | null {
  if (rel === null || rel === undefined) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    active:     { bg: '#F0FDF4', color: '#15803D' },
    inactive:   { bg: '#FFF7ED', color: '#C2410C' },
    discharged: { bg: '#F9FAFB', color: '#6B7280' },
  }
  const s = map[status] ?? map.active
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, textTransform: 'capitalize' }}>
      {status}
    </span>
  )
}

function nextDueBadge(dateStr: string | null) {
  if (!dateStr) return <span style={{ color: '#8FA0B0', fontSize: 12 }}>Not scheduled</span>
  const today = new Date(); today.setHours(0,0,0,0)
  const due   = new Date(dateStr + 'T00:00:00')
  const days  = Math.round((due.getTime() - today.getTime()) / 86400000)
  const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const color = days < 0 ? '#B91C1C' : days <= 14 ? '#D97706' : '#15803D'
  return (
    <div>
      <div style={{ fontSize: 13, color: '#1A2E44' }}>{label}</div>
      <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 1 }}>
        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `in ${days}d`}
      </div>
    </div>
  )
}

export default async function AssessmentClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; nurse?: string }>
}) {
  const { q = '', status: statusFilter = 'active', nurse: nurseFilter = '' } = await searchParams

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'supervisor', 'nurse'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const isNurse = profile.role === 'nurse'

  // Fetch nurses for filter dropdown
  const { data: nursesRaw } = await db
    .from('profiles').select('id, full_name')
    .in('role', ['nurse', 'admin', 'supervisor'])
    .eq('status', 'active').order('full_name')
  const nurses = nursesRaw ?? []

  type ScheduleRel = {
    id: string; cadence_days: number; nurse_id: string; is_active: boolean; plan_type: string
    nurse: { id: string; full_name: string } | { id: string; full_name: string }[] | null
  } | null

  type NextAssessmentRel = { id: string; scheduled_date: string; status: string } | null

  type ClientRow = {
    id: string; full_name: string; payer_type: string | null; phone: string | null
    city: string | null; status: string; created_at: string
    schedule: ScheduleRel | ScheduleRel[]
    next_assessment: NextAssessmentRel | NextAssessmentRel[]
  }

  let query = db.from('assessment_clients')
    .select(`
      id, full_name, payer_type, phone, city, status, created_at,
      schedule:assessment_schedules!left(
        id, cadence_days, nurse_id, is_active, plan_type,
        nurse:profiles!nurse_id(id, full_name)
      ),
      next_assessment:assessments!left(
        id, scheduled_date, status
      )
    `)
    .order('full_name')

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: rawClients } = await query
  let clients = (rawClients ?? []) as unknown as ClientRow[]

  // Nurse scope: show only clients assigned to them
  if (isNurse) {
    clients = clients.filter(c => {
      const schedArr = Array.isArray(c.schedule) ? c.schedule : (c.schedule ? [c.schedule] : [])
      return schedArr.some(s => s?.is_active && s?.nurse_id === user.id)
    })
  }

  const getClinicalSchedule = (c: ClientRow): NonNullable<ScheduleRel> | null => {
    const arr = Array.isArray(c.schedule) ? c.schedule : (c.schedule ? [c.schedule] : [])
    return arr.find(s => s?.is_active && s?.plan_type === 'clinical') ?? null
  }

  const hasEPSchedule = (c: ClientRow): boolean => {
    const arr = Array.isArray(c.schedule) ? c.schedule : (c.schedule ? [c.schedule] : [])
    return arr.some(s => s?.is_active && s?.plan_type === 'ep_annual')
  }

  // Nurse filter (admin/supervisor only)
  if (!isNurse && nurseFilter) {
    if (nurseFilter === 'unassigned') {
      clients = clients.filter(c => !getClinicalSchedule(c))
    } else {
      clients = clients.filter(c => {
        const sched = getClinicalSchedule(c)
        return sched?.nurse_id === nurseFilter
      })
    }
  }

  const qLower = q.toLowerCase()
  if (qLower) {
    clients = clients.filter(c => c.full_name.toLowerCase().includes(qLower))
  }

  const getNextAssessment = (c: ClientRow) => {
    const raw = c.next_assessment
    if (!raw) return null
    const arr = Array.isArray(raw) ? raw : [raw]
    const pending = arr.filter(
      (a): a is { id: string; scheduled_date: string; status: string } =>
        a !== null && ['scheduled', 'overdue'].includes(a.status ?? '')
    )
    if (pending.length === 0) return null
    return pending.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0]
  }

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1100, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ marginBottom: 4 }}>
            <Link href="/assessments" style={{ color: '#0E7C7B', textDecoration: 'none', fontSize: 13 }}>← Assessments</Link>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>
            {isNurse ? 'My Clients' : 'Assessment Clients'}
          </h1>
          <p style={{ fontSize: 14, color: '#4A6070', margin: '4px 0 0' }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''} shown
          </p>
        </div>
        {!isNurse && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/assessments/clients/import" style={{ display: 'inline-block', padding: '10px 18px', background: '#F8FAFC', border: '1px solid #D1D9E0', color: '#0E7C7B', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
              ⬇ Import from AxisCare
            </Link>
            <Link href="/assessments/clients/new" style={{ display: 'inline-block', padding: '10px 20px', background: '#0E7C7B', color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
              + Add Client
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input name="q" defaultValue={q} placeholder="Search by name…" style={{ padding: '8px 14px', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, color: '#1A2E44', background: '#fff', width: 220, outline: 'none' }} />
        <select name="status" defaultValue={statusFilter} style={{ padding: '8px 12px', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, color: '#1A2E44', background: '#fff' }}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discharged">Discharged</option>
          <option value="all">All statuses</option>
        </select>
        {!isNurse && (
          <select name="nurse" defaultValue={nurseFilter} style={{ padding: '8px 12px', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, color: '#1A2E44', background: '#fff' }}>
            <option value="">All nurses</option>
            <option value="unassigned">⚠ Unassigned</option>
            {nurses.map(n => <option key={n.id} value={n.id}>{n.full_name}</option>)}
          </select>
        )}
        <button type="submit" style={{ padding: '8px 16px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Search
        </button>
      </form>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        {clients.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#8FA0B0', fontSize: 14 }}>
            {q ? `No clients matching "${q}".` : nurseFilter === 'unassigned' ? 'No unassigned clients.' : 'No clients found.'}
            {!isNurse && !q && (
              <div style={{ marginTop: 12 }}>
                <Link href="/assessments/clients/new" style={{ color: '#0E7C7B', textDecoration: 'none', fontWeight: 600 }}>Add your first client →</Link>
              </div>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Client', 'Payer Type', 'Assigned Nurse', 'Cadence', 'Next Due', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, idx) => {
                  const clinicalSched = getClinicalSchedule(c)
                  const nurse         = clinicalSched ? normRel(clinicalSched.nurse) : null
                  const hasEP         = hasEPSchedule(c)
                  const next          = getNextAssessment(c)
                  return (
                    <tr key={c.id} style={{ borderBottom: idx < clients.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: '#1A2E44' }}>{c.full_name}</span>
                          {hasEP && <span style={{ fontSize: 10, fontWeight: 700, color: '#0E7C7B', background: '#E6F4F4', padding: '1px 6px', borderRadius: 8, border: '1px solid #B2E0DF' }}>EP</span>}
                        </div>
                        {c.city && <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>{c.city}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#4A6070' }}>{c.payer_type ?? <span style={{ color: '#8FA0B0' }}>—</span>}</td>
                      <td style={{ padding: '14px 16px', color: '#1A2E44' }}>
                        {nurse?.full_name ?? <span style={{ color: '#D97706', fontSize: 12 }}>⚠ Unassigned</span>}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#4A6070' }}>
                        {clinicalSched ? <span style={{ fontWeight: 600 }}>{clinicalSched.cadence_days}-day</span> : <span style={{ color: '#8FA0B0' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>{nextDueBadge(next?.scheduled_date ?? null)}</td>
                      <td style={{ padding: '14px 16px' }}>{statusBadge(c.status)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link href={`/assessments/clients/${c.id}`} style={{ color: '#0E7C7B', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>View →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
