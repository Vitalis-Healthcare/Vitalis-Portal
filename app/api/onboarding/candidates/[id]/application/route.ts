// app/api/onboarding/candidates/[id]/application/route.ts
// Staff-only. Lets a coordinator correct a candidate's application before it is
// pushed to AxisCare. Updates onb_applications by candidate_id using the SAME
// field sanitizer as the candidate-facing route (buildApplicationRow). Does NOT
// change candidate status and does NOT email anyone.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildApplicationRow } from '@/lib/onboarding/sanitize'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }

  const { data: cand } = await svc.from('onb_candidates').select('id').eq('id', id).maybeSingle()
  if (!cand) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const application = (body.application || {}) as Record<string, unknown>
  const fields = buildApplicationRow(application)
  const nowIso = new Date().toISOString()

  // Upsert so a staff edit works even if (rarely) no draft row exists yet.
  const { error } = await svc
    .from('onb_applications')
    .upsert({ candidate_id: cand.id, ...fields, updated_at: nowIso }, { onConflict: 'candidate_id' })

  if (error) {
    console.error('[staff-application-edit] update failed:', error.message)
    return NextResponse.json({ error: 'Could not save changes. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
