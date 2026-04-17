// app/(dashboard)/assessments/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function statusBadge(status: string) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    scheduled: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    completed:  { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
    overdue:    { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
    cancelled:  { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' },
  }
  const s = styles[status] ?? styles.scheduled
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11,
      fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  )
}

function fmt(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const due   = new Date(dateStr + 'T00:00:00')
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

type NurseRel  = { id: string; full_name: string } | { id: string; full_name: string }[] | null
type ClientRel = { id: string; full_name: string } | { id: string; full_name: string }[] | null

function normRel<T>(rel: T | T[] | null): T | null {
  if (rel === null || rel === undefined) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export default async function AssessmentsPage() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'supervisor', 'nurse'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const isNurse = profile.role === 'nurse'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthStart   = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd     = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
  const fourteenDays = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0]

  // Build each query individually — passing partially-chained Supabase builders
  // to a generic helper causes PostgrestQueryBuilder vs PostgrestFilterBuilder
  // type mismatch under the Portal's tsconfig.
  let dueQ = db.from('assessments')
    .select('id', { count: 'exact', head: true })
    .in('status', ['scheduled', 'overdue'])
    .gte('scheduled_date', monthStart)
    .lte('scheduled_date', monthEnd)
  if (isNurse) dueQ = dueQ.eq('nurse_id', user.id)

  let overdueQ = db.from('assessments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'overdue')
  if (isNurse) overdueQ = overdueQ.eq('nurse_id', user.id)

  let completedQ = db.from('assessments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_date', monthStart)
  if (isNurse) completedQ = completedQ.eq('nurse_id', user.id)

  const [
    { count: dueCount },
    { count: overdueCount },
    { count: completedCount },
    { count: activeClientCount },
  ] = await Promise.all([
    dueQ,
    overdueQ,
    completedQ,
    db.from('assessment_clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  type AssessmentRow = {
    id: string
    scheduled_date: string
    status: string
    assessment_type: string
    client: ClientRel
    nurse: NurseRel
  }

  let upcomingQ = db.from('assessments')
    .select(`
      id, scheduled_date, status, assessment_type,
      client:assessment_clients!client_id(id, full_name),
      nurse:profiles!nurse_id(id, full_name)
    `)
    .or(`status.eq.overdue,and(status.eq.scheduled,scheduled_date.lte.${fourteenDays})`)
    .order('scheduled_date')
    .limit(25)
  if (isNurse) upcomingQ = upcomingQ.eq('nurse_id', user.id)

  const { data: upcomingRaw } = await upcomingQ
  const upcoming = (upcomingRaw ?? []) as unknown as AssessmentRow[]

  const monthName = today.toLocaleDateString('en-US', { month: 'long' })
  const stats = [
    { label: `Due in ${monthName}`,  value: dueCount ?? 0,          color: '#0E7C7B', bg: '#E6F4F4' },
    { label: 'Overdue',              value: overdueCount ?? 0,       color: '#B91C1C', bg: '#FEF2F2' },
    { label: 'Completed this month', value: completedCount ?? 0,     color: '#15803D', bg: '#F0FDF4' },
    { label: 'Active Clients',       value: activeClientCount ?? 0,  color: '#1A2E44', bg: '#F8FAFC' },
  ]

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A2E44', margin: '0 0 4px' }}>🩺 Assessments</h1>
        <p style={{ fontSize: 14, color: '#4A6070', margin: 0 }}>
          {isNurse ? 'Your assigned clients and upcoming nursing assessments' : 'Agency-wide nursing assessment schedule and status'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#4A6070', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2E44' }}>Upcoming &amp; Overdue</div>
            <div style={{ fontSize: 12, color: '#4A6070', marginTop: 2 }}>Overdue + due within 14 days</div>
          </div>
          <Link href="/assessments/clients" style={{ display: 'inline-block', padding: '7px 16px', background: '#0E7C7B', color: '#fff', textDecoration: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
            All Clients →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#8FA0B0', fontSize: 14 }}>
            No assessments due in the next 14 days.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Client', 'Assigned Nurse', 'Due Date', 'Days', 'Type', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upcoming.map((a, idx) => {
                  const client = normRel(a.client)
                  const nurse  = normRel(a.nurse)
                  const days   = daysUntil(a.scheduled_date)
                  return (
                    <tr key={a.id} style={{ borderBottom: idx < upcoming.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1A2E44' }}>{client?.full_name ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#4A6070' }}>{nurse?.full_name ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#4A6070' }}>{fmt(a.scheduled_date)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: days < 0 ? '#B91C1C' : days <= 7 ? '#D97706' : '#4A6070' }}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4A6070', textTransform: 'capitalize' }}>{a.assessment_type}</td>
                      <td style={{ padding: '12px 16px' }}>{statusBadge(a.status)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link href={`/assessments/clients/${client?.id ?? ''}`} style={{ color: '#0E7C7B', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>View →</Link>
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
