import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('*').eq('id', user.id).single()
  const { data: credTypes } = await svc.from('credential_types').select('*').order('name')
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'
  return <SettingsClient profile={profile} credTypes={credTypes||[]} isAdmin={isAdmin} />
}
