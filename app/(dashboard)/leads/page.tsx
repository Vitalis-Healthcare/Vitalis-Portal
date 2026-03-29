import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import LeadsClient from './LeadsClient'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const { data: leads } = await svc
    .from('leads')
    .select(`
      id, full_name, client_name, email, phone, source, referral_name,
      status, relationship, care_types, condition_notes, preferred_schedule,
      estimated_hours_week, hourly_rate, expected_start_date, expected_close_date,
      won_date, lost_date, lost_reason, notes, created_at, updated_at,
      assigned_to, created_by,
      assignee:assigned_to(full_name),
      creator:created_by(full_name)
    `)
    .order('created_at', { ascending: false })

  const { data: staff } = await svc
    .from('profiles')
    .select('id, full_name')
    .in('role', ['admin', 'supervisor'])
    .eq('status', 'active')
    .order('full_name')

  // Latest activity per lead for "last contact" display
  const leadIds = (leads || []).map(l => l.id)
  const { data: latestActivities } = leadIds.length > 0
    ? await svc
        .from('lead_activities')
        .select('lead_id, activity_type, content, next_follow_up, created_at')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Build last-activity map
  const lastActivity: Record<string, any> = {}
  for (const a of latestActivities || []) {
    if (!lastActivity[a.lead_id]) lastActivity[a.lead_id] = a
  }

  // Build next-follow-up map (first upcoming follow-up per lead)
  const nextFollowUp: Record<string, string> = {}
  const today = new Date().toISOString().split('T')[0]
  for (const a of [...(latestActivities || [])].reverse()) {
    if (a.next_follow_up && a.next_follow_up >= today) {
      nextFollowUp[a.lead_id] = a.next_follow_up
    }
  }

  return (
    <LeadsClient
      leads={leads || []}
      staff={staff || []}
      currentUserId={user.id}
      currentUserName={profile?.full_name || ''}
      lastActivity={lastActivity}
      nextFollowUp={nextFollowUp}
    />
  )
}
