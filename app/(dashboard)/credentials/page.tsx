import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import CredentialsClient from './CredentialsClient'
import StaffCredentialsClient from './StaffCredentialsClient'

export default async function CredentialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user?.id||'').single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  const { data: credTypes } = await svc.from('credential_types').select('*').order('name')

  if (!isAdmin) {
    // Staff view — only their own credentials
    const { data: myCreds } = await supabase
      .from('staff_credentials')
      .select('*, credential_type:credential_types(name, validity_days)')
      .eq('user_id', user?.id||'')
      .order('created_at', { ascending: false })

    return (
      <StaffCredentialsClient
        credTypes={credTypes||[]}
        myCreds={myCreds||[]}
        userId={user?.id||''}
        fullName={profile?.full_name||''}
      />
    )
  }

  // Admin view — all staff + pending submissions
  // Credentials matrix shows caregivers only
  const { data: staff } = await supabase
    .from('profiles').select('id, full_name, role, status').eq('status','active').eq('role','caregiver').order('full_name')

  const { data: allCreds } = await supabase
    .from('staff_credentials')
    .select('*, credential_type:credential_types(name, validity_days), submitter:profiles!staff_credentials_user_id_fkey(full_name)')
    .order('expiry_date', { ascending: true })

  const { count: currentCount } = await svc.from('staff_credentials').select('*', { count:'exact', head:true }).eq('status','current').eq('review_status','approved')
  const { count: expiringCount } = await svc.from('staff_credentials').select('*', { count:'exact', head:true }).eq('status','expiring').eq('review_status','approved')
  const { count: expiredCount } = await svc.from('staff_credentials').select('*', { count:'exact', head:true }).eq('status','expired').eq('review_status','approved')

  return (
    <CredentialsClient
      credTypes={credTypes||[]}
      staff={staff||[]}
      allCreds={allCreds||[]}
      stats={{ current: currentCount||0, expiring: expiringCount||0, expired: expiredCount||0, total: staff?.length||0 }}
    />
  )
}
