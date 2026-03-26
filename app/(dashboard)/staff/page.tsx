import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import StaffClient from './StaffClient'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: currentProfile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = currentProfile?.role === 'admin' || currentProfile?.role === 'supervisor' || currentProfile?.role === 'staff'

  if (!isAdmin) {
    // Personal dashboard for caregivers
    const { data: profile } = await svc.from('profiles').select('*').eq('id', user.id).single()
    const { data: myEnrollments } = await svc
      .from('course_enrollments')
      .select('*, course:courses(title,category,thumbnail_color)')
      .eq('user_id', user.id)
      .order('assigned_at', { ascending: false })
    const { data: pendingPolicies } = await svc
      .from('policies').select('id, title, version, category, updated_at').eq('status','published')
    const signedIds = new Set(
      (await svc.from('policy_acknowledgements').select('policy_id').eq('user_id', user.id)).data?.map(a=>a.policy_id)
    )
    const unsigned = (pendingPolicies||[]).filter(p => !signedIds.has(p.id))
    const { data: myCreds } = await svc
      .from('staff_credentials').select('*, credential_type:credential_types(name)').eq('user_id', user.id)
    return <StaffClient isAdmin={false} profile={profile} myEnrollments={myEnrollments||[]} unsignedPolicies={unsigned} myCreds={myCreds||[]} allStaff={[]} />
  }

  // Admin: caregivers only
  const { data: allStaff } = await svc
    .from('profiles')
    .select('*')
    .eq('role', 'caregiver')
    .eq('status', 'active')
    .order('full_name')

  const staffIds = (allStaff || []).map((s: any) => s.id)

  // Credential summaries per caregiver
  const { data: allStaffCreds } = staffIds.length > 0
    ? await svc.from('staff_credentials').select('user_id, status, not_applicable, does_not_expire').in('user_id', staffIds)
    : { data: [] }

  // Credential types for missing computation
  const { data: credTypes } = await svc.from('credential_types').select('id, name, required_for_roles')

  // Reference summaries per caregiver
  const { data: allRefs } = staffIds.length > 0
    ? await svc.from('caregiver_references').select('caregiver_id, status').in('caregiver_id', staffIds)
    : { data: [] }

  // Build per-caregiver summaries
  type CredSummary = { current: number; expiring: number; expired: number; missing: number }
  type RefSummary  = { received: number; total: number }

  const credSummary: Record<string, CredSummary> = {}
  const refSummary:  Record<string, RefSummary>  = {}

  for (const s of allStaff || []) {
    const userCreds = (allStaffCreds || []).filter((c: any) => c.user_id === s.id)
    const credTypeIds = new Set(userCreds.map((c: any) => c.credential_type_id))
    const missing = (credTypes || []).filter((ct: any) => {
      const roles: string[] = Array.isArray(ct.required_for_roles) ? ct.required_for_roles : []
      return roles.includes(s.role) && !credTypeIds.has(ct.id)
    }).length
    credSummary[s.id] = {
      current:  userCreds.filter((c: any) => c.status === 'current').length,
      expiring: userCreds.filter((c: any) => c.status === 'expiring').length,
      expired:  userCreds.filter((c: any) => c.status === 'expired').length,
      missing,
    }
    const userRefs = (allRefs || []).filter((r: any) => r.caregiver_id === s.id)
    refSummary[s.id] = {
      received: userRefs.filter((r: any) => r.status === 'received').length,
      total: 3,
    }
  }

  return <StaffClient isAdmin={true} allStaff={allStaff||[]} credSummary={credSummary} refSummary={refSummary} profile={null} myEnrollments={[]} unsignedPolicies={[]} myCreds={[]} />
}
