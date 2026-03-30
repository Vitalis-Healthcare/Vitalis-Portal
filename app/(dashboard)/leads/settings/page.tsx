import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import LeadsSettingsClient from './LeadsSettingsClient'

export default async function LeadsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const [{ data: stages }, { data: serviceTypes }] = await Promise.all([
    svc.from('lead_stages').select('*').order('order_index'),
    svc.from('lead_service_types').select('*').order('order_index'),
  ])

  return <LeadsSettingsClient stages={stages || []} serviceTypes={serviceTypes || []} />
}
