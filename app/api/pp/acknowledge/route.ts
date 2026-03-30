import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Always verify server-side — never trust the client payload alone
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const { data: profile } = await svc
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  const { docId, docVersion, timestamp } = await request.json()

  if (!docId || !docVersion) {
    return NextResponse.json({ error: 'docId and docVersion required' }, { status: 400 })
  }

  // Verify the policy exists
  const { data: policy } = await svc
    .from('pp_policies')
    .select('doc_id, title, version, applicable_roles')
    .eq('doc_id', docId)
    .single()

  if (!policy) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  // Map portal role to PP role
  const userRole = profile?.role || ''
  const ppRole = userRole === 'admin' ? 'Administrator'
    : userRole === 'supervisor' ? 'Director of Nursing'
    : userRole === 'caregiver' ? 'CNA'
    : 'All Staff'

  // Verify this policy applies to the user
  const roles = policy.applicable_roles || []
  const applies = roles.includes('All Staff') || roles.includes(ppRole)
  if (!applies && userRole !== 'admin' && userRole !== 'supervisor') {
    return NextResponse.json({ error: 'This policy does not apply to your role' }, { status: 403 })
  }

  // Insert acknowledgment — ON CONFLICT DO NOTHING prevents duplicate taps on mobile
  const { error } = await svc
    .from('pp_acknowledgments')
    .insert({
      doc_id: docId,
      doc_version: docVersion,
      user_id: user.id,
      user_role: ppRole,
      acknowledged_at: timestamp || new Date().toISOString(),
    })

  if (error && error.code !== '23505') {
    // 23505 = unique violation = already acknowledged = success
    console.error('Acknowledgment insert error:', error)
    return NextResponse.json({ error: 'Failed to record acknowledgment' }, { status: 500 })
  }

  // Audit log — best effort, non-blocking
  try {
    await svc.from('audit_log').insert({
      user_id: user.id,
      action: `Acknowledged policy ${docId} v${docVersion}`,
      entity_type: 'policy',
    })
  } catch {}

  // Send confirmation email — best effort, non-blocking
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
    const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

    if (RESEND_API_KEY && profile?.email) {
      const staffName = profile.full_name || 'Team Member'
      const policyTitle = policy.title || docId
      const ackDate = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })
      const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<div style="max-width:540px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Vitalis Healthcare Services</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Policy Acknowledgment Confirmation</p>
  </div>
  <div style="padding:32px;">
    <div style="background:#E6F6F4;border-left:4px solid #0E7C7B;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <div style="font-size:13px;font-weight:700;color:#0E4A4A;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">✓ Acknowledgment Recorded</div>
      <div style="font-size:14px;color:#1A2E44;font-weight:600;">${policyTitle}</div>
      <div style="font-size:12px;color:#4A6070;margin-top:4px;">Document version v${docVersion}</div>
    </div>
    <p style="color:#4A6070;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${staffName}</strong>, this email confirms that you have read and acknowledged the above Vitalis Healthcare policy.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="padding:8px 12px;background:#F8FAFC;border:1px solid #E2E8F0;font-size:12px;font-weight:600;color:#4A6070;width:40%;">Acknowledged by</td>
          <td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:13px;color:#1A2E44;">${staffName}</td></tr>
      <tr><td style="padding:8px 12px;background:#F8FAFC;border:1px solid #E2E8F0;font-size:12px;font-weight:600;color:#4A6070;">Date & Time</td>
          <td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:13px;color:#1A2E44;">${ackDate} ET</td></tr>
      <tr><td style="padding:8px 12px;background:#F8FAFC;border:1px solid #E2E8F0;font-size:12px;font-weight:600;color:#4A6070;">Policy</td>
          <td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:13px;color:#1A2E44;">${policyTitle}</td></tr>
      <tr><td style="padding:8px 12px;background:#F8FAFC;border:1px solid #E2E8F0;font-size:12px;font-weight:600;color:#4A6070;">Document ID</td>
          <td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:13px;color:#1A2E44;">${docId} · v${docVersion}</td></tr>
    </table>
    <p style="color:#8FA0B0;font-size:13px;line-height:1.6;margin:0 0 24px;">
      Please keep this email for your records. Your acknowledgment has been securely logged in the Vitalis compliance system and is available to your supervisors.
    </p>
    <div style="text-align:center;">
      <a href="${PORTAL_URL}/pp/${docId}" style="display:inline-block;padding:11px 26px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        View Policy ↗
      </a>
    </div>
  </div>
  <div style="text-align:center;padding:16px;font-size:11px;color:#94A3B8;border-top:1px solid #EFF2F5;">
    Vitalis Healthcare Services · 8757 Georgia Ave., Suite 440 · Silver Spring, MD 20910<br>
    RSA #3879R · This is an automated compliance confirmation.
  </div>
</div>
</body></html>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [profile.email],
          subject: `✓ Policy acknowledged: ${policyTitle} — ${ackDate}`,
          html,
        }),
      })
    }
  } catch (emailErr) {
    console.error('Policy ack email failed (non-fatal):', emailErr)
  }

  return NextResponse.json({ ok: true })
}
