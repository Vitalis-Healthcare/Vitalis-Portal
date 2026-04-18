// app/(dashboard)/assessments/calendar/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import CalendarPrintButton from './CalendarPrintButton'
import type { CalendarPrintRow } from './CalendarPrintButton'

function normRel<T>(rel: T | T[] | null): T | null {
  if (rel === null || rel === undefined) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function fmtShort(dateStr: string): string {
  const parts = dateStr.split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}
function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}
function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: '#1D4ED8',
  overdue:   '#B91C1C',
  emergency: '#B91C1C',
  completed: '#15803D',
  cancelled: '#6B7280',
}
const STATUS_BG: Record<string, string> = {
  scheduled: '#EFF6FF',
  overdue:   '#FEF2F2',
  emergency: '#FEF2F2',
  completed: '#F0FDF4',
  cancelled: '#F9FAFB',
}

export default async function AssessmentCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; nurse_id?: string }>
}) {
  const { month: monthParam, nurse_id } = await searchParams

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || !['admin', 'supervisor', 'nurse'].includes(profile.role)) redirect('/dashboard')

  const isNurse = profile.role === 'nurse'
  const effectiveNurseId = isNurse ? user.id : (nurse_id || null)

  const today    = new Date()
  const defaultM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const ym       = monthParam ?? defaultM
  const [y, m]   = ym.split('-').map(Number)

  const monthStart = `${ym}-01`
  const lastDay    = new Date(y, m, 0).getDate()
  const monthEnd   = `${ym}-${String(lastDay).padStart(2, '0')}`

  const { data: nursesRaw } = await db
    .from('profiles').select('id, full_name')
    .in('role', ['nurse', 'admin', 'supervisor'])
    .eq('status', 'active').order('full_name')
  const nurses = nursesRaw ?? []

  type ClientRel = { id: string; full_name: string; address: string|null; city: string|null; state: string|null; zip: string|null }
  type NurseRel  = { id: string; full_name: string }
  type AssessmentRow = {
    id: string; scheduled_date: string; status: string; assessment_type: string
    client: ClientRel | ClientRel[] | null
    nurse:  NurseRel  | NurseRel[]  | null
  }

  let q = db.from('assessments')
    .select(`
      id, scheduled_date, status, assessment_type,
      client:assessment_clients!client_id(id, full_name, address, city, state, zip),
      nurse:profiles!nurse_id(id, full_name)
    `)
    .gte('scheduled_date', monthStart)
    .lte('scheduled_date', monthEnd)
    .order('scheduled_date')
  if (effectiveNurseId) q = q.eq('nurse_id', effectiveNurseId)

  const { data: rawRows } = await q
  const rows = (rawRows ?? []) as unknown as AssessmentRow[]

  const byDate = new Map<string, AssessmentRow[]>()
  for (const r of rows) {
    const key = r.scheduled_date
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(r)
  }

  const firstDow   = new Date(y, m - 1, 1).getDay()
  const totalCells = Math.ceil((firstDow + lastDay) / 7) * 7
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
    ...Array(totalCells - firstDow - lastDay).fill(null),
  ]

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const nurseLabel = effectiveNurseId
    ? (nurses.find(n => n.id === effectiveNurseId)?.full_name ?? 'Unknown')
    : 'All Nurses'

  const prevQ = effectiveNurseId ? `?month=${prevMonth(ym)}&nurse_id=${effectiveNurseId}` : `?month=${prevMonth(ym)}`
  const nextQ = effectiveNurseId ? `?month=${nextMonth(ym)}&nurse_id=${effectiveNurseId}` : `?month=${nextMonth(ym)}`

  // Build print rows for CalendarPrintButton
  const printRows: CalendarPrintRow[] = rows.map(a => {
    const c    = normRel(a.client)
    const n    = normRel(a.nurse)
    const addr = [c?.address, c?.city, c?.state].filter(Boolean).join(', ')
    return {
      clientName: c?.full_name ?? '—',
      address:    addr || '—',
      nurse:      n?.full_name ?? '—',
      date:       fmtShort(a.scheduled_date),
      type:       a.assessment_type,
      status:     a.status,
    }
  })

  return (
    <div style={{ padding: '28px 28px 64px', maxWidth: 1200, margin: '0 auto' }}>

      <div data-no-print="true" style={{ marginBottom: 20 }}>
        <Link href="/assessments" style={{ color: '#0E7C7B', textDecoration: 'none', fontSize: 13 }}>
          ← Assessments
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E44', margin: '0 0 4px' }}>📅 Assessment Calendar</h1>
          <div style={{ fontSize: 13, color: '#4A6070' }}>{nurseLabel}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {!isNurse && (
            <form data-no-print="true" method="GET" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="hidden" name="month" value={ym} />
              <select name="nurse_id" defaultValue={nurse_id ?? ''} style={{ padding: '7px 12px', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, color: '#1A2E44', background: '#fff' }}>
                <option value="">All nurses</option>
                {nurses.map(n => <option key={n.id} value={n.id}>{n.full_name}</option>)}
              </select>
              <button type="submit" style={{ padding: '7px 14px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Filter
              </button>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href={`/assessments/calendar${prevQ}`} style={{ padding: '7px 12px', background: '#F8FAFC', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, color: '#4A6070', textDecoration: 'none', fontWeight: 600 }}>‹</Link>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1A2E44', minWidth: 160, textAlign: 'center' }}>{monthLabel(ym)}</span>
            <Link href={`/assessments/calendar${nextQ}`} style={{ padding: '7px 12px', background: '#F8FAFC', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, color: '#4A6070', textDecoration: 'none', fontWeight: 600 }}>›</Link>
          </div>

          <CalendarPrintButton rows={printRows} periodLabel={monthLabel(ym)} nurseLabel={nurseLabel} />
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#0E7C7B' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, idx) => {
            const dateStr = day ? `${ym}-${String(day).padStart(2, '0')}` : null
            const dayAssessments = dateStr ? (byDate.get(dateStr) ?? []) : []
            const isToday   = dateStr === todayStr
            const isPast    = dateStr ? dateStr < todayStr : false
            const isWeekend = idx % 7 === 0 || idx % 7 === 6

            return (
              <div
                key={idx}
                style={{
                  minHeight: 120,
                  borderRight: idx % 7 !== 6 ? '1px solid #F1F5F9' : 'none',
                  borderBottom: Math.floor(idx / 7) < Math.floor((cells.length - 1) / 7) ? '1px solid #F1F5F9' : 'none',
                  padding: '6px 6px 8px',
                  background: isToday ? '#FFFBEB' : isWeekend ? '#FAFAFA' : '#fff',
                }}
              >
                {day && (
                  <>
                    <div style={{
                      fontSize: 12, fontWeight: isToday ? 800 : 500,
                      color: isToday ? '#0E7C7B' : isPast ? '#B0BEC5' : '#1A2E44',
                      marginBottom: 4,
                      width: 22, height: 22, lineHeight: '22px', textAlign: 'center',
                      background: isToday ? '#E6F4F4' : 'transparent',
                      borderRadius: '50%',
                    }}>
                      {day}
                    </div>

                    {dayAssessments.slice(0, 3).map(a => {
                      const c   = normRel(a.client)
                      const n   = normRel(a.nurse)
                      const key = a.assessment_type === 'emergency' ? 'emergency' : a.status
                      return (
                        <Link key={a.id} href={`/assessments/clients/${c?.id ?? ''}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 3 }}>
                          <div style={{
                            background: STATUS_BG[key] ?? '#EFF6FF',
                            borderLeft: `3px solid ${STATUS_COLOR[key] ?? '#1D4ED8'}`,
                            borderRadius: 4, padding: '3px 6px', fontSize: 10,
                          }}>
                            <div style={{ fontWeight: 700, color: '#1A2E44', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c?.full_name ?? '—'}
                            </div>
                            {c?.city && (
                              <div style={{ color: '#4A6070', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                                {c.city}
                              </div>
                            )}
                            {!effectiveNurseId && n?.full_name && (
                              <div style={{ color: STATUS_COLOR[key] ?? '#1D4ED8', fontWeight: 600, marginTop: 1 }}>
                                {n.full_name.split(' ')[0]}
                              </div>
                            )}
                          </div>
                        </Link>
                      )
                    })}

                    {dayAssessments.length > 3 && (
                      <div style={{ fontSize: 10, color: '#8FA0B0', fontWeight: 600, marginTop: 2, paddingLeft: 4 }}>
                        +{dayAssessments.length - 3} more
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Scheduled', color: '#1D4ED8', bg: '#EFF6FF' },
          { label: 'Overdue',   color: '#B91C1C', bg: '#FEF2F2' },
          { label: 'Emergency', color: '#B91C1C', bg: '#FEF2F2' },
          { label: 'Completed', color: '#15803D', bg: '#F0FDF4' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4A6070' }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: l.bg, border: `2px solid ${l.color}`, flexShrink: 0 }} />
            {l.label}
          </div>
        ))}
        <div style={{ fontSize: 12, color: '#8FA0B0', marginLeft: 'auto' }}>
          {rows.length} assessment{rows.length !== 1 ? 's' : ''} in {monthLabel(ym)}
        </div>
      </div>
    </div>
  )
}
