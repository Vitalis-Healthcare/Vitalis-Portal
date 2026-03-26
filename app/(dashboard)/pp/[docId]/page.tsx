import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import PolicyIframe from './PolicyIframe'
import PolicyAcknowledgeButton from './PolicyAcknowledgeButton'
import PrintButton from './PrintButton'
import PolicyAISidebar from './PolicyAISidebar'

export default async function PolicyViewerPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: profile } = await supabase.from('profiles').select('id, role, full_name, email').eq('id', user.id).single()
  const { data: policy } = await supabase.from('pp_policies').select('*').eq('doc_id', docId.toUpperCase()).single()
  if (!policy) notFound()

  const { data: ack } = await supabase.from('pp_acknowledgments')
    .select('acknowledged_at, doc_version')
    .eq('doc_id', policy.doc_id).eq('user_id', user.id).eq('doc_version', policy.version)
    .maybeSingle()

  const { data: versions } = await supabase.from('pp_policy_versions')
    .select('version, change_summary, change_type, created_at, changed_by_role')
    .eq('doc_id', policy.doc_id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: openProposals } = await supabase.from('pp_edit_proposals')
    .select('id, section_title, status, created_at')
    .eq('doc_id', policy.doc_id)
    .eq('status', 'pending')

  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'
  const ppRole = profile?.role === 'admin' ? 'Administrator'
    : profile?.role === 'supervisor' ? 'Director of Nursing'
    : profile?.role === 'caregiver' ? 'CNA' : 'All Staff'

  const roles = policy.applicable_roles || []
  const appliesToUser = roles.includes('All Staff') || roles.includes(ppRole)
  const ackState = !appliesToUser ? 'not-applicable' : ack ? 'acknowledged' : 'required'

  const domainColors: Record<string, { text: string; bg: string }> = {
    D1: { text: '#4c1d95', bg: '#ede9fe' }, D2: { text: '#064e3b', bg: '#d1fae5' },
    D3: { text: '#1e3a5f', bg: '#dbeafe' }, D4: { text: '#7c2d12', bg: '#ffedd5' },
    D5: { text: '#78350f', bg: '#fef3c7' }, D6: { text: '#831843', bg: '#fce7f3' },
    D7: { text: '#334155', bg: '#f1f5f9' },
  }
  const dc = domainColors[policy.domain] || { text: '#1A2E44', bg: '#EFF2F5' }
  const tierLabels: Record<number, string> = { 1: 'Policy', 2: 'Procedure', 3: 'Work Instruction' }
  const isOverdue = new Date(policy.review_date) < new Date()
  const changeTypeColors: Record<string, string> = {
    initial: '#8FA0B0', minor: '#0B6B5C', major: '#F59E0B', regulatory: '#7C3AED', personnel: '#DB2777'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

      {/* MAIN CONTENT */}
      <div>
        {/* Back */}
        <div style={{ marginBottom: 14 }}>
          <Link href={`/pp/domain/${policy.domain}`} style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <ArrowLeft size={13} /> {policy.domain} · {policy.domain === 'D1' ? 'Governance & Compliance' : 'Policy Library'}
          </Link>
        </div>

        {/* Banners */}
        {policy.status === 'superseded' && (
          <div style={{ background: '#FDE8E9', border: '1px solid #E63946', borderRadius: 10, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <AlertTriangle size={16} color="#E63946" />
            <strong>This document has been superseded.</strong>
            {policy.superseded_by && <Link href={`/pp/${policy.superseded_by}`} style={{ color: '#E63946', fontWeight: 700, textDecoration: 'none' }}>View current version →</Link>}
          </div>
        )}
        {isOverdue && policy.status === 'active' && isAdmin && (
          <div style={{ background: '#FEF3EA', border: '1px solid #F4A261', borderRadius: 10, padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <AlertTriangle size={14} color="#F4A261" />
            Annual review was due <strong style={{ marginLeft: 4 }}>{new Date(policy.review_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
          </div>
        )}
        {isAdmin && (openProposals||[]).length > 0 && (
          <div style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 10, padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
            <span>🔵 <strong>{(openProposals||[]).length} edit proposal{(openProposals||[]).length !== 1 ? 's' : ''}</strong> pending approval for this document</span>
            <Link href="/pp/admin/proposals" style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>Review →</Link>
          </div>
        )}

        {/* Portal header bar */}
        <div style={{ background: '#fff', borderRadius: '12px 12px 0 0', border: '1px solid #E2E8F0', borderBottom: 'none', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: dc.bg, color: dc.text }}>{policy.domain}</span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#EFF2F5', color: '#4A6070' }}>Tier {policy.tier} — {tierLabels[policy.tier]}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8FA0B0', padding: '2px 7px', background: '#F8FAFB', borderRadius: 5, border: '1px solid #E2E8F0' }}>{policy.doc_id}</span>
                <span style={{ fontSize: 11, color: '#8FA0B0' }}>v{policy.version}</span>
              </div>
              <h1 style={{ fontSize: 19, fontWeight: 800, color: '#1A2E44', margin: '0 0 4px' }}>{policy.title}</h1>
              <div style={{ fontSize: 12, color: '#8FA0B0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>Effective {new Date(policy.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>Owner: {policy.owner_role}</span>
                {policy.comar_refs?.length > 0 && <span>COMAR: {policy.comar_refs.join(', ')}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {isAdmin && (
                <Link href={`/pp/${policy.doc_id}/edit`}>
                  <button style={{ padding: '8px 14px', border: '1px solid #0B6B5C', borderRadius: 8, background: '#fff', color: '#0B6B5C', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    ✏️ Edit
                  </button>
                </Link>
              )}
              <PrintButton />
              <PolicyAcknowledgeButton
                docId={policy.doc_id} docVersion={policy.version}
                ackState={ackState} acknowledgedAt={ack?.acknowledged_at || null}
                userId={user.id} userRole={ppRole}
              />
            </div>
          </div>
        </div>

        {/* Policy HTML content via iframe */}
        <div style={{ border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
          <PolicyIframe docId={policy.doc_id} />
        </div>

        {/* Bottom ack CTA */}
        {ackState === 'required' && (
          <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 3 }}>Have you read and understood this policy?</div>
              <div style={{ fontSize: 12, color: '#8FA0B0' }}>Your acknowledgment is required. It is recorded with your name, role, and timestamp for OHCQ compliance.</div>
            </div>
            <PolicyAcknowledgeButton docId={policy.doc_id} docVersion={policy.version} ackState={ackState} acknowledgedAt={null} userId={user.id} userRole={ppRole} />
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20 }}>
        <PolicyAISidebar
          docId={policy.doc_id}
          docTitle={policy.title}
          userRole={ppRole}
        />

        {/* Version history */}
        {(versions||[]).length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1A2E44', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              🕐 Version History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(versions||[]).map((v: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginTop: 3 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: changeTypeColors[v.change_type] || '#8FA0B0', border: i === 0 ? '2px solid #0B6B5C' : '1px solid #E2E8F0' }} />
                    {i < (versions||[]).length - 1 && <div style={{ width: 1, height: 28, background: '#E2E8F0', marginTop: 3 }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1A2E44' }}>v{v.version}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: changeTypeColors[v.change_type] + '20', color: changeTypeColors[v.change_type] }}>
                        {v.change_type}
                      </span>
                    </div>
                    {v.change_summary && <div style={{ fontSize: 11, color: '#4A6070', marginTop: 2, lineHeight: 1.4 }}>{v.change_summary}</div>}
                    <div style={{ fontSize: 10, color: '#CBD5E0', marginTop: 2 }}>
                      {new Date(v.created_at).toLocaleDateString()} · {v.changed_by_role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin actions */}
        {isAdmin && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1A2E44', margin: '0 0 12px' }}>Admin Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href={`/pp/${policy.doc_id}/edit`} style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '9px 14px', background: '#0B6B5C', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
                  ✏️ Edit with AI Assist
                </button>
              </Link>
              <Link href="/pp/admin/acknowledgments" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '9px 14px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 8, color: '#1A2E44', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                  📊 View Acknowledgments
                </button>
              </Link>
              <Link href="/pp/admin/reviews" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '9px 14px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 8, color: '#1A2E44', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                  📅 Review Calendar
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
