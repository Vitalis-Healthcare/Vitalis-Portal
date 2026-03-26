import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PolicyEditorClient from './PolicyEditorClient'

export default async function PolicyEditPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') redirect(`/pp/${docId}`)

  const { data: policy } = await supabase.from('pp_policies').select('*').eq('doc_id', docId.toUpperCase()).single()
  if (!policy) notFound()

  const { data: proposals } = await supabase.from('pp_edit_proposals')
    .select('*').eq('doc_id', policy.doc_id).order('created_at', { ascending: false }).limit(20)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href={`/pp/${policy.doc_id}`} style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <ArrowLeft size={13} /> Back to {policy.doc_id}
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: '#ede9fe', color: '#4c1d95' }}>{policy.domain}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8FA0B0', background: '#F8FAFB', padding: '2px 7px', borderRadius: 5, border: '1px solid #E2E8F0' }}>{policy.doc_id}</span>
            <span style={{ fontSize: 11, color: '#8FA0B0' }}>v{policy.version}</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E44', margin: 0 }}>✏️ Edit: {policy.title}</h1>
          <p style={{ fontSize: 13, color: '#8FA0B0', marginTop: 4 }}>
            Use AI to propose edits to sections · All proposals go through approval before publishing
          </p>
        </div>
      </div>

      <PolicyEditorClient
        policy={policy}
        proposals={proposals || []}
        editorName={profile?.full_name || 'Administrator'}
        editorRole={profile?.role === 'admin' ? 'Administrator' : 'Director of Nursing'}
      />
    </div>
  )
}
