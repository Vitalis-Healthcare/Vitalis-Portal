import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import ReportClient from './ReportClient'

export default async function ReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  return <ReportClient userName={profile?.full_name || 'Team'} />
}
