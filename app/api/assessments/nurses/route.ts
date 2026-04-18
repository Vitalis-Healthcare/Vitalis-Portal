// app/api/assessments/nurses/route.ts
// Returns profiles with can_be_assigned = true — sole criterion for the nurse dropdown.
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createServiceClient()
    const { data, error } = await db
      .from('profiles')
      .select('id, full_name, role')
      .eq('can_be_assigned', true)
      .eq('status', 'active')
      .order('full_name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
