// app/api/enrollment-requests/create/route.ts
// Caregiver submits a request to enroll in a programme or course.
// Admin/supervisor is notified. Request sits pending until reviewed.

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
  const { programme_id, course_id, request_message } = await request.json()

  if (!programme_id && !course_id) {
    return NextResponse.json({ error: 'programme_id or course_id required' }, { status: 400 })
  }

  const { data: profile } = await svc.from('profiles').select('full_name, role').eq('id', user.id).single()

  // Check not already enrolled or pending
  if (programme_id) {
    const { data: existing } = await svc
      .from('enrollment_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('programme_id', programme_id)
      .in('status', ['pending'])
      .maybeSingle()
    if (existing) return NextResponse.json({ error: 'You already have a pending enrollment request for this programme.' }, { status: 409 })

    const { data: enrolled } = await svc
      .from('programme_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('programme_id', programme_id)
      .maybeSingle()
    if (enrolled) return NextResponse.json({ error: 'You are already enrolled in this programme.' }, { status: 409 })
  }

  const { data: req, error } = await svc
    .from('enrollment_requests')
    .insert({ user_id: user.id, programme_id: programme_id || null, course_id: course_id || null, request_message: request_message || null })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get programme/course title for notification
  let title = 'Training'
  if (programme_id) {
    const { data: prog } = await svc.from('programmes').select('title').eq('id', programme_id).single()
    title = prog?.title || 'Programme'
  } else if (course_id) {
    const { data: course } = await svc.from('courses').select('title').eq('id', course_id).single()
    title = course?.title || 'Course'
  }

  // Notify admins/supervisors
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (RESEND_API_KEY) {
    const { data: admins } = await svc.from('profiles').select('email, full_name').in('role', ['admin', 'supervisor']).eq('status', 'active')
    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#1A2E44;padding:24px 32px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Training Enrollment Request</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <div style="display:inline-block;padding:4px 14px;background:#EBF4FF;border-radius:20px;font-size:11px;font-weight:700;color:#457B9D;letter-spacing:0.8px;margin-bottom:16px;">ACTION REQUIRED</div>
    <p style="color:#4A6070;font-size:14px;margin:0 0 16px;"><strong>${profile?.full_name}</strong> has requested enrollment in:<br><strong style="color:#1A2E44;font-size:16px;">${title}</strong></p>
    ${request_message ? `<div style="background:#F8FAFB;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#4A6070;border:1px solid #E2E8F0;">"${request_message}"</div>` : ''}
    <a href="${PORTAL_URL}/lms" style="display:inline-block;padding:11px 24px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">Review Request →</a>
  </div>
</div>
</body></html>`
    for (const admin of admins || []) {
      if (!admin.email) continue
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: [admin.email], cc: [TEAM_EMAIL], subject: `[Vitalis] Enrollment request: ${profile?.full_name} → ${title}`, html }),
      })
    }
  }

  return NextResponse.json({ success: true, requestId: req.id })
}
