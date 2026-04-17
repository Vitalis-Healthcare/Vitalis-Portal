// app/(dashboard)/assessments/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import PrintDownloadActions from './PrintDownloadActions'

function normRel<T>(rel: T | T[] | null): T | null {
  if (rel === null || rel === undefined) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.round((new Date(dateStr + 'T00:00:00').getTime() - today.getTime()) / 86400000)
}

function statusBadge(status: string) {
  const m: Record<string,{bg:string;color:string;border:string}> = {
    scheduled: { bg:'#EFF6FF', color:'#1D4ED8', border:'#BFDBFE' },
    completed:  { bg:'#F0FDF4', color:'#15803D', border:'#86EFAC' },
    overdue:    { bg:'#FEF2F2', color:'#B91C1C', border:'#FECACA' },
    cancelled:  { bg:'#F9FAFB', color:'#6B7280', border:'#E5E7EB' },
  }
  const s = m[status] ?? m.scheduled
  return (
    <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:s.bg, color:s.color, border:`1px solid ${s.border}`, textTransform:'capitalize' }}>
      {status}
    </span>
  )
}

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ nurse_id?: string; view?: string; from?: string; to?: string }>
}) {
  const { nurse_id, view = 'upcoming', from: fromParam, to: toParam } = await searchParams

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || !['admin', 'supervisor', 'nurse'].includes(profile.role)) redirect('/dashboard')

  const isNurse = profile.role === 'nurse'
  const effectiveNurseId = isNurse ? user.id : (nurse_id || null)

  // ── Date range ─────────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0,0,0,0)
  const todayStr = today.toISOString().split('T')[0]

  let rangeStart: string
  let rangeEnd:   string
  let rangeLabel: string

  if (view === 'thismonth') {
    rangeStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    rangeEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
    rangeLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } else if (view === 'nextmonth') {
    rangeStart = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0]
    rangeEnd   = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0]
    rangeLabel = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } else if (view === 'custom' && fromParam && toParam) {
    rangeStart = fromParam
    rangeEnd   = toParam
    rangeLabel = `${fmt(fromParam)} – ${fmt(toParam)}`
  } else {
    // default: upcoming 14 days + all overdue
    rangeStart = todayStr
    rangeEnd   = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0]
    rangeLabel = 'Next 14 days'
  }

  // ── Nurse list for filter dropdown ─────────────────────────────────────────
  const { data: nursesRaw } = await db
    .from('profiles').select('id, full_name')
    .in('role', ['nurse', 'admin', 'supervisor'])
    .eq('status', 'active')
    .order('full_name')
  const nurses = nursesRaw ?? []

  // ── Stat queries ───────────────────────────────────────────────────────────
  let dueQ = db.from('assessments').select('id', { count:'exact', head:true })
    .in('status', ['scheduled', 'overdue'])
    .gte('scheduled_date', rangeStart).lte('scheduled_date', rangeEnd)
  if (effectiveNurseId) dueQ = dueQ.eq('nurse_id', effectiveNurseId)

  let overdueQ = db.from('assessments').select('id', { count:'exact', head:true })
    .eq('status', 'overdue')
  if (effectiveNurseId) overdueQ = overdueQ.eq('nurse_id', effectiveNurseId)

  let completedQ = db.from('assessments').select('id', { count:'exact', head:true })
    .eq('status', 'completed')
    .gte('completed_date', rangeStart).lte('completed_date', rangeEnd)
  if (effectiveNurseId) completedQ = completedQ.eq('nurse_id', effectiveNurseId)

  const [
    { count: dueCount },
    { count: overdueCount },
    { count: completedCount },
    { count: activeClientCount },
  ] = await Promise.all([
    dueQ, overdueQ, completedQ,
    db.from('assessment_clients').select('id', { count:'exact', head:true }).eq('status', 'active'),
  ])

  // ── Upcoming / range table ─────────────────────────────────────────────────
  type ClientRel = { id:string; full_name:string; address:string|null; city:string|null; state:string|null; zip:string|null }
  type NurseRel  = { id:string; full_name:string }
  type AssessmentRow = {
    id:string; scheduled_date:string; status:string; assessment_type:string
    client: ClientRel | ClientRel[] | null
    nurse:  NurseRel  | NurseRel[]  | null
  }

  let tableQ = db.from('assessments')
    .select(`
      id, scheduled_date, status, assessment_type,
      client:assessment_clients!client_id(id, full_name, address, city, state, zip),
      nurse:profiles!nurse_id(id, full_name)
    `)
    .order('scheduled_date')
    .limit(50)

  // For 'upcoming' view: overdue + scheduled in range. For other views: all in range.
  if (view === 'upcoming') {
    tableQ = tableQ.or(`status.eq.overdue,and(status.eq.scheduled,scheduled_date.lte.${rangeEnd})`)
  } else {
    tableQ = tableQ.in('status', ['scheduled', 'overdue', 'completed'])
      .gte('scheduled_date', rangeStart).lte('scheduled_date', rangeEnd)
  }
  if (effectiveNurseId) tableQ = tableQ.eq('nurse_id', effectiveNurseId)

  const { data: tableRaw } = await tableQ
  const tableRows = (tableRaw ?? []) as unknown as AssessmentRow[]

  // ── Build report rows for PrintDownloadActions ─────────────────────────────
  const reportRows = tableRows.map(a => {
    const c     = normRel(a.client)
    const n     = normRel(a.nurse)
    const days  = daysUntil(a.scheduled_date)
    const addrParts = [c?.address, c?.city, [c?.state, c?.zip].filter(Boolean).join(' ')].filter(Boolean)
    return {
      clientName: c?.full_name ?? '—',
      address:    addrParts.join(', ') || '—',
      nurse:      n?.full_name ?? '—',
      dueDate:    fmt(a.scheduled_date),
      daysLabel:  days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`,
      type:       a.assessment_type,
      status:     a.status,
    }
  })

  const nurseLabel = effectiveNurseId
    ? (nurses.find(n => n.id === effectiveNurseId)?.full_name ?? 'Unknown')
    : 'All Nurses'

  const stats = [
    { label: `Due — ${rangeLabel}`, value: dueCount ?? 0,          color:'#0E7C7B', bg:'#E6F4F4' },
    { label: 'Overdue (total)',      value: overdueCount ?? 0,       color:'#B91C1C', bg:'#FEF2F2' },
    { label: 'Completed in period',  value: completedCount ?? 0,     color:'#15803D', bg:'#F0FDF4' },
    { label: 'Active Clients',       value: activeClientCount ?? 0,  color:'#1A2E44', bg:'#F8FAFC' },
  ]

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          aside, header, [data-no-print] { display: none !important; }
          body { font-size: 10pt; }
          .print-header { display: block !important; }
        }
        .print-header { display: none; }
      `}</style>

      <div style={{ padding:'32px 32px 64px', maxWidth:1200, margin:'0 auto' }}>

        {/* Print-only header */}
        <div className="print-header" style={{ marginBottom:20 }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#0A5C5B' }}>🩺 Vitalis Healthcare — Assessment Schedule</div>
          <div style={{ fontSize:12, color:'#4A6070', marginTop:4 }}>
            Period: <strong>{rangeLabel}</strong> &nbsp;|&nbsp; Nurse: <strong>{nurseLabel}</strong>
          </div>
        </div>

        {/* Screen header */}
        <div data-no-print="true" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:26, fontWeight:800, color:'#1A2E44', margin:'0 0 4px' }}>🩺 Assessments</h1>
            <p style={{ fontSize:14, color:'#4A6070', margin:0 }}>
              {isNurse ? 'Your assigned clients and upcoming assessments' : 'Agency-wide nursing assessment schedule'}
            </p>
          </div>
          <PrintDownloadActions rows={reportRows} periodLabel={rangeLabel} nurseLabel={nurseLabel} />
        </div>

        {/* Filter form */}
        {!isNurse && (
          <form data-no-print="true" method="GET" style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20, alignItems:'flex-end' }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#4A6070', marginBottom:4 }}>NURSE</div>
              <select name="nurse_id" defaultValue={nurse_id ?? ''} style={{ padding:'8px 12px', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, color:'#1A2E44', background:'#fff' }}>
                <option value="">All nurses</option>
                {nurses.map(n => <option key={n.id} value={n.id}>{n.full_name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#4A6070', marginBottom:4 }}>PERIOD</div>
              <select name="view" defaultValue={view} style={{ padding:'8px 12px', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13, color:'#1A2E44', background:'#fff' }}>
                <option value="upcoming">Next 14 days</option>
                <option value="thismonth">This month</option>
                <option value="nextmonth">Next month</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            {view === 'custom' && (
              <>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#4A6070', marginBottom:4 }}>FROM</div>
                  <input type="date" name="from" defaultValue={fromParam ?? ''} style={{ padding:'8px 12px', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13 }} />
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#4A6070', marginBottom:4 }}>TO</div>
                  <input type="date" name="to" defaultValue={toParam ?? ''} style={{ padding:'8px 12px', border:'1px solid #D1D9E0', borderRadius:7, fontSize:13 }} />
                </div>
              </>
            )}
            <button type="submit" style={{ padding:'8px 18px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Apply
            </button>
            {(nurse_id || view !== 'upcoming') && (
              <Link href="/assessments" style={{ padding:'8px 14px', background:'#F8FAFC', border:'1px solid #D1D9E0', borderRadius:7, fontSize:12, color:'#4A6070', textDecoration:'none' }}>
                Clear
              </Link>
            )}
          </form>
        )}

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'20px 22px' }}>
              <div style={{ fontSize:28, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#4A6070', marginTop:6, fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#1A2E44' }}>
                {view === 'upcoming' ? 'Upcoming & Overdue' : rangeLabel}
              </div>
              <div style={{ fontSize:12, color:'#4A6070', marginTop:2 }}>
                {tableRows.length} assessment{tableRows.length !== 1 ? 's' : ''} · {nurseLabel}
              </div>
            </div>
            <div data-no-print="true" style={{ display:'flex', gap:8 }}>
              <Link href="/assessments/calendar" style={{ padding:'7px 14px', background:'#F8FAFC', border:'1px solid #D1D9E0', color:'#0E7C7B', textDecoration:'none', borderRadius:7, fontSize:13, fontWeight:600 }}>
                📅 Calendar
              </Link>
              <Link href="/assessments/clients" style={{ padding:'7px 16px', background:'#0E7C7B', color:'#fff', textDecoration:'none', borderRadius:7, fontSize:13, fontWeight:600 }}>
                All Clients →
              </Link>
            </div>
          </div>

          {tableRows.length === 0 ? (
            <div style={{ padding:'48px 24px', textAlign:'center', color:'#8FA0B0', fontSize:14 }}>
              No assessments in this period.
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#F8FAFC' }}>
                    {['Client', 'Address', 'Nurse', 'Due Date', 'Days', 'Type', 'Status', ''].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#4A6070', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #E2E8F0', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((a, idx) => {
                    const c    = normRel(a.client)
                    const n    = normRel(a.nurse)
                    const days = daysUntil(a.scheduled_date)
                    const addrParts = [c?.address, c?.city, [c?.state, c?.zip].filter(Boolean).join(' ')].filter(Boolean)
                    return (
                      <tr key={a.id} style={{ borderBottom: idx < tableRows.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <td style={{ padding:'12px 14px', fontWeight:600, color:'#1A2E44', whiteSpace:'nowrap' }}>{c?.full_name ?? '—'}</td>
                        <td style={{ padding:'12px 14px', color:'#4A6070', fontSize:12 }}>{addrParts.join(', ') || '—'}</td>
                        <td style={{ padding:'12px 14px', color:'#4A6070', whiteSpace:'nowrap' }}>{n?.full_name ?? '—'}</td>
                        <td style={{ padding:'12px 14px', color:'#4A6070', whiteSpace:'nowrap' }}>{fmt(a.scheduled_date)}</td>
                        <td style={{ padding:'12px 14px' }}>
                          <span style={{ fontWeight:700, fontSize:12, color: days < 0 ? '#B91C1C' : days <= 7 ? '#D97706' : '#4A6070' }}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                          </span>
                        </td>
                        <td style={{ padding:'12px 14px', color:'#4A6070', textTransform:'capitalize', whiteSpace:'nowrap' }}>{a.assessment_type}</td>
                        <td style={{ padding:'12px 14px' }}>{statusBadge(a.status)}</td>
                        <td style={{ padding:'12px 14px' }} data-no-print="true">
                          <Link href={`/assessments/clients/${c?.id ?? ''}`} style={{ color:'#0E7C7B', textDecoration:'none', fontSize:12, fontWeight:600 }}>View →</Link>
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
    </>
  )
}
