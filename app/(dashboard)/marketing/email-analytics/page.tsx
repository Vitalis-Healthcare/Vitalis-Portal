import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import EmailAnalyticsClient from './EmailAnalyticsClient'

export default async function EmailAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const { data: campaigns } = await svc
    .from('marketing_email_campaigns')
    .select('*, opens:marketing_email_opens(id, email_address, name_in_csv, contact_id)')
    .order('campaign_date', { ascending: false })

  const { data: contactCount } = await svc
    .from('marketing_contacts')
    .select('id', { count: 'exact', head: true })
    .not('email', 'is', null)
    .eq('email_blast_opt_in', true)

  return (
    <EmailAnalyticsClient
      initialCampaigns={campaigns || []}
      optInCount={(contactCount as any)?.count || 0}
    />
  )
}
