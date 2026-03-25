import { createClient } from '@/lib/supabase/server'
import CredentialsClient from './CredentialsClient'

export default async function CredentialsPage() {
  const supabase = await createClient()

  const { data: credTypes } = await supabase
    .from('credential_types')
    .select('*')
    .order('name')

  const { data: staff } = await supabase
    .from('profiles')
    .select('id, full_name, role, status')
    .eq('status', 'active')
    .order('full_name')

  const { data: allCreds } = await supabase
    .from('staff_credentials')
    .select('*, credential_type:credential_types(name, validity_days)')
    .order('expiry_date', { ascending: true })

  const { count: currentCount } = await supabase
    .from('staff_credentials').select('*', { count:'exact', head:true }).eq('status','current')
  const { count: expiringCount } = await supabase
    .from('staff_credentials').select('*', { count:'exact', head:true }).eq('status','expiring')
  const { count: expiredCount } = await supabase
    .from('staff_credentials').select('*', { count:'exact', head:true }).eq('status','expired')

  return (
    <CredentialsClient
      credTypes={credTypes||[]}
      staff={staff||[]}
      allCreds={allCreds||[]}
      stats={{ current: currentCount||0, expiring: expiringCount||0, expired: expiredCount||0, total: staff?.length||0 }}
    />
  )
}
