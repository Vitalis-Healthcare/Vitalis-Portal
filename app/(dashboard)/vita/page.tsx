import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import VitaChat from '@/components/vita/VitaChat'
import { buildVitaSnapshot } from '@/lib/vita/context'

export default async function VitaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const ppRole =
    profile?.role === 'admin'      ? 'Administrator' :
    profile?.role === 'supervisor' ? 'Director of Nursing' :
    profile?.role === 'caregiver'  ? 'CNA' : 'All Staff'

  // Build snapshot for personalised suggestions
  const snapshot = await buildVitaSnapshot(user.id, svc)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <VitaChat
        userId={user.id}
        userRole={profile?.role || 'caregiver'}
        ppRole={ppRole}
        userName={profile?.full_name || 'there'}
        snapshot={snapshot}
      />
    </div>
  )
}
