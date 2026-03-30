import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import ActivityLoggerClient from './ActivityLoggerClient'

export default async function ActivityLoggerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const [{ data: centers }, { data: logs }, { data: staff }] = await Promise.all([
    svc
      .from('marketing_influence_centers')
      .select('id, name, assigned_day, week_group, contacts:marketing_contacts(id, name, role)')
      .eq('go_no_go', true)
      .order('name'),
    svc
      .from('marketing_visit_logs')
      .select(`
        id, visit_date, activity_type, notes, created_at,
        center:marketing_influence_centers(id, name),
        contact:marketing_contacts(id, name, role),
        logger:logged_by(id, full_name)
      `)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200),
    svc
      .from('profiles')
      .select('id, full_name')
      .in('role', ['admin', 'supervisor'])
      .eq('status', 'active')
      .order('full_name'),
  ])

  return (
    <ActivityLoggerClient
      centers={centers || []}
      initialLogs={logs || []}
      staff={staff || []}
      currentUserId={user.id}
      currentUserName={profile?.full_name || ''}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
