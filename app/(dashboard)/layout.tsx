import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { Profile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service role to read profile — bypasses RLS so admin role is always returned correctly
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Topbar profile={profile as Profile} />
      <div style={{ display:'flex', flex:1 }}>
        <Sidebar role={profile?.role ?? 'caregiver'} />
        <main style={{ flex:1, padding:32, overflowY:'auto', maxHeight:'calc(100vh - 64px)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
