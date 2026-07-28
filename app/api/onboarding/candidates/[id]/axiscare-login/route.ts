// app/api/onboarding/candidates/[id]/axiscare-login/route.ts
//
// Sends the AxisCare login instructions to a converted caregiver.
//
// Gated on BOTH conversion and an AxisCare applicant record, because the email
// hands out sign-in details for an account that has to already exist. Sending
// it early would give someone credentials for nothing and generate a support
// call, so the route refuses and says which half is missing.
//
// Dynamic route -> params must be awaited (pitfalls #5).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildAxisCareLoginEmail } from '@/lib/onboarding/axiscare-login-email'

export const dynamic = 'force-dynamic'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const TEAM_NOTIFY = process.env.TEAM_NOTIFY_EMAIL || 'team@vitalishealthcare.com'
const RESEND_KEY = process.env.RESEND_API_KEY

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor', 'staff'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }

  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, email, axiscare_applicant_id, converted_to_profile_id, axiscare_login_sent_at')
    .eq('id', id)
    .maybeSingle()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  if (!cand.converted_to_profile_id) {
    return NextResponse.json({
      error: 'Convert this candidate to a caregiver first — these instructions are for someone who already has an account.',
    }, { status: 409 })
  }
  if (!cand.axiscare_applicant_id) {
    return NextResponse.json({
      error: 'Push this candidate to AxisCare first — the email hands out sign-in details for a profile that has to exist.',
    }, { status: 409 })
  }
  if (!cand.email) {
    return NextResponse.json({ error: 'This candidate has no email address on file.' }, { status: 400 })
  }
  if (!RESEND_KEY) {
    return NextResponse.json({ error: 'Email service is not configured.' }, { status: 503 })
  }

  const html = buildAxisCareLoginEmail({
    firstName: cand.first_name || 'there',
    loginEmail: cand.email,
    lastName: cand.last_name || '',
  })

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [cand.email],
        bcc: [TEAM_NOTIFY],
        subject: 'Your profile is now in AxisCare — how to sign in',
        html,
      }),
    })
    if (!res.ok) {
      const detail = await res.text()
      console.error('[axiscare-login] resend error:', detail)
      return NextResponse.json({ error: 'The email could not be sent. Please try again.' }, { status: 502 })
    }
  } catch (err) {
    console.error('[axiscare-login] resend threw:', err)
    return NextResponse.json({ error: 'The email could not be sent. Please try again.' }, { status: 502 })
  }

  const sentAt = new Date().toISOString()
  try {
    const { error } = await svc
      .from('onb_candidates')
      .update({ axiscare_login_sent_at: sentAt, updated_at: sentAt })
      .eq('id', id)
    if (error) {
      // The email is already gone; report success but note the bookkeeping gap.
      console.error('[axiscare-login] could not record sent_at:', error.message)
      return NextResponse.json({
        success: true, sent_at: sentAt, email: cand.email,
        warning: 'The email was sent, but the record of it could not be saved.',
      })
    }
  } catch (err) {
    console.error('[axiscare-login] sent_at update threw:', err)
  }

  const resend = !!cand.axiscare_login_sent_at
  return NextResponse.json({ success: true, sent_at: sentAt, email: cand.email, resend })
}
