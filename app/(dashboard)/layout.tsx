import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { Profile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Topbar profile={profile as Profile} />
      <div style={{ display:'flex', flex:1 }}>
        <Sidebar />
        <main style={{ flex:1, padding:32, overflowY:'auto', maxHeight:'calc(100vh - 64px)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
