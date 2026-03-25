import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, Download } from 'lucide-react'
import AckAdminClient from './AckAdminClient'

export default async function AdminAcknowledgmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id||'').single()

  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') {
    redirect('/pp')
  }

  // All active policies
  const { data: policies } = await supabase
    .from('pp_policies')
    .select('doc_id, domain, tier, title, version, applicable_roles')
    .in('status', ['active', 'under-review'])
    .order('doc_id')

  // All acknowledgments with profile info
  const { data: acks } = await supabase
    .from('pp_acknowledgments')
    .select('id, doc_id, doc_version, user_id, user_role, acknowledged_at')
    .order('acknowledged_at', { ascending: false })

  // All staff profiles
  const { data: staffProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, email, status')
    .eq('status', 'active')
    .order('full_name')

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/pp" style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
          <ArrowLeft size={14} /> Policy Library
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Acknowledgment Dashboard</h1>
          <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>Track staff compliance across all policies</p>
        </div>
        <Link href="/api/pp/export-csv" target="_blank">
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', background: '#1A2E44', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            <Download size={13} /> Export CSV (OHCQ)
          </button>
        </Link>
      </div>

      <AckAdminClient
        policies={policies || []}
        acks={acks || []}
        staffProfiles={staffProfiles || []}
      />
    </div>
  )
}
