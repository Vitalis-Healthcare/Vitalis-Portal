// app/api/auth/approve/route.ts
// Admin approves a pending user — sets status to active, sends welcome email.
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
  const { data: admin } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(admin?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  // Activate the user
  const { data: profile, error } = await svc
    .from('profiles')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('full_name, email, role')
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: error?.message || 'User not found' }, { status: 500 })
  }

  // Send approval email via Resend
  if (RESEND_KEY) {
    const firstName = profile.full_name?.split(' ')[0] || 'there'
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">You're approved!</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Vitalis Staff Portal</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 10px;">Hi ${firstName} 👋</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Your Vitalis Portal account has been approved. You can now sign in and access your training, policies, and compliance records.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${PORTAL_URL}/login" style="display:inline-block;padding:14px 40px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
        Sign In Now →
      </a>
    </div>
    <div style="background:#F8FAFC;border-radius:8px;padding:14px 18px;">
      <div style="font-size:12px;color:#8FA0B0;line-height:1.8;">
        <strong>Email:</strong> ${profile.email}<br>
        <strong>Portal:</strong> <a href="${PORTAL_URL}/login" style="color:#0E7C7B;">${PORTAL_URL}</a>
      </div>
    </div>
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
        subject: 'Your Vitalis Portal account has been approved',
        html,
      }),
    }).catch((e) => console.error('[approve] Resend error:', e))
  }

  return NextResponse.json({ success: true, profile })
}
