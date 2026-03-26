import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const DOMAINS = [
  { id: 'D1', name: 'Governance & Compliance', desc: 'Licensing, ethics, corporate structure, regulatory compliance', icon: '⚖️', bg: '#ede9fe', text: '#4c1d95', border: '#c4b5fd' },
  { id: 'D2', name: 'Human Resources & Workforce', desc: 'Hiring, onboarding, personnel records, compensation, performance', icon: '👥', bg: '#d1fae5', text: '#064e3b', border: '#6ee7b7' },
  { id: 'D3', name: 'Client Services & Care Delivery', desc: 'Client intake, plan of care, service delivery, coordination', icon: '🏠', bg: '#dbeafe', text: '#1e3a5f', border: '#93c5fd' },
  { id: 'D4', name: 'Clinical Operations', desc: 'Clinical standards, nursing supervision, care protocols', icon: '🩺', bg: '#ffedd5', text: '#7c2d12', border: '#fdba74' },
  { id: 'D5', name: 'Business Operations', desc: 'Billing, claims, contracts, financial operations', icon: '📊', bg: '#fef3c7', text: '#78350f', border: '#fcd34d' },
  { id: 'D6', name: 'Client Rights & Safety', desc: 'Client rights, abuse prevention, safety, incident response', icon: '🛡️', bg: '#fce7f3', text: '#831843', border: '#f9a8d4' },
  { id: 'D7', name: 'Emergency & Business Continuity', desc: 'Emergency preparedness, disaster response, continuity planning', icon: '🚨', bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
]

const TIER_LABELS: Record<number, string> = { 1: 'Policy', 2: 'Procedure', 3: 'Work Instruction' }

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user?.id||'').single()
  const ppRole = profile?.role === 'admin' ? 'Administrator' : profile?.role === 'supervisor' ? 'Director of Nursing' : profile?.role === 'caregiver' ? 'CNA' : 'All Staff'
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  const { data: policies } = await supabase.from('pp_policies')
    .select('doc_id, domain, tier, title, version, status, applicable_roles, review_date')
    .in('status', isAdmin ? ['draft','active','under-review','superseded'] : ['active','under-review'])
    .order('doc_id')

  const { data: myAcks } = await supabase.from('pp_acknowledgments')
    .select('doc_id, doc_version').eq('user_id', user?.id||'')
  const ackedSet = new Set((myAcks||[]).filter(a => {
    const p = (policies||[]).find(p => p.doc_id === a.doc_id)
    return p && a.doc_version === p.version
  }).map(a => a.doc_id))

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/pp" style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <ArrowLeft size={13} /> P&P Home
        </Link>
      </div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Policy Library</h1>
        <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>{(policies||[]).length} documents across 7 operational domains</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {DOMAINS.map(domain => {
          const docs = (policies||[]).filter(p => p.domain === domain.id)
          return (
            <div key={domain.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: `1px solid ${domain.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '18px 22px', background: `linear-gradient(135deg, ${domain.bg}, #fff)`, borderBottom: `1px solid ${domain.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 28 }}>{domain.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: domain.text, color: '#fff' }}>{domain.id}</span>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: domain.text, margin: 0 }}>{domain.name}</h2>
                  </div>
                  <p style={{ fontSize: 12, color: '#8FA0B0', margin: '3px 0 0' }}>{domain.desc}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: domain.text }}>{docs.length}</div>
                  <div style={{ fontSize: 11, color: '#8FA0B0' }}>documents</div>
                </div>
              </div>

              {docs.length === 0 ? (
                <div style={{ padding: '20px 22px', fontSize: 13, color: '#CBD5E0', fontStyle: 'italic' }}>Content arriving in next delivery</div>
              ) : (
                <div>
                  {([1,2,3] as const).map(tier => {
                    const tierDocs = docs.filter(d => d.tier === tier)
                    if (tierDocs.length === 0) return null
                    return (
                      <div key={tier}>
                        <div style={{ padding: '8px 22px', background: '#FAFBFC', borderTop: '1px solid #EFF2F5', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          Tier {tier} — {TIER_LABELS[tier]}
                        </div>
                        {tierDocs.map((doc, i) => {
                          const isAcked = ackedSet.has(doc.doc_id)
                          const roles = doc.applicable_roles || []
                          const applies = roles.includes('All Staff') || roles.includes(ppRole) || isAdmin
                          const statusColor = doc.status === 'active' ? '#0B6B5C' : doc.status === 'under-review' ? '#F59E0B' : '#8FA0B0'
                          return (
                            <Link key={doc.doc_id} href={`/pp/${doc.doc_id}`} style={{ textDecoration: 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 22px', borderTop: '1px solid #EFF2F5', background: '#fff' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: applies ? (isAcked ? '#E6F6F4' : '#FEF3EA') : '#F8FAFB' }}>
                                  <span style={{ fontSize: 12 }}>{!applies ? '📄' : isAcked ? '✓' : '⏳'}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2E44' }}>{doc.title}</div>
                                  <div style={{ fontSize: 11, color: '#8FA0B0', display: 'flex', gap: 10, marginTop: 2 }}>
                                    <span style={{ fontFamily: 'monospace' }}>{doc.doc_id}</span>
                                    <span>v{doc.version}</span>
                                    {doc.status !== 'active' && <span style={{ color: statusColor, fontWeight: 600 }}>{doc.status}</span>}
                                  </div>
                                </div>
                                {applies && !isAcked && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#FEF3EA', color: '#F59E0B', flexShrink: 0 }}>Pending</span>}
                                {applies && isAcked && <span style={{ fontSize: 11, color: '#0B6B5C', fontWeight: 600, flexShrink: 0 }}>✓ Acknowledged</span>}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
