// app/api/missing-credential-alerts/route.ts
// Vercel Cron — runs daily at 10:00 UTC (see vercel.json)
// For every active caregiver, checks each credential type required for their role.
// If no entry exists, OR entry is not current/expiring AND not flagged does_not_expire
// or not_applicable — sends an alert email to the caregiver.
// Deduplicates via email_log (one alert per caregiver×credential per day).

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL =
  process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }

  const svc = createServiceClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // All active caregivers
  const { data: caregivers } = await svc
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('status', 'active')
    .eq('role', 'caregiver')

  // All credential types
  const { data: credTypes } = await svc
    .from('credential_types')
    .select('id, name, required_for_roles')

  if (!caregivers?.length || !credTypes?.length) {
    return NextResponse.json({ success: true, totalSent: 0, message: 'No caregivers or cred types' })
  }

  // All existing credentials for active caregivers (one query, not N+1)
  const { data: allCreds } = await svc
    .from('staff_credentials')
    .select('id, user_id, credential_type_id, status, does_not_expire, not_applicable')
    .in('user_id', caregivers.map(c => c.id))

  // Index credentials by user_id + credential_type_id for fast lookup
  type CredRow = { id: string; user_id: string; credential_type_id: string; status: string; does_not_expire: boolean; not_applicable: boolean }
  const credIndex: Record<string, CredRow> = {}
  for (const cred of allCreds ?? []) {
    credIndex[`${cred.user_id}:${cred.credential_type_id}`] = cred
  }

  let totalSent = 0
  const errors: string[] = []

  for (const caregiver of caregivers) {
    if (!caregiver.email) continue

    const missingList: string[] = []

    for (const ct of credTypes) {
      // Check if this credential type is required for this caregiver's role
      const requiredRoles: string[] = ct.required_for_roles ?? []
      if (!requiredRoles.includes(caregiver.role)) continue

      const existing = credIndex[`${caregiver.id}:${ct.id}`]

      // Skip if: entry exists AND (does_not_expire OR not_applicable OR status is current/expiring)
      if (existing) {
        if (existing.does_not_expire || existing.not_applicable) continue
        if (existing.status === 'current' || existing.status === 'expiring') continue
        // status = 'expired' or 'missing' → falls through to alert list
        // 'missing' is set by DB trigger: entry exists but no valid expiry, not N/A, not does_not_expire
      }
      // No entry at all, or entry with status = 'expired' | 'missing' → alert

      missingList.push(ct.name)
    }

    if (missingList.length === 0) continue

    // Dedup — skip if we already sent a missing alert today for this caregiver
    const { data: existing } = await svc
      .from('email_log')
      .select('id')
      .eq('recipient_email', caregiver.email)
      .eq('type', 'missing_credentials')
      .gte('sent_at', today.toISOString())
      .maybeSingle()

    if (existing) continue

    const html = buildMissingEmail(caregiver.full_name, missingList, PORTAL_URL)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [caregiver.email],
        subject: `⚠️ Action required: ${missingList.length} credential${missingList.length !== 1 ? 's' : ''} missing from your profile`,
        html,
      }),
    })

    if (res.ok) {
      await svc.from('email_log').insert({
        recipient_email: caregiver.email,
        subject: `Missing credentials: ${missingList.join(', ')}`,
        type: 'missing_credentials',
        entity_id: null,
      })
      totalSent++
    } else {
      const err = await res.text()
      console.error(`Failed to email ${caregiver.email}:`, err)
      errors.push(`${caregiver.full_name}: ${err}`)
    }
  }

  return NextResponse.json({
    success: true,
    totalSent,
    ...(errors.length > 0 && { errors }),
  })
}

function buildMissingEmail(name: string, missing: string[], portalUrl: string): string {
  const firstName = name?.split(' ')[0] ?? 'there'
  const itemRows = missing.map(m => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #EFF2F5;font-size:13px;color:#1A2E44;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#E63946;margin-right:8px;vertical-align:middle;"></span>
        ${m}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #EFF2F5;font-size:12px;color:#E63946;font-weight:700;text-align:right;">
        MISSING
      </td>
    </tr>`).join('')

  return `
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
    <div style="display:inline-block;padding:4px 14px;background:#FDE8E9;border-radius:20px;font-size:11px;font-weight:700;color:#E63946;letter-spacing:0.8px;margin-bottom:18px;">
      ACTION REQUIRED
    </div>
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 12px;">Missing Credentials on Your Profile</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hi <strong>${firstName}</strong>,<br><br>
      The following credential${missing.length !== 1 ? 's are' : ' is'} required for your role but ${missing.length !== 1 ? 'are' : 'is'} currently missing from your profile. Please upload ${missing.length !== 1 ? 'them' : 'it'} as soon as possible to remain compliant.
    </p>

    <table style="width:100%;border-collapse:collapse;border:1px solid #EFF2F5;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#F8FAFB;">
          <th style="padding:10px 12px;font-size:11px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.8px;text-align:left;">Credential</th>
          <th style="padding:10px 12px;font-size:11px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.8px;text-align:right;">Status</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${portalUrl}/credentials"
        style="display:inline-block;padding:13px 32px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        Upload My Credentials →
      </a>
    </div>

    <p style="color:#94A3B8;font-size:12px;margin:0;border-top:1px solid #EFF2F5;padding-top:16px;">
      If a credential does not apply to your role, please contact your supervisor. This is an automated alert from the Vitalis Healthcare staff portal.
    </p>
  </div>

  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;">
    Vitalis Healthcare Services, LLC<br>
    8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910
  </div>
</div>
</body>
</html>`
}
