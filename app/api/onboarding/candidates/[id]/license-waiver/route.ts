// app/api/onboarding/candidates/[id]/license-waiver/route.ts
//
// Records that a candidate is an unlicensed aide, so MBON verification is not
// required for them.
//
// The waiver is REFUSED when the candidate declared a clinical credential on
// their application. Someone who told us they are a CNA must not be able to
// pass through as unlicensed — that is the whole point of the check, and it is
// enforced here rather than only in the interface.
//
// Dynamic route -> params must be awaited (pitfalls #5).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isLicensedCredential } from '@/lib/onboarding/gates'

export const dynamic = 'force-dynamic'

async function staffGate(): Promise<{ ok: true; userId: string } | { ok: false; res: NextResponse }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, res: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role
    if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) {
      return { ok: false, res: NextResponse.json({ error: 'Staff access required' }, { status: 403 }) }
    }
    return { ok: true, userId: user.id }
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Auth check failed' }, { status: 500 }) }
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await staffGate()
  if (!g.ok) return g.res

  let reason = ''
  try {
    const body = await req.json()
    reason = String(body.reason ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (reason.length < 5) {
    return NextResponse.json({
      error: 'Give a short reason for the waiver — it forms part of the credentialing record.',
    }, { status: 400 })
  }
  if (reason.length > 500) {
    return NextResponse.json({ error: 'That reason is too long.' }, { status: 400 })
  }

  const svc = createServiceClient()

  const { data: cand } = await svc
    .from('onb_candidates').select('id').eq('id', id).maybeSingle()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  // The refusal that matters.
  let credentialType: string | null = null
  try {
    const { data } = await svc
      .from('onb_applications').select('credential_type').eq('candidate_id', id).maybeSingle()
    credentialType = data?.credential_type ?? null
  } catch {
    credentialType = null
  }

  if (isLicensedCredential(credentialType)) {
    return NextResponse.json({
      error: `This candidate declared ${credentialType} on their application, so the license cannot be waived. Upload the MBON verification, or correct the application if that credential was entered in error.`,
      code: 'credential_declared',
      credential_type: credentialType,
    }, { status: 409 })
  }

  try {
    const { error } = await svc
      .from('onb_candidates')
      .update({
        license_waived_at: new Date().toISOString(),
        license_waived_by: g.userId,
        license_waiver_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true, waived: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await staffGate()
  if (!g.ok) return g.res

  const svc = createServiceClient()
  try {
    const { error } = await svc
      .from('onb_candidates')
      .update({
        license_waived_at: null,
        license_waived_by: null,
        license_waiver_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true, waived: false })
}
