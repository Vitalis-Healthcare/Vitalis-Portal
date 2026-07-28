// app/(dashboard)/candidates/board/page.tsx
// Server component: the same staff gate as the candidates list, then one batch
// load of the whole board. All interactivity lives in BoardClient.
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { loadTrackBoard, summarise } from '@/lib/onboarding/track-board'
import BoardClient from './BoardClient'

export const dynamic = 'force-dynamic'

export default async function TrackBoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  const isStaff = role === 'admin' || role === 'supervisor' || role === 'staff'
  if (!isStaff) redirect('/dashboard')

  const rows = await loadTrackBoard()

  return <BoardClient rows={rows} summary={summarise(rows)} />
}
