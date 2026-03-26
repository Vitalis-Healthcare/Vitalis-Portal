// app/api/enrollments/direct/route.ts
// Admin/supervisor enrolls a caregiver directly into a programme.
// No approval required — admin IS the approval.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(viewer?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { caregiverId, programmeId } = await request.json()
  if (!caregiverId || !programmeId) {
    return NextResponse.json({ error: 'caregiverId and programmeId required' }, { status: 400 })
  }

  // Check not already enrolled
  const { data: existing } = await svc
    .from('programme_enrollments')
    .select('id')
    .eq('user_id', caregiverId)
    .eq('programme_id', programmeId)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Already enrolled in this programme' }, { status: 409 })

  // Enroll
  const { error } = await svc.from('programme_enrollments').insert({
    user_id:      caregiverId,
    programme_id: programmeId,
    assigned_by:  user.id,
    status:       'enrolled',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get programme title and caregiver email for notification
  const [{ data: prog }, { data: caregiver }] = await Promise.all([
    svc.from('programmes').select('title').eq('id', programmeId).single(),
    svc.from('profiles').select('full_name, email').eq('id', caregiverId).single(),
  ])

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (RESEND_API_KEY && caregiver?.email) {
    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:48px;height:48px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;margin-bottom:10px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Vitalis Healthcare</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <div style="display:inline-block;padding:4px 14px;background:#E6F6F4;border-radius:20px;font-size:11px;font-weight:700;color:#0E7C7B;letter-spacing:0.8px;margin-bottom:16px;">✓ ENROLLED</div>
    <h2 style="font-size:16px;color:#1A2E44;margin:0 0 12px;">You've Been Enrolled in a Training Programme</h2>
    <p style="color:#4A6070;font-size:14px;margin:0 0 16px;">
      Hi <strong>${caregiver.full_name}</strong>,<br><br>
      You have been enrolled in <strong>${prog?.title || 'a training programme'}</strong>. You can now access this training from your portal.
    </p>
    <a href="${PORTAL_URL}/lms" style="display:inline-block;padding:11px 24px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">Start Training →</a>
  </div>
</div>
</body></html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [caregiver.email],
        subject: `You've been enrolled: ${prog?.title || 'Training Programme'}`,
        html,
      }),
    })
  }

  return NextResponse.json({ success: true })
}
