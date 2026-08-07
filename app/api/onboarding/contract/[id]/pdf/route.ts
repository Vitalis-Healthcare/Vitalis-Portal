// app/api/onboarding/contract/[id]/pdf/route.ts
//
// Staff-only. Streams a signed agreement as a PDF for filing.
//
// This route imports the Chromium renderer, so the ~76 MB bundle lands here
// and in the sign route alone. Nothing else in the portal pays for it.
//
// Node runtime and a raised timeout are not optional: Chromium cannot start on
// the Edge runtime, and a cold start plus render can exceed the default limit.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { renderContractPdf, pdfFileName } from '@/lib/onboarding/contract-pdf'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor', 'staff'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }

  const { data: contract } = await svc
    .from('onb_contracts')
    .select('id, signed_at, signature_name, rendered_html')
    .eq('id', id)
    .maybeSingle()
  if (!contract) return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 })
  if (!contract.signed_at || !contract.rendered_html) {
    return NextResponse.json({
      error: 'This agreement has not been signed yet, so there is nothing to file.',
    }, { status: 409 })
  }

  const result = await renderContractPdf(contract.rendered_html)
  if (!result.ok || !result.pdf) {
    // The signed HTML is always available as a fallback — say so rather than
    // leaving a coordinator with a dead button and no route forward.
    return NextResponse.json({
      error: 'The PDF could not be produced. The signed agreement is still viewable and printable from the candidate page.',
      detail: result.error,
    }, { status: 502 })
  }

  const filename = pdfFileName(contract.signature_name || '', contract.signed_at)
  return new NextResponse(new Uint8Array(result.pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
