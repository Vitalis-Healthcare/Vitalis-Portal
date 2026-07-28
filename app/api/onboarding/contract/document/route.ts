// app/api/onboarding/contract/document/route.ts
//
// Serves the agreement as a standalone HTML document, for the on-page preview
// frame and for Print -> Save as PDF. The repo has no react-pdf; branded print
// output is HTML plus window.print() (pitfalls #12).
//
// PUBLIC, token-gated. Once signed, this returns the stored snapshot rather
// than re-rendering, so the signed copy is byte-for-byte what was agreed to
// even if the template is later amended.

import { NextRequest } from 'next/server'
import {
  CONTRACT_TEMPLATES,
  renderContractHtml,
  type ContractTemplateKey,
} from '@/lib/onboarding/contract-templates'
import { findContractByRawToken, isExpired, documentDate } from '@/lib/onboarding/contract'

function plain(message: string, status: number): Response {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vitalis Healthcare Services</title></head>
<body style="margin:0;padding:48px 24px;font-family:'DM Sans',Arial,sans-serif;color:#333B31;text-align:center;">
<p style="font-size:15px;">${message}</p>
</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('token') || ''
  const contract = await findContractByRawToken(raw)

  if (!contract) return plain('This link is not valid or has expired.', 404)

  // A signed agreement stays readable after the token window closes — the
  // person should always be able to retrieve what they signed.
  if (!contract.signed_at && isExpired(contract)) {
    return plain('This link has expired. Contact the office and we will send a new one.', 410)
  }

  if (contract.signed_at && contract.rendered_html) {
    return new Response(contract.rendered_html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }

  const template = CONTRACT_TEMPLATES[contract.template_key as ContractTemplateKey]
  if (!template) return plain('This agreement could not be prepared. Please contact the office.', 500)

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
