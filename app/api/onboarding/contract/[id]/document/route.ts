// app/api/onboarding/contract/[id]/document/route.ts
//
// Staff view of an agreement by contract id. Staff never hold the raw signing
// token (only its hash is stored), so without this route the office could never
// read back what a candidate signed.
//
// Dynamic route -> params must be awaited (pitfalls #5).

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  CONTRACT_TEMPLATES,
  renderContractHtml,
  type ContractTemplateKey,
} from '@/lib/onboarding/contract-templates'
import { documentDate } from '@/lib/onboarding/contract'

function plain(message: string, status: number): Response {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Vitalis Portal</title></head>
<body style="margin:0;padding:48px 24px;font-family:Arial,sans-serif;color:#333B31;text-align:center;">
<p style="font-size:15px;">${message}</p>
</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return plain('Sign in to view this agreement.', 401)

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) {
    return plain('Staff access required.', 403)
  }

  const { data: contract } = await svc
    .from('onb_contracts')
    .select('template_key, pay_rate, signed_at, signature_name, rendered_html')
    .eq('id', id)
    .maybeSingle()

  if (!contract) return plain('Agreement not found.', 404)

  if (contract.signed_at && contract.rendered_html) {
    return new Response(contract.rendered_html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }

  const template = CONTRACT_TEMPLATES[contract.template_key as ContractTemplateKey]
  if (!template) return plain('This agreement could not be prepared.', 500)

  const html = renderContractHtml({
    templateKey: template.key,
    candidateName: contract.signature_name || '',
    payRate: contract.pay_rate,
    issuedDate: documentDate(),
  })

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
