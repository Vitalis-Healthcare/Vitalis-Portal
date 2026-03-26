// app/api/references/send/route.ts
// Creates or updates a reference record and sends the request email.
// Called by the caregiver's references page when they save a referee's details.

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
  const { slot, referee_name, referee_email, referee_phone, referee_org, reference_type } = await request.json()

  if (!slot || !referee_email || !reference_type) {
    return NextResponse.json({ error: 'slot, referee_email and reference_type required' }, { status: 400 })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) return NextResponse.json({ error: 'Email not configured' }, { status: 500 })

  // Get caregiver profile
  const { data: profile } = await svc.from('profiles').select('full_name').eq('id', user.id).single()
  const caregiverName = profile?.full_name || 'A Vitalis Healthcare caregiver'

  // Upsert the reference record
  const { data: ref, error: upsertError } = await svc
    .from('caregiver_references')
    .upsert({
      caregiver_id:   user.id,
      slot,
      reference_type,
      referee_name:   referee_name || null,
      referee_email,
      referee_phone:  referee_phone || null,
      referee_org:    referee_org || null,
      status:         'sent',
      sent_at:        new Date().toISOString(),
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'caregiver_id,slot' })
    .select()
    .single()

  if (upsertError) {
    console.error('Reference upsert error:', upsertError.message)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  const formUrl = `${PORTAL_URL}/ref/${ref.token}`
  const isProfessional = reference_type === 'professional'

  const html = buildReferenceEmail({ caregiverName, refereeName: referee_name, formUrl, isProfessional })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [referee_email],
      cc: [TEAM_EMAIL],
      subject: `Reference Request — ${caregiverName} · Vitalis Healthcare`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ success: true, token: ref.token })
}

function buildReferenceEmail({ caregiverName, refereeName, formUrl, isProfessional }: {
  caregiverName: string; refereeName?: string; formUrl: string; isProfessional: boolean
}) {
  const greeting = refereeName ? `Dear ${refereeName},` : 'Dear Reference,'
  const formType = isProfessional ? 'Employment Reference Form' : 'Character Reference Verification'

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Vitalis Healthcare Services</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910</p>
  </div>

  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <p style="color:#4A6070;font-size:15px;line-height:1.7;margin:0 0 20px;">${greeting}</p>

    <p style="color:#4A6070;font-size:14px;line-height:1.7;margin:0 0 16px;">
      <strong>${caregiverName}</strong> has applied to Vitalis Healthcare Services, LLC and has submitted your name as a reference. The serious nature of our responsibility to our clients is such that any consideration of the individual by Vitalis Healthcare, LLC is dependent upon receipt of satisfactory references.
    </p>

    <p style="color:#4A6070;font-size:14px;line-height:1.7;margin:0 0 24px;">
      We would appreciate your cooperation in completing our <strong>${formType}</strong>. Please be assured that your response will be kept in the strictest confidence. The form takes approximately 3–5 minutes to complete.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${formUrl}"
        style="display:inline-block;padding:14px 36px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
        Complete the ${isProfessional ? 'Employment' : 'Character'} Reference Form →
      </a>
    </div>

    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="color:#4A6070;font-size:13px;margin:0;line-height:1.6;">
        <strong>Note:</strong> No login or account is required. The link above will take you directly to the form. If the button above does not work, copy and paste this link into your browser:<br>
        <span style="color:#0E7C7B;font-size:12px;word-break:break-all;">${formUrl}</span>
      </p>
    </div>

    <p style="color:#94A3B8;font-size:12px;margin:0;border-top:1px solid #EFF2F5;padding-top:16px;">
      Thank you in advance for your time and cooperation. If you have any questions, please contact us at ${TEAM_EMAIL} or call 267.474.8578.
    </p>
  </div>

  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;">
    Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br>
    Tel: 267.474.8578 · Fax: 240.266.0650
  </div>
</div>
</body>
</html>`
}
