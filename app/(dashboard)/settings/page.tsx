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

  // Credential-email toggle state (v0.6.12)
  const { data: credFlag } = await svc
    .from('portal_settings')
    .select('value')
    .eq('key', 'credential_emails_enabled')
    .maybeSingle()
  const credEmailsEnabled = credFlag?.value !== 'false'
  const envOverrideActive = process.env.CREDENTIAL_EMAILS_ENABLED === 'false'

  return (
    <SettingsClient
      profile={profile}
      credTypes={credTypes||[]}
      isAdmin={isAdmin}
      credEmailsEnabled={credEmailsEnabled}
      envOverrideActive={envOverrideActive}
    />
  )
}
