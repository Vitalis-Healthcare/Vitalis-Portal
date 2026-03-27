// app/api/auth/reject/route.ts
// Admin rejects a pending user — sets status to rejected, notifies user.
// Admin only.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const RESEND_KEY = process.env.RESEND_API_KEY

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: admin } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(admin?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, reason } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { data: profile, error } = await svc
    .from('profiles')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('full_name, email')
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: error?.message || 'User not found' }, { status: 500 })
  }

  // Notify user of rejection
  if (RESEND_KEY) {
    const firstName = profile.full_name?.split(' ')[0] || 'there'
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#1A2E44;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Account Request Update</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.8px;">Vitalis Staff Portal</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 10px;">Hi ${firstName},</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Thank you for registering for the Vitalis Portal. Unfortunately, we were unable to approve your account request at this time.
    </p>
    ${reason ? `<div style="background:#FEF3EA;border:1px solid #F4A26144;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#92400E;line-height:1.6;"><strong>Reason:</strong> ${reason}</div>` : ''}
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0;">
      If you believe this is an error or have questions, please contact your supervisor or the Vitalis admin team directly.
    </p>
  </div>
  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
    Vitalis Healthcare Services, LLC · Silver Spring, MD 20910
  </div>
</div>
</body>
</html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [profile.email],
        subject: 'Update on your Vitalis Portal account request',
        html,
      }),
    }).catch((e) => console.error('[reject] Resend error:', e))
  }

  return NextResponse.json({ success: true })
}
