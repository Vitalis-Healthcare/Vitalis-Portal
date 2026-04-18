// app/api/assessments/schedules/[id]/route.ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { sendAssignmentEmail } from '@/lib/assessments/email'

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
    if ('nurse_id' in body && body.nurse_id)      patch.nurse_id     = body.nurse_id
    if ('cadence_days' in body && body.cadence_days) {
      if (![30, 60, 90, 120].includes(Number(body.cadence_days))) {
        return NextResponse.json({ error: 'cadence_days must be 30, 60, 90, or 120' }, { status: 400 })
      }
      patch.cadence_days = Number(body.cadence_days)
    }

    const { data, error } = await db
      .from('assessment_schedules')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If nurse changed, cascade to all future assessments for this schedule
    if (patch.nurse_id) {
      await db
        .from('assessments')
        .update({ nurse_id: patch.nurse_id, updated_at: new Date().toISOString() })
        .eq('schedule_id', id)
        .in('status', ['scheduled', 'overdue'])

      // Soft-fail: send reassignment email — never blocks the response
      try {
        const schedData = data as Record<string, unknown>
        const newNurseId  = String(patch.nurse_id)
        const clientId    = String(schedData.client_id ?? '')
        const cadenceDays = Number(schedData.cadence_days ?? 30)

        const [nurseRes, clientRes, nextAssRes] = await Promise.all([
          db.from('profiles')
            .select('full_name, email')
            .eq('id', newNurseId)
            .single(),
          db.from('assessment_clients')
            .select('full_name, address, city, state, zip')
            .eq('id', clientId)
            .single(),
          db.from('assessments')
            .select('scheduled_date')
            .eq('schedule_id', id)
            .in('status', ['scheduled', 'overdue'])
            .order('scheduled_date', { ascending: true })
            .limit(1)
            .maybeSingle(),
        ])

        const nurse  = nurseRes.data
        const client = clientRes.data
        if (nurse?.email && client) {
          const addr = [client.address, client.city, client.state, client.zip]
            .filter(Boolean)
            .join(', ')
          await sendAssignmentEmail({
            nurseEmail:     nurse.email,
            nurseName:      nurse.full_name || nurse.email,
            clientName:     client.full_name,
            clientAddress:  addr,
            cadenceDays,
            nextDueDate:    nextAssRes.data?.scheduled_date ?? null,
            isReassignment: true,
          })
        }
      } catch (emailErr) {
        console.error('[schedules PATCH] reassignment email failed (non-fatal):', emailErr)
      }
    }

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
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

    // Soft-deactivate, don't hard-delete (preserve history)
    const { data, error } = await db
      .from('assessment_schedules')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
