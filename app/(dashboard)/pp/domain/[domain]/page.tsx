import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, FileText } from 'lucide-react'

const DOMAIN_META: Record<string, { name: string; owner: string; bg: string; text: string; border: string; desc: string }> = {
  D1: { name: 'Governance & Compliance', owner: 'Administrator', bg: '#ede9fe', text: '#4c1d95', border: '#c4b5fd', desc: 'Agency licensing, corporate structure, ethics, and regulatory compliance' },
  D2: { name: 'Human Resources & Workforce', owner: 'HR / Office Manager', bg: '#d1fae5', text: '#064e3b', border: '#6ee7b7', desc: 'Hiring, onboarding, personnel records, and workforce management' },
  D3: { name: 'Client Services & Care Delivery', owner: 'Care Coordinator', bg: '#dbeafe', text: '#1e3a5f', border: '#93c5fd', desc: 'Client intake, plan of care, service delivery, and coordination' },
  D4: { name: 'Clinical Operations', owner: 'Director of Nursing', bg: '#ffedd5', text: '#7c2d12', border: '#fdba74', desc: 'Clinical standards, nursing supervision, and care protocols' },
  D5: { name: 'Business Operations', owner: 'Billing / Compliance Officer', bg: '#fef3c7', text: '#78350f', border: '#fcd34d', desc: 'Billing, claims, contracts, and business operations' },
  D6: { name: 'Client Rights & Safety', owner: 'Director of Nursing', bg: '#fce7f3', text: '#831843', border: '#f9a8d4', desc: 'Client rights, safety, abuse prevention, and incident response' },
  D7: { name: 'Emergency & Business Continuity', owner: 'Administrator', bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', desc: 'Emergency preparedness, disaster response, and continuity planning' },
}

const TIER_LABELS: Record<number, string> = { 1: 'Policy', 2: 'Procedure', 3: 'Work Instruction' }
const TIER_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#EDE9FE', text: '#4C1D95' },
  2: { bg: '#DBEAFE', text: '#1E3A5F' },
  3: { bg: '#F1F5F9', text: '#334155' },
}

export default async function DomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  const domainMeta = DOMAIN_META[domain.toUpperCase()]
  if (!domainMeta) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user?.id||'').single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'
  const userRole = profile?.role || ''

  const ppRole = userRole === 'admin' ? 'Administrator'
    : userRole === 'supervisor' ? 'Director of Nursing'
    : userRole === 'caregiver' ? 'CNA'
    : 'All Staff'

  const { data: policies } = await supabase
    .from('pp_policies')
    .select('doc_id, domain, tier, title, status, version, effective_date, review_date, applicable_roles, owner_role')
    .eq('domain', domain.toUpperCase())
    .in('status', isAdmin ? ['draft','active','under-review','superseded'] : ['active','under-review'])
    .order('doc_id')

  const { data: myAcks } = await supabase
    .from('pp_acknowledgments')
    .select('doc_id, doc_version, acknowledged_at')
    .eq('user_id', user?.id||'')

  const ackedMap = Object.fromEntries((myAcks||[]).map(a => [a.doc_id, a]))

  // Group by tier
  const byTier: Record<number, typeof policies> = { 1: [], 2: [], 3: [] }
  for (const p of policies||[]) {
    if (!byTier[p.tier]) byTier[p.tier] = []
    byTier[p.tier]!.push(p)
  }

  const dm = domainMeta

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/pp" style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
          <ArrowLeft size={14} /> Policy Library
        </Link>
      </div>

      {/* Domain header */}
      <div style={{
        background: `linear-gradient(135deg, #1A2E44 0%, ${dm.text} 100%)`,
        borderRadius: 14, padding: '24px 28px', color: '#fff', marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
              background: 'rgba(255,255,255,0.2)', color: '#fff', letterSpacing: '0.5px', marginBottom: 10, display: 'inline-block'
            }}>
              {domain.toUpperCase()}
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '6px 0 6px' }}>{dm.name}</h1>
            <p style={{ fontSize: 14, opacity: 0.8, margin: 0 }}>{dm.desc}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{(policies||[]).length}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>documents</div>
          </div>
        </div>
      </div>

      {/* Tier sections */}
      {([1, 2, 3] as const).map(tier => {
        const docs = byTier[tier] || []
        if (docs.length === 0) return null

        return (
          <div key={tier} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                background: TIER_COLORS[tier].bg, color: TIER_COLORS[tier].text
              }}>
                Tier {tier} — {TIER_LABELS[tier]}
              </span>
              <span style={{ fontSize: 12, color: '#8FA0B0' }}>{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              {docs.map((p, i) => {
                if (!p) return null
                const ack = ackedMap[p.doc_id]
                const isAcked = ack && ack.doc_version === p.version
                const roles = p.applicable_roles || []
                const applies = roles.includes('All Staff') || roles.includes(ppRole) || isAdmin
                const isOverdue = new Date(p.review_date) < new Date()
                const statusColor = p.status === 'active' ? '#2A9D8F' : p.status === 'under-review' ? '#F4A261' : p.status === 'draft' ? '#8FA0B0' : '#E63946'
                const statusBg = p.status === 'active' ? '#E6F6F4' : p.status === 'under-review' ? '#FEF3EA' : p.status === 'draft' ? '#EFF2F5' : '#FDE8E9'

                return (
                  <Link key={p.doc_id} href={`/pp/${p.doc_id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                      borderBottom: i < docs.length - 1 ? '1px solid #EFF2F5' : 'none',
                      background: '#fff', cursor: 'pointer'
                    }}>
                      {/* Ack status icon */}
                      <div style={{ flexShrink: 0 }}>
                        {!applies ? (
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F8FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={13} color="#CBD5E0" />
                          </div>
                        ) : isAcked ? (
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E6F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={14} color="#2A9D8F" />
                          </div>
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF3EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={13} color="#F4A261" />
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 3 }}>
                          {p.title}
                        </div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#8FA0B0', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace' }}>{p.doc_id}</span>
                          <span>v{p.version}</span>
                          <span>Effective {new Date(p.effective_date).toLocaleDateString()}</span>
                          {isAdmin && isOverdue && (
                            <span style={{ color: '#E63946', fontWeight: 600 }}>⚠ Review overdue</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                        {isAdmin && (
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: statusBg, color: statusColor }}>
                            {p.status}
                          </span>
                        )}
                        {applies && !isAcked && (
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#FEF3EA', color: '#F4A261' }}>
                            Pending
                          </span>
                        )}
                        {applies && isAcked && (
                          <span style={{ fontSize: 11, color: '#2A9D8F', fontWeight: 600 }}>
                            ✓ {new Date(ack!.acknowledged_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}

      {(policies||[]).length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A2E44', marginBottom: 8 }}>
            Content arriving soon
          </h3>
          <p style={{ color: '#8FA0B0', fontSize: 14 }}>
            {dm.name} documents are being prepared and will appear here when published.
          </p>
        </div>
      )}
    </div>
  )
}
