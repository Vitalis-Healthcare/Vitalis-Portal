import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user?.id || '').single()

  const role = profile?.role || ''
  if (!['admin', 'supervisor', 'staff'].includes(role)) redirect('/dashboard')

  // Admin sees everyone. Supervisor/staff see only caregivers + pending caregivers.
  const { data: profiles } = await svc
    .from('profiles')
    .select('*')
    .order('full_name')

  const visibleProfiles = role === 'admin'
    ? (profiles || [])
    : (profiles || []).filter((p: any) => p.role === 'caregiver' || p.status === 'pending')

  return <UsersClient profiles={visibleProfiles} currentUserId={user?.id || ''} currentUserRole={role} />
}
