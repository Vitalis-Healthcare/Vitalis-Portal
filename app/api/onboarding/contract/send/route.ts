// app/api/onboarding/contract/send/route.ts
//
// Staff issue a contract to a candidate and email them a signing link.
//
// Re-sending supersedes: any unsigned contract for that candidate has its token
// expired, so an older link in someone's inbox stops working. An ALREADY SIGNED
// contract is never touched — a signed agreement is a record, not a draft.
//
// No middleware in this repo, so the staff gate runs in-handler (pitfalls #25).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  CONTRACT_TEMPLATES,
  CONTRACT_TEMPLATE_VERSION,
  type ContractTemplateKey,
} from '@/lib/onboarding/contract-templates'
import { newRawToken, hashToken, tokenExpiry } from '@/lib/onboarding/contract'
import { loadGateInput } from '@/lib/onboarding/gate-data'
import { evaluateContractGate, blockerSummary } from '@/lib/onboarding/gates'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const TEAM_NOTIFY = 'team@vitalishealthcare.com'
const RESEND_KEY = process.env.RESEND_API_KEY

function buildEmail(opts: { firstName: string; docTitle: string; link: string }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#1A2E44,#0E4A4A);padding:26px 32px;border-radius:12px 12px 0 0;">
    <div style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;border-radius:9px;background:linear-gradient(135deg,#0E7C7B,#F4A261);color:#fff;font-weight:800;font-size:15px;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:19px;font-weight:800;">Your Vitalis agreement is ready to sign</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <p style="color:#4A6070;font-size:14px;margin:0 0 16px;line-height:1.65;">
      Hello ${opts.firstName},
    </p>
    <p style="color:#4A6070;font-size:14px;margin:0 0 20px;line-height:1.65;">
      Please review your <strong>${opts.docTitle}</strong> job description and terms of
      engagement, then sign at the bottom of the page. Take your time reading it &mdash;
      it sets out what the role involves and the attendance terms you are agreeing to.
    </p>
    <div style="text-align:center;margin:26px 0;">
      <a href="${opts.link}" style="display:inline-block;padding:13px 30px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;">Review and sign</a>
    </div>
    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#8FA0B0;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Button not working? Copy this link</div>
      <div style="font-size:11px;color:#4A6070;word-break:break-all;line-height:1.6;">${opts.link}</div>
    </div>
    <p style="color:#94A3B8;font-size:12px;margin:0;line-height:1.6;">
      This link is personal to you and expires in 21 days. If anything in the
      document looks wrong, reply to this email before signing.
    </p>
  </div>
  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
    Vitalis Healthcare Services, LLC &middot; 8757 Georgia Avenue, Suite 440 &middot; Silver Spring, MD 20910<br>
    This is an automated message &mdash; please do not reply directly.
  </div>
</div>
</body></html>`
}

export async function POST(req: NextRequest) {
  // ── Staff gate ────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  let candidateId = ''
  let templateKey = '' as ContractTemplateKey
  let payRate = ''
  try {
    const body = await req.json()
    candidateId = String(body.candidate_id ?? '').trim()
    templateKey = String(body.template_key ?? '').trim() as ContractTemplateKey
    payRate = String(body.pay_rate ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!candidateId) return NextResponse.json({ error: 'A candidate is required.' }, { status: 400 })
  const template = CONTRACT_TEMPLATES[templateKey]
  if (!template) return NextResponse.json({ error: 'Choose a position for this agreement.' }, { status: 400 })
  if (!payRate) return NextResponse.json({ error: 'Enter the pay rate.' }, { status: 400 })
  if (payRate.length > 60) return NextResponse.json({ error: 'That pay rate looks too long.' }, { status: 400 })

  // ── Candidate ─────────────────────────────────────────────────────────────
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, email')
    .eq('id', candidateId)
    .maybeSingle()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  // ── Credentialing gate ────────────────────────────────────────────────────
  // Enforced here, not only in the interface. A disabled button is a hint; this
  // is the rule. Blockers are returned in full so the page can say exactly what
  // is missing rather than just refusing.
  const gateInput = await loadGateInput(candidateId)
  if (!gateInput) {
    return NextResponse.json({ error: 'Could not check credentialing status.' }, { status: 500 })
  }
  const gate = evaluateContractGate(gateInput)
  if (!gate.ok) {
    console.warn('[contract/send] blocked for', candidateId, '-', blockerSummary(gate.blockers))
    return NextResponse.json({
      error: 'Credentialing is not complete for this candidate.',
      code: 'gate_blocked',
      blockers: gate.blockers,
    }, { status: 409 })
  }

  // ── Supersede any unsigned contract, never a signed one ───────────────────
  try {
    const { error } = await svc
      .from('onb_contracts')
      .update({ token_expires_at: new Date().toISOString() })
      .eq('candidate_id', candidateId)
      .is('signed_at', null)
    if (error) {
      console.error('[contract/send] supersede error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } catch (err) {
    console.error('[contract/send] supersede threw:', err)
    return NextResponse.json({ error: 'Could not supersede the previous agreement.' }, { status: 500 })
  }

  // ── Issue ─────────────────────────────────────────────────────────────────
  const rawToken = newRawToken()
  let contractId = ''
  try {
    const { data, error } = await svc
      .from('onb_contracts')
      .insert({
        candidate_id: candidateId,
        template_key: template.key,
        template_version: CONTRACT_TEMPLATE_VERSION,
        position_title: template.positionTitle,
        pay_rate: payRate,
        sign_token: hashToken(rawToken),
        token_expires_at: tokenExpiry(),
        sent_by: user.id,
      })
      .select('id')
      .single()
    if (error || !data) {
      console.error('[contract/send] insert error:', error?.message)
      return NextResponse.json({ error: error?.message || 'Could not create the agreement.' }, { status: 500 })
    }
    contractId = data.id
  } catch (err) {
    console.error('[contract/send] insert threw:', err)
    return NextResponse.json({ error: 'Could not create the agreement.' }, { status: 500 })
  }

  // ── Email (soft-fail: the record is saved first) ──────────────────────────
  const link = `${PORTAL_URL}/onboarding/contract?token=${rawToken}`
  let emailed = false
  let emailError: string | undefined

  if (!RESEND_KEY) {
    emailError = 'Email service is not configured, so no message was sent.'
  } else {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [cand.email],
          bcc: [TEAM_NOTIFY],
          subject: `Your Vitalis agreement — ${template.docTitle}`,
          html: buildEmail({ firstName: cand.first_name, docTitle: template.docTitle, link }),
        }),
      })
      if (res.ok) {
        emailed = true
      } else {
        emailError = 'The agreement was created but the email failed to send.'
        console.error('[contract/send] resend error:', await res.text())
      }
    } catch (err) {
      emailError = 'The agreement was created but the email failed to send.'
      console.error('[contract/send] resend threw:', err)
    }
  }

  return NextResponse.json({
    success: true,
    contract_id: contractId,
    email: cand.email,
    emailed,
    ...(emailError ? { error: emailError } : {}),
  })
}
