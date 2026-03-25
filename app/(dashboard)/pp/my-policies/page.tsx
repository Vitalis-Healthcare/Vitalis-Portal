import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle, Clock, ArrowLeft, FileText } from 'lucide-react'

const TIER_LABELS: Record<number, string> = { 1: 'Policy', 2: 'Procedure', 3: 'Work Instruction' }
const DOMAIN_NAMES: Record<string, string> = {
  D1: 'Governance & Compliance', D2: 'Human Resources', D3: 'Client Services',
  D4: 'Clinical Operations', D5: 'Business Operations', D6: 'Client Rights', D7: 'Emergency'
}
const DOMAIN_COLORS: Record<string, { bg: string; text: string }> = {
  D1: { bg: '#ede9fe', text: '#4c1d95' }, D2: { bg: '#d1fae5', text: '#064e3b' },
  D3: { bg: '#dbeafe', text: '#1e3a5f' }, D4: { bg: '#ffedd5', text: '#7c2d12' },
  D5: { bg: '#fef3c7', text: '#78350f' }, D6: { bg: '#fce7f3', text: '#831843' },
  D7: { bg: '#f1f5f9', text: '#334155' },
}

export default async function MyPoliciesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user?.id||'').single()

  const userRole = profile?.role || ''
  const ppRole = userRole === 'admin' ? 'Administrator'
    : userRole === 'supervisor' ? 'Director of Nursing'
    : userRole === 'caregiver' ? 'CNA'
    : 'All Staff'

  // Get all active policies applicable to this user
  const { data: allPolicies } = await supabase
    .from('pp_policies')
    .select('doc_id, domain, tier, title, version, review_date, applicable_roles, owner_role')
    .in('status', ['active', 'under-review'])
    .order('domain')
    .order('doc_id')

  const { data: myAcks } = await supabase
    .from('pp_acknowledgments')
    .select('doc_id, doc_version, acknowledged_at')
    .eq('user_id', user?.id||'')
    .order('acknowledged_at', { ascending: false })

  const ackedMap = Object.fromEntries((myAcks||[]).map(a => [a.doc_id, a]))

  // Filter to applicable policies
  const myPolicies = (allPolicies||[]).filter(p => {
    const roles = p.applicable_roles || []
    return roles.includes('All Staff') || roles.includes(ppRole)
  })

  const pending = myPolicies.filter(p => {
    const ack = ackedMap[p.doc_id]
    return !ack || ack.doc_version !== p.version
  })
  const acknowledged = myPolicies.filter(p => {
    const ack = ackedMap[p.doc_id]
    return ack && ack.doc_version === p.version
  })

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/pp" style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
          <ArrowLeft size={14} /> Policy Library
        </Link>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>My Policies</h1>
        <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>
          {profile?.full_name} · {ppRole}
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        <div style={{ background: pending.length > 0 ? '#FEF3EA' : '#E6F6F4', borderRadius: 12, padding: '18px 20px', border: `1px solid ${pending.length > 0 ? '#F4A261' : '#2A9D8F'}` }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: pending.length > 0 ? '#F4A261' : '#2A9D8F', lineHeight: 1 }}>{pending.length}</div>
          <div style={{ fontSize: 13, color: '#4A6070', marginTop: 4, fontWeight: 600 }}>
            {pending.length === 0 ? '✓ All acknowledged' : 'Pending acknowledgment'}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#2A9D8F', lineHeight: 1 }}>{acknowledged.length}</div>
          <div style={{ fontSize: 13, color: '#4A6070', marginTop: 4, fontWeight: 600 }}>Acknowledged</div>
        </div>
      </div>

      {/* Pending section */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={14} color="#F4A261" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1A2E44', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Needs acknowledgment — {pending.length}
            </span>
          </div>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #EFF2F5', overflow: 'hidden' }}>
            {pending.map((p, i) => {
              const dc = DOMAIN_COLORS[p.domain] || { bg: '#EFF2F5', text: '#4A6070' }
              return (
                <Link key={p.doc_id} href={`/pp/${p.doc_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    borderBottom: i < pending.length - 1 ? '1px solid #EFF2F5' : 'none',
                    cursor: 'pointer'
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={14} color="#F4A261" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 3 }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: '#8FA0B0', display: 'flex', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace' }}>{p.doc_id}</span>
                        <span>{TIER_LABELS[p.tier]}</span>
                        <span>v{p.version}</span>
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: dc.bg, color: dc.text, flexShrink: 0 }}>
                      {p.domain}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Acknowledged section */}
      {acknowledged.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle size={14} color="#2A9D8F" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1A2E44', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Acknowledged — {acknowledged.length}
            </span>
          </div>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #EFF2F5', overflow: 'hidden' }}>
            {acknowledged.map((p, i) => {
              const ack = ackedMap[p.doc_id]
              const dc = DOMAIN_COLORS[p.domain] || { bg: '#EFF2F5', text: '#4A6070' }
              return (
                <Link key={p.doc_id} href={`/pp/${p.doc_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px',
                    borderBottom: i < acknowledged.length - 1 ? '1px solid #EFF2F5' : 'none',
                    cursor: 'pointer'
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E6F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle size={13} color="#2A9D8F" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#4A6070' }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: '#8FA0B0' }}>
                        <span style={{ fontFamily: 'monospace' }}>{p.doc_id}</span>
                        {ack && <span style={{ marginLeft: 8 }}>Acknowledged {new Date(ack.acknowledged_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: dc.bg, color: dc.text, flexShrink: 0 }}>
                      {p.domain}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {myPolicies.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#8FA0B0' }}>
          <FileText size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No policies assigned to your role yet.</p>
        </div>
      )}
    </div>
  )
}
