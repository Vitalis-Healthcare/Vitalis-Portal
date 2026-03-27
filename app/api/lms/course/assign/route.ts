// app/api/lms/course/assign/route.ts
// Assigns one or more staff members to a course.
// Called by CourseAssignModal — replaces direct client-side supabase writes.
// Admin / supervisor only.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const RESEND_KEY  = process.env.RESEND_API_KEY

export async function POST(req: NextRequest) {
  // ── Auth + role gate ──────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: adminProfile } = await svc
    .from('profiles').select('role, full_name').eq('id', user.id).single()

  if (!['admin', 'supervisor'].includes(adminProfile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse ─────────────────────────────────────────────────────────────────
  const { courseId, courseName, userIds, dueDate, sendEmail } = await req.json()

  if (!courseId || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'courseId and userIds are required' }, { status: 400 })
  }

  // ── Insert enrollments ────────────────────────────────────────────────────
  const rows = userIds.map((userId: string) => ({
    course_id:    courseId,
    user_id:      userId,
    assigned_by:  user.id,
    assigned_at:  new Date().toISOString(),
    progress_pct: 0,
    due_date:     dueDate || null,
  }))

  const { error: insertError } = await svc
    .from('course_enrollments')
    .insert(rows)

  if (insertError) {
    // If some already exist, try inserting one at a time skipping duplicates
    if (insertError.message.includes('duplicate') || insertError.code === '23505') {
      let inserted = 0
      for (const row of rows) {
        const { error: singleError } = await svc.from('course_enrollments').insert(row)
        if (!singleError) inserted++
      }
      if (inserted === 0) {
        return NextResponse.json({ error: 'All selected staff are already enrolled.' }, { status: 409 })
      }
    } else {
      console.error('[course/assign] insert error:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  try {
    await svc.from('audit_log').insert({
      user_id:     user.id,
      action:      `Assigned course "${courseName}" to ${userIds.length} staff member(s)`,
      entity_type: 'course',
      entity_id:   courseId,
    })
  } catch { /* non-fatal */ }

  // ── Email notifications (optional) ───────────────────────────────────────
  if (sendEmail && RESEND_KEY) {
    const { data: staffProfiles } = await svc
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    const { data: courseData } = await svc
      .from('courses')
      .select('title, estimated_minutes, thumbnail_color')
      .eq('id', courseId)
      .single()

    for (const staff of staffProfiles || []) {
      if (!staff.email) continue
      const firstName = staff.full_name?.split(' ')[0] || 'there'
      const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:44px;height:44px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;margin-bottom:10px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">New Training Assigned</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:16px;color:#1A2E44;margin:0 0 12px;">Hi ${firstName} 👋</h2>
    <p style="color:#4A6070;font-size:14px;margin:0 0 16px;line-height:1.6;">
      A new training course has been assigned to you in the Vitalis Portal:
    </p>
    <div style="background:#F8FAFC;border-left:4px solid ${courseData?.thumbnail_color || '#0E7C7B'};border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
      <div style="font-size:16px;font-weight:700;color:#1A2E44;">${courseName}</div>
      ${courseData?.estimated_minutes ? `<div style="font-size:12px;color:#8FA0B0;margin-top:4px;">⏱ ${courseData.estimated_minutes} minutes</div>` : ''}
      ${dueDate ? `<div style="font-size:12px;color:#E63946;margin-top:4px;font-weight:600;">📅 Due ${new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>` : ''}
    </div>
    <div style="text-align:center;margin-bottom:20px;">
      <a href="${PORTAL_URL}/lms/courses/${courseId}" style="display:inline-block;padding:12px 32px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        Start Training →
      </a>
    </div>
    <p style="color:#94A3B8;font-size:12px;margin:0;line-height:1.6;">
      Log in to your Vitalis Portal at <a href="${PORTAL_URL}" style="color:#0E7C7B;">${PORTAL_URL}</a> to complete this training.
    </p>
  </div>
  <div style="text-align:center;padding:16px 0;font-size:11px;color:#94A3B8;">
    Vitalis Healthcare Services, LLC · Silver Spring, MD 20910
  </div>
</div>
</body>
</html>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [staff.email],
          subject: `New training assigned: ${courseName}`,
          html,
        }),
      }).catch(() => {}) // non-fatal
    }
  }

  return NextResponse.json({ success: true, assigned: userIds.length })
}
