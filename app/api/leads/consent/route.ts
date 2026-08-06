// app/api/leads/consent/route.ts
// ═════════════════════════════════════════════════════════════════════════
// Ship 5b (v0.6.46) — POST: prepare and send the Service Agreement /
// Consent Form from a lead workspace.
//
// Flow: validate → void any live consent link (one live link per lead;
// re-sending revokes the old one, the v0.6.37 email-change rule) →
// create the lead_consents row (rep pre-signs here, per ruling) → send
// the signing-link email (hard-fail; a dead row with no email is rolled
// back to void) → consent_status='sent' + the same timeline log line the
// update route writes → lead_emails audit row.
// ═════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { leadsEmailsPaused, sendLeadOutbound } from '@/lib/leads/outbound'
import { renderConsentRequestEmail } from '@/lib/leads/consent-render'
import {
  AGREEMENT_VERSION, EMAIL_REASSURANCE_PARAGRAPH, isValidBillingMethod,
  type ConsentPrefill,
} from '@/lib/leads/consent-content'
import { firstNameOf, isSelfLead, recipientNameOf } from '@/lib/leads/email-templates'
import { prettyKey } from '@/lib/leads/model'

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

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
  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: 'A valid recipient email address is required' }, { status: 400 })
  }

  const { data: lead } = await svc
    .from('leads')
    .select('id, full_name, client_name, relationship, consent_status, archived_at, status')
    .eq('id', lead_id).maybeSingle()
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.archived_at) return NextResponse.json({ error: 'This lead is archived \u2014 restore it before sending the agreement' }, { status: 409 })
  if ((lead.consent_status || '') === 'signed') {
    return NextResponse.json({ error: 'The agreement is already signed for this lead' }, { status: 409 })
  }

  // ── Prefill validation ───────────────────────────────────────────────
  const pf = body.prefill || {}
  const client_name = (pf.client_name || '').trim()
  if (!client_name) return NextResponse.json({ error: 'Client name is required on the agreement' }, { status: 400 })
  const billing_method = String(pf.billing_method || '')
  if (!isValidBillingMethod(billing_method)) {
    return NextResponse.json({ error: 'Choose a billing method for the agreement' }, { status: 400 })
  }
  if (billing_method === 'private_pay' && !(pf.private_pay_rate || '').trim()) {
    return NextResponse.json({ error: 'Enter the agreed Private Pay rate \u2014 it prints on the agreement' }, { status: 400 })
  }

  const norm = (v: unknown): string | null => {
    const s = String(v ?? '').trim()
    return s ? s : null
  }
  const prefill: ConsentPrefill = {
    client_name,
    dob: norm(pf.dob),
    address: norm(pf.address),
    city: norm(pf.city),
    state: norm(pf.state),
    zip: norm(pf.zip),
    start_of_care: norm(pf.start_of_care),
    ltc_insurer: norm(pf.ltc_insurer),
    ltc_claim: norm(pf.ltc_claim),
    billing_method,
    private_pay_rate: billing_method === 'private_pay' ? norm(pf.private_pay_rate) : null,
    insurance_projected: billing_method === 'insurance' ? norm(pf.insurance_projected) : null,
  }

  const repName = (body.rep_name || profile?.full_name || '').trim()
  if (!repName) return NextResponse.json({ error: 'The Vitalis representative name is required' }, { status: 400 })

  // ── One live link per lead: void any sent/viewed consent first ───────
  await svc.from('lead_consents')
    .update({ status: 'void', voided_at: new Date().toISOString() })
    .eq('lead_id', lead_id).in('status', ['sent', 'viewed'])

  const token = randomBytes(24).toString('hex')
  const { data: consent, error: consentErr } = await svc.from('lead_consents').insert({
    lead_id, token, status: 'sent',
    agreement_version: AGREEMENT_VERSION,
    prefill,
    rep_name: repName,
    rep_signature_kind: 'typed',
    rep_signature_data: repName,
    sent_by: user.id,
  }).select('id, token').single()
  if (consentErr || !consent) {
    return NextResponse.json({ error: `Could not create the agreement record: ${consentErr?.message || 'unknown error'}` }, { status: 500 })
  }

  // ── The signing-link email (LOCKED copy incl. reassurance) ───────────
  const contact = firstNameOf(lead.full_name)
  const self = isSelfLead(lead)
  const who = recipientNameOf(lead)
  const signUrl = `${PORTAL_URL}/consent/${consent.token}`
  const senderName = profile?.full_name || 'Vitalis HealthCare'
  const subject = 'Your Vitalis Service Agreement is ready to sign'

  const paragraphsBefore = [
    `Dear ${contact},`,
    self
      ? 'We\u2019ve prepared your Home Care Service Agreement and Consent Form. It covers the services we\u2019ll provide, your rights and responsibilities as a client, and how billing works \u2014 everything we discussed, in writing.'
      : `We\u2019ve prepared the Home Care Service Agreement and Consent Form for ${who}. It covers the services we\u2019ll provide, your rights and responsibilities as a client, and how billing works \u2014 everything we discussed, in writing.`,
    EMAIL_REASSURANCE_PARAGRAPH,
    'You can review and sign it securely from your phone, tablet, or computer. It takes about five minutes, and Vitalis has already signed our side.',
  ]
  const paragraphsAfter = [
    'If anything in the agreement is unclear, or you\u2019d rather go through it together over the phone, reply to this email or call (240) 716-6874 \u2014 we\u2019re glad to walk through it with you before you sign.',
  ]
  const html = renderConsentRequestEmail({ paragraphsBefore, paragraphsAfter, signUrl, senderName })

  let resendId: string
  let fromEmail: string
  try {
    const result = await sendLeadOutbound({ to, subject, html, senderName, senderEmail: user.email || '' })
    resendId = result.resendId
    fromEmail = result.fromEmail
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown send failure'
    // The link never reached anyone — void the row so it cannot dangle live.
    await svc.from('lead_consents')
      .update({ status: 'void', voided_at: new Date().toISOString() })
      .eq('id', consent.id)
    return NextResponse.json({ error: `The agreement email failed to send: ${reason}` }, { status: 502 })
  }

  // ── Timeline + consent_status (mirrors the update route's log line) ──
  const prevConsent = lead.consent_status || 'not_started'
  await svc.from('leads').update({ consent_status: 'sent', updated_at: new Date().toISOString() }).eq('id', lead_id)
  if (prevConsent !== 'sent') {
    try {
      await svc.from('lead_activities').insert({
        lead_id, created_by: user.id, activity_type: 'status_change',
        content: `Consent milestone: ${prettyKey(prevConsent)} \u2192 ${prettyKey('sent')}`,
      })
    } catch (err) { console.error('[leads/consent] consent status log failed:', err) }
  }

  let activityId: string | null = null
  try {
    const { data: activity } = await svc.from('lead_activities').insert({
      lead_id, created_by: user.id, activity_type: 'email',
      content: `Email sent: ${subject}`,
    }).select('id').single()
    activityId = activity?.id || null
  } catch (err) { console.error('[leads/consent] email timeline insert failed:', err) }

  const { data: emailRow } = await svc.from('lead_emails').insert({
    lead_id, sent_by: user.id, to_email: to, from_email: fromEmail,
    subject, html, template_key: 'consent_request', resend_id: resendId,
    status: 'sent', activity_id: activityId,
  }).select().single()

  if (emailRow?.id) {
    await svc.from('lead_consents').update({ email_id: emailRow.id }).eq('id', consent.id)
  }

  return NextResponse.json({
    sent: true,
    consent: { id: consent.id, status: 'sent', created_at: new Date().toISOString() },
    email: emailRow || null,
    activity_id: activityId,
  })
}
