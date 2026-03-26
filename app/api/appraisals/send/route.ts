// app/api/appraisals/send/route.ts
// Marks appraisal as 'sent' and emails the caregiver a sign-off link.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const TEAM_EMAIL = 'team@vitalishealthcare.com'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(viewer?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { appraisalId } = await request.json()
  if (!appraisalId) return NextResponse.json({ error: 'appraisalId required' }, { status: 400 })

  const { data: appraisal } = await svc
    .from('appraisals')
    .select('*, caregiver:caregiver_id(full_name, email), appraiser:appraiser_id(full_name)')
    .eq('id', appraisalId)
    .single()

  if (!appraisal) return NextResponse.json({ error: 'Appraisal not found' }, { status: 404 })

  await svc.from('appraisals').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', appraisalId)

  const caregiverEmail = (appraisal.caregiver as any)?.email
  const caregiverName  = (appraisal.caregiver as any)?.full_name || 'Team Member'
  const appraiserName  = (appraisal.appraiser as any)?.full_name || 'Your Supervisor'
  const signOffUrl     = `${PORTAL_URL}/appraisal/${appraisal.sign_off_token}`

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (RESEND_API_KEY && caregiverEmail) {
    const html = `
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Vitalis Healthcare Services</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Performance Appraisal</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 16px;">Your Performance Appraisal is Ready for Review</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Hi <strong>${caregiverName}</strong>,<br><br>
      <strong>${appraiserName}</strong> has completed your ${appraisal.appraisal_period || 'annual'} performance appraisal.
      Please review it and sign off at your earliest convenience.
    </p>
    <div style="background:#F8FAFB;border-radius:8px;padding:14px 18px;margin-bottom:24px;border:1px solid #E2E8F0;">
      <div style="font-size:12px;font-weight:700;color:#8FA0B0;margin-bottom:4px;">APPRAISAL PERIOD</div>
      <div style="font-size:15px;font-weight:700;color:#1A2E44;">${appraisal.appraisal_period || 'Annual Performance Review'}</div>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${signOffUrl}" style="display:inline-block;padding:14px 36px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
        Review & Sign Appraisal →
      </a>
    </div>
    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:14px 18px;">
      <p style="color:#4A6070;font-size:13px;margin:0;line-height:1.6;">
        No login required. If the button above does not work, copy and paste this link:<br>
        <span style="color:#0E7C7B;font-size:12px;word-break:break-all;">${signOffUrl}</span>
      </p>
    </div>
    <p style="color:#94A3B8;font-size:12px;margin:24px 0 0;border-top:1px solid #EFF2F5;padding-top:16px;">
      Questions? Contact ${TEAM_EMAIL} or call 267.474.8578.
    </p>
  </div>
</div>
</body></html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [caregiverEmail], cc: [TEAM_EMAIL], subject: `Your performance appraisal is ready for sign-off — ${appraisal.appraisal_period || 'Annual Review'}`, html }),
    })
  }

  return NextResponse.json({ success: true, signOffUrl })
}
