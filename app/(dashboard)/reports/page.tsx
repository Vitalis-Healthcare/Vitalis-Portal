import { createClient } from '@/lib/supabase/server'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const supabase = await createClient()

  const [
    { data: caregivers },
    { data: credTypes },
    { data: allCreds },
    { data: courses },
    { data: enrollments },
    { data: policies },
    { data: acks },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, position_name, created_at')
      .eq('role', 'caregiver')
      .eq('status', 'active')
      .order('full_name'),
    supabase
      .from('credential_types')
      .select('id, name, validity_days')
      .order('name'),
    supabase
      .from('staff_credentials')
      .select('id, user_id, credential_type_id, expiry_date, status, does_not_expire, issue_date'),
    supabase
      .from('courses')
      .select('id, title, category')
      .eq('status', 'published')
      .order('title'),
    supabase
      .from('course_enrollments')
      .select('user_id, course_id, completed_at, assigned_at'),
    supabase
      .from('policies')
      .select('id, title, version, category')
      .eq('status', 'published')
      .order('title'),
    supabase
      .from('policy_acknowledgements')
      .select('user_id, policy_id, version_signed, signed_at'),
  ])

  const { count: totalActive } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const allExpiring = (allCreds || []).filter((c: any) => c.status === 'expiring' || c.status === 'expired')
  const allCompletions = (enrollments || []).filter((e: any) => e.completed_at)

  return (
    <ReportsClient
      caregivers={caregivers || []}
      credTypes={credTypes || []}
      allCreds={allCreds || []}
      courses={courses || []}
      enrollments={enrollments || []}
      policies={policies || []}
      acks={acks || []}
      kpi={{
        totalActive: totalActive ?? 0,
        credentialIssues: allExpiring.length,
        trainingCompletions: allCompletions.length,
        policySignoffs: (acks || []).length,
      }}
    />
  )
}
