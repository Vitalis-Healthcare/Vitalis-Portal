import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  // Only admin can archive/restore/hard-delete leads (not supervisor)
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Only administrators can delete leads.' }, { status: 403 })
  }

  const { id, action } = await req.json()
  if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })

  // ── v0.6.38: the archive is a TIMESTAMP (archived_at), not a status. ──
  // Before the split, archiving overwrote leads.status with 'archived',
  // destroying the lead's real state. Now stage and status survive the
  // archive intact, and restore is a clean reversal.
  if (action === 'archive') {
    const { error } = await svc.from('leads').update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await svc.from('lead_activities').insert({
      lead_id: id, created_by: user.id,
      activity_type: 'status_change',
      content: 'Lead archived by administrator.',
    })
    return NextResponse.json({ success: true })
  }

  if (action === 'restore') {
    const { error } = await svc.from('leads').update({
      archived_at: null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await svc.from('lead_activities').insert({
      lead_id: id, created_by: user.id,
      activity_type: 'status_change',
      content: 'Lead restored from the archive.',
    })
    return NextResponse.json({ success: true })
  }

  // Hard delete — cascades to lead_activities
  const { error } = await svc.from('leads').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
