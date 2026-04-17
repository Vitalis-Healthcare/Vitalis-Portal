// app/api/assessments/clients/route.ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from('assessment_clients')
      .select('id, full_name, status, payer_type, city, phone, created_at')
      .order('full_name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

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
    const {
      full_name, date_of_birth, phone, address, city, state,
      zip, payer_type, axiscare_id, notes,
      schedule, // optional: { nurse_id, cadence_days, first_due_date }
    } = body

    if (!full_name?.trim()) {
      return NextResponse.json({ error: 'full_name is required' }, { status: 400 })
    }

    // Insert client
    const { data: client, error: clientErr } = await db
      .from('assessment_clients')
      .insert({
        full_name:      full_name.trim(),
        date_of_birth:  date_of_birth || null,
        phone:          phone || null,
        address:        address || null,
        city:           city || null,
        state:          state || 'MD',
        zip:            zip || null,
        payer_type:     payer_type || null,
        axiscare_id:    axiscare_id || null,
        notes:          notes || null,
        created_by:     user.id,
      })
      .select()
      .single()

    if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 })

    // If schedule provided, create it + seed first assessment
    if (schedule?.nurse_id && schedule?.first_due_date) {
      const { data: sched, error: schedErr } = await db
        .from('assessment_schedules')
        .insert({
          client_id:    client.id,
          nurse_id:     schedule.nurse_id,
          cadence_days: schedule.cadence_days ?? 120,
          created_by:   user.id,
        })
        .select()
        .single()

      if (schedErr) {
        // Client was created; log but don't fail the whole request
        console.error('[assessments/clients POST] schedule insert error:', schedErr.message)
        return NextResponse.json({ data: client, scheduleError: schedErr.message })
      }

      // Seed first assessment row
      const { error: assessErr } = await db
        .from('assessments')
        .insert({
          client_id:       client.id,
          schedule_id:     sched.id,
          nurse_id:        schedule.nurse_id,
          assessment_type: 'routine',
          scheduled_date:  schedule.first_due_date,
          status:          'scheduled',
        })

      if (assessErr) {
        console.error('[assessments/clients POST] assessment seed error:', assessErr.message)
      }
    }

    return NextResponse.json({ data: client })
  } catch (err) {
    console.error('[assessments/clients POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
