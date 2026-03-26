import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PPAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') redirect('/pp')

  const [{ data: policies }, { data: acks }, { data: proposals }, { data: staff }] = await Promise.all([
    supabase.from('pp_policies').select('doc_id, status, review_date').in('status', ['active','under-review','draft']),
    supabase.from('pp_acknowledgments').select('id, doc_id, user_id, acknowledged_at'),
    supabase.from('pp_edit_proposals').select('id, status, doc_id, section_title, created_at').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, role').eq('status', 'active'),
  ])

  const overdue = (policies||[]).filter(p => new Date(p.review_date) < new Date() && p.status === 'active')
  const pending = (proposals||[]).filter(p => p.status === 'pending')

  const cards = [
    { label: 'Policy Documents', value: (policies||[]).length, sub: `${overdue.length} overdue review`, color: '#0B6B5C', href: '/pp/library', icon: '📋' },
    { label: 'Total Acknowledgments', value: (acks||[]).length, sub: 'audit trail records', color: '#1A9B87', href: '/pp/admin/acknowledgments', icon: '✅' },
    { label: 'Pending Proposals', value: pending.length, sub: 'edits awaiting approval', color: pending.length > 0 ? '#F59E0B' : '#8FA0B0', href: '/pp/admin/proposals', icon: '🔵' },
    { label: 'Overdue Reviews', value: overdue.length, sub: 'annual review past due', color: overdue.length > 0 ? '#DC2626' : '#8FA0B0', href: '/pp/admin/reviews', icon: '⏰' },
  ]

  const adminLinks = [
    { href: '/pp/admin/acknowledgments', icon: '📊', title: 'Acknowledgment Dashboard', desc: 'Per-document and per-staff completion rates' },
    { href: '/pp/admin/proposals', icon: '✏️', title: 'Edit Proposals', desc: 'Review and approve AI-generated policy edits' },
    { href: '/pp/admin/reviews', icon: '📅', title: 'Annual Review Calendar', desc: 'Track review due dates by urgency' },
    { href: '/pp/admin/alerts', icon: '⚡', title: 'Regulatory Alerts', desc: 'Flag policy changes needed from new regulations' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E44', margin: 0 }}>P&P Admin Console</h1>
        <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>Manage policies, track acknowledgments, review proposals</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        {cards.map((c,i) => (
          <Link key={i} href={c.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `4px solid ${c.color}` }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2E44', marginTop: 4 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>{c.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 28 }}>
        {adminLinks.map((l,i) => (
          <Link key={i} href={l.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E6F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{l.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44' }}>{l.title}</div>
                <div style={{ fontSize: 12, color: '#8FA0B0', marginTop: 3 }}>{l.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#CBD5E0' }}>→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent proposals */}
      {(proposals||[]).slice(0,5).length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 22, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Recent Edit Proposals</h3>
            <Link href="/pp/admin/proposals" style={{ fontSize: 12, color: '#0B6B5C', fontWeight: 700, textDecoration: 'none' }}>View all →</Link>
          </div>
          {(proposals||[]).slice(0,5).map((p: any, i: number) => {
            const sc = p.status === 'pending' ? { bg: '#FEF3EA', text: '#F59E0B' } : p.status === 'approved' ? { bg: '#E6F6F4', text: '#0B6B5C' } : { bg: '#FDE8E9', text: '#E63946' }
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid #EFF2F5' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E44' }}>{p.doc_id} · {p.section_title || 'Section'}</div>
                  <div style={{ fontSize: 11, color: '#8FA0B0' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.text }}>{p.status}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
