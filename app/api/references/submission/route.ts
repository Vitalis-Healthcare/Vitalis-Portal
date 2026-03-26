// app/api/references/submission/route.ts
// Returns full reference submission data for a given reference ID.
// Admin/supervisor/staff only.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor', 'staff'].includes(viewer?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const referenceId = searchParams.get('referenceId')
  if (!referenceId) return NextResponse.json({ error: 'referenceId required' }, { status: 400 })

  const { data: submission } = await svc
    .from('reference_submissions')
    .select('*')
    .eq('reference_id', referenceId)
    .single()

  const { data: ref } = await svc
    .from('caregiver_references')
    .select('reference_type, referee_name, referee_email, slot')
    .eq('id', referenceId)
    .single()

  return NextResponse.json({ submission, reference: ref })
}
