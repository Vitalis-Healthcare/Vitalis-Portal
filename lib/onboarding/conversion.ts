// lib/onboarding/conversion.ts
//
// The act of turning a candidate into a caregiver, extracted from the convert
// route so TWO callers can perform it identically:
//
//   1. an admin pressing Convert directly, and
//   2. an admin APPROVING a coordinator's conversion request.
//
// Those must not drift. If approval had its own copy of this logic, the two
// paths would eventually create caregivers with different side effects — one
// seeding credentials, say, and the other not — and the difference would only
// show up as a caregiver with an empty Credentials board weeks later.
//
// The GATE is deliberately NOT enforced in here. Each caller checks it before
// calling, because they have different ideas of what a valid starting status
// is: a direct conversion starts from 'in_review', an approval starts from
// 'awaiting_approval'.

import { createServiceClient } from '@/lib/supabase/service'
import { seedStaffCredentials } from '@/lib/onboarding/credential-seed'

type Svc = ReturnType<typeof createServiceClient>

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const TEAM_NOTIFY = process.env.TEAM_NOTIFY_EMAIL || 'team@vitalishealthcare.com'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const RESEND_KEY = process.env.RESEND_API_KEY

/** Statuses a candidate may be converted FROM. */
export const CONVERTIBLE_STATUSES = ['in_review', 'axiscare_created', 'awaiting_approval']

function nonEmpty(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

function buildWelcomeEmail(opts: { firstName: string; fullName: string; email: string; setPasswordLink: string }) {
  const { firstName, fullName, email, setPasswordLink } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Welcome to the Vitalis Team</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Caregiver Portal</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 10px;">Congratulations, ${firstName}! 🎉</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 6px;">
      You are now part of the Vitalis caregiver team. We have created your caregiver portal account, where you will
      find your training, schedule, and important documents.
    </p>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Click below to set your password and sign in. The link is valid for <strong>24 hours</strong>.
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${setPasswordLink}" style="display:inline-block;padding:14px 40px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">Set My Password &amp; Sign In →</a>
    </div>
    <div style="background:#F8FAFC;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:12px;font-weight:700;color:#8FA0B0;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Your Account</div>
      <div style="font-size:13px;color:#1A2E44;line-height:2;">
        <strong>Name:</strong> ${fullName}<br>
        <strong>Email:</strong> ${email}<br>
        <strong>Portal:</strong> <a href="${PORTAL_URL}/login" style="color:#0E7C7B;">${PORTAL_URL}</a>
      </div>
    </div>
    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;">
      <div style="font-size:11px;font-weight:700;color:#8FA0B0;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Button not working? Copy this link</div>
      <div style="font-size:11px;color:#4A6070;word-break:break-all;line-height:1.6;">${setPasswordLink}</div>
    </div>
  </div>
  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
    Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br>
    This is an automated message — please do not reply directly.
  </div>
</div>
</body>
</html>`
}

async function sendWelcome(email: string, firstName: string, fullName: string, link: string): Promise<boolean> {
  if (!RESEND_KEY) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL, to: [email], bcc: [TEAM_NOTIFY],
        subject: 'Welcome to Vitalis — set your caregiver portal password',
        html: buildWelcomeEmail({ firstName, fullName, email, setPasswordLink: link }),
      }),
    })
    if (!res.ok) { console.error('[convert] welcome email error:', await res.text()); return false }
    return true
  } catch (e) {
    console.error('[convert] welcome email threw:', e); return false
  }
}

export interface ConversionResult {
  ok: true
  profileId: string
  outcome: 'converted' | 'linked_existing'
  emailed: boolean
  credentials: Awaited<ReturnType<typeof seedStaffCredentials>>
}
export interface ConversionFailure {
  ok: false
  error: string
  status: number
}

/**
 * Create (or link) the caregiver account for a candidate and mark them
 * converted. Callers must have already checked authorisation, the gate, and
 * the candidate's status.
 *
 * `actorId` is the staff user causing the conversion — the admin pressing
 * Convert, or the admin approving a request.
 */
export async function performConversion(
  svc: Svc,
  cand: { id: string; first_name: string; last_name: string; email: string },
  actorId: string,
): Promise<ConversionResult | ConversionFailure> {
  const { data: app } = await svc
    .from('onb_applications')
    .select('legal_first_name, legal_last_name, email, phone')
    .eq('candidate_id', cand.id)
    .maybeSingle()

  const firstName = nonEmpty(app?.legal_first_name) || nonEmpty(cand.first_name) || ''
  const lastName = nonEmpty(app?.legal_last_name) || nonEmpty(cand.last_name) || ''
  const fullName = `${firstName} ${lastName}`.trim()
  const email = (nonEmpty(app?.email) || nonEmpty(cand.email) || '').toLowerCase()
  const phone = nonEmpty(app?.phone)
  if (!fullName || !email) {
    return { ok: false, error: 'A name and email are required before converting.', status: 400 }
  }

  const nowIso = new Date().toISOString()

  const { data: authData, error: createError } = await svc.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'caregiver', phone, department: null },
  })

  let profileId: string | null = authData?.user?.id || null
  let emailed = false
  let outcome: 'converted' | 'linked_existing' = 'converted'

  if (createError) {
    const msg = (createError.message || '').toLowerCase()
    const exists = msg.includes('already') || msg.includes('exists')
    if (!exists) {
      console.error('[convert] createUser error:', createError.message)
      return { ok: false, error: createError.message, status: 500 }
    }
    // Account already exists — link to the existing profile, don't re-send a password email.
    const { data: existing } = await svc.from('profiles').select('id').eq('email', email).maybeSingle()
    if (!existing?.id) {
      return { ok: false, error: 'An account with this email exists but its profile could not be found.', status: 500 }
    }
    profileId = existing.id
    outcome = 'linked_existing'
  } else {
    if (profileId) {
      await svc.from('profiles').upsert(
        { id: profileId, email, full_name: fullName, role: 'caregiver', phone, status: 'active' },
        { onConflict: 'id', ignoreDuplicates: true },
      )
    }
    const { data: linkData } = await svc.auth.admin.generateLink({
      type: 'recovery', email, options: { redirectTo: `${PORTAL_URL}/update-password` },
    })
    const hashed = linkData?.properties?.hashed_token
    if (hashed) {
      const link = `${PORTAL_URL}/auth/confirm?token_hash=${hashed}&type=recovery&next=/update-password`
      emailed = await sendWelcome(email, firstName, fullName, link)
    }
  }

  if (!profileId) {
    return { ok: false, error: 'Could not determine the new caregiver profile.', status: 500 }
  }

  await svc.from('onb_candidates')
    .update({ converted_to_profile_id: profileId, status: 'converted', updated_at: nowIso })
    .eq('id', cand.id)

  // Soft-fail by construction: the account exists and the candidate is already
  // marked converted, so a seeding problem must be reported, not thrown.
  let credentials: Awaited<ReturnType<typeof seedStaffCredentials>> = { seeded: [], skipped: [] }
  try {
    credentials = await seedStaffCredentials(svc, cand.id, profileId, actorId)
    if (credentials.skipped.length) {
      console.warn('[convert] credential seeding skipped:',
        credentials.skipped.map((s) => `${s.label} (${s.reason})`).join('; '))
    }
  } catch (err) {
    console.error('[convert] credential seeding threw:', err)
  }

  return { ok: true, profileId, outcome, emailed, credentials }
}
