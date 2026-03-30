import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import InfluenceCentersClient from './InfluenceCentersClient'

export default async function InfluenceCentersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const { data: centers } = await svc
    .from('marketing_influence_centers')
    .select('*, contacts:marketing_contacts(id, name, role, email)')
    .order('name')

  return (
    <InfluenceCentersClient
      initialCenters={centers || []}
      currentUserId={user.id}
    />
  )
}
