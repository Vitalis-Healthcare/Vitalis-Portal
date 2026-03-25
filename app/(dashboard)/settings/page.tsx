import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id||'').single()
  const { data: credTypes } = await supabase.from('credential_types').select('*').order('name')
  return <SettingsClient profile={profile} credTypes={credTypes||[]} />
}
