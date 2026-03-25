// Vitalis Portal — Credential Expiry Alert Function
// Deploy: supabase functions deploy credential-alerts
// Schedule: Set cron trigger in Supabase dashboard → Edge Functions → Schedule
// Cron expression: 0 9 * * * (runs at 9:00 AM UTC daily)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('NOTIFY_FROM_EMAIL') ?? 'Vitalis Portal <notifications@vitalis.care>'
const PORTAL_URL = Deno.env.get('PORTAL_URL') ?? 'https://vitalis-portal.vercel.app'
const ADMIN_EMAIL = Deno.env.get('ADMIN_ALERT_EMAIL') ?? 'oxofoegbu@gmail.com'

// Alert thresholds in days
const ALERT_DAYS = [30, 14, 7]

Deno.serve(async (_req) => {
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let totalSent = 0
  const adminSummary: string[] = []

  for (const days of ALERT_DAYS) {
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + days)
    const dateStr = targetDate.toISOString().split('T')[0]

    // Get credentials expiring exactly on this date
    const { data: expiring, error } = await supabase
      .from('staff_credentials')
      .select(`
        id,
        expiry_date,
        credential_type:credential_types ( name ),
        staff:profiles!staff_credentials_user_id_fkey ( full_name, email )
      `)
      .eq('expiry_date', dateStr)
      .neq('status', 'expired')

    if (error) {
      console.error('Query error:', error.message)
      continue
    }

    for (const cred of expiring ?? []) {
      const staffEmail = (cred.staff as any)?.email
      const staffName = (cred.staff as any)?.full_name ?? 'Team Member'
      const credName = (cred.credential_type as any)?.name ?? 'Credential'

      if (!staffEmail) continue

      // Dedup: skip if we already sent this alert today
      const { data: existing } = await supabase
        .from('email_log')
        .select('id')
        .eq('entity_id', cred.id)
        .eq('type', `credential_expiry_${days}d`)
        .gte('sent_at', today.toISOString())
        .maybeSingle()

      if (existing) continue

      const urgencyColor = days <= 7 ? '#E63946' : days <= 14 ? '#F4A261' : '#F4B942'
      const urgencyBg = days <= 7 ? '#FDE8E9' : days <= 14 ? '#FEF3EA' : '#FFFBEA'
      const urgencyLabel = days <= 7 ? 'URGENT' : days <= 14 ? 'ACTION NEEDED' : 'REMINDER'

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#F8FAFC;padding:32px 16px;">
          <div style="background:#0E7C7B;padding:20px 28px;border-radius:10px 10px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Vitalis Healthcare</h1>
            <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:4px 0 0;">Staff Compliance Portal</p>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-radius:0 0 10px 10px;">
            <div style="display:inline-block;padding:4px 12px;background:${urgencyBg};border-radius:20px;font-size:11px;font-weight:700;color:${urgencyColor};letter-spacing:0.8px;margin-bottom:16px;">
              ${urgencyLabel}
            </div>
            <h2 style="font-size:18px;color:#1A2E44;margin:0 0 16px;">Credential Expiring in ${days} Days</h2>
            <p style="color:#4A6070;font-size:14px;margin-bottom:8px;">Hi <strong>${staffName}</strong>,</p>
            <p style="color:#4A6070;font-size:14px;margin-bottom:20px;">
              Your credential is expiring soon. Please renew it before the expiry date to remain compliant.
            </p>
            <div style="background:#EFF2F5;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
              <table style="width:100%;font-size:13px;">
                <tr>
                  <td style="color:#8FA0B0;padding:4px 0;width:40%;">Credential</td>
                  <td style="color:#1A2E44;font-weight:700;padding:4px 0;">${credName}</td>
                </tr>
                <tr>
                  <td style="color:#8FA0B0;padding:4px 0;">Expiry Date</td>
                  <td style="color:${urgencyColor};font-weight:700;padding:4px 0;">${new Date(cred.expiry_date!).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</td>
                </tr>
                <tr>
                  <td style="color:#8FA0B0;padding:4px 0;">Days Remaining</td>
                  <td style="color:${urgencyColor};font-weight:700;padding:4px 0;">${days} days</td>
                </tr>
              </table>
            </div>
            <p style="color:#4A6070;font-size:14px;margin-bottom:24px;">
              Please renew your credential and upload the updated documentation to the portal.
            </p>
            <a
              href="${PORTAL_URL}/credentials"
              style="display:inline-block;padding:11px 26px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;"
            >
              View My Credentials ↗
            </a>
            <p style="color:#B0BEC5;font-size:12px;margin-top:28px;border-top:1px solid #EFF2F5;padding-top:16px;">
              This is an automated alert from the Vitalis Healthcare staff portal. Contact your supervisor if you need assistance.
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
          to: [staffEmail],
          subject: `⚠️ ${credName} expires in ${days} days — action required`,
          html
        })
      })

      if (res.ok) {
        await supabase.from('email_log').insert({
          recipient_email: staffEmail,
          subject: `${credName} expires in ${days} days`,
          type: `credential_expiry_${days}d`,
          entity_id: cred.id
        })
        adminSummary.push(`${staffName}: ${credName} in ${days}d`)
        totalSent++
      } else {
        console.error(`Failed to email ${staffEmail}:`, await res.text())
      }
    }
  }

  // Send daily admin digest if any alerts went out
  if (totalSent > 0 && ADMIN_EMAIL) {
    const digestHtml = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#1A2E44;padding:20px 28px;border-radius:10px 10px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Daily Credential Alert Digest</h1>
          <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;">${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <div style="background:#fff;padding:24px 28px;border:1px solid #E2E8F0;border-radius:0 0 10px 10px;">
          <p style="color:#4A6070;font-size:14px;margin-bottom:16px;">
            <strong>${totalSent}</strong> credential expiry alert${totalSent !== 1 ? 's' : ''} sent today:
          </p>
          <ul style="color:#4A6070;font-size:13px;padding-left:20px;">
            ${adminSummary.map(s => `<li style="margin-bottom:4px;">${s}</li>`).join('')}
          </ul>
          <a href="${PORTAL_URL}/credentials" style="display:inline-block;margin-top:20px;padding:9px 20px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:7px;font-weight:600;font-size:13px;">
            Review Credentials Dashboard
          </a>
        </div>
      </div>
    `

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `[Vitalis] ${totalSent} credential alert${totalSent !== 1 ? 's' : ''} sent — ${new Date().toLocaleDateString()}`,
        html: digestHtml
      })
    })
  }

  return new Response(
    JSON.stringify({ success: true, totalSent, alerts: adminSummary }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
