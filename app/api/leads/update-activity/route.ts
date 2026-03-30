import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, activity_type, content, outcome, next_follow_up } = await req.json()
  if (!id || !content?.trim()) return NextResponse.json({ error: 'ID and content required' }, { status: 400 })
  const { data, error } = await svc.from('lead_activities')
    .update({ activity_type, content: content.trim(), outcome: outcome || null, next_follow_up: next_follow_up || null })
    .eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activity: data })
}
