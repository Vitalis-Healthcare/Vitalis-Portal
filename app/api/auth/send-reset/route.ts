// app/api/auth/send-reset/route.ts
// Sends a password reset email via Resend.
// Called by the login page "Forgot password?" form.
// No authentication required — user is not logged in.
//
// Uses svc.auth.admin.generateLink({ type: 'recovery' }) to get the reset URL,
// then sends a branded Resend email. The existing /update-password page
// handles the token exchange — no changes needed there.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const RESEND_KEY = process.env.RESEND_API_KEY

function buildResetEmail(opts: { firstName: string; email: string; resetLink: string }) {
  const { firstName, email, resetLink } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Reset Your Password</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Vitalis Staff Portal</p>
  </div>

  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 10px;">Hi ${firstName},</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 8px;">
      We received a request to reset the password for your Vitalis Portal account.
    </p>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Click the button below to set a new password. This link is valid for <strong>24 hours</strong>.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${resetLink}" style="display:inline-block;padding:14px 40px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
        Reset My Password →
      </a>
    </div>

    <div style="background:#F8FAFC;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <div style="font-size:12px;color:#8FA0B0;line-height:1.8;">
        <strong>Account email:</strong> ${email}<br>
        <strong>Portal:</strong> <a href="${PORTAL_URL}/login" style="color:#0E7C7B;">${PORTAL_URL}</a>
      </div>
    </div>

    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#8FA0B0;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Button not working? Copy this link</div>
      <div style="font-size:11px;color:#4A6070;word-break:break-all;line-height:1.6;">${resetLink}</div>
    </div>

    <p style="color:#94A3B8;font-size:12px;margin:0;line-height:1.6;">
      If you didn't request a password reset, you can safely ignore this email — your password won't change.
    </p>
  </div>

  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
    Vitalis Healthcare Services, LLC<br>
    8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br>
    This is an automated message — please do not reply directly.
  </div>
</div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  if (!RESEND_KEY) {
    return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 })
  }

  const { email } = await req.json()
  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()

  // ── Generate reset link via admin API ─────────────────────────────────────
  // IMPORTANT: We always return success to the user even if the email doesn't
  // exist — this prevents email enumeration attacks.
  const svc = createServiceClient()
  const { data: linkData, error: linkError } = await svc.auth.admin.generateLink({
    type: 'recovery',
    email: cleanEmail,
    options: { redirectTo: `${PORTAL_URL}/auth/callback?next=/update-password` },
  })

  // If user doesn't exist or other error — return success anyway (security)
  if (linkError || !linkData?.properties?.action_link) {
    console.warn('[send-reset] generateLink failed:', linkError?.message, '— returning success to prevent enumeration')
    return NextResponse.json({ success: true })
  }

  const resetLink = linkData.properties.action_link

  // ── Build name from email prefix if no profile found ─────────────────────
  const { data: profile } = await svc
    .from('profiles').select('full_name').eq('email', cleanEmail).single()
  const firstName = profile?.full_name?.split(' ')[0] || cleanEmail.split('@')[0]

  // ── Send via Resend ───────────────────────────────────────────────────────
  const html = buildResetEmail({ firstName, email: cleanEmail, resetLink })

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [cleanEmail],
      subject: 'Reset your Vitalis Portal password',
      html,
    }),
  })

  if (!resendRes.ok) {
    console.error('[send-reset] Resend error:', await resendRes.text())
    return NextResponse.json({ error: 'Failed to send reset email. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
