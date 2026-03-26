import { NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

export async function POST(request: Request) {
  const { email, fullName } = await request.json()

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 })
  }

  if (!RESEND_API_KEY) {
    // Not fatal — account was created, just no welcome email
    console.warn('RESEND_API_KEY not set — welcome email skipped')
    return NextResponse.json({ success: true, message: 'Email not configured' })
  }

  const firstName = fullName?.split(' ')[0] || 'there'

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Welcome to Vitalis Portal</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Staff & Compliance Hub</p>
  </div>

  <!-- BODY -->
  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 8px;">Hi ${firstName} 👋</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Your Vitalis Portal account is ready. This is your hub for training courses, policies, credentials, and compliance — all in one place.
    </p>

    <!-- WHAT YOU CAN DO -->
    <div style="background:#F8FAFC;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <div style="font-size:13px;font-weight:700;color:#1A2E44;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.5px;">What you can do in the portal</div>
      ${[
        ['📚', 'Complete training courses assigned to you'],
        ['📋', 'Read and acknowledge agency policies'],
        ['🏅', 'Upload and track your credentials & certifications'],
        ['🔔', 'Get notified when renewals are coming up'],
      ].map(([icon, text]) => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <span style="font-size:18px;">${icon}</span>
        <span style="font-size:13px;color:#4A6070;">${text}</span>
      </div>`).join('')}
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${PORTAL_URL}/login"
        style="display:inline-block;padding:13px 36px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.2px;">
        Sign In to Your Portal →
      </a>
    </div>

    <!-- LOGIN REMINDER -->
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <div style="font-size:12px;font-weight:700;color:#1D4ED8;margin-bottom:4px;">YOUR LOGIN DETAILS</div>
      <div style="font-size:13px;color:#1E3A5F;">
        <strong>Email:</strong> ${email}<br>
        <strong>Password:</strong> The one you just created<br>
        <strong>Portal:</strong> <a href="${PORTAL_URL}/login" style="color:#1D4ED8;">${PORTAL_URL}/login</a>
      </div>
    </div>

    <p style="color:#94A3B8;font-size:12px;margin:0;">
      If you have any trouble signing in, use <strong>"Forgot password?"</strong> on the login page and a reset link will be sent to this email address. For other questions, contact your supervisor or the Vitalis admin team.
    </p>
  </div>

  <!-- FOOTER -->
  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;">
    Vitalis Healthcare Services, LLC<br>
    8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br>
    This is an automated message — please do not reply directly to this email.
  </div>

</div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Welcome to Vitalis Portal — Your account is ready',
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Resend welcome email error:', errBody)
      return NextResponse.json({ success: false, error: errBody }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Welcome email exception:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
