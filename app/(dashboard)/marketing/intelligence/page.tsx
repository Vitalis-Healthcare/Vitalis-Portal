import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import IntelligenceClient from './IntelligenceClient'

export default async function IntelligencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  // All computation done in the API route — client fetches on load
  return <IntelligenceClient />
}
