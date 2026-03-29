import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import LeadDetailClient from './LeadDetailClient'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const { data: lead } = await svc
    .from('leads')
    .select(`*, assignee:assigned_to(full_name), creator:created_by(full_name)`)
    .eq('id', id)
    .single()

  if (!lead) notFound()

  const { data: activities } = await svc
    .from('lead_activities')
    .select(`*, author:created_by(full_name)`)
    .eq('lead_id', id)
    .order('created_at', { ascending: false })

  const { data: staff } = await svc
    .from('profiles').select('id, full_name')
    .in('role', ['admin', 'supervisor']).eq('status', 'active').order('full_name')

  return (
    <LeadDetailClient
      lead={lead}
      activities={activities || []}
      staff={staff || []}
      currentUserId={user.id}
      currentUserName={profile?.full_name || ''}
    />
  )
}
