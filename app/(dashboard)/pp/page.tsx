import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react'

const DOMAINS = [
  { id: 'D1', name: 'Governance & Compliance',        owner: 'Administrator',           bg: '#ede9fe', text: '#4c1d95', border: '#c4b5fd' },
  { id: 'D2', name: 'Human Resources & Workforce',    owner: 'HR / Office Manager',      bg: '#d1fae5', text: '#064e3b', border: '#6ee7b7' },
  { id: 'D3', name: 'Client Services & Care Delivery',owner: 'Care Coordinator',         bg: '#dbeafe', text: '#1e3a5f', border: '#93c5fd' },
  { id: 'D4', name: 'Clinical Operations',            owner: 'Director of Nursing',      bg: '#ffedd5', text: '#7c2d12', border: '#fdba74' },
  { id: 'D5', name: 'Business Operations',            owner: 'Billing / Compliance Officer', bg: '#fef3c7', text: '#78350f', border: '#fcd34d' },
  { id: 'D6', name: 'Client Rights & Safety',         owner: 'Director of Nursing',      bg: '#fce7f3', text: '#831843', border: '#f9a8d4' },
  { id: 'D7', name: 'Emergency & Business Continuity',owner: 'Administrator',            bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
]

const TIER_LABELS: Record<number, string> = { 1: 'Policy', 2: 'Procedure', 3: 'Work Instruction' }

export default async function PPIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id||'').single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'
  const userRole = profile?.role || ''

  // Map portal roles to PP role names
  const ppRole = userRole === 'admin' ? 'Administrator'
    : userRole === 'supervisor' ? 'Director of Nursing'
    : userRole === 'caregiver' ? 'CNA'
    : 'All Staff'

  // Get all active policies
  const { data: allPolicies } = await supabase
    .from('pp_policies')
    .select('doc_id, domain, tier, title, status, version, review_date, applicable_roles')
    .in('status', ['active', 'under-review'])
    .order('doc_id')

  // Get my acknowledgments
  const { data: myAcks } = await supabase
    .from('pp_acknowledgments')
    .select('doc_id, doc_version, acknowledged_at')
    .eq('user_id', user?.id||'')

  const ackedMap = Object.fromEntries((myAcks||[]).map(a => [a.doc_id, a]))

  // Build domain stats
  const domainStats: Record<string, { total: number; acked: number; pending: number; overdue: number }> = {}
  for (const d of DOMAINS) domainStats[d.id] = { total: 0, acked: 0, pending: 0, overdue: 0 }

  for (const p of allPolicies||[]) {
    const roles = p.applicable_roles || []
    const applies = roles.includes('All Staff') || roles.includes(ppRole) || isAdmin
    if (!applies) continue

    const ds = domainStats[p.domain]
    if (!ds) continue
    ds.total++

    const ack = ackedMap[p.doc_id]
    if (ack && ack.doc_version === p.version) {
      ds.acked++
    } else {
      ds.pending++
      // Check if overdue review
      if (new Date(p.review_date) < new Date()) ds.overdue++
    }
  }

  // Global pending count for header
  const totalPending = Object.values(domainStats).reduce((s, d) => s + d.pending, 0)

  // Recent acknowledgment activity (admin)
  const { data: recentAcks } = isAdmin ? await supabase
    .from('pp_acknowledgments')
    .select('doc_id, acknowledged_at, user_id, user_role')
    .order('acknowledged_at', { ascending: false })
    .limit(5) : { data: [] }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>
            Policies & Procedures
          </h1>
          <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>
            Vitalis Healthcare Services — Policy & Procedure Library
          </p>
        </div>
        {totalPending > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', background: '#FEF3EA', border: '1px solid #F4A261',
            borderRadius: 10, fontSize: 13
          }}>
            <Clock size={14} color="#F4A261" />
            <span style={{ color: '#1A2E44', fontWeight: 600 }}>
              {totalPending} policy{totalPending !== 1 ? ' acknowledgments' : ' acknowledgment'} pending
            </span>
            <Link href="/pp/my-policies" style={{ color: '#0E7C7B', fontWeight: 700, textDecoration: 'none' }}>
              View →
            </Link>
          </div>
        )}
      </div>

      {/* Domain grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
        {DOMAINS.map(domain => {
          const stats = domainStats[domain.id]
          const policies = (allPolicies||[]).filter(p => p.domain === domain.id)
          const hasContent = policies.length > 0

          return (
            <Link
              key={domain.id}
              href={`/pp/domain/${domain.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: '#fff', borderRadius: 12, padding: 20,
                border: `1px solid ${domain.border}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                cursor: 'pointer', transition: 'box-shadow 0.2s',
                opacity: hasContent ? 1 : 0.6
              }}>
                {/* Domain tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                    background: domain.bg, color: domain.text, letterSpacing: '0.5px'
                  }}>
                    {domain.id}
                  </span>
                  {hasContent && stats.pending > 0 && (
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: '#FEF3EA', color: '#F4A261'
                    }}>
                      {stats.pending} pending
                    </span>
                  )}
                  {hasContent && stats.pending === 0 && stats.total > 0 && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: '#E6F6F4', color: '#2A9D8F'
                    }}>
                      <CheckCircle size={11} /> All acknowledged
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: '0 0 4px' }}>
                  {domain.name}
                </h3>
                <p style={{ fontSize: 12, color: '#8FA0B0', margin: '0 0 14px' }}>
                  Owner: {domain.owner}
                </p>

                {hasContent ? (
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#4A6070' }}>
                    <span><FileText size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />{policies.length} documents</span>
                    {stats.total > 0 && (
                      <span>
                        <CheckCircle size={11} style={{ verticalAlign: 'middle', marginRight: 3, color: '#2A9D8F' }} />
                        {stats.acked}/{stats.total} acknowledged
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#CBD5E0', fontStyle: 'italic' }}>
                    Content arriving in next delivery
                  </div>
                )}

                {/* Mini progress bar */}
                {hasContent && stats.total > 0 && (
                  <div style={{ marginTop: 12, background: '#EFF2F5', borderRadius: 10, height: 4 }}>
                    <div style={{
                      width: `${Math.round((stats.acked / stats.total) * 100)}%`,
                      background: domain.text, borderRadius: 10, height: 4,
                      transition: 'width 0.4s'
                    }} />
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* My pending acknowledgments (staff) */}
      {!isAdmin && totalPending > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A2E44', margin: 0 }}>
              Pending Acknowledgments
            </h3>
            <Link href="/pp/my-policies" style={{ fontSize: 13, color: '#0E7C7B', fontWeight: 600, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          {(allPolicies||[])
            .filter(p => {
              const roles = p.applicable_roles || []
              const applies = roles.includes('All Staff') || roles.includes(ppRole)
              const ack = ackedMap[p.doc_id]
              return applies && (!ack || ack.doc_version !== p.version)
            })
            .slice(0, 5)
            .map(p => {
              const domain = DOMAINS.find(d => d.id === p.domain)
              return (
                <Link key={p.doc_id} href={`/pp/${p.doc_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0', borderBottom: '1px solid #EFF2F5'
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: '#F4A261'
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2E44' }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>
                        {p.doc_id} · {TIER_LABELS[p.tier] || 'Policy'} · v{p.version}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: domain?.bg || '#EFF2F5', color: domain?.text || '#4A6070'
                    }}>
                      {p.domain}
                    </span>
                  </div>
                </Link>
              )
            })}
        </div>
      )}

      {/* Admin: recent acknowledgment activity */}
      {isAdmin && (recentAcks||[]).length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A2E44', margin: 0 }}>Recent Acknowledgments</h3>
            <Link href="/pp/admin/acknowledgments" style={{ fontSize: 13, color: '#0E7C7B', fontWeight: 600, textDecoration: 'none' }}>
              Full report →
            </Link>
          </div>
          {(recentAcks||[]).map((a: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #EFF2F5', fontSize: 13 }}>
              <div>
                <span style={{ fontWeight: 600, color: '#1A2E44' }}>{a.doc_id}</span>
                <span style={{ color: '#8FA0B0', marginLeft: 8 }}>{a.user_role}</span>
              </div>
              <span style={{ fontSize: 12, color: '#8FA0B0' }}>
                {new Date(a.acknowledged_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
