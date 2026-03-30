// app/api/staff/invite/route.ts
// Creates a staff account and sends a branded "set your password" email via Resend.
// Admin / supervisor only.
//
// Flow:
//   1. svc.auth.admin.createUser()      — creates auth user, no Supabase email
//   2. handle_new_user trigger           — auto-creates profiles row
//   3. svc.auth.admin.generateLink()     — get hashed_token for recovery
//   4. Build link to /auth/confirm       — our server handles token exchange
//   5. Resend                            — branded invite email

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const RESEND_KEY = process.env.RESEND_API_KEY

function buildInviteEmail(opts: {
  firstName: string; fullName: string; email: string
  role: string; setPasswordLink: string; invitedBy: string
}) {
  const { firstName, fullName, email, role, setPasswordLink, invitedBy } = opts
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Welcome to Vitalis Portal</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Staff &amp; Compliance Hub</p>
  </div>

  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 10px;">Hi ${firstName} 👋</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 6px;">
      <strong>${invitedBy}</strong> has created a Vitalis Portal account for you.
    </p>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Click the button below to set your password and access the portal. The link is valid for <strong>24 hours</strong>.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${setPasswordLink}"
        style="display:inline-block;padding:14px 40px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
        Set My Password &amp; Sign In →
      </a>
    </div>

    <div style="background:#F8FAFC;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:12px;font-weight:700;color:#8FA0B0;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Your Account Details</div>
      <div style="font-size:13px;color:#1A2E44;line-height:2;">
        <strong>Name:</strong> ${fullName}<br>
        <strong>Email:</strong> ${email}<br>
        <strong>Role:</strong> ${roleLabel}<br>
        <strong>Portal:</strong> <a href="${PORTAL_URL}/login" style="color:#0E7C7B;">${PORTAL_URL}</a>
      </div>
    </div>

    <div style="background:#FEF3EA;border:1px solid #F4A26144;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      <div style="font-size:12px;color:#92400E;line-height:1.6;">
        ⚠️ <strong>This link expires in 24 hours.</strong> If it has expired, go to the portal and click <em>"Forgot password?"</em> on the login page.
      </div>
    </div>

    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;">
      <div style="font-size:11px;font-weight:700;color:#8FA0B0;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Button not working? Copy this link</div>
      <div style="font-size:11px;color:#4A6070;word-break:break-all;line-height:1.6;">${setPasswordLink}</div>
    </div>
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: adminProfile } = await svc
    .from('profiles').select('role, full_name').eq('id', user.id).single()

  if (!['admin', 'supervisor', 'staff'].includes(adminProfile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!RESEND_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured.' }, { status: 500 })
  }

  const body = await req.json()
  const full_name  = body.full_name?.trim()
  const email      = body.email?.trim().toLowerCase()
  const role       = body.role || 'caregiver'

  // Non-admin callers can only invite caregivers — enforce server-side
  const callerRole = adminProfile?.role || ''
  if (callerRole !== 'admin' && role !== 'caregiver') {
    return NextResponse.json({ error: 'You can only invite caregivers.' }, { status: 403 })
  }
  const department = body.department?.trim() || null
  const phone      = body.phone?.trim() || null

  if (!full_name || !email) {
    return NextResponse.json({ error: 'full_name and email are required' }, { status: 400 })
  }

  const firstName = full_name.split(' ')[0]
  const invitedBy = adminProfile?.full_name || 'The Vitalis admin team'

  // ── Step 1: Create auth user ──────────────────────────────────────────────
  const { data: authData, error: createError } = await svc.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name, role, phone, department },
  })

  if (createError) {
    const alreadyExists =
      createError.message?.toLowerCase().includes('already') ||
      createError.message?.toLowerCase().includes('exists')
    if (alreadyExists) {
      return NextResponse.json({ status: 'already_exists', message: 'An account with this email already exists.' })
    }
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // ── Step 2: Belt-and-braces profile upsert (trigger handles this normally) ─
  if (authData?.user?.id) {
    await svc.from('profiles').upsert(
      { id: authData.user.id, email, full_name, role, department, phone, status: 'active' },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  }

  // ── Step 3: Generate hashed token ────────────────────────────────────────
  // We use hashed_token (not action_link) so our own /auth/confirm route
  // handles the token exchange server-side — no hash fragments in the browser.
  const { data: linkData, error: linkError } = await svc.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${PORTAL_URL}/update-password` },
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('[invite] generateLink error:', linkError?.message)
    return NextResponse.json({
      status: 'created_no_link',
      message: 'Account created but invite link failed. User can use "Forgot password?" on the login page.',
    })
  }

  // Build link to our own server route — token exchange happens server-side
  const setPasswordLink = `${PORTAL_URL}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/update-password`

  // ── Step 4: Send via Resend ───────────────────────────────────────────────
  const html = buildInviteEmail({ firstName, fullName: full_name, email, role, setPasswordLink, invitedBy })

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [email],
      subject: `You've been invited to Vitalis Portal — set your password`,
      html,
    }),
  })

  if (!resendRes.ok) {
    console.error('[invite] Resend error:', await resendRes.text())
    return NextResponse.json({ status: 'created_email_failed', message: 'Account created but invite email failed.' })
  }

  return NextResponse.json({ status: 'invited', message: `Invite sent to ${email}` })
}
