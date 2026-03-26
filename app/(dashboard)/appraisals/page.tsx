// app/(dashboard)/appraisals/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import AppraisalsClient from './AppraisalsClient'

export default async function AppraisalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()

  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const { data: caregivers } = await svc
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'caregiver')
    .eq('status', 'active')
    .order('full_name')

  const { data: appraisals } = await svc
    .from('appraisals')
    .select('*, caregiver:caregiver_id(full_name), appraiser:appraiser_id(full_name)')
    .order('created_at', { ascending: false })

  return (
    <AppraisalsClient
      caregivers={caregivers || []}
      appraisals={appraisals || []}
      currentUserId={user.id}
    />
  )
}
