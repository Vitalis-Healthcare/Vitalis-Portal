import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Clock, CheckCircle, Calendar } from 'lucide-react'

export default async function ReviewCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user?.id||'').single()

  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') redirect('/pp')

  const { data: policies } = await svc
    .from('pp_policies')
    .select('doc_id, domain, tier, title, version, review_date, owner_role, status')
    .in('status', ['active', 'under-review'])
    .order('review_date')

  const now = new Date()

  const categorise = (reviewDate: string) => {
    const rd = new Date(reviewDate)
    const daysOut = Math.ceil((rd.getTime() - now.getTime()) / 86400000)
    if (daysOut < 0) return { label: 'Overdue', color: '#E63946', bg: '#FDE8E9', priority: 0 }
    if (daysOut <= 30) return { label: `${daysOut}d`, color: '#E63946', bg: '#FDE8E9', priority: 1 }
    if (daysOut <= 60) return { label: `${daysOut}d`, color: '#F4A261', bg: '#FEF3EA', priority: 2 }
    return { label: `${daysOut}d`, color: '#2A9D8F', bg: '#E6F6F4', priority: 3 }
  }

  const overdue = (policies||[]).filter(p => new Date(p.review_date) < now)
  const due30 = (policies||[]).filter(p => { const d = new Date(p.review_date); const days = Math.ceil((d.getTime() - now.getTime()) / 86400000); return days >= 0 && days <= 30 })
  const due60 = (policies||[]).filter(p => { const d = new Date(p.review_date); const days = Math.ceil((d.getTime() - now.getTime()) / 86400000); return days > 30 && days <= 60 })
  const upcoming = (policies||[]).filter(p => { const d = new Date(p.review_date); const days = Math.ceil((d.getTime() - now.getTime()) / 86400000); return days > 60 })

  const Section = ({ title, docs, icon, color }: { title: string; docs: typeof policies; icon: React.ReactNode; color: string }) => {
    if (!docs || docs.length === 0) return null
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          {icon}
          <span style={{ fontSize: 13, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {title} ({docs.length})
          </span>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {docs.map((p, i) => {
            const cat = categorise(p.review_date)
            return (
              <div key={p.doc_id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px',
                borderBottom: i < docs.length - 1 ? '1px solid #EFF2F5' : 'none'
              }}>
                <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: cat.bg, color: cat.color }}>
                    {cat.label}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/pp/${p.doc_id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44' }}>{p.title}</div>
                  </Link>
                  <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2, display: 'flex', gap: 10 }}>
                    <span style={{ fontFamily: 'monospace' }}>{p.doc_id}</span>
                    <span>v{p.version}</span>
                    <span>Owner: {p.owner_role}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1A2E44' }}>
                    {new Date(p.review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                    background: p.status === 'under-review' ? '#FEF3EA' : '#E6F6F4',
                    color: p.status === 'under-review' ? '#F4A261' : '#2A9D8F'
                  }}>
                    {p.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/pp" style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
          <ArrowLeft size={14} /> Policy Library
        </Link>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Annual Review Calendar</h1>
        <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>All active policies by review due date</p>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Overdue', value: overdue.length, color: '#E63946', bg: '#FDE8E9' },
          { label: 'Due ≤30 days', value: due30.length, color: '#E63946', bg: '#FDE8E9' },
          { label: 'Due 31–60 days', value: due60.length, color: '#F4A261', bg: '#FEF3EA' },
          { label: 'Due >60 days', value: upcoming.length, color: '#2A9D8F', bg: '#E6F6F4' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Section title="Overdue" docs={overdue} color="#E63946"
        icon={<AlertTriangle size={14} color="#E63946" />} />
      <Section title="Due within 30 days" docs={due30} color="#E63946"
        icon={<AlertTriangle size={14} color="#E63946" />} />
      <Section title="Due in 31–60 days" docs={due60} color="#F4A261"
        icon={<Clock size={14} color="#F4A261" />} />
      <Section title="Upcoming (>60 days)" docs={upcoming} color="#2A9D8F"
        icon={<Calendar size={14} color="#2A9D8F" />} />
    </div>
  )
}
