// app/(dashboard)/candidates/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import CandidatesClient from './CandidatesClient'

export default async function CandidatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  const isStaff = role === 'admin' || role === 'supervisor' || role === 'staff'
  if (!isStaff) redirect('/dashboard')

  const { data: candidates } = await svc
    .from('onb_candidates')
    .select('*')
    .order('created_at', { ascending: false })

  return <CandidatesClient candidates={candidates || []} />
}
