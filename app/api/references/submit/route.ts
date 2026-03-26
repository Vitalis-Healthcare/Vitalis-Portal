// app/api/references/submit/route.ts
// Public endpoint — no authentication required.
// Validates the token, saves the submission, marks the reference as received.
// Called by the public /ref/[token] form page.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const TEAM_EMAIL = 'team@vitalishealthcare.com'

export async function POST(request: Request) {
  const svc = createServiceClient()
  const body = await request.json()
  const { token, ...formData } = body

  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  // Look up the reference by token
  const { data: ref } = await svc
    .from('caregiver_references')
    .select('*, caregiver:caregiver_id(full_name, email)')
    .eq('token', token)
    .single()

  if (!ref) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  if (ref.status === 'received') return NextResponse.json({ error: 'This reference has already been submitted' }, { status: 409 })

  // Get IP address from headers
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null

  // Save submission
  const { error: submitError } = await svc
    .from('reference_submissions')
    .insert({ reference_id: ref.id, ip_address: ip, ...formData })

  if (submitError) {
    console.error('Reference submission error:', submitError.message)
    return NextResponse.json({ error: submitError.message }, { status: 500 })
  }

  // Mark reference as received
  await svc.from('caregiver_references').update({
    status: 'received',
    received_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', ref.id)

  // Notify admin + team
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (RESEND_API_KEY) {
    const caregiverName = (ref.caregiver as any)?.full_name || 'A caregiver'
    const refereeName = formData.referee_name || ref.referee_name || 'The referee'
    const formType = ref.reference_type === 'professional' ? 'Employment Reference' : 'Character Reference'

    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#1A2E44;padding:24px 32px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Reference Received</h1>
    <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:6px 0 0;">${formType} · ${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <div style="display:inline-block;padding:4px 14px;background:#E6F6F4;border-radius:20px;font-size:11px;font-weight:700;color:#0E7C7B;letter-spacing:0.8px;margin-bottom:18px;">REFERENCE RECEIVED</div>
    <p style="color:#4A6070;font-size:14px;margin:0 0 16px;">
      <strong>${refereeName}</strong> has completed the ${formType} form for <strong>${caregiverName}</strong>.
    </p>
    <a href="${PORTAL_URL}/staff" style="display:inline-block;padding:11px 24px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">
      View Caregiver Profile →
    </a>
  </div>
</div>
</body></html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TEAM_EMAIL],
        subject: `[Vitalis] ${formType} received for ${caregiverName} — from ${refereeName}`,
        html,
      }),
    })
  }

  return NextResponse.json({ success: true })
}
