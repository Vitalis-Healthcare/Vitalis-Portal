// app/api/assessments/schedules/route.ts — admin only
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { sendAssignmentEmail } from '@/lib/assessments/email'

const VALID_CADENCES   = [30, 60, 90, 120, 365]
const VALID_PLAN_TYPES = ['clinical', 'ep_annual'] as const
type PlanType = typeof VALID_PLAN_TYPES[number]

export async function POST(request: Request) {
  try {
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
    const { client_id, nurse_id, cadence_days, first_due_date, plan_type, is_initial } = body

    if (!client_id || !nurse_id || !cadence_days || !first_due_date) {
      return NextResponse.json(
        { error: 'client_id, nurse_id, cadence_days, and first_due_date are required' },
        { status: 400 }
      )
    }

    const resolvedPlanType: PlanType = VALID_PLAN_TYPES.includes(plan_type) ? plan_type : 'clinical'
    if (!VALID_CADENCES.includes(Number(cadence_days))) {
      return NextResponse.json({ error: 'cadence_days must be 30, 60, 90, 120, or 365' }, { status: 400 })
    }

    await db
      .from('assessment_schedules')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('client_id', client_id).eq('plan_type', resolvedPlanType).eq('is_active', true)

    const { data: sched, error: schedErr } = await db
      .from('assessment_schedules')
      .insert({ client_id, nurse_id, cadence_days: Number(cadence_days), plan_type: resolvedPlanType, created_by: user.id })
      .select().single()

    if (schedErr) return NextResponse.json({ error: schedErr.message }, { status: 500 })

    const { data: assessment, error: assessErr } = await db
      .from('assessments')
      .insert({
        client_id, schedule_id: sched.id, nurse_id,
        assessment_type: 'routine', scheduled_date: first_due_date,
        status: 'scheduled', is_initial: is_initial === true,
      })
      .select().single()

    if (assessErr) console.error('[schedules POST] assessment seed error:', assessErr.message)

    try {
      const [nurseRes, clientRes] = await Promise.all([
        db.from('profiles').select('full_name, email').eq('id', nurse_id).single(),
        db.from('assessment_clients').select('full_name, phone, address, city, state, zip').eq('id', client_id).single(),
      ])
      const nurse  = nurseRes.data
      const client = clientRes.data
      if (nurse?.email && client) {
        const addr = [client.address, client.city, client.state, client.zip].filter(Boolean).join(', ')
        await sendAssignmentEmail({
          nurseEmail: nurse.email, nurseName: nurse.full_name || nurse.email,
          clientName: client.full_name, clientPhone: client.phone ?? null,
          clientAddress: addr, cadenceDays: Number(cadence_days),
          nextDueDate: first_due_date, planType: resolvedPlanType,
        })
      }
    } catch (emailErr) {
      console.error('[schedules POST] assignment email failed (non-fatal):', emailErr)
    }

    return NextResponse.json({ data: { schedule: sched, assessment: assessment ?? null } })
  } catch (err) {
    console.error('[schedules POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
