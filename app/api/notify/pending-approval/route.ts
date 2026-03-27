// app/api/notify/pending-approval/route.ts
// Notifies admin when a new user self-registers and needs approval.
// Called fire-and-forget from the login page after signup.

import { NextResponse } from 'next/server'

const FROM_EMAIL  = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL  = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'oxofoegbu@gmail.com'
const RESEND_KEY  = process.env.RESEND_API_KEY

export async function POST(request: Request) {
  const { email, fullName } = await request.json()
  if (!email || !RESEND_KEY) return NextResponse.json({ success: true })

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#1A2E44;padding:24px 28px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">⏳ New Account Request</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;">Vitalis Portal · Admin Notification</p>
  </div>
  <div style="background:#fff;padding:28px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 16px;">
      A new user has registered and is awaiting your approval before they can access the portal.
    </p>
    <div style="background:#F8FAFC;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <div style="font-size:13px;color:#1A2E44;line-height:2;">
        <strong>Name:</strong> ${fullName || 'Not provided'}<br>
        <strong>Email:</strong> ${email}
      </div>
    </div>
    <div style="text-align:center;">
      <a href="${PORTAL_URL}/users" style="display:inline-block;padding:12px 32px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        Review in User Management →
      </a>
    </div>
  </div>
  <div style="text-align:center;padding:16px 0;font-size:11px;color:#94A3B8;">
    Vitalis Healthcare Services, LLC · This is an automated notification.
  </div>
</div>
</body>
</html>`

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `New portal account request — ${fullName || email}`,
        html,
      }),
    })
  } catch (e) {
    console.error('[pending-approval] Resend error:', e)
  }

  return NextResponse.json({ success: true })
}
