// app/(dashboard)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import LayoutShell from '@/components/layout/LayoutShell'
import { Profile } from '@/types'
import CjisOverdueBanner from '@/components/onboarding/CjisOverdueBanner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'caregiver'

  return (
    <LayoutShell profile={profile as Profile} role={role}>
      {/* Renders nothing until a CJIS result is 8 days past its expected
          date. From then it is unavoidable, on every page, for every member
          of staff who could resolve it. */}
      <CjisOverdueBanner role={role} />
      {children}
    </LayoutShell>
  )
}
