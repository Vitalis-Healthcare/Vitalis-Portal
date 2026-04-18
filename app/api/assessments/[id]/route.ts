// app/api/assessments/[id]/route.ts
// PATCH — update a pending assessment's scheduled_date and/or is_initial flag.
// Only applies to assessments in 'scheduled' or 'overdue' status.
// Admin and supervisor only.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createServiceClient()
    const { data: profile } = await db
      .from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if ('scheduled_date' in body && body.scheduled_date) {
      patch.scheduled_date = body.scheduled_date
    }
    if ('is_initial' in body && typeof body.is_initial === 'boolean') {
      patch.is_initial = body.is_initial
    }

    if (Object.keys(patch).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Safety: only allow updating pending assessments
    const { data, error } = await db
      .from('assessments')
      .update(patch)
      .eq('id', id)
      .in('status', ['scheduled', 'overdue'])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Assessment not found or not reschedulable' }, { status: 404 })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[assessments PATCH]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
