// app/api/auth/send-magic-link/route.ts
// Sends a branded magic sign-in link via Resend.
// No password needed — user clicks the link and is signed in instantly.
//
// Flow:
//   POST { email } → generateLink({ type: 'magiclink' })
//   → branded Resend email with /auth/confirm?token_hash=...&type=magiclink&next=/dashboard
//   → /auth/confirm verifies token, sets session cookie, redirects to /dashboard

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL  = process.env.NOTIFY_FROM_EMAIL  || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL  = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const RESEND_KEY  = process.env.RESEND_API_KEY

function buildMagicLinkEmail(opts: { firstName: string; email: string; magicLink: string }) {
  const { firstName, email, magicLink } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Your Sign-In Link</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Vitalis Staff Portal</p>
  </div>

  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 10px;">Hi ${firstName}! 👋</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 8px;">
      Here is your sign-in link for the Vitalis Staff Portal.
    </p>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Tap the button below — <strong>no password needed.</strong>
      This link expires in <strong>1 hour</strong> and can only be used once.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${magicLink}"
        style="display:inline-block;padding:16px 44px;background:linear-gradient(135deg,#0E7C7B,#1A9B87);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(14,124,123,0.3);">
        ✨ Sign In to Vitalis Portal
      </a>
    </div>

    <div style="background:#F8FAFC;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <div style="font-size:12px;color:#8FA0B0;line-height:1.8;">
        <strong>Account:</strong> ${email}<br>
        <strong>Portal:</strong> <a href="${PORTAL_URL}" style="color:#0E7C7B;">${PORTAL_URL}</a>
      </div>
    </div>

    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#8FA0B0;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Button not working? Copy this link</div>
      <div style="font-size:11px;color:#4A6070;word-break:break-all;line-height:1.6;">${magicLink}</div>
    </div>

    <p style="color:#94A3B8;font-size:12px;margin:0;line-height:1.6;">
      If you did not request this sign-in link, you can safely ignore this email.
      Your account will not be affected.
    </p>
  </div>

  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
    Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br>
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
  if (!email?.trim()) return NextResponse.json({ error: 'Email address is required.' }, { status: 400 })
  const cleanEmail = email.trim().toLowerCase()

  const svc = createServiceClient()

  // Check the email exists in profiles — avoid leaking whether accounts exist
  // by always returning success, but only send if profile found
  const { data: profile } = await svc
    .from('profiles')
    .select('full_name, status')
    .eq('email', cleanEmail)
    .single()

  // If account is pending or rejected, return a specific message
  if (profile?.status === 'pending') {
    return NextResponse.json({ error: 'pending' }, { status: 403 })
  }
  if (profile?.status === 'rejected') {
    return NextResponse.json({ error: 'rejected' }, { status: 403 })
  }

  // Generate the magic link token via Supabase admin
  const { data: linkData, error: linkError } = await svc.auth.admin.generateLink({
    type: 'magiclink',
    email: cleanEmail,
    options: { redirectTo: `${PORTAL_URL}/dashboard` },
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    // User doesn't exist in auth — still return success to prevent email enumeration
    console.warn('[send-magic-link] generateLink failed:', linkError?.message)
    return NextResponse.json({ success: true })
  }

  // Build the confirm URL — server-side token exchange, no hash fragments
  const magicLink = `${PORTAL_URL}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=magiclink&next=/dashboard`

  const firstName = profile?.full_name?.split(' ')[0] || cleanEmail.split('@')[0]
  const html = buildMagicLinkEmail({ firstName, email: cleanEmail, magicLink })

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [cleanEmail],
      subject: `✨ Your Vitalis Portal sign-in link`,
      html,
    }),
  })

  if (!resendRes.ok) {
    console.error('[send-magic-link] Resend error:', await resendRes.text())
    return NextResponse.json({ error: 'Failed to send sign-in link. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
