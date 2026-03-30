import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import ContactsClient from './ContactsClient'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const [{ data: contacts }, { data: centers }] = await Promise.all([
    svc
      .from('marketing_contacts')
      .select('*, center:marketing_influence_centers(id, name, assigned_day, week_group)')
      .order('name'),
    svc
      .from('marketing_influence_centers')
      .select('id, name, assigned_day, week_group')
      .order('name'),
  ])

  return (
    <ContactsClient
      initialContacts={contacts || []}
      centers={centers || []}
      currentUserId={user.id}
    />
  )
}
