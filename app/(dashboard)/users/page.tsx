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

  const { data: profiles } = await svc
    .from('profiles')
    .select('*')
    .order('full_name')

  // v0.6.13-b: merge auth sign-in state so the table can flag stranded accounts
  // (created but never signed in). last_sign_in_at lives in auth.users, not
  // profiles, so we pull it via the admin API and join by id. Best-effort —
  // if the admin call fails we simply don't flag anyone.
  const signInById = new Map<string, string | null>()
  try {
    // listUsers is paginated. Page through so large staff lists are covered.
    let page = 1
    for (let i = 0; i < 20; i++) {
      const { data: authList, error } = await svc.auth.admin.listUsers({ page, perPage: 200 })
      if (error || !authList?.users?.length) break
      for (const u of authList.users) {
        signInById.set(u.id, u.last_sign_in_at ?? null)
      }
      if (authList.users.length < 200) break
      page += 1
    }
  } catch {
    // leave the map empty — no rows get flagged
  }

  const withSignIn = (profiles || []).map((p: any) => ({
    ...p,
    never_signed_in: signInById.has(p.id) ? !signInById.get(p.id) : false,
  }))

  const visibleProfiles = role === 'admin'
    ? withSignIn
    : withSignIn.filter((p: any) => p.role === 'caregiver' || p.status === 'pending')

  return <UsersClient profiles={visibleProfiles} currentUserId={user?.id || ''} currentUserRole={role} />
}
