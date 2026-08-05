// lib/onboarding/invite-email.ts
// The ONE track-aware invite email, shared by the invite/resend route and the
// staff "Send test" action so the copy can never drift between them. Raw fetch
// to the Resend API (no SDK), portal house style, BCC team@ — the standing
// rules for all onboarding email.
import type { CandidateTrack } from '@/lib/onboarding/application'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const TEAM_NOTIFY = process.env.TEAM_NOTIFY_EMAIL || 'team@vitalishealthcare.com'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const RESEND_KEY = process.env.RESEND_API_KEY
export const TOKEN_TTL_DAYS = 30

// The email variant is named for what the link opens, not for the track,
// because the two can differ: "Send test" emails the test variant to a
// candidate whose track is application_only.
export type InviteVariant = 'test' | 'application' | 'documents'

/** The variant a fresh invite on this track should send. */
export function variantForTrack(track: CandidateTrack): InviteVariant {
  if (track === 'application_only') return 'application'
  if (track === 'documents_only') return 'documents'
  return 'test'
}

function copyFor(variant: InviteVariant) {
  if (variant === 'application') {
    return {
      subject: 'Welcome to Vitalis — complete your caregiver application',
      tagline: 'Caregiver Application',
      intro:
        'Thank you for your interest in joining the Vitalis caregiver team. The next step is to complete your <strong>caregiver application</strong>.',
      button: 'Complete Your Application',
      expect:
        '<strong>What to expect:</strong> your contact details, work history, references, and document uploads (photo ID and any certifications you hold). You can save a draft and come back any time.',
      path: '/onboarding/application',
    }
  }
  if (variant === 'documents') {
    return {
      subject: 'Welcome to Vitalis — add your caregiver documents',
      tagline: 'Caregiver Documents',
      intro:
        'Thank you for your interest in joining the Vitalis caregiver team. We have your application on file — the next step is to upload your <strong>supporting documents</strong>.',
      button: 'Upload Your Documents',
      expect:
        '<strong>What to upload:</strong> a government-issued photo ID, plus any certifications you hold — CNA or other credentials, CPR, TB test result, and similar. Clear photos or PDFs are both fine, and you can come back to add more at any time.',
      path: '/onboarding/documents',
    }
  }
  return {
    subject: 'Welcome to Vitalis — start your caregiver competency test',
    tagline: 'Caregiver Competency Test',
    intro:
      'Thank you for your interest in joining the Vitalis caregiver team. The first step is a short <strong>caregiver competency test</strong>.',
    button: 'Start the Competency Test',
    expect:
      '<strong>What to expect:</strong> 86 multiple-choice questions on everyday caregiving — communication, safety, infection control, documentation, and client care. Take your time; there is no time limit.',
    path: '/onboarding/test',
  }
}

function buildInviteEmail(opts: { firstName: string; link: string; variant: InviteVariant }) {
  const { firstName, link, variant } = opts
  const copy = copyFor(variant)
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Welcome to Vitalis HealthCare</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">${copy.tagline}</p>
  </div>

  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 10px;">Hi ${firstName}! 👋</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 8px;">
      ${copy.intro}
    </p>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Tap the button below to begin — <strong>no password needed.</strong> This link is just for you
      and stays active for <strong>${TOKEN_TTL_DAYS} days</strong>.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${link}"
        style="display:inline-block;padding:16px 44px;background:linear-gradient(135deg,#0E7C7B,#1A9B87);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(14,124,123,0.3);">
        ${copy.button}
      </a>
    </div>

    <div style="background:#F8FAFC;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <div style="font-size:13px;color:#4A6070;line-height:1.7;">
        ${copy.expect}
      </div>
    </div>

    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#8FA0B0;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Button not working? Copy this link</div>
      <div style="font-size:11px;color:#4A6070;word-break:break-all;line-height:1.6;">${link}</div>
    </div>

    <p style="color:#94A3B8;font-size:12px;margin:0;line-height:1.6;">
      If you were not expecting this invitation, you can safely ignore this email.
    </p>
  </div>

  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
    Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br>
    This is an automated message — please do not reply directly.
  </div>
</div>
</body>
</html>`
}

/**
 * Send one invite email. Soft-fail contract: never throws; the caller decides
 * what a failed send means (the record is always saved first).
 */
export async function sendOnboardingInvite(opts: {
  to: string
  firstName: string
  rawToken: string
  variant: InviteVariant
}): Promise<{ ok: boolean; error?: string }> {
  const { to, firstName, rawToken, variant } = opts
  if (!RESEND_KEY) return { ok: false, error: 'Email service not configured.' }
  const link = `${PORTAL_URL}${copyFor(variant).path}?token=${rawToken}`
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        bcc: [TEAM_NOTIFY],
        subject: copyFor(variant).subject,
        html: buildInviteEmail({ firstName, link, variant }),
      }),
    })
    if (!res.ok) {
      console.error('[onboarding-invite] Resend error:', await res.text())
      return { ok: false, error: 'The invite email failed to send.' }
    }
    return { ok: true }
  } catch (e) {
    console.error('[onboarding-invite] send threw:', e)
    return { ok: false, error: 'The invite email failed to send.' }
  }
}
