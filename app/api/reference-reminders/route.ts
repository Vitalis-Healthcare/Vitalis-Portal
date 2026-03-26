// app/api/reference-reminders/route.ts
// Vercel Cron — runs daily at 11:00 UTC
// At 15 days: reminder to referee + caregiver notified
// At 30 days: second reminder to referee + caregiver notified
// At 45 days: final warning — referee reminder + caregiver warned of schedule removal
// All emails CC team@vitalishealthcare.com
// Deduplicates via reference_reminder_log

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const TEAM_EMAIL = 'team@vitalishealthcare.com'
const REMINDER_DAYS = [15, 30, 45]

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const svc = createServiceClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let totalSent = 0
  const errors: string[] = []

  for (const days of REMINDER_DAYS) {
    const cutoffDate = new Date(today)
    cutoffDate.setDate(today.getDate() - days)
    const cutoffStr = cutoffDate.toISOString()

    // References sent on or before cutoff that are still pending/sent (not received)
    const { data: refs } = await svc
      .from('caregiver_references')
      .select('*, caregiver:caregiver_id(full_name, email)')
      .in('status', ['sent', 'pending'])
      .lte('sent_at', cutoffStr)

    for (const ref of refs ?? []) {
      if (!ref.sent_at) continue

      // Dedup — skip if already sent this day's reminder
      const { data: logged } = await svc
        .from('reference_reminder_log')
        .select('id')
        .eq('reference_id', ref.id)
        .eq('reminder_day', days)
        .maybeSingle()

      if (logged) continue

      const caregiverName  = (ref.caregiver as any)?.full_name || 'Your caregiver'
      const caregiverEmail = (ref.caregiver as any)?.email
      const formUrl        = `${PORTAL_URL}/ref/${ref.token}`
      const isPro          = ref.reference_type === 'professional'
      const formType       = isPro ? 'Employment Reference' : 'Character Reference'
      const isFinal        = days === 45

      // 1. Email to referee
      const refereeHtml = buildRefereeReminder({ days, isFinal, caregiverName, refereeName: ref.referee_name, formUrl, isPro })
      const refereeRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [ref.referee_email],
          cc: [TEAM_EMAIL],
          subject: isFinal
            ? `[Final Notice] Reference still needed — ${caregiverName} · Vitalis Healthcare`
            : `[Reminder ${days} days] Reference Request — ${caregiverName} · Vitalis Healthcare`,
          html: refereeHtml,
        }),
      })

      // 2. Email to caregiver
      if (caregiverEmail) {
        const caregiverHtml = buildCaregiverNotice({ days, isFinal, refereeName: ref.referee_name, refereeEmail: ref.referee_email, formType })
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [caregiverEmail],
            cc: [TEAM_EMAIL],
            subject: isFinal
              ? `⚠️ Final notice: reference not received — action required`
              : `Update: reference still pending (${days} days)`,
            html: caregiverHtml,
          }),
        })
      }

      if (refereeRes.ok) {
        await svc.from('reference_reminder_log').insert({ reference_id: ref.id, reminder_day: days })
        await svc.from('caregiver_references').update({
          reminder_count:   (ref.reminder_count || 0) + 1,
          last_reminder_at: new Date().toISOString(),
          updated_at:       new Date().toISOString(),
        }).eq('id', ref.id)
        totalSent++
      } else {
        const err = await refereeRes.text()
        errors.push(`${ref.referee_email} (${days}d): ${err}`)
      }
    }
  }

  return NextResponse.json({ success: true, totalSent, ...(errors.length && { errors }) })
}

function buildRefereeReminder({ days, isFinal, caregiverName, refereeName, formUrl, isPro }: {
  days: number; isFinal: boolean; caregiverName: string; refereeName?: string; formUrl: string; isPro: boolean
}) {
  const urgencyColor = isFinal ? '#E63946' : days >= 30 ? '#F4A261' : '#F4B942'
  const urgencyBg    = isFinal ? '#FDE8E9' : days >= 30 ? '#FEF3EA' : '#FFFBEA'
  const urgencyLabel = isFinal ? 'FINAL NOTICE' : days >= 30 ? 'ACTION NEEDED' : 'REMINDER'
  const greeting     = refereeName ? `Dear ${refereeName},` : 'Dear Reference,'

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:48px;height:48px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;margin-bottom:10px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Vitalis Healthcare Services</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <div style="display:inline-block;padding:4px 14px;background:${urgencyBg};border-radius:20px;font-size:11px;font-weight:700;color:${urgencyColor};letter-spacing:0.8px;margin-bottom:16px;">${urgencyLabel}</div>
    <p style="color:#4A6070;font-size:14px;line-height:1.7;margin:0 0 16px;">${greeting}</p>
    <p style="color:#4A6070;font-size:14px;line-height:1.7;margin:0 0 16px;">
      We are following up regarding the ${isPro ? 'employment' : 'character'} reference you were asked to provide for <strong>${caregiverName}</strong>. We have not yet received your response.
    </p>
    ${isFinal ? `<p style="color:#E63946;font-size:14px;font-weight:700;line-height:1.7;margin:0 0 16px;">This is our final reminder. If we do not receive the reference, we may be unable to proceed with ${caregiverName}'s placement on our schedule.</p>` : ''}
    <div style="text-align:center;margin:24px 0;">
      <a href="${formUrl}" style="display:inline-block;padding:13px 32px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        Complete the Reference Form →
      </a>
    </div>
    <p style="color:#94A3B8;font-size:12px;margin:0;border-top:1px solid #EFF2F5;padding-top:14px;">
      Questions? Contact us at ${TEAM_EMAIL} or call 267.474.8578.
    </p>
  </div>
</div>
</body></html>`
}

function buildCaregiverNotice({ days, isFinal, refereeName, refereeEmail, formType }: {
  days: number; isFinal: boolean; refereeName?: string; refereeEmail: string; formType: string
}) {
  const referee = refereeName || refereeEmail

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:${isFinal ? '#E63946' : '#1A2E44'};padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Vitalis Healthcare Services</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:16px;color:#1A2E44;margin:0 0 16px;">
      ${isFinal ? '⚠️ Final Notice: Reference Not Received' : `Reference Pending — ${days} Days`}
    </h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.7;margin:0 0 16px;">
      We have not yet received the <strong>${formType}</strong> from <strong>${referee}</strong>.
      ${days === 15 ? 'We have sent them a reminder.' : days === 30 ? 'We have now sent them a second reminder.' : ''}
    </p>
    ${isFinal ? `
    <div style="background:#FDE8E9;border:1px solid #E63946;border-radius:8px;padding:14px 18px;margin-bottom:16px;">
      <p style="color:#E63946;font-size:13px;font-weight:700;margin:0;">
        If this reference is not received, you may be removed from the schedule. Please contact ${referee} directly or provide an alternative reference as soon as possible.
      </p>
    </div>` : ''}
    <a href="${PORTAL_URL}/references" style="display:inline-block;padding:11px 24px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">
      View My References →
    </a>
  </div>
</div>
</body></html>`
}
