import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import RouteBuilderClient from './RouteBuilderClient'

export default async function RouteBuilderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const { data: centers } = await svc
    .from('marketing_influence_centers')
    .select('*, contacts:marketing_contacts(id, name, role, direct_line, mobile, email)')
    .eq('go_no_go', true)
    .order('visit_order', { ascending: true, nullsFirst: false })
    .order('name')

  return <RouteBuilderClient centers={centers || []} />
}
