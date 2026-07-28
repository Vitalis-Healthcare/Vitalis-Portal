// app/api/assessments/clients/ignore/route.ts
//
// The permanent "do not import" list for AxisCare clients.
//
//   POST   { axiscare_id, full_name?, reason? }  -> ignore (idempotent upsert)
//   DELETE { axiscare_id }                       -> restore
//
// Ignoring is a decision, not a filter: once a client is on this list the
// import screen stops surfacing them and the import route refuses to touch
// them, so nobody has to re-make the same judgement every sync.
//
// Admin / supervisor only. No middleware in this repo — gate in-handler.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type Gate =
  | { ok: false; res: NextResponse }
  | { ok: true; userId: string }

async function gate(): Promise<Gate> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }
    const svc = createServiceClient()
    const { data: profile } = await svc
      .from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'supervisor'].includes(profile?.role || '')) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    }
    return { ok: true, userId: user.id }
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Auth check failed' }, { status: 500 }) }
  }
}

export async function POST(req: NextRequest) {
  const g = await gate()
  if (!g.ok) return g.res

  let axiscareId = ''
  let fullName: string | null = null
  let reason: string | null = null

  try {
    const body = await req.json()
    axiscareId = String(body.axiscare_id ?? '').trim()
    fullName = body.full_name ? String(body.full_name).trim() : null
    reason = body.reason ? String(body.reason).trim() : null
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!axiscareId) {
    return NextResponse.json({ error: 'axiscare_id is required' }, { status: 400 })
  }

  const svc = createServiceClient()

  try {
    const { error } = await svc
      .from('assessment_client_ignores')
      .upsert({
        axiscare_id: axiscareId,
        full_name: fullName,
        reason: reason,
        ignored_by: g.userId,
        ignored_at: new Date().toISOString(),
      }, { onConflict: 'axiscare_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true, axiscare_id: axiscareId, ignored: true })
}

export async function DELETE(req: NextRequest) {
  const g = await gate()
  if (!g.ok) return g.res

  let axiscareId = ''
  try {
    const body = await req.json()
    axiscareId = String(body.axiscare_id ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!axiscareId) {
    return NextResponse.json({ error: 'axiscare_id is required' }, { status: 400 })
  }

  const svc = createServiceClient()

  try {
    const { error } = await svc
      .from('assessment_client_ignores')
      .delete()
      .eq('axiscare_id', axiscareId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true, axiscare_id: axiscareId, ignored: false })
}
