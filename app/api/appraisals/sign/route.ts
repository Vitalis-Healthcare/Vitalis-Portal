// app/api/appraisals/sign/route.ts
// Public endpoint — caregiver signs off on their appraisal via token.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const TEAM_EMAIL = 'team@vitalishealthcare.com'

export async function POST(request: Request) {
  const svc = createServiceClient()
  const { token, caregiver_signature } = await request.json()

  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })
  if (!caregiver_signature?.trim()) return NextResponse.json({ error: 'Signature required' }, { status: 400 })

  const { data: appraisal } = await svc
    .from('appraisals')
    .select('*, caregiver:caregiver_id(full_name), appraiser:appraiser_id(full_name, email)')
    .eq('sign_off_token', token)
    .single()

  if (!appraisal) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (appraisal.status === 'signed') return NextResponse.json({ error: 'Already signed' }, { status: 409 })

  await svc.from('appraisals').update({
    status:              'signed',
    signed_at:           new Date().toISOString(),
    caregiver_signature: caregiver_signature.trim(),
    updated_at:          new Date().toISOString(),
  }).eq('sign_off_token', token)

  const caregiverName = (appraisal.caregiver as any)?.full_name || 'Team member'
  const appraiserEmail = (appraisal.appraiser as any)?.email

  // Notify appraiser + team
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (RESEND_API_KEY) {
    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#1A2E44;padding:24px 32px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Appraisal Signed</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <div style="display:inline-block;padding:4px 14px;background:#E6F6F4;border-radius:20px;font-size:11px;font-weight:700;color:#0E7C7B;letter-spacing:0.8px;margin-bottom:16px;">✓ SIGNED</div>
    <p style="color:#4A6070;font-size:14px;margin:0 0 16px;">
      <strong>${caregiverName}</strong> has signed their ${appraisal.appraisal_period || 'annual'} performance appraisal.
    </p>
    <div style="background:#F8FAFB;border-radius:8px;padding:10px 16px;margin-bottom:16px;font-size:13px;color:#4A6070;border:1px solid #E2E8F0;">
      Signed as: "${caregiver_signature}"<br>
      Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
    <a href="${PORTAL_URL}/appraisals" style="display:inline-block;padding:11px 24px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">
      View in Portal →
    </a>
  </div>
</div>
</body></html>`

    const recipients = [TEAM_EMAIL]
    if (appraiserEmail) recipients.push(appraiserEmail)

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: recipients, subject: `[Vitalis] Appraisal signed — ${caregiverName}`, html }),
    })
  }

  return NextResponse.json({ success: true })
}
