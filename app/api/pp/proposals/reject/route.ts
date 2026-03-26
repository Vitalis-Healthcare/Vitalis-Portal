import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { proposalId } = await req.json()
  await svc.from('pp_edit_proposals').update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', proposalId)
  return NextResponse.json({ ok: true })
}
