'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Proposal {
  id: string
  doc_id: string
  section_title: string
  original_text: string
  proposed_text: string
  change_reason: string
  status: string
  created_at: string
  proposed_by_role: string
  pp_policies?: { title: string }
}

export default function ProposalsClient({ proposals: initial }: { proposals: Proposal[] }) {
  const [proposals, setProposals] = useState(initial)
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState<string | null>(null)

  const act = async (id: string, action: 'approve' | 'reject') => {
    setLoading(id)
    try {
      await fetch(`/api/pp/proposals/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: id })
      })
      setProposals(prev => prev.map(p => p.id === id ? { ...p, status: action === 'approve' ? 'approved' : 'rejected' } : p))
    } catch {}
    setLoading(null)
  }

  const filtered = proposals.filter(p => filter === 'all' || p.status === filter)
  const counts = { pending: proposals.filter(p => p.status === 'pending').length, approved: proposals.filter(p => p.status === 'approved').length, rejected: proposals.filter(p => p.status === 'rejected').length }

  const statusStyle = (s: string) => ({
    pending: { bg: '#FEF3EA', text: '#F59E0B' },
    approved: { bg: '#E6F6F4', text: '#0B6B5C' },
    rejected: { bg: '#FDE8E9', text: '#E63946' },
    applied: { bg: '#EFF6FF', text: '#2563EB' },
  }[s] || { bg: '#EFF2F5', text: '#8FA0B0' })

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['pending', `Pending (${counts.pending})`], ['approved', `Approved (${counts.approved})`], ['rejected', `Rejected (${counts.rejected})`], ['all', 'All']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '7px 16px', borderRadius: 8, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: filter === key ? '#0B6B5C' : '#fff',
            color: filter === key ? '#fff' : '#4A6070',
            borderColor: filter === key ? '#0B6B5C' : '#E2E8F0'
          }}>{label}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '50px 24px', textAlign: 'center', color: '#8FA0B0', fontSize: 14, border: '1px solid #E2E8F0' }}>
          No {filter === 'all' ? '' : filter} proposals.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map(p => {
          const sc = statusStyle(p.status)
          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 18px', background: '#F8FAFB', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <Link href={`/pp/${p.doc_id}`} style={{ fontSize: 14, fontWeight: 800, color: '#1A2E44', textDecoration: 'none' }}>
                    {p.doc_id}: {(p as any).pp_policies?.title || p.doc_id}
                  </Link>
                  <span style={{ fontSize: 12, color: '#8FA0B0', marginLeft: 8 }}>→ {p.section_title || 'Section'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#8FA0B0' }}>{new Date(p.created_at).toLocaleDateString()}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>{p.status}</span>
                </div>
              </div>
              <div style={{ padding: 18 }}>
                {p.change_reason && (
                  <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#1E40AF', marginBottom: 14 }}>
                    📌 <strong>Change reason:</strong> {p.change_reason}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#E63946', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Original Text</div>
                    <div style={{ fontSize: 12, color: '#4A6070', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 10, maxHeight: 150, overflowY: 'auto', lineHeight: 1.6 }}>{p.original_text}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0B6B5C', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Proposed Text</div>
                    <div style={{ fontSize: 12, color: '#1A2E44', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 10, maxHeight: 150, overflowY: 'auto', lineHeight: 1.6 }}>{p.proposed_text}</div>
                  </div>
                </div>
                {p.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => act(p.id, 'approve')} disabled={loading === p.id} style={{ flex: 1, padding: '9px', background: '#0B6B5C', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      {loading === p.id ? 'Processing…' : '✓ Approve'}
                    </button>
                    <button onClick={() => act(p.id, 'reject')} disabled={loading === p.id} style={{ flex: 1, padding: '9px', background: '#fff', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      ✕ Reject
                    </button>
                    <Link href={`/pp/${p.doc_id}/edit`} style={{ textDecoration: 'none' }}>
                      <button style={{ padding: '9px 14px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 8, color: '#1A2E44', fontSize: 13, cursor: 'pointer' }}>
                        ✏️ Edit
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
