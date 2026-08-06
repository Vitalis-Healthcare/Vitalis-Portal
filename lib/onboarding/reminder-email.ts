// lib/onboarding/reminder-email.ts
//
// The ONE application-reminder email, shared by the manual staff button and
// (v0.6.61) the scheduled cadence, so the copy can never drift. Raw fetch to
// the Resend API (no SDK), portal house style, BCC team@ — the standing rules
// for all onboarding email.
//
// Two links, and the distinction matters:
//
//   Continue        — carries a FRESH access_token. A reminder whose link has
//                     expired is worse than no reminder: it tells the person
//                     we want them and then shuts the door.
//   Not interested  — carries a SEPARATE optout_token and opens a
//                     CONFIRMATION page. It never withdraws anyone by itself.
//                     Corporate mail scanners and link-preview bots fetch
//                     every URL in an email; a one-click withdraw endpoint
//                     would quietly retire candidates who never touched it.

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const TEAM_NOTIFY = process.env.TEAM_NOTIFY_EMAIL || 'team@vitalishealthcare.com'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const RESEND_KEY = process.env.RESEND_API_KEY

/** Matches the invite email's TTL — the same magic link, refreshed. */
export const REMINDER_TOKEN_TTL_DAYS = 30
/** The opt-out link outlives the invite deliberately: someone who decides in
 *  week six that they are not interested should still be able to say so. */
export const OPTOUT_TOKEN_TTL_DAYS = 90

export interface ReminderCopy {
  subject: string
  heading: string
  intro: string
}

/**
 * Reminder 1 is a nudge. Reminder 2 says what happens if they stay quiet,
 * because a deadline nobody was told about is a trap, not a process.
 */
export function reminderCopy(reminderNumber: number, firstName: string): ReminderCopy {
  const name = firstName || 'there'
  if (reminderNumber >= 2) {
    return {
      subject: 'Still interested in joining Vitalis?',
      heading: `${name}, your application is still open`,
      intro:
        'We have not heard from you in about a week, and your caregiver application is still waiting to be completed. If you are still interested, you can pick up exactly where you left off — nothing you entered has been lost.<br><br>If we do not hear from you in the next few days we will set your application aside, so that we are not chasing someone who has moved on. That is not a rejection: tell us any time and we will pick it straight back up.',
    }
  }
  return {
    subject: 'Your Vitalis caregiver application is waiting',
    heading: `${name}, you are nearly there`,
    intro:
      'Thank you for the time you have already put in with us. Your caregiver application has not been completed yet, and it is the last thing standing between you and our review. It takes most people about fifteen minutes, and you can save and come back if you need to.',
  }
}

export interface SendReminderInput {
  to: string
  firstName: string
  reminderNumber: number
  /** Raw (unhashed) access token — goes in the Continue link only. */
  rawAccessToken: string
  /** Raw (unhashed) opt-out token — goes in the Not interested link only. */
  rawOptoutToken: string
  /** '/onboarding/application' or '/onboarding/documents'. */
  path: string
}

export interface SendResult {
  ok: boolean
  id?: string
  error?: string
}

function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderReminderHtml(i: SendReminderInput): string {
  const copy = reminderCopy(i.reminderNumber, i.firstName)
  const continueUrl = `${PORTAL_URL}${i.path}?token=${encodeURIComponent(i.rawAccessToken)}`
  const optOutUrl = `${PORTAL_URL}/onboarding/not-interested?token=${encodeURIComponent(i.rawOptoutToken)}`
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F8FAFC;font-family:'DM Sans','Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:26px 30px;border-radius:14px 14px 0 0;text-align:center;">
      <div style="width:50px;height:50px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-block;line-height:50px;font-size:19px;font-weight:900;color:#ffffff;">V+</div>
      <h1 style="color:#ffffff;margin:10px 0 0;font-size:19px;font-weight:800;">${esc(copy.heading)}</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Vitalis HealthCare</p>
    </div>
    <div style="background:#ffffff;padding:28px 30px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 14px 14px;">
      <p style="color:#4A6070;font-size:14px;line-height:1.7;margin:0 0 22px;">${copy.intro}</p>
      <div style="text-align:center;margin:0 0 22px;">
        <a href="${continueUrl}" style="display:inline-block;padding:13px 30px;background:#0E7C7B;color:#ffffff;text-decoration:none;border-radius:9px;font-size:15px;font-weight:700;">Continue my application</a>
      </div>
      <p style="color:#8FA0B0;font-size:12.5px;line-height:1.7;margin:0 0 18px;text-align:center;">
        This link is personal to you and works for the next ${REMINDER_TOKEN_TTL_DAYS} days.
      </p>
      <div style="border-top:1px solid #EFF2F5;padding-top:18px;">
        <p style="color:#8FA0B0;font-size:12.5px;line-height:1.7;margin:0;">
          Taken a different job, or changed your mind? That is completely fine, and we would rather know.
          <a href="${optOutUrl}" style="color:#4A6070;font-weight:700;">Let us know you are no longer interested</a>
          and we will stop emailing you. You can always come back to us later.
        </p>
      </div>
    </div>
    <div style="text-align:center;padding:18px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
      Vitalis Healthcare Services, LLC &middot; 8757 Georgia Avenue, Suite 440 &middot; Silver Spring, MD 20910
    </div>
  </div>
</body></html>`
}

/**
 * Soft-fail by contract: the caller records the reminder first and treats a
 * failed send as information, never as a reason to abort. Same rule as every
 * other onboarding email.
 */
export async function sendApplicationReminder(i: SendReminderInput): Promise<SendResult> {
  if (!RESEND_KEY) return { ok: false, error: 'RESEND_API_KEY is not configured.' }
  const copy = reminderCopy(i.reminderNumber, i.firstName)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [i.to],
        bcc: [TEAM_NOTIFY],
        subject: copy.subject,
        html: renderReminderHtml(i),
      }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, error: (body && body.message) || `Resend returned ${res.status}.` }
    }
    // Resend answers 200 with no id when an address is on the suppression list
    // (pitfall: the silent-invite failure of v0.6.13). No id means no email.
    const id = body && typeof body.id === 'string' ? body.id : undefined
    if (!id) return { ok: false, error: 'Resend accepted the request but returned no id — the address may be suppressed.' }
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error reaching Resend.' }
  }
}
