import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProposalsClient from './ProposalsClient'

export default async function ProposalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  if (!user) redirect('/login')
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') redirect('/pp')

  const { data: proposals } = await svc.from('pp_edit_proposals')
    .select('*, pp_policies(title)')
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/pp/admin" style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <ArrowLeft size={13} /> Admin Console
        </Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Edit Proposals</h1>
          <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>Review, approve, or reject AI-generated policy edits</p>
        </div>
      </div>
      <ProposalsClient proposals={proposals || []} />
    </div>
  )
}
