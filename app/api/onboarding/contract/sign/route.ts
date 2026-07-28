// app/api/onboarding/contract/sign/route.ts
//
// PUBLIC endpoint — the candidate has no Supabase account. The raw token in the
// request body is the only credential, and it is checked by hash.
//
// Signing is one-way and idempotent-safe: a contract that already carries a
// signed_at is never overwritten. At the moment of signing we snapshot the
// fully rendered HTML into the row, so amending the template later cannot
// change what this person agreed to.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  CONTRACT_TEMPLATES,
  renderContractHtml,
  type ContractTemplateKey,
} from '@/lib/onboarding/contract-templates'
import {
  findContractByRawToken,
  isExpired,
  documentDate,
  clientIp,
} from '@/lib/onboarding/contract'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const TEAM_NOTIFY = 'team@vitalishealthcare.com'
const RESEND_KEY = process.env.RESEND_API_KEY

export async function POST(req: NextRequest) {
  let rawToken = ''
  let signatureName = ''
  let agreed = false
  try {
    const body = await req.json()
    rawToken = String(body.token ?? '').trim()
    signatureName = String(body.signature_name ?? '').trim().replace(/\s+/g, ' ')
    agreed = body.agreed === true
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!rawToken) return NextResponse.json({ error: 'This signing link is not valid.' }, { status: 400 })
  if (!agreed) return NextResponse.json({ error: 'Please confirm you have read the agreement.' }, { status: 400 })
  if (signatureName.length < 3) {
    return NextResponse.json({ error: 'Type your full name to sign.' }, { status: 400 })
  }
  if (signatureName.length > 120) {
    return NextResponse.json({ error: 'That name is too long.' }, { status: 400 })
  }

  const contract = await findContractByRawToken(rawToken)
  // Do not distinguish "unknown token" from "expired" to anyone unauthenticated.
  if (!contract) {
    return NextResponse.json({ error: 'This signing link is not valid or has expired.' }, { status: 404 })
  }
  if (contract.signed_at) {
    return NextResponse.json({ error: 'This agreement has already been signed.' }, { status: 409 })
  }
  if (isExpired(contract)) {
    return NextResponse.json({
      error: 'This signing link has expired. Contact the office and we will send a new one.',
    }, { status: 410 })
  }

  const template = CONTRACT_TEMPLATES[contract.template_key as ContractTemplateKey]
  if (!template) {
    console.error('[contract/sign] unknown template key:', contract.template_key)
    return NextResponse.json({ error: 'This agreement could not be prepared. Contact the office.' }, { status: 500 })
  }

  const svc = createServiceClient()
  const signedAtIso = new Date().toISOString()
  const ip = clientIp(req.headers)

  const renderedHtml = renderContractHtml({
    templateKey: template.key,
    candidateName: signatureName,
    payRate: contract.pay_rate,
    issuedDate: documentDate(signedAtIso),
    signed: { signedAt: documentDate(signedAtIso), ip },
  })

  // Conditional update: `.is('signed_at', null)` makes a double submit a no-op
  // rather than a second signature.
  try {
    const { data, error } = await svc
      .from('onb_contracts')
      .update({
        signed_at: signedAtIso,
        signature_name: signatureName,
        signature_ip: ip,
        rendered_html: renderedHtml,
      })
      .eq('id', contract.id)
      .is('signed_at', null)
      .select('id')
    if (error) {
      console.error('[contract/sign] update error:', error.message)
      return NextResponse.json({ error: 'Your signature could not be saved. Please try again.' }, { status: 500 })
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'This agreement has already been signed.' }, { status: 409 })
    }
  } catch (err) {
    console.error('[contract/sign] update threw:', err)
    return NextResponse.json({ error: 'Your signature could not be saved. Please try again.' }, { status: 500 })
  }

  // ── Notify the office (soft-fail) ─────────────────────────────────────────
  if (RESEND_KEY) {
    try {
      const { data: cand } = await svc
        .from('onb_candidates')
        .select('first_name, last_name')
        .eq('id', contract.candidate_id)
        .maybeSingle()
      const who = cand ? `${cand.first_name} ${cand.last_name}` : 'A candidate'
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [TEAM_NOTIFY],
          subject: `Agreement signed — ${who} (${template.docTitle})`,
          html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#1A2E44;padding:24px 32px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Agreement Signed</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <div style="display:inline-block;padding:4px 14px;background:#E6F6F4;border-radius:20px;font-size:11px;font-weight:700;color:#0E7C7B;letter-spacing:0.8px;margin-bottom:16px;">&#10003; SIGNED</div>
    <p style="color:#4A6070;font-size:14px;margin:0 0 16px;">
      <strong>${who}</strong> has signed the ${template.docTitle} agreement.
    </p>
    <div style="background:#F8FAFB;border-radius:8px;padding:10px 16px;font-size:13px;color:#4A6070;border:1px solid #E2E8F0;">
      Signed as: &ldquo;${signatureName}&rdquo;<br>
      Position: ${template.positionTitle}<br>
      Pay rate: ${contract.pay_rate}<br>
      Date: ${documentDate(signedAtIso)}
    </div>
  </div>
</div>
</body></html>`,
        }),
      })
    } catch (err) {
      // Never let a notification failure affect a saved signature.
      console.error('[contract/sign] notify threw:', err)
    }
  }

  return NextResponse.json({ success: true, signed_at: signedAtIso })
}
