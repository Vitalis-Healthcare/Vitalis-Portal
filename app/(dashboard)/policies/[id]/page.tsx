import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PolicySignOff from './PolicySignOff'

export default async function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()

  const { data: policy } = await supabase.from('policies').select('*').eq('id', id).single()
  if (!policy) notFound()

  const { data: ack } = await supabase
    .from('policy_acknowledgements')
    .select('*')
    .eq('policy_id', id)
    .eq('user_id', user?.id||'')
    .eq('version_signed', policy.version)
    .single()

  const { data: allAcks } = await supabase
    .from('policy_acknowledgements')
    .select('*, profile:profiles(full_name)')
    .eq('policy_id', id)
    .eq('version_signed', policy.version)
    .order('signed_at', { ascending: false })

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user?.id||'').single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <Link href="/policies" style={{ color:'#8FA0B0', textDecoration:'none', display:'flex', alignItems:'center', gap:4, fontSize:14 }}>
          <ArrowLeft size={14}/> Policies
        </Link>
      </div>

      <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', marginBottom:20 }}>
        <div style={{ background:'#1A2E44', padding:'24px 32px', color:'#fff' }}>
          <div style={{ fontSize:11, opacity:0.6, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{policy.category} · {policy.version}</div>
          <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>{policy.title}</h1>
          {policy.effective_date && (
            <div style={{ fontSize:13, opacity:0.7, marginTop:6 }}>
              Effective: {new Date(policy.effective_date).toLocaleDateString()}
            </div>
          )}
        </div>

        <div style={{ padding:'28px 32px' }}>
          <div className="prose" style={{ whiteSpace:'pre-wrap', fontSize:14, lineHeight:1.8, color:'#4A6070' }}>
            {policy.content}
          </div>
        </div>

        {/* Sign off section */}
        <div style={{ borderTop:'1px solid #EFF2F5', padding:'20px 32px', background:'#F8FAFB' }}>
          <PolicySignOff
            policyId={policy.id}
            version={policy.version}
            title={policy.title}
            userId={user?.id||''}
            alreadySigned={!!ack}
            signedAt={ack?.signed_at}
          />
        </div>
      </div>

      {/* Sign-off log */}
      {isAdmin && (
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:16 }}>
            Sign-off Log — {allAcks?.length||0} staff signed
          </h2>
          {(allAcks||[]).length === 0 ? (
            <p style={{ color:'#8FA0B0', fontSize:14 }}>No one has signed this policy yet.</p>
          ) : (
            (allAcks||[]).map((a: any) => (
              <div key={a.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #EFF2F5', fontSize:14 }}>
                <span style={{ fontWeight:600, color:'#1A2E44' }}>{a.profile?.full_name}</span>
                <span style={{ color:'#8FA0B0', fontSize:12 }}>{new Date(a.signed_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
