import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalis.care>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

export async function POST(request: Request) {
  const { fullName, credentialName, issueDate, expiryDate, notes } = await request.json()

  const supabase = await createClient()

  // Get all admin + supervisor emails
  const { data: admins } = await supabase
    .from('profiles')
    .select('email, full_name')
    .in('role', ['admin', 'supervisor'])
    .eq('status', 'active')

  if (!admins || admins.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: 'No admins to notify' })
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ success: true, sent: 0, message: 'Email not configured' })
  }

  let sent = 0

  for (const admin of admins) {
    if (!admin.email) continue

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#F8FAFC;padding:32px 16px;">
        <div style="background:#1A2E44;padding:20px 28px;border-radius:10px 10px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Vitalis Healthcare</h1>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0;">Staff Compliance Portal</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-radius:0 0 10px 10px;">
          <div style="display:inline-block;padding:4px 12px;background:#EBF4FF;border-radius:20px;font-size:11px;font-weight:700;color:#457B9D;letter-spacing:0.8px;margin-bottom:16px;">
            ACTION REQUIRED
          </div>
          <h2 style="font-size:18px;color:#1A2E44;margin:0 0 16px;">Credential Submitted for Review</h2>
          <p style="color:#4A6070;font-size:14px;margin-bottom:20px;">
            Hi ${admin.full_name?.split(' ')[0] || 'there'},<br/><br/>
            <strong>${fullName}</strong> has submitted a credential for your review and approval.
          </p>
          <div style="background:#EFF2F5;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
            <table style="width:100%;font-size:13px;">
              <tr>
                <td style="color:#8FA0B0;padding:4px 0;width:40%;">Staff Member</td>
                <td style="color:#1A2E44;font-weight:700;padding:4px 0;">${fullName}</td>
              </tr>
              <tr>
                <td style="color:#8FA0B0;padding:4px 0;">Credential</td>
                <td style="color:#1A2E44;font-weight:700;padding:4px 0;">${credentialName}</td>
              </tr>
              <tr>
                <td style="color:#8FA0B0;padding:4px 0;">Issue Date</td>
                <td style="color:#1A2E44;padding:4px 0;">${issueDate ? new Date(issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</td>
              </tr>
              ${expiryDate ? `<tr>
                <td style="color:#8FA0B0;padding:4px 0;">Expiry Date</td>
                <td style="color:#1A2E44;padding:4px 0;">${new Date(expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>` : ''}
              ${notes ? `<tr>
                <td style="color:#8FA0B0;padding:4px 0;">Notes</td>
                <td style="color:#1A2E44;padding:4px 0;">${notes}</td>
              </tr>` : ''}
            </table>
          </div>
          <p style="color:#4A6070;font-size:14px;margin-bottom:24px;">
            Please log in to the portal to review this submission and either approve or reject it.
          </p>
          <a
            href="${PORTAL_URL}/credentials"
            style="display:inline-block;padding:11px 26px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;"
          >
            Review in Portal ↗
          </a>
          <p style="color:#B0BEC5;font-size:12px;margin-top:28px;border-top:1px solid #EFF2F5;padding-top:16px;">
            This notification was sent by the Vitalis Healthcare staff portal.
          </p>
        </div>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [admin.email],
        subject: `[Vitalis] ${fullName} submitted a credential for review — ${credentialName}`,
        html
      })
    })

    if (res.ok) sent++
  }

  return NextResponse.json({ success: true, sent })
}
