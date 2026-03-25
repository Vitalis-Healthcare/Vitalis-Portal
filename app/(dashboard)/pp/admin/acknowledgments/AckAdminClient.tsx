'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Clock, User, FileText } from 'lucide-react'

interface Policy {
  doc_id: string
  domain: string
  tier: number
  title: string
  version: string
  applicable_roles: string[]
}
interface Ack {
  id: string
  doc_id: string
  doc_version: string
  user_id: string
  user_role: string
  acknowledged_at: string
}
interface StaffProfile {
  id: string
  full_name: string
  role: string
  email: string
  status: string
}

const ROLE_MAP: Record<string, string> = {
  admin: 'Administrator', supervisor: 'Director of Nursing',
  caregiver: 'CNA', staff: 'All Staff'
}

export default function AckAdminClient({
  policies, acks, staffProfiles
}: {
  policies: Policy[]
  acks: Ack[]
  staffProfiles: StaffProfile[]
}) {
  const [tab, setTab] = useState<'by-doc' | 'by-staff'>('by-doc')
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')

  // Build lookup maps
  const acksByDoc: Record<string, Ack[]> = {}
  const acksByUser: Record<string, Ack[]> = {}
  for (const a of acks) {
    if (!acksByDoc[a.doc_id]) acksByDoc[a.doc_id] = []
    acksByDoc[a.doc_id].push(a)
    if (!acksByUser[a.user_id]) acksByUser[a.user_id] = []
    acksByUser[a.user_id].push(a)
  }

  const ppRoleForStaff = (role: string) => ROLE_MAP[role] || 'All Staff'

  // For a policy, which staff are applicable?
  const getApplicableStaff = (policy: Policy) => {
    return staffProfiles.filter(s => {
      const pr = ppRoleForStaff(s.role)
      return policy.applicable_roles.includes('All Staff') || policy.applicable_roles.includes(pr)
    })
  }

  const filteredPolicies = policies.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.doc_id.toLowerCase().includes(search.toLowerCase())
    const matchDomain = domainFilter === 'all' || p.domain === domainFilter
    return matchSearch && matchDomain
  })

  const filteredStaff = staffProfiles.filter(s =>
    !search || s.full_name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase())
  )

  const domains = [...new Set(policies.map(p => p.domain))].sort()

  const inp: React.CSSProperties = { padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Policies', value: policies.length, color: '#0E7C7B' },
          { label: 'Total Staff', value: staffProfiles.length, color: '#1A2E44' },
          { label: 'Total Acknowledgments', value: acks.length, color: '#2A9D8F' },
          { label: 'Unique Staff Acknowledged', value: Object.keys(acksByUser).length, color: '#457B9D' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', borderLeft: `4px solid ${s.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1A2E44', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + filters */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#F8FAFB', borderRadius: 8, padding: 3 }}>
          {([['by-doc', 'By Document'], ['by-staff', 'By Staff Member']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '7px 16px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: tab === key ? '#fff' : 'transparent',
              color: tab === key ? '#1A2E44' : '#8FA0B0',
              boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}>
              {label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tab === 'by-doc' ? 'Search policies…' : 'Search staff…'}
          style={{ ...inp, flex: 1, minWidth: 160 }}
        />
        {tab === 'by-doc' && (
          <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} style={inp}>
            <option value="all">All Domains</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>

      {/* By Document view */}
      {tab === 'by-doc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredPolicies.map(policy => {
            const applicable = getApplicableStaff(policy)
            const docAcks = acksByDoc[policy.doc_id] || []
            const currentAcks = docAcks.filter(a => a.doc_version === policy.version)
            const ackedUserIds = new Set(currentAcks.map(a => a.user_id))
            const pending = applicable.filter(s => !ackedUserIds.has(s.id))
            const pct = applicable.length > 0 ? Math.round((ackedUserIds.size / applicable.length) * 100) : 0

            return (
              <div key={policy.doc_id} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #EFF2F5' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8FA0B0', background: '#F8FAFB', padding: '2px 7px', borderRadius: 5, border: '1px solid #E2E8F0' }}>{policy.doc_id}</span>
                      <span style={{ fontSize: 11, color: '#8FA0B0' }}>v{policy.version}</span>
                    </div>
                    <Link href={`/pp/${policy.doc_id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44' }}>{policy.title}</div>
                    </Link>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: pct === 100 ? '#2A9D8F' : pct > 50 ? '#F4A261' : '#E63946' }}>{pct}%</div>
                    <div style={{ fontSize: 11, color: '#8FA0B0' }}>{ackedUserIds.size}/{applicable.length} staff</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ background: '#EFF2F5', borderRadius: 10, height: 6, marginBottom: 12 }}>
                  <div style={{ width: `${pct}%`, background: pct === 100 ? '#2A9D8F' : '#0E7C7B', borderRadius: 10, height: 6, transition: 'width 0.3s' }} />
                </div>

                {/* Pending staff list */}
                {pending.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>
                      Pending ({pending.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {pending.map(s => (
                        <span key={s.id} style={{
                          padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: '#FEF3EA', color: '#C67B2A', display: 'flex', alignItems: 'center', gap: 5
                        }}>
                          <Clock size={10} /> {s.full_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {pending.length === 0 && applicable.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#2A9D8F', fontWeight: 600 }}>
                    <CheckCircle size={14} /> All applicable staff have acknowledged this policy
                  </div>
                )}
              </div>
            )
          })}
          {filteredPolicies.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8FA0B0', fontSize: 14 }}>No policies match your filters.</div>
          )}
        </div>
      )}

      {/* By Staff view */}
      {tab === 'by-staff' && (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {filteredStaff.map((s, i) => {
            const userAcks = acksByUser[s.id] || []
            const ackedDocIds = new Set(userAcks.map(a => a.doc_id))
            const ppRole = ppRoleForStaff(s.role)

            const applicablePolicies = policies.filter(p => {
              return p.applicable_roles.includes('All Staff') || p.applicable_roles.includes(ppRole)
            })
            const pendingCount = applicablePolicies.filter(p => {
              const ack = userAcks.find(a => a.doc_id === p.doc_id && a.doc_version === p.version)
              return !ack
            }).length
            const pct = applicablePolicies.length > 0
              ? Math.round(((applicablePolicies.length - pendingCount) / applicablePolicies.length) * 100)
              : 100

            return (
              <div key={s.id} style={{
                padding: '14px 20px',
                borderBottom: i < filteredStaff.length - 1 ? '1px solid #EFF2F5' : 'none',
                display: 'flex', alignItems: 'center', gap: 14
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={16} color="#4A6070" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 2 }}>{s.full_name}</div>
                  <div style={{ fontSize: 12, color: '#8FA0B0' }}>{ppRole} · {s.email}</div>
                  <div style={{ marginTop: 8, background: '#EFF2F5', borderRadius: 10, height: 4, maxWidth: 200 }}>
                    <div style={{ width: `${pct}%`, background: pct === 100 ? '#2A9D8F' : '#0E7C7B', borderRadius: 10, height: 4 }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: pct === 100 ? '#2A9D8F' : '#1A2E44' }}>{pct}%</div>
                  <div style={{ fontSize: 11, color: '#8FA0B0' }}>
                    {applicablePolicies.length - pendingCount}/{applicablePolicies.length} policies
                  </div>
                  {pendingCount > 0 && (
                    <div style={{ fontSize: 11, color: '#F4A261', fontWeight: 600, marginTop: 2 }}>
                      {pendingCount} pending
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {filteredStaff.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8FA0B0', fontSize: 14 }}>No staff found.</div>
          )}
        </div>
      )}
    </div>
  )
}
