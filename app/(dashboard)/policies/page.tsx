import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import PolicySearch from './PolicySearch'

export default async function PoliciesPage() {
  const supabase = await createClient()
  const { data: policies } = await supabase
    .from('policies')
    .select('*')
    .order('updated_at', { ascending: false })

  const { data: profiles } = await supabase
    .from('profiles').select('id').eq('status','active')
  const totalStaff = profiles?.length || 0

  const policiesWithCounts = await Promise.all((policies||[]).map(async (p) => {
    const { count } = await supabase
      .from('policy_acknowledgements')
      .select('*', { count:'exact', head:true })
      .eq('policy_id', p.id)
      .eq('version_signed', p.version)
    return { ...p, signed_count: count||0, total_staff: totalStaff }
  }))

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Policies & Procedures</h1>
          <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>Manage, publish, and track staff acknowledgements</p>
        </div>
        <Link href="/policies/new">
          <button style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
            <Plus size={16}/> New Policy
          </button>
        </Link>
      </div>
      <PolicySearch policies={policiesWithCounts} />
    </div>
  )
}
