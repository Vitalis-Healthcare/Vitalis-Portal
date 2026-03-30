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
    { data: campaigns },
    { data: topOpenerRows },
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
    // Top campaigns by openers (non-internal)
    svc.from('marketing_email_campaigns')
      .select('id, campaign_date, total_opened, open_rate, total_sent')
      .order('total_opened', { ascending: false })
      .limit(5),
    // Top openers — raw opens excluding internal domain, grouped by email
    svc.from('marketing_email_opens')
      .select('email_address, name_in_csv, contact_id, marketing_contacts(name, influence_center_id, marketing_influence_centers(name))')
      .not('email_address', 'ilike', '%vitalishealthcare.com')
      .order('email_address'),
  ])

  // Aggregate top openers client-side (Supabase doesn't support GROUP BY easily in JS client)
  const openerMap: Record<string, {
    email: string
    name: string
    facility: string
    count: number
    contact_id: string | null
  }> = {}

  for (const row of (topOpenerRows || [])) {
    const email = row.email_address
    if (!openerMap[email]) {
      const contact = Array.isArray(row.marketing_contacts) ? row.marketing_contacts[0] : row.marketing_contacts
      const facility = contact
        ? (Array.isArray(contact.marketing_influence_centers)
            ? contact.marketing_influence_centers[0]?.name
            : (contact.marketing_influence_centers as any)?.name) || '—'
        : '—'
      openerMap[email] = {
        email,
        name: row.name_in_csv || contact?.name || email,
        facility,
        count: 0,
        contact_id: row.contact_id,
      }
    }
    openerMap[email].count++
  }

  const topOpeners = Object.values(openerMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const totalCampaigns = (await svc.from('marketing_email_campaigns').select('id', { count: 'exact', head: true })).count || 0

  return (
    <MarketingOverviewClient
      centers={centers || []}
      contacts={contacts || []}
      recentLogs={recentLogs || []}
      userName={profile?.full_name || ''}
      topOpeners={topOpeners}
      topCampaigns={campaigns || []}
      totalCampaigns={totalCampaigns}
    />
  )
}
