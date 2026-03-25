import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalis.care>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

export async function POST(request: Request) {
  if (!RESEND_API_KEY) {
    // Email not configured — silently succeed so assignment still works
    return NextResponse.json({ success: true, message: 'Email not configured — RESEND_API_KEY missing' })
  }

  const { courseId, courseName, userIds, dueDate } = await request.json()

  const supabase = await createClient()

  // Fetch email addresses for the assigned users
  const { data: staffProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  if (!staffProfiles || staffProfiles.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  let sent = 0
  const errors: string[] = []

  for (const staff of staffProfiles) {
    if (!staff.email) continue

    const dueLine = dueDate
      ? `<p style="color:#4A6070;font-size:14px;">This training is due by <strong>${new Date(dueDate).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</strong>.</p>`
      : ''

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#F8FAFC;padding:32px 16px;">
        <div style="background:#0E7C7B;padding:20px 28px;border-radius:10px 10px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Vitalis Healthcare</h1>
          <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:4px 0 0;">Staff Compliance Portal</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-radius:0 0 10px 10px;">
          <h2 style="font-size:18px;color:#1A2E44;margin:0 0 16px;">New Training Assigned</h2>
          <p style="color:#4A6070;font-size:14px;margin-bottom:8px;">Hi <strong>${staff.full_name}</strong>,</p>
          <p style="color:#4A6070;font-size:14px;margin-bottom:16px;">
            A new training course has been assigned to you:
          </p>
          <div style="background:#EFF2F5;border-left:4px solid #0E7C7B;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px;">
            <div style="font-size:16px;font-weight:700;color:#1A2E44;">${courseName}</div>
          </div>
          ${dueLine}
          <p style="color:#4A6070;font-size:14px;margin-bottom:24px;">
            Log in to the portal to begin your training. You can track your progress and complete the course at your own pace.
          </p>
          <a
            href="${PORTAL_URL}/lms/courses/${courseId}/take"
            style="display:inline-block;padding:11px 26px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;"
          >
            Start Training ↗
          </a>
          <p style="color:#B0BEC5;font-size:12px;margin-top:28px;border-top:1px solid #EFF2F5;padding-top:16px;">
            This notification was sent by the Vitalis Healthcare staff portal. If you have questions, contact your supervisor.
          </p>
        </div>
      </div>
    `

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [staff.email],
          subject: `New Training Assigned: ${courseName}`,
          html
        })
      })

      if (res.ok) {
        // Log the email
        await supabase.from('email_log').insert({
          recipient_email: staff.email,
          subject: `New Training Assigned: ${courseName}`,
          type: 'course_assigned',
          entity_id: courseId
        }).catch(() => {}) // non-critical

        sent++
      } else {
        const errBody = await res.text()
        errors.push(`${staff.email}: ${errBody}`)
      }
    } catch (err) {
      errors.push(`${staff.email}: ${String(err)}`)
    }
  }

  return NextResponse.json({ success: true, sent, errors })
}
