// app/api/references/resend/route.ts
// Resends a reference email for a specific reference ID.
// Callable by admin/supervisor/staff OR by a caregiver for their own references.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const TEAM_EMAIL = 'team@vitalishealthcare.com'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()

  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = ['admin', 'supervisor', 'staff'].includes(viewer?.role || '')
  const isCaregiver = viewer?.role === 'caregiver'

  // Must be admin/supervisor/staff OR a caregiver (caregivers can only resend their own — enforced below)
  if (!isAdmin && !isCaregiver) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { referenceId } = await request.json()
  if (!referenceId) return NextResponse.json({ error: 'referenceId required' }, { status: 400 })

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) return NextResponse.json({ error: 'Email not configured' }, { status: 500 })

  // Load the reference + caregiver name
  const { data: ref } = await svc
    .from('caregiver_references')
    .select('*, caregiver:caregiver_id(full_name)')
    .eq('id', referenceId)
    .single()

  if (!ref) return NextResponse.json({ error: 'Reference not found' }, { status: 404 })

  // Caregivers may only resend their own references
  if (isCaregiver && ref.caregiver_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (ref.status === 'received') return NextResponse.json({ error: 'Reference already received' }, { status: 400 })

  const caregiverName = (ref.caregiver as any)?.full_name || 'A Vitalis Healthcare caregiver'
  const formUrl = `${PORTAL_URL}/ref/${ref.token}`
  const isProfessional = ref.reference_type === 'professional'

  const html = buildReferenceEmail({ caregiverName, refereeName: ref.referee_name, formUrl, isProfessional, isResend: true })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [ref.referee_email],
      cc: [TEAM_EMAIL],
      subject: `[Reminder] Reference Request — ${caregiverName} · Vitalis Healthcare`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  // Update sent_at and status
  await svc.from('caregiver_references').update({
    sent_at: new Date().toISOString(),
    status: 'sent',
    updated_at: new Date().toISOString(),
  }).eq('id', referenceId)

  return NextResponse.json({ success: true })
}

function buildReferenceEmail({ caregiverName, refereeName, formUrl, isProfessional, isResend }: {
  caregiverName: string; refereeName?: string; formUrl: string; isProfessional: boolean; isResend?: boolean
}) {
  const greeting = refereeName ? `Dear ${refereeName},` : 'Dear Reference,'
  const formType = isProfessional ? 'Employment Reference Form' : 'Character Reference Verification'

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Vitalis Healthcare Services</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    ${isResend ? `<div style="display:inline-block;padding:4px 14px;background:#FFFBEA;border-radius:20px;font-size:11px;font-weight:700;color:#F4B942;letter-spacing:0.8px;margin-bottom:18px;">REMINDER</div>` : ''}
    <p style="color:#4A6070;font-size:15px;line-height:1.7;margin:0 0 20px;">${greeting}</p>
    <p style="color:#4A6070;font-size:14px;line-height:1.7;margin:0 0 16px;">
      ${isResend ? 'This is a friendly reminder that we are still awaiting your reference for' : 'We are writing regarding'} <strong>${caregiverName}</strong>, who has applied to Vitalis Healthcare Services, LLC and submitted your name as a reference.
    </p>
    <p style="color:#4A6070;font-size:14px;line-height:1.7;margin:0 0 24px;">
      We would appreciate your cooperation in completing our <strong>${formType}</strong>. Your response will be kept in the strictest confidence.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${formUrl}" style="display:inline-block;padding:14px 36px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
        Complete the ${isProfessional ? 'Employment' : 'Character'} Reference Form →
      </a>
    </div>
    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="color:#4A6070;font-size:13px;margin:0;line-height:1.6;">
        No login required. If the button above does not work, copy and paste this link:<br>
        <span style="color:#0E7C7B;font-size:12px;word-break:break-all;">${formUrl}</span>
      </p>
    </div>
    <p style="color:#94A3B8;font-size:12px;margin:0;border-top:1px solid #EFF2F5;padding-top:16px;">
      Questions? Contact us at team@vitalishealthcare.com or call 267.474.8578.
    </p>
  </div>
  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;">
    Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910
  </div>
</div>
</body>
</html>`
}
