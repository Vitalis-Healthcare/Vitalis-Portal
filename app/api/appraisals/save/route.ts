// app/api/appraisals/save/route.ts
// Admin creates or updates an HHA performance appraisal.
// Status stays 'draft' until explicitly sent.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(viewer?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { caregiver_id, appraisal_period, comments, scores, appraisalId } = body

  if (!caregiver_id) return NextResponse.json({ error: 'caregiver_id required' }, { status: 400 })

  const payload = {
    caregiver_id,
    appraiser_id:   user.id,
    appraisal_period: appraisal_period || null,
    comments:         comments || null,
    updated_at:       new Date().toISOString(),
    ...scores,
  }

  let result
  if (appraisalId) {
    const { data, error } = await svc.from('appraisals').update(payload).eq('id', appraisalId).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    const { data, error } = await svc.from('appraisals').insert({ ...payload, status: 'draft' }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  return NextResponse.json({ success: true, appraisal: result })
}
