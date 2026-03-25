import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, Printer, AlertTriangle } from 'lucide-react'
import PolicyAcknowledgeButton from './PolicyAcknowledgeButton'

export default async function PolicyViewerPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single()

  const { data: policy } = await supabase
    .from('pp_policies')
    .select('*')
    .eq('doc_id', docId.toUpperCase())
    .single()

  if (!policy) notFound()

  // Check if user has acknowledged this version
  const { data: ack } = await supabase
    .from('pp_acknowledgments')
    .select('acknowledged_at, doc_version')
    .eq('doc_id', policy.doc_id)
    .eq('user_id', user.id)
    .eq('doc_version', policy.version)
    .maybeSingle()

  const userRole = profile?.role || ''
  const ppRole = userRole === 'admin' ? 'Administrator'
    : userRole === 'supervisor' ? 'Director of Nursing'
    : userRole === 'caregiver' ? 'CNA'
    : 'All Staff'

  const roles = policy.applicable_roles || []
  const appliesToUser = roles.includes('All Staff') || roles.includes(ppRole)

  const ackState = !appliesToUser ? 'not-applicable'
    : ack ? 'acknowledged'
    : 'required'

  const domainColors: Record<string, { text: string; bg: string }> = {
    D1: { text: '#4c1d95', bg: '#ede9fe' },
    D2: { text: '#064e3b', bg: '#d1fae5' },
    D3: { text: '#1e3a5f', bg: '#dbeafe' },
    D4: { text: '#7c2d12', bg: '#ffedd5' },
    D5: { text: '#78350f', bg: '#fef3c7' },
    D6: { text: '#831843', bg: '#fce7f3' },
    D7: { text: '#334155', bg: '#f1f5f9' },
  }
  const dc = domainColors[policy.domain] || { text: '#1A2E44', bg: '#EFF2F5' }

  const tierLabels: Record<number, string> = { 1: 'Policy', 2: 'Procedure', 3: 'Work Instruction' }
  const isOverdue = new Date(policy.review_date) < new Date()

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Back */}
      <div style={{ marginBottom: 16 }}>
        <Link href={`/pp/domain/${policy.domain}`} style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
          <ArrowLeft size={14} /> {policy.domain} — {policy.domain === 'D1' ? 'Governance & Compliance' : 'Policy Library'}
        </Link>
      </div>

      {/* Superseded banner */}
      {policy.status === 'superseded' && (
        <div style={{ background: '#FDE8E9', border: '1px solid #E63946', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} color="#E63946" />
          <span style={{ fontSize: 14, color: '#1A2E44' }}>
            <strong>This document has been superseded.</strong>
            {policy.superseded_by && (
              <> Current version: <Link href={`/pp/${policy.superseded_by}`} style={{ color: '#E63946', fontWeight: 700 }}>{policy.superseded_by} →</Link></>
            )}
          </span>
        </div>
      )}

      {/* Under review banner */}
      {policy.status === 'under-review' && (
        <div style={{ background: '#FEF3EA', border: '1px solid #F4A261', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Clock size={16} color="#F4A261" />
          <span style={{ fontSize: 14, color: '#1A2E44' }}>
            This policy is currently under annual review. The content shown remains in effect until a new version is approved.
          </span>
        </div>
      )}

      {/* Review overdue banner (admin only) */}
      {isOverdue && policy.status === 'active' && (
        <div style={{ background: '#FEF3EA', border: '1px solid #F4A261', borderRadius: 10, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={16} color="#F4A261" />
          <span style={{ fontSize: 13, color: '#1A2E44' }}>
            Annual review was due <strong>{new Date(policy.review_date).toLocaleDateString()}</strong>.
          </span>
        </div>
      )}

      {/* Portal header bar */}
      <div style={{ background: '#fff', borderRadius: '12px 12px 0 0', border: '1px solid #E2E8F0', borderBottom: 'none', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          {/* Left: doc info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: dc.bg, color: dc.text }}>
                {policy.domain}
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#EFF2F5', color: '#4A6070' }}>
                Tier {policy.tier} — {tierLabels[policy.tier] || 'Document'}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8FA0B0', padding: '3px 8px', background: '#F8FAFB', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                {policy.doc_id}
              </span>
              <span style={{ fontSize: 11, color: '#8FA0B0' }}>v{policy.version}</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E44', margin: '0 0 4px' }}>{policy.title}</h1>
            <div style={{ fontSize: 12, color: '#8FA0B0', display: 'flex', gap: 14 }}>
              <span>Effective {new Date(policy.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>Owner: {policy.owner_role}</span>
              {policy.comar_refs && policy.comar_refs.length > 0 && (
                <span>COMAR: {policy.comar_refs.join(', ')}</span>
              )}
            </div>
          </div>

          {/* Right: acknowledgment + print */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={() => window.print()}
              style={{ padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#4A6070', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              🖨 Print
            </button>

            <PolicyAcknowledgeButton
              docId={policy.doc_id}
              docVersion={policy.version}
              ackState={ackState}
              acknowledgedAt={ack?.acknowledged_at || null}
              userId={user.id}
              userRole={ppRole}
            />
          </div>
        </div>
      </div>

      {/* Policy HTML content */}
      <div style={{ border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
        <div
          className="pp-policy-content"
          dangerouslySetInnerHTML={{ __html: policy.html_content }}
        />
      </div>

      {/* Bottom acknowledgment CTA */}
      {ackState === 'required' && (
        <div style={{ marginTop: 20, background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 4 }}>
              Have you read and understood this policy?
            </div>
            <div style={{ fontSize: 13, color: '#8FA0B0' }}>
              Your acknowledgment is required for compliance. It is recorded with your name, role, and timestamp.
            </div>
          </div>
          <PolicyAcknowledgeButton
            docId={policy.doc_id}
            docVersion={policy.version}
            ackState={ackState}
            acknowledgedAt={null}
            userId={user.id}
            userRole={ppRole}
          />
        </div>
      )}
    </div>
  )
}
