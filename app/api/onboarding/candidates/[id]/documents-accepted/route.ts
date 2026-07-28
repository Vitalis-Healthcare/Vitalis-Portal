// app/api/onboarding/candidates/[id]/documents-accepted/route.ts
//
// The coordinator's "documents reviewed and accepted" sign-off.
//
// This exists because the requirement is a HUMAN JUDGEMENT — "after the care
// coordinator is satisfied" — and no amount of counting files can derive it.
// v0.6.21 added the machine-checkable half (photo ID, CPR, TB must be present).
// This is the other half: someone looked at them and said yes, and the record
// says who and when.
//
// Dynamic route -> params must be awaited (pitfall #5).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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

// ── POST: record the sign-off ───────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await staffGate()
  if (!g.ok) return g.res

  let note = ''
  try {
    const body = await req.json()
    note = typeof body.note === 'string' ? body.note.slice(0, 1000).trim() : ''
  } catch {
    note = ''
  }

  const svc = createServiceClient()

  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  // Signing off before the application is in would be signing off on nothing.
  if (!(cand.status === 'application_submitted' || cand.status === 'in_review')) {
    return NextResponse.json({
      error: 'Documents can only be accepted once the application is submitted and under review.',
    }, { status: 409 })
  }

  const nowIso = new Date().toISOString()

  try {
    const { error } = await svc
      .from('onb_candidates')
      .update({
        documents_accepted_at: nowIso,
        documents_accepted_by: g.userId,
        documents_accepted_note: note || null,
        updated_at: nowIso,
      })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true, accepted_at: nowIso })
}

// ── DELETE: withdraw it ─────────────────────────────────────────────────────
//
// Withdrawing is a real action, not a mistake-fixer: if the coordinator decides
// the file is not adequate after all, she needs a way to reclose the gate
// without waiting for a Request-documents round trip.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await staffGate()
  if (!g.ok) return g.res

  const svc = createServiceClient()
  const nowIso = new Date().toISOString()

  try {
    const { error } = await svc
      .from('onb_candidates')
      .update({
        documents_accepted_at: null,
        documents_accepted_by: null,
        documents_accepted_note: null,
        updated_at: nowIso,
      })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
