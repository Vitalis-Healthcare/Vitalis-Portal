// app/api/consent/[token]/sign/route.ts
// ═════════════════════════════════════════════════════════════════════════
// Ship 5b (v0.6.46) — POST: the client (or representative) signs.
//
// Public + token-gated (the token IS the auth; no session exists).
// Order of operations puts the signature first: record the signature +
// snapshot, THEN mirror to the lead, THEN email the signed copy
// SOFT-FAIL — an email hiccup must never undo a legally meaningful
// signature that has already been given.
// ═════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { renderSignedSnapshot } from '@/lib/leads/consent-render'
import {
  isValidDirectiveKey, mergeClientDetails, changedClientFields,
  CLIENT_EDITABLE_FIELDS, CLIENT_FIELD_LABELS,
  type ConsentPrefill, type ClientDetails, type ClientEditableField,
} from '@/lib/leads/consent-content'
import { prettyKey } from '@/lib/leads/model'
import { TEAM_EMAIL } from '@/lib/leads/outbound'

const MAX_DRAWN_BYTES = 300000 // ~300KB data URL cap for drawn signatures

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL =
  process.env.NOTIFY_FROM_EMAIL ||
  'Vitalis Portal <notifications@vitalishealthcare.com>'

/** Soft-fail send of the signed copy — mirrors lib/leads/email.ts's posture. */
async function emailSignedCopy(to: string, clientName: string, signedHtml: string): Promise<void> {
  if (process.env.LEADS_EMAILS_PAUSED === 'true') return
  if (!RESEND_API_KEY) return
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      reply_to: [TEAM_EMAIL],
      bcc: [TEAM_EMAIL],
      subject: `Your signed Vitalis Service Agreement — ${clientName}`,
      html: signedHtml,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend ${res.status}: ${body}`)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!token || !/^[a-f0-9]{48}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid signing link' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const signer_name: string = (body.signer_name || '').trim()
  const signer_role: string = body.signer_role === 'representative' ? 'representative' : 'client'
  const signature_kind: string = body.signature_kind === 'drawn' ? 'drawn' : 'typed'
  const signature_data: string = String(body.signature_data || '')
  const acknowledged: boolean = body.acknowledged === true
  const rawDirectives: unknown = body.directives

  if (!acknowledged) return NextResponse.json({ error: 'Please confirm you have read and understand the agreement' }, { status: 400 })
  if (signer_name.length < 2) return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 })
  if (signature_kind === 'typed') {
    if (!signature_data.trim()) return NextResponse.json({ error: 'A typed signature is required' }, { status: 400 })
  } else {
    if (!signature_data.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'The drawn signature could not be read — please try again' }, { status: 400 })
    }
    if (signature_data.length > MAX_DRAWN_BYTES) {
      return NextResponse.json({ error: 'The drawn signature is too large — please clear and sign again' }, { status: 400 })
    }
  }
  // ── v0.6.47: the client's own details (they complete/correct these) ──
  const rawDetails = (body.client_details && typeof body.client_details === 'object') ? body.client_details : {}
  const client_details: ClientDetails = {}
  for (const f of CLIENT_EDITABLE_FIELDS) {
    const v = rawDetails[f]
    if (typeof v === 'string' && v.trim()) client_details[f] = v.trim().slice(0, 200)
  }
  if (!client_details.client_name || client_details.client_name.length < 2) {
    return NextResponse.json({ error: 'Please enter the client\u2019s full legal name before signing' }, { status: 400 })
  }

  const directives: string[] = Array.isArray(rawDirectives)
    ? rawDirectives.filter((d): d is string => typeof d === 'string' && isValidDirectiveKey(d))
    : []

  const svc = createServiceClient()
  const { data: consent } = await svc
    .from('lead_consents')
    .select('id, lead_id, status, prefill, rep_name, rep_signed_at, email_id')
    .eq('token', token)
    .maybeSingle()

  if (!consent) return NextResponse.json({ error: 'This signing link is no longer active' }, { status: 404 })
  if (consent.status === 'signed') return NextResponse.json({ error: 'This agreement has already been signed' }, { status: 409 })
  if (consent.status === 'void') return NextResponse.json({ error: 'This link was replaced by a newer one — please open the most recent email from us' }, { status: 409 })

  const signedAtIso = new Date().toISOString()
  const staffPrefill = consent.prefill as ConsentPrefill
  const changed = changedClientFields(staffPrefill, client_details)
  // What the client entered is what prints; the staff original stays in `prefill`.
  const prefill = mergeClientDetails(staffPrefill, client_details)

  const signed_html = renderSignedSnapshot({
    prefill, directives,
    signerName: signer_name,
    signerRole: signer_role as 'client' | 'representative',
    signatureKind: signature_kind as 'typed' | 'drawn',
    signatureData: signature_kind === 'typed' ? signer_name : signature_data,
    signedAtIso,
    repName: consent.rep_name,
    repSignedAtIso: consent.rep_signed_at,
  })

  // ── 1. The signature record (guarded: only a live row can sign) ──────
  const { data: updated, error: updErr } = await svc.from('lead_consents')
    .update({
      status: 'signed', signed_at: signedAtIso,
      signer_name, signer_role, signature_kind,
      signature_data: signature_kind === 'typed' ? signer_name : signature_data,
      directives, signed_html, client_details,
    })
    .eq('id', consent.id)
    .in('status', ['sent', 'viewed'])
    .select('id')
    .maybeSingle()
  if (updErr || !updated) {
    return NextResponse.json({ error: 'Could not record the signature — please refresh and try again' }, { status: 409 })
  }

  // ── 2. Mirror to the lead (consent_status + the standard log lines) ──
  const { data: lead } = await svc.from('leads')
    .select('consent_status, client_name, date_of_birth, address, city, state, zip')
    .eq('id', consent.lead_id).maybeSingle()
  const prevConsent = lead?.consent_status || 'not_started'
  await svc.from('leads').update({ consent_status: 'signed', updated_at: signedAtIso }).eq('id', consent.lead_id)
  try {
    if (prevConsent !== 'signed') {
      await svc.from('lead_activities').insert({
        lead_id: consent.lead_id, created_by: null, activity_type: 'status_change',
        content: `Consent milestone: ${prettyKey(prevConsent)} \u2192 ${prettyKey('signed')}`,
      })
    }
    await svc.from('lead_activities').insert({
      lead_id: consent.lead_id, created_by: null, activity_type: 'note',
      content: `Service Agreement signed by ${signer_name} (${signer_role === 'representative' ? 'client\u2019s representative' : 'client'})`,
    })
    if (changed.length) {
      const names = changed.map((f: ClientEditableField) => CLIENT_FIELD_LABELS[f]).join(', ')
      await svc.from('lead_activities').insert({
        lead_id: consent.lead_id, created_by: null, activity_type: 'note',
        content: `Client completed their details on the agreement: ${names}`,
      })
    }
  } catch (err) { console.error('[consent/sign] timeline insert failed:', err) }

  // ── 2b. Write back to BLANK lead fields only (v0.6.47 ruling) ─────
  // Never overwrite something staff already entered — a gap the client
  // filled is worth capturing; a disagreement is a conversation, not an
  // automatic edit. Silent-fail: this must never disturb the signature.
  if (lead) {
    const blank = (v: unknown) => v === null || v === undefined || String(v).trim() === ''
    const writeBack: Record<string, string> = {}
    const pairs: [string, string | null | undefined][] = [
      ['client_name', client_details.client_name],
      ['date_of_birth', client_details.dob],
      ['address', client_details.address],
      ['city', client_details.city],
      ['state', client_details.state],
      ['zip', client_details.zip],
    ]
    for (const [col, val] of pairs) {
      if (val && blank((lead as Record<string, unknown>)[col])) writeBack[col] = val
    }
    if (Object.keys(writeBack).length) {
      try {
        await svc.from('leads').update(writeBack).eq('id', consent.lead_id)
        await svc.from('lead_activities').insert({
          lead_id: consent.lead_id, created_by: null, activity_type: 'note',
          content: `Lead record updated from the signed agreement (blank fields only): ${Object.keys(writeBack).join(', ')}`,
        })
      } catch (err) { console.error('[consent/sign] lead write-back failed:', err) }
    }
  }

  // ── 3. Email the signed copy (SOFT-FAIL) ─────────────────────────────
  try {
    const { data: emailRow } = consent.email_id
      ? await svc.from('lead_emails').select('to_email').eq('id', consent.email_id).maybeSingle()
      : { data: null }
    const to = emailRow?.to_email
    if (to) await emailSignedCopy(to, prefill.client_name, signed_html)
  } catch (err) {
    console.error('[consent/sign] signed-copy email failed (signature is safe):', err)
  }

  return NextResponse.json({ signed: true })
}
