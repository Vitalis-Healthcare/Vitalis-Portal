import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import ReferralSourcesClient from './ReferralSourcesClient'

export default async function ReferralSourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const [{ data: sources }, { data: leads }] = await Promise.all([
    svc.from('referral_sources').select('*').order('name'),
    svc.from('leads').select('id, status, referral_source_id, estimated_hours_week, hourly_rate, won_date'),
  ])

  return <ReferralSourcesClient sources={sources || []} leads={leads || []} />
}
