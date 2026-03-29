import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { lead_id, activity_type, content, outcome, next_follow_up } = await req.json()
  if (!lead_id || !content?.trim()) {
    return NextResponse.json({ error: 'lead_id and content required' }, { status: 400 })
  }

  const { data: activity, error } = await svc.from('lead_activities').insert({
    lead_id, created_by: user.id,
    activity_type: activity_type || 'note',
    content: content.trim(),
    outcome: outcome || null,
    next_follow_up: next_follow_up || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If follow-up date set, update lead's updated_at to surface it
  if (next_follow_up) {
    await svc.from('leads').update({ updated_at: new Date().toISOString() }).eq('id', lead_id)
  }

  return NextResponse.json({ activity })
}
