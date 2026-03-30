import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import MarketingOverviewClient from './MarketingOverviewClient'

export default async function MarketingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const [
    { data: centers },
    { data: contacts },
    { data: recentLogs },
  ] = await Promise.all([
    svc.from('marketing_influence_centers')
      .select('id, name, heat_status, go_no_go, assigned_day, week_group')
      .order('name'),
    svc.from('marketing_contacts')
      .select('id, name, email')
      .order('name'),
    svc.from('marketing_visit_logs')
      .select('id, visit_date, activity_type, influence_center_id, marketing_influence_centers(name)')
      .order('visit_date', { ascending: false })
      .limit(10),
  ])

  return (
    <MarketingOverviewClient
      centers={centers || []}
      contacts={contacts || []}
      recentLogs={recentLogs || []}
      userName={profile?.full_name || ''}
    />
  )
}
