import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { alertId } = await req.json()
  await svc.from('pp_regulatory_alerts').update({ status: 'dismissed' }).eq('id', alertId)
  return NextResponse.json({ ok: true })
}
