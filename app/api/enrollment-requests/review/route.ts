// app/api/enrollment-requests/review/route.ts
// Admin/supervisor approves or rejects an enrollment request.
// On approval: creates the programme_enrollment record and notifies the caregiver.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(viewer?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { requestId, approve, review_notes } = await request.json()
  if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })

  const { data: req } = await svc
    .from('enrollment_requests')
    .select('*, caregiver:user_id(full_name, email)')
    .eq('id', requestId)
    .single()

  if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  // Update request status
  await svc.from('enrollment_requests').update({
    status:      approve ? 'approved' : 'rejected',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    review_notes: review_notes || null,
  }).eq('id', requestId)

  // On approval: enroll them
  if (approve && req.programme_id) {
    await svc.from('programme_enrollments').upsert({
      user_id:      req.user_id,
      programme_id: req.programme_id,
      assigned_by:  user.id,
      status:       'enrolled',
    }, { onConflict: 'user_id,programme_id' })
  } else if (approve && req.course_id) {
    await svc.from('course_enrollments').upsert({
      user_id:     req.user_id,
      course_id:   req.course_id,
      assigned_by: user.id,
    }, { onConflict: 'user_id,course_id' })
  }

  // Get title
  let title = 'Training'
  if (req.programme_id) {
    const { data: prog } = await svc.from('programmes').select('title').eq('id', req.programme_id).single()
    title = prog?.title || 'Programme'
  } else if (req.course_id) {
    const { data: course } = await svc.from('courses').select('title').eq('id', req.course_id).single()
    title = course?.title || 'Course'
  }

  // Notify caregiver
  const caregiverEmail = (req.caregiver as any)?.email
  const caregiverName  = (req.caregiver as any)?.full_name || 'Team Member'
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (RESEND_API_KEY && caregiverEmail) {
    const html = approve ? `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:48px;height:48px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;margin-bottom:10px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Vitalis Healthcare</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <div style="display:inline-block;padding:4px 14px;background:#E6F6F4;border-radius:20px;font-size:11px;font-weight:700;color:#0E7C7B;letter-spacing:0.8px;margin-bottom:16px;">✓ APPROVED</div>
    <h2 style="font-size:16px;color:#1A2E44;margin:0 0 12px;">Your Enrollment Request Has Been Approved</h2>
    <p style="color:#4A6070;font-size:14px;margin:0 0 16px;">Hi <strong>${caregiverName}</strong>,<br><br>
    Your request to enroll in <strong>${title}</strong> has been approved. You can now access this training from your portal.</p>
    ${review_notes ? `<div style="background:#F8FAFB;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#4A6070;border:1px solid #E2E8F0;">Note from supervisor: "${review_notes}"</div>` : ''}
    <a href="${PORTAL_URL}/lms" style="display:inline-block;padding:11px 24px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">Start Training →</a>
  </div>
</div>
</body></html>` : `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#1A2E44;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Vitalis Healthcare</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:16px;color:#1A2E44;margin:0 0 12px;">Enrollment Request Update</h2>
    <p style="color:#4A6070;font-size:14px;margin:0 0 16px;">Hi <strong>${caregiverName}</strong>,<br><br>
    Your request to enroll in <strong>${title}</strong> was not approved at this time.</p>
    ${review_notes ? `<div style="background:#F8FAFB;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#4A6070;border:1px solid #E2E8F0;">Note: "${review_notes}"</div>` : ''}
    <p style="color:#8FA0B0;font-size:12px;">If you have questions, please contact your supervisor.</p>
  </div>
</div>
</body></html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [caregiverEmail], subject: approve ? `✓ Enrollment approved: ${title}` : `Enrollment request update: ${title}`, html }),
    })
  }

  return NextResponse.json({ success: true })
}
