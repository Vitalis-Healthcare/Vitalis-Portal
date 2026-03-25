import { createClient } from '@/lib/supabase/server'
import StaffClient from './StaffClient'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user?.id||'').single()
  const isAdmin = currentProfile?.role === 'admin' || currentProfile?.role === 'supervisor'

  if (!isAdmin) {
    // Show personal dashboard for caregivers
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id||'').single()
    const { data: myEnrollments } = await supabase
      .from('course_enrollments')
      .select('*, course:courses(title,category,thumbnail_color)')
      .eq('user_id', user?.id||'')
      .order('assigned_at', { ascending: false })
    const { data: pendingPolicies } = await supabase
      .from('policies')
      .select('id, title, version, category, updated_at')
      .eq('status','published')
    const signedIds = new Set(
      (await supabase.from('policy_acknowledgements').select('policy_id').eq('user_id',user?.id||'')).data?.map(a=>a.policy_id)
    )
    const unsigned = (pendingPolicies||[]).filter(p => !signedIds.has(p.id))
    const { data: myCreds } = await supabase
      .from('staff_credentials')
      .select('*, credential_type:credential_types(name)')
      .eq('user_id', user?.id||'')
    return <StaffClient isAdmin={false} profile={profile} myEnrollments={myEnrollments||[]} unsignedPolicies={unsigned} myCreds={myCreds||[]} allStaff={[]} />
  }

  const { data: allStaff } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')
  return <StaffClient isAdmin={true} allStaff={allStaff||[]} profile={null} myEnrollments={[]} unsignedPolicies={[]} myCreds={[]} />
}
