// app/api/credential-alerts/route.ts
// Vercel Cron — runs daily at 09:00 UTC (see vercel.json)
// Sends expiry alerts to staff at 30 / 14 / 7 days before expiry.
// Sends a digest to the admin after all alerts are dispatched.
// Deduplicates via email_log — safe to re-run manually.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL =
  process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const ADMIN_EMAIL =
  process.env.ADMIN_ALERT_EMAIL || 'oxofoegbu@gmail.com'

const ALERT_DAYS = [30, 14, 7]

export async function GET(request: Request) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }

  const supabase = createServiceClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let totalSent = 0
  const adminSummary: string[] = []
  const errors: string[] = []

  for (const days of ALERT_DAYS) {
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + days)
    const dateStr = targetDate.toISOString().split('T')[0]

    // Credentials expiring exactly on this date, not already expired
    const { data: expiring, error: queryError } = await supabase
      .from('staff_credentials')
      .select(`
        id,
        expiry_date,
        does_not_expire,
        credential_type:credential_types ( name ),
        staff:profiles!staff_credentials_user_id_fkey ( full_name, email )
      `)
      .eq('expiry_date', dateStr)
      .neq('status', 'expired')
      .eq('does_not_expire', false)

    if (queryError) {
      console.error(`Query error for ${days}d window:`, queryError.message)
      errors.push(`query_${days}d: ${queryError.message}`)
      continue
    }

    for (const cred of expiring ?? []) {
      const staffEmail = (cred.staff as any)?.email
      const staffName = (cred.staff as any)?.full_name ?? 'Team Member'
      const credName = (cred.credential_type as any)?.name ?? 'Credential'
      const expiryFormatted = new Date(cred.expiry_date!).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })

      if (!staffEmail) continue

      // Dedup — skip if already sent this alert today
      const { data: existing } = await supabase
        .from('email_log')
        .select('id')
        .eq('entity_id', cred.id)
        .eq('type', `credential_expiry_${days}d`)
        .gte('sent_at', today.toISOString())
        .maybeSingle()

      if (existing) continue

      // Urgency styling
      const urgencyColor = days <= 7 ? '#E63946' : days <= 14 ? '#F4A261' : '#F4B942'
      const urgencyBg    = days <= 7 ? '#FDE8E9' : days <= 14 ? '#FEF3EA' : '#FFFBEA'
      const urgencyLabel = days <= 7 ? 'URGENT' : days <= 14 ? 'ACTION NEEDED' : 'REMINDER'

      const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Vitalis Healthcare</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Staff Compliance Portal</p>
  </div>

  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <div style="display:inline-block;padding:4px 14px;background:${urgencyBg};border-radius:20px;font-size:11px;font-weight:700;color:${urgencyColor};letter-spacing:0.8px;margin-bottom:18px;">
      ${urgencyLabel}
    </div>
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 16px;">Credential Expiring in ${days} Day${days === 1 ? '' : 's'}</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hi <strong>${staffName}</strong>,<br><br>
      The following credential is expiring soon. Please renew it and upload the updated documentation to the portal before the expiry date to stay compliant.
    </p>

    <div style="background:#EFF2F5;border-radius:10px;padding:18px 22px;margin-bottom:24px;">
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr>
          <td style="color:#8FA0B0;padding:6px 0;width:42%;vertical-align:top;">Credential</td>
          <td style="color:#1A2E44;font-weight:700;padding:6px 0;">${credName}</td>
        </tr>
        <tr>
          <td style="color:#8FA0B0;padding:6px 0;">Expiry Date</td>
          <td style="color:${urgencyColor};font-weight:700;padding:6px 0;">${expiryFormatted}</td>
        </tr>
        <tr>
          <td style="color:#8FA0B0;padding:6px 0;">Days Remaining</td>
          <td style="color:${urgencyColor};font-weight:700;padding:6px 0;">${days} day${days === 1 ? '' : 's'}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${PORTAL_URL}/credentials"
        style="display:inline-block;padding:13px 32px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        Update My Credentials →
      </a>
    </div>

    <p style="color:#94A3B8;font-size:12px;margin:0;border-top:1px solid #EFF2F5;padding-top:16px;">
      This is an automated alert from the Vitalis Healthcare staff portal. Contact your supervisor if you need assistance renewing this credential.
    </p>
  </div>

  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;">
    Vitalis Healthcare Services, LLC<br>
    8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910
  </div>
</div>
</body>
</html>`

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [staffEmail],
          subject: `⚠️ ${credName} expires in ${days} day${days === 1 ? '' : 's'} — action required`,
          html,
        }),
      })

      if (res.ok) {
        await supabase.from('email_log').insert({
          recipient_email: staffEmail,
          subject: `${credName} expires in ${days} days`,
          type: `credential_expiry_${days}d`,
          entity_id: cred.id,
        })
        adminSummary.push(`${staffName}: ${credName} (${days}d)`)
        totalSent++
      } else {
        const errText = await res.text()
        console.error(`Resend error for ${staffEmail}:`, errText)
        errors.push(`email_${cred.id}: ${errText}`)
      }
    }
  }

  // Admin digest — only if at least one alert went out
  if (totalSent > 0) {
    const digestHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#1A2E44;padding:24px 32px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Daily Credential Alert Digest</h1>
    <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:6px 0 0;">
      ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <p style="color:#4A6070;font-size:14px;margin:0 0 16px;">
      <strong>${totalSent}</strong> credential expiry alert${totalSent !== 1 ? 's were' : ' was'} sent today:
    </p>
    <ul style="color:#4A6070;font-size:13px;padding-left:20px;margin:0 0 24px;">
      ${adminSummary.map(s => `<li style="margin-bottom:6px;">${s}</li>`).join('')}
    </ul>
    <a href="${PORTAL_URL}/credentials"
      style="display:inline-block;padding:11px 24px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">
      Review Credentials Dashboard →
    </a>
    ${errors.length > 0 ? `
    <div style="margin-top:20px;padding:12px 16px;background:#FEF2F2;border-radius:8px;font-size:12px;color:#B91C1C;">
      <strong>${errors.length} error${errors.length !== 1 ? 's' : ''} encountered</strong> — check Vercel logs for details.
    </div>` : ''}
  </div>
</div>
</body>
</html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `[Vitalis] ${totalSent} credential alert${totalSent !== 1 ? 's' : ''} sent — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        html: digestHtml,
      }),
    })
  }

  return NextResponse.json({
    success: true,
    totalSent,
    alerts: adminSummary,
    ...(errors.length > 0 && { errors }),
  })
}
