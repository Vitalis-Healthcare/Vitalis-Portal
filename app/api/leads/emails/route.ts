// app/api/leads/emails/route.ts
// ═════════════════════════════════════════════════════════════════════════
// Ship 5a (v0.6.45) — POST: send an outbound email from a lead workspace.
//
// The send IS the action, so this route is honest about failure:
//   • LEADS_EMAILS_PAUSED → 409, refused explicitly (never silent).
//   • Resend failure / suppression (200-no-id) → 502 with the reason;
//     a lead_emails row is written with status='failed' for the audit
//     trail, and NO timeline activity is logged (a failed send is not
//     an email the client received).
// On success, write order is: lead_activities (the timeline entry) →
// lead_emails (linked by activity_id, so the timeline can wear the 5c
// delivery badge) → the optional next-action mirror (same behavior as
// the activity route: a follow-up date BECOMES the next action).
// ═════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { leadsEmailsPaused, renderLeadEmailHtml, sendLeadOutbound } from '@/lib/leads/outbound'

const MAX_SUBJECT = 200
const MAX_BODY = 10000

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (leadsEmailsPaused()) {
    return NextResponse.json(
      { error: 'Lead emails are paused (LEADS_EMAILS_PAUSED is set in Vercel). Remove the env var and redeploy to resume sending.' },
      { status: 409 },
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

  const lead_id: string = body.lead_id
  const to: string = (body.to || '').trim()
  const subject: string = (body.subject || '').trim()
  const emailBody: string = (body.body || '').trim()
  const template_key: string | null = body.template_key || null
  const follow_up: string | null = body.follow_up || null

  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: 'A valid recipient email address is required' }, { status: 400 })
  }
  if (!subject) return NextResponse.json({ error: 'Subject required' }, { status: 400 })
  if (!emailBody) return NextResponse.json({ error: 'Message body required' }, { status: 400 })
  if (subject.length > MAX_SUBJECT) return NextResponse.json({ error: `Subject too long (max ${MAX_SUBJECT})` }, { status: 400 })
  if (emailBody.length > MAX_BODY) return NextResponse.json({ error: `Message too long (max ${MAX_BODY} characters)` }, { status: 400 })

  const { data: lead } = await svc.from('leads').select('id, full_name, archived_at').eq('id', lead_id).maybeSingle()
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.archived_at) return NextResponse.json({ error: 'This lead is archived — restore it before emailing' }, { status: 409 })

  const senderName = profile?.full_name || 'Vitalis HealthCare'
  const senderEmail = user.email || ''
  if (!senderEmail) return NextResponse.json({ error: 'Your account has no email address to send from' }, { status: 400 })

  const html = renderLeadEmailHtml(emailBody, senderName)

  // ── Send (hard-fail) ────────────────────────────────────────────────
  let resendId: string
  let fromEmail: string
  try {
    const result = await sendLeadOutbound({ to, subject, html, senderName, senderEmail })
    resendId = result.resendId
    fromEmail = result.fromEmail
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown send failure'
    // Audit the failure; no timeline entry — the client received nothing.
    try {
      await svc.from('lead_emails').insert({
        lead_id, sent_by: user.id, to_email: to, from_email: senderEmail,
        subject, html, template_key, status: 'failed', failure_reason: reason,
      })
    } catch (auditErr) {
      console.error('[leads/emails] failed-send audit insert failed:', auditErr)
    }
    return NextResponse.json({ error: `Email failed to send: ${reason}` }, { status: 502 })
  }

  // ── Timeline entry ──────────────────────────────────────────────────
  let activityId: string | null = null
  try {
    const { data: activity } = await svc.from('lead_activities').insert({
      lead_id, created_by: user.id,
      activity_type: 'email',
      content: `Email sent: ${subject}`,
      next_follow_up: follow_up,
    }).select('id').single()
    activityId = activity?.id || null
  } catch (err) {
    console.error('[leads/emails] timeline insert failed after successful send:', err)
  }

  // ── The email record (5c webhook target) ────────────────────────────
  const { data: emailRow, error: emailErr } = await svc.from('lead_emails').insert({
    lead_id, sent_by: user.id, to_email: to, from_email: fromEmail,
    subject, html, template_key, resend_id: resendId,
    status: 'sent', activity_id: activityId,
  }).select().single()
  if (emailErr) console.error('[leads/emails] lead_emails insert failed after successful send:', emailErr)

  // ── Follow-up BECOMES the next action (v0.6.39 rule, verbatim) ──────
  if (follow_up) {
    try {
      await svc.from('leads').update({
        next_action_type: 'follow_up',
        next_action_due: follow_up,
        next_action_note: null,
        updated_at: new Date().toISOString(),
      }).eq('id', lead_id)
    } catch (err) {
      console.error('[leads/emails] next-action mirror failed:', err)
    }
  }

  return NextResponse.json({ sent: true, email: emailRow, activity_id: activityId })
}
