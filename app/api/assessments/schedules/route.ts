// app/api/assessments/schedules/route.ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
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
    const { client_id, nurse_id, cadence_days, first_due_date } = body

    if (!client_id || !nurse_id || !cadence_days || !first_due_date) {
      return NextResponse.json(
        { error: 'client_id, nurse_id, cadence_days, and first_due_date are required' },
        { status: 400 }
      )
    }

    if (![30, 60, 90, 120].includes(Number(cadence_days))) {
      return NextResponse.json({ error: 'cadence_days must be 30, 60, 90, or 120' }, { status: 400 })
    }

    // Deactivate any existing active schedule for this client
    await db
      .from('assessment_schedules')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('client_id', client_id)
      .eq('is_active', true)

    // Create new schedule
    const { data: sched, error: schedErr } = await db
      .from('assessment_schedules')
      .insert({
        client_id,
        nurse_id,
        cadence_days: Number(cadence_days),
        created_by: user.id,
      })
      .select()
      .single()

    if (schedErr) return NextResponse.json({ error: schedErr.message }, { status: 500 })

    // Seed first assessment
    const { data: assessment, error: assessErr } = await db
      .from('assessments')
      .insert({
        client_id,
        schedule_id:     sched.id,
        nurse_id,
        assessment_type: 'routine',
        scheduled_date:  first_due_date,
        status:          'scheduled',
      })
      .select()
      .single()

    if (assessErr) {
      console.error('[schedules POST] assessment seed error:', assessErr.message)
    }

    return NextResponse.json({ data: { schedule: sched, assessment: assessment ?? null } })
  } catch (err) {
    console.error('[schedules POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
