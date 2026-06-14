// app/api/onboarding/application/route.ts
// Public, token-gated. Saves the candidate application as a draft ('save') or
// submits it ('submit'). Persists scalar fields, the two checkbox arrays
// (willing_to_work_with / experience_with), the availability map, and the three
// repeatable JSONB groups (work_experience / applicant_references /
// emergency_contacts). On first save: test_passed -> applying; on submit:
// applying -> application_submitted (+ timestamp) and a confirmation email.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import {
  APPLICATION_EDITABLE_STATUSES, APPLICATION_FIELDS, APPLICATION_BOOLEAN_FIELDS,
  WILLING_TO_WORK_WITH, EXPERIENCE_WITH, WEEK_DAYS, REFERENCE_SLOTS,
  MAX_WORK_EXPERIENCE, MAX_EMERGENCY_CONTACTS,
  type ApplicationData,
} from '@/lib/onboarding/application'

export const dynamic = 'force-dynamic'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const RESEND_KEY = process.env.RESEND_API_KEY

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function buildConfirmationEmail(firstName: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Application Received</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Vitalis HealthCare</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 10px;">Thank you, ${firstName}! 🎉</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 8px;">
      We have received your caregiver application. Our team will review it shortly.
    </p>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 8px;">
      <strong>What happens next:</strong> a Vitalis coordinator will review your information and reach out with next
      steps. If we need any additional documents, we will email you a link to add them — there is nothing else you need
      to do right now.
    </p>
    <p style="color:#94A3B8;font-size:12px;margin:18px 0 0;line-height:1.6;">
      If you have questions, simply reply to this email and a member of our team will help.
    </p>
  </div>
  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
    Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910
  </div>
</div>
</body>
</html>`
}

async function sendConfirmation(to: string, firstName: string): Promise<boolean> {
  if (!RESEND_KEY || !to) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL, to: [to],
        subject: 'We received your Vitalis caregiver application',
        html: buildConfirmationEmail(firstName),
      }),
    })
    if (!res.ok) { console.error('[onboarding-application] confirmation send error:', await res.text()); return false }
    return true
  } catch (e) {
    console.error('[onboarding-application] confirmation send threw:', e)
    return false
  }
}

const BOOLEAN_SET = new Set<string>(APPLICATION_BOOLEAN_FIELDS as string[])

function trimOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

// Scalar fields (with boolean coercion + integer for live_in_max_days).
function sanitizeScalars(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of APPLICATION_FIELDS) {
    if (!(key in input)) continue
    const raw = input[key]
    if (BOOLEAN_SET.has(key as string)) {
      out[key as string] = typeof raw === 'boolean' ? raw : null
    } else if (key === 'live_in_max_days') {
      const n = parseInt(String(raw ?? ''), 10)
      out[key as string] = Number.isFinite(n) ? n : null
    } else {
      out[key as string] = trimOrNull(raw)
    }
  }
  return out
}

function sanitizeStringArray(v: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(v)) return []
  const set = new Set(allowed)
  return v.map((x) => String(x)).filter((x) => set.has(x))
}

function sanitizeWorkExperience(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, MAX_WORK_EXPERIENCE).map((e) => {
    const o = (e || {}) as Record<string, unknown>
    return {
      organization: trimOrNull(o.organization),
      contact_person: trimOrNull(o.contact_person),
      telephone: trimOrNull(o.telephone),
      dates_worked: trimOrNull(o.dates_worked),
      may_contact: typeof o.may_contact === 'boolean' ? o.may_contact : null,
    }
  }).filter((e) => e.organization || e.contact_person || e.telephone || e.dates_worked)
}

function sanitizeReferences(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, REFERENCE_SLOTS.length).map((e, i) => {
    const o = (e || {}) as Record<string, unknown>
    const kind = o.kind === 'character' ? 'character' : REFERENCE_SLOTS[i]?.kind || 'professional'
    return {
      kind,
      name: trimOrNull(o.name),
      title: trimOrNull(o.title),
      phone: trimOrNull(o.phone),
      dates_known: trimOrNull(o.dates_known),
    }
  }).filter((e) => e.name || e.phone)
}

function sanitizeEmergencyContacts(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, MAX_EMERGENCY_CONTACTS).map((e) => {
    const o = (e || {}) as Record<string, unknown>
    return {
      name: trimOrNull(o.name),
      relationship: trimOrNull(o.relationship),
      phone: trimOrNull(o.phone),
      phone_type: trimOrNull(o.phone_type),
    }
  }).filter((e) => e.name || e.phone)
}

function sanitizeAvailabilityDays(v: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!v || typeof v !== 'object') return out
  const o = v as Record<string, unknown>
  for (const d of WEEK_DAYS) {
    const t = trimOrNull(o[d.key])
    if (t) out[d.key] = t
  }
  return out
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const token: string = body.token || ''
  const action: string = body.action === 'submit' ? 'submit' : 'save'
  const application = (body.application || {}) as ApplicationData

  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, email, status, token_expires_at')
    .eq('access_token', hashToken(token))
    .single()

  if (!cand) return NextResponse.json({ error: 'invalid_token' }, { status: 404 })
  if (cand.token_expires_at && new Date(cand.token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'expired_token' }, { status: 410 })
  }

  const status: string = cand.status || ''
  if (!(APPLICATION_EDITABLE_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'not_editable' }, { status: 409 })
  }

  const nowIso = new Date().toISOString()
  const input = application as Record<string, unknown>
  const scalars = sanitizeScalars(input)

  if (action === 'submit') {
    const required: (keyof ApplicationData)[] = ['legal_first_name', 'legal_last_name', 'phone', 'email', 'signature_name']
    const missing = required.filter((k) => !scalars[k as string])
    if (missing.length) return NextResponse.json({ error: 'Please complete your name, phone, email, and signature before submitting.' }, { status: 400 })
    if (!application.attested) return NextResponse.json({ error: 'Please check the attestation box before submitting.' }, { status: 400 })
  }

  const row: Record<string, unknown> = {
    candidate_id: cand.id,
    ...scalars,
    willing_to_work_with: sanitizeStringArray(input.willing_to_work_with, WILLING_TO_WORK_WITH),
    experience_with: sanitizeStringArray(input.experience_with, EXPERIENCE_WITH),
    work_experience: sanitizeWorkExperience(input.work_experience),
    applicant_references: sanitizeReferences(input.applicant_references),
    emergency_contacts: sanitizeEmergencyContacts(input.emergency_contacts),
    availability_days: sanitizeAvailabilityDays(input.availability_days),
    updated_at: nowIso,
  }
  if (action === 'submit') {
    row.attested = true
    row.signed_at = nowIso
    row.submitted_at = nowIso
  }

  const { error: upErr } = await svc.from('onb_applications').upsert(row, { onConflict: 'candidate_id' })
  if (upErr) {
    console.error('[onboarding-application] upsert failed:', upErr.message)
    return NextResponse.json({ error: 'Could not save your application. Please try again.' }, { status: 500 })
  }

  if (action === 'submit') {
    await svc.from('onb_candidates')
      .update({ status: 'application_submitted', application_submitted_at: nowIso, updated_at: nowIso })
      .eq('id', cand.id)
    const emailed = await sendConfirmation(cand.email, cand.first_name)
    return NextResponse.json({ success: true, submitted: true, emailed })
  }

  if (status === 'test_passed') {
    await svc.from('onb_candidates').update({ status: 'applying', updated_at: nowIso }).eq('id', cand.id)
  }
  return NextResponse.json({ success: true, submitted: false })
}
