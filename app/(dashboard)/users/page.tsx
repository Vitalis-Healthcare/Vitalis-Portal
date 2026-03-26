import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user?.id || '').single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: profiles } = await svc
    .from('profiles')
    .select('*')
    .order('full_name')

  return <UsersClient profiles={profiles || []} currentUserId={user?.id || ''} />
}
