// app/api/assessments/[id]/complete/route.ts — admin only
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export async function POST(
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
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { notes } = body

    const { data: assessment, error: fetchErr } = await db
      .from('assessments')
      .select('id, client_id, schedule_id, nurse_id, scheduled_date, status, triggers_reset, assessment_type')
      .eq('id', id).single()

    if (fetchErr || !assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    if (!['scheduled', 'overdue'].includes(assessment.status)) {
      return NextResponse.json({ error: 'Assessment is not pending' }, { status: 400 })
    }

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const { data: schedule } = await db
      .from('assessment_schedules').select('id, cadence_days, nurse_id')
      .eq('id', assessment.schedule_id ?? '').maybeSingle()

    const cadenceDays = schedule?.cadence_days ?? 120

    const { data: completed, error: completeErr } = await db
      .from('assessments')
      .update({ status: 'completed', completed_date: todayStr, completed_by: user.id, notes: notes || null, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (completeErr) return NextResponse.json({ error: completeErr.message }, { status: 500 })

    const baseDate = assessment.triggers_reset ? todayStr : assessment.scheduled_date
    const nextDue  = addDays(baseDate, cadenceDays)

    const { data: nextAssessment, error: nextErr } = await db
      .from('assessments')
      .insert({
        client_id: assessment.client_id, schedule_id: assessment.schedule_id,
        nurse_id: schedule?.nurse_id ?? assessment.nurse_id,
        assessment_type: 'routine', scheduled_date: nextDue, status: 'scheduled',
      })
      .select().single()

    if (nextErr) console.error('[assessments/complete] next seed error:', nextErr.message)

    return NextResponse.json({ data: { completed, nextAssessment: nextAssessment ?? null, nextDue } })
  } catch (err) {
    console.error('[assessments/complete POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
