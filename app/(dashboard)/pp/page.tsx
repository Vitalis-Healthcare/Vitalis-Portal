import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import PPAIChat from './PPAIChat'

const DOMAINS = [
  { id: 'D1', name: 'Governance & Compliance',  bg: '#ede9fe', text: '#4c1d95', border: '#c4b5fd', icon: '⚖️' },
  { id: 'D2', name: 'Human Resources',          bg: '#d1fae5', text: '#064e3b', border: '#6ee7b7', icon: '👥' },
  { id: 'D3', name: 'Client Services',          bg: '#dbeafe', text: '#1e3a5f', border: '#93c5fd', icon: '🏠' },
  { id: 'D4', name: 'Clinical Operations',      bg: '#ffedd5', text: '#7c2d12', border: '#fdba74', icon: '🩺' },
  { id: 'D5', name: 'Business Operations',      bg: '#fef3c7', text: '#78350f', border: '#fcd34d', icon: '📊' },
  { id: 'D6', name: 'Client Rights & Safety',   bg: '#fce7f3', text: '#831843', border: '#f9a8d4', icon: '🛡️' },
  { id: 'D7', name: 'Emergency & Continuity',   bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', icon: '🚨' },
]

export default async function PPPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  if (!user) redirect('/login')

  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'
  const ppRole = profile?.role === 'admin' ? 'Administrator'
    : profile?.role === 'supervisor' ? 'Director of Nursing'
    : profile?.role === 'caregiver' ? 'CNA' : 'All Staff'

  const { data: policies } = await svc.from('pp_policies')
    .select('doc_id, domain, tier, title, version, review_date, applicable_roles, status')
    .in('status', ['active', 'under-review']).order('doc_id')

  const { data: myAcks } = await svc.from('pp_acknowledgments')
    .select('doc_id, doc_version').eq('user_id', user.id)
  const ackedSet = new Set((myAcks||[]).filter(a => {
    const p = (policies||[]).find(p => p.doc_id === a.doc_id)
    return p && a.doc_version === p.version
  }).map(a => a.doc_id))

  const myPolicies = (policies||[]).filter(p => {
    const r = p.applicable_roles || []
    return r.includes('All Staff') || r.includes(ppRole)
  })
  const pending = myPolicies.filter(p => !ackedSet.has(p.doc_id))
  const overdue = (policies||[]).filter(p => new Date(p.review_date) < new Date() && p.status === 'active')
  const due30 = (policies||[]).filter(p => {
    const days = Math.ceil((new Date(p.review_date).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 30 && p.status === 'active'
  })

  const { data: proposals } = isAdmin ? await svc.from('pp_edit_proposals').select('id').eq('status', 'pending') : { data: [] }
  const { data: recentAcks } = isAdmin ? await svc.from('pp_acknowledgments').select('doc_id, acknowledged_at, user_role').order('acknowledged_at', { ascending: false }).limit(6) : { data: [] }
  const domainCounts = Object.fromEntries(DOMAINS.map(d => [d.id, (policies||[]).filter(p => p.domain === d.id).length]))

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B6B5C 0%, #1A2E44 60%, #0B3D6B 100%)', borderRadius: 16, padding: '32px 36px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(26,155,135,0.2) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#1A9B87', margin: '0 0 6px' }}>Vitalis Healthcare Services</p>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Policies & Procedures</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              {(policies||[]).length} documents · {DOMAINS.filter(d => domainCounts[d.id] > 0).length} active domains
              {pending.length > 0 && <span style={{ color: '#FCD34D' }}> · {pending.length} pending your signature</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/pp/library"><button style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Browse Library</button></Link>
            {isAdmin && <Link href="/pp/admin"><button style={{ padding: '9px 18px', background: '#1A9B87', border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Admin Console</button></Link>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { label: 'Total Policies', value: (policies||[]).length, note: 'across 7 domains', color: '#fff' },
            { label: 'Need Acknowledgment', value: pending.length, note: pending.length > 0 ? 'your signatures pending' : 'all signed ✓', color: pending.length > 0 ? '#FCD34D' : '#6EE7B7' },
            { label: 'Reviews Overdue', value: overdue.length, note: overdue.length > 0 ? 'past due date' : 'all current ✓', color: overdue.length > 0 ? '#FCA5A5' : '#6EE7B7' },
            { label: 'Pending Proposals', value: isAdmin ? (proposals||[]).length : '—', note: isAdmin ? 'edits awaiting approval' : 'admin only', color: '#C7D2FE' },
          ].map((s,i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, padding: '14px 16px' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 370px', gap: 20, alignItems: 'start' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Pending acknowledgments */}
          {pending.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 22, border: '2px solid #FCD34D' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1A2E44', margin: 0 }}>⏳ Awaiting Your Acknowledgment</h3>
                  <p style={{ fontSize: 12, color: '#8FA0B0', margin: '3px 0 0' }}>Policies applicable to your role that need your signature</p>
                </div>
                <Link href="/pp/my-policies" style={{ fontSize: 12, color: '#0B6B5C', fontWeight: 700, textDecoration: 'none' }}>View all →</Link>
              </div>
              {pending.slice(0,4).map((p,i) => {
                const d = DOMAINS.find(d => d.id === p.domain)
                return (
                  <Link key={p.doc_id} href={`/pp/${p.doc_id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < Math.min(pending.length,4)-1 ? '1px solid #EFF2F5' : 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2E44' }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: '#8FA0B0' }}>{p.doc_id} · v{p.version}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: d?.bg, color: d?.text }}>{p.domain}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Domain library */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Policy Library</h3>
              <Link href="/pp/library" style={{ fontSize: 12, color: '#0B6B5C', fontWeight: 700, textDecoration: 'none' }}>Browse all →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
              {DOMAINS.map(d => {
                const count = domainCounts[d.id] || 0
                const domPending = (policies||[]).filter(p => {
                  const r = p.applicable_roles || []
                  return p.domain === d.id && (r.includes('All Staff') || r.includes(ppRole)) && !ackedSet.has(p.doc_id)
                }).length
                return (
                  <Link key={d.id} href={count > 0 ? `/pp/domain/${d.id}` : '#'} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '13px 14px', borderRadius: 10, border: `1px solid ${count>0?d.border:'#E2E8F0'}`, background: count>0?'#fff':'#FAFAFA', cursor: count>0?'pointer':'default', display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize: 18 }}>{d.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: count>0?'#1A2E44':'#CBD5E0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 1 }}>
                          {count > 0 ? `${count} doc${count!==1?'s':''}` : 'Coming soon'}
                          {domPending > 0 && <span style={{ color:'#F59E0B', fontWeight:700 }}> · {domPending} pending</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: d.bg, color: d.text, flexShrink: 0 }}>{d.id}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Admin: alert cards */}
          {isAdmin && (overdue.length > 0 || due30.length > 0 || (proposals||[]).length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {overdue.length > 0 && (
                <Link href="/pp/admin/reviews" style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '16px' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#DC2626' }}>{overdue.length}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', marginTop: 4 }}>Overdue Reviews</div>
                    <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>Annual deadline passed →</div>
                  </div>
                </Link>
              )}
              {due30.length > 0 && (
                <Link href="/pp/admin/reviews" style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12, padding: '16px' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#D97706' }}>{due30.length}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginTop: 4 }}>Due in 30 Days</div>
                    <div style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>Schedule reviews soon →</div>
                  </div>
                </Link>
              )}
              {(proposals||[]).length > 0 && (
                <Link href="/pp/admin/proposals" style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 12, padding: '16px' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#2563EB' }}>{(proposals||[]).length}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', marginTop: 4 }}>Edit Proposals</div>
                    <div style={{ fontSize: 11, color: '#1E40AF', marginTop: 2 }}>Awaiting approval →</div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Recent activity */}
          {isAdmin && (recentAcks||[]).length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Recent Acknowledgments</h3>
                <Link href="/pp/admin/acknowledgments" style={{ fontSize: 12, color: '#0B6B5C', fontWeight: 700, textDecoration: 'none' }}>Full report →</Link>
              </div>
              {(recentAcks||[]).map((a: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < (recentAcks||[]).length-1 ? '1px solid #EFF2F5' : 'none' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: '#E6F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0B6B5C' }}>✓</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1A2E44' }}>{a.doc_id}</div>
                    <div style={{ fontSize: 11, color: '#8FA0B0' }}>{a.user_role} · {new Date(a.acknowledged_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — AI Chat */}
        <div style={{ position: 'sticky', top: 20 }}>
          <PPAIChat userId={user.id} userRole={ppRole} userName={profile?.full_name || 'User'} />
        </div>
      </div>
    </div>
  )
}
