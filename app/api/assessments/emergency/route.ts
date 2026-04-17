// app/api/assessments/emergency/route.ts
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
      return NextResponse.json({ error: 'Admin or Supervisor access required' }, { status: 403 })
    }

    const body = await request.json()
    const { client_id, schedule_id, nurse_id, notes } = body

    if (!client_id || !nurse_id) {
      return NextResponse.json({ error: 'client_id and nurse_id are required' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const { data, error } = await db
      .from('assessments')
      .insert({
        client_id,
        schedule_id:     schedule_id || null,
        nurse_id,
        assessment_type: 'emergency',
        scheduled_date:  todayStr,
        status:          'scheduled',
        triggers_reset:  true,
        notes:           notes || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[assessments/emergency POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
