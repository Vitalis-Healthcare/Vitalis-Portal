// app/(dashboard)/references/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import ReferencesClient from './ReferencesClient'

export default async function ReferencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()

  const isAdmin = ['admin', 'supervisor', 'staff'].includes(profile?.role || '')

  // Load references — own for caregiver, all for admin
  let refs: any[] = []
  if (isAdmin) {
    const { data } = await svc
      .from('caregiver_references')
      .select('*, caregiver:caregiver_id(full_name, id), submission:reference_submissions(id, submitted_at, overall_recommendation, rating_quality)')
      .order('created_at', { ascending: false })
    refs = data || []
  } else {
    const { data } = await svc
      .from('caregiver_references')
      .select('*, submission:reference_submissions(id, submitted_at)')
      .eq('caregiver_id', user.id)
      .order('slot')
    refs = data || []
  }

  return (
    <ReferencesClient
      refs={refs}
      userId={user.id}
      fullName={profile?.full_name || ''}
      isAdmin={isAdmin}
    />
  )
}
