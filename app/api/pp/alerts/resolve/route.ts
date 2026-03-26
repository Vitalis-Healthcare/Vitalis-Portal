import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { alertId } = await req.json()
  await supabase.from('pp_regulatory_alerts').update({ status: 'resolved', resolved_by: user.id, resolved_at: new Date().toISOString() }).eq('id', alertId)
  return NextResponse.json({ ok: true })
}
