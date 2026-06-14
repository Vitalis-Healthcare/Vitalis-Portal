// app/api/onboarding/candidates/[id]/document/route.ts
// Staff-only. Mints a short-lived signed URL for a candidate's private document
// and redirects to it. Re-minted on every click, so links never go stale and
// the bucket stays private. Auth happens inside the handler (no middleware).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createDocumentSignedUrl } from '@/lib/onboarding/documents'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // ── Staff gate (browser navigation carries the session cookie) ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }

  const docId = req.nextUrl.searchParams.get('doc') || ''
  if (!docId) return NextResponse.json({ error: 'Missing document id.' }, { status: 400 })

  const { data: doc } = await svc
    .from('onb_documents')
    .select('storage_path, candidate_id')
    .eq('id', docId)
    .single()
  if (!doc || doc.candidate_id !== id) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }

  const signed = await createDocumentSignedUrl(svc, doc.storage_path, 300)
  if (!signed) return NextResponse.json({ error: 'Could not open the document.' }, { status: 500 })

  return NextResponse.redirect(signed)
}
