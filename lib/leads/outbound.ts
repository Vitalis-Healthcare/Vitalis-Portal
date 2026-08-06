// lib/leads/outbound.ts
// ═════════════════════════════════════════════════════════════════════════
// Ship 5a (v0.6.45) — outbound lead email machinery.
//
// DELIBERATELY SEPARATE from lib/leads/email.ts (the digest, soft-fail).
// These are human-initiated sends where the send IS the action, so this
// module is HARD-FAIL: it throws with the real reason, the route reports
// it, and the person sees the failure instead of a false success.
//
// Rulings (Okezie, 6 Aug 2026):
//   • From: the sending staff member (domain vitalishealthcare.com is
//     verified in Resend). Non-domain sender addresses fall back to
//     NOTIFY_FROM_EMAIL with the sender in Reply-To.
//   • Reply-To: the sender AND team@ — a family's reply reaches both.
//   • BCC: team@ on every outbound lead email.
//   • LEADS_EMAILS_PAUSED refuses EXPLICITLY here (a 409 upstream) —
//     silently suppressing a human's send would report false success.
//
// The v0.6.13 suppression trap applies: Resend can return HTTP 200 with
// NO id for suppressed addresses. sendLeadOutbound verifies the id.
// ═════════════════════════════════════════════════════════════════════════

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FALLBACK_FROM =
  process.env.NOTIFY_FROM_EMAIL ||
  'Vitalis Portal <notifications@vitalishealthcare.com>'

export const TEAM_EMAIL = 'team@vitalishealthcare.com'
const SENDER_DOMAIN = '@vitalishealthcare.com'

export function leadsEmailsPaused(): boolean {
  return process.env.LEADS_EMAILS_PAUSED === 'true'
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Wrap edited plain-text paragraphs in the public Vitalis green brand
 * shell (Cormorant Garamond + DM Sans, the letterhead greens) — the
 * design signed off from the 6 Aug mockups. Blank lines split
 * paragraphs; single newlines become <br> so "When: / Where:" detail
 * lines survive.
 */
export function renderLeadEmailHtml(body: string, senderName: string): string {
  const paragraphs = body
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 15px;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')

  return (
`<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F4F3EC;">
<div style="max-width:640px;margin:0 auto;background:#FFFFFF;font-family:'DM Sans',Arial,sans-serif;color:#2A2A26;">
  <div style="background:#2D5A1B;padding:26px 28px 22px;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;color:#FFFFFF;font-size:26px;font-weight:600;letter-spacing:0.4px;">Vitalis <span style="color:#7AB52A;">HealthCare</span></div>
    <div style="height:3px;width:52px;background:#7AB52A;margin-top:10px;border-radius:2px;"></div>
  </div>
  <div style="padding:30px 32px 8px;font-size:15px;line-height:1.65;">
    ${paragraphs}
  </div>
  <div style="padding:2px 32px 26px;font-size:15px;line-height:1.55;">
    Warm regards,<br>
    <span style="font-weight:700;color:#2D5A1B;">${escapeHtml(senderName)}</span><br>
    <span style="font-size:13px;color:#6B6B62;">Vitalis HealthCare · (240) 716-6874</span>
  </div>
  <div style="background:#F4F3EC;border-top:1px solid #E4E2D8;padding:18px 28px 20px;font-size:11.5px;color:#8A8A80;line-height:1.7;text-align:center;">
    <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:#2D5A1B;font-weight:600;">Vitalis HealthCare Services LLC</span><br>
    8757 Georgia Avenue, Suite 440, Silver Spring, MD 20910 · Tel (240) 716-6874 · Fax (240) 266-0650<br>
    Maryland-licensed Residential Service Agency · License #3879R
  </div>
</div>
</body></html>`
  )
}

export interface OutboundSendArgs {
  to: string
  subject: string
  html: string
  senderName: string
  senderEmail: string
}

export interface OutboundSendResult {
  resendId: string
  fromEmail: string
}

/**
 * Send a human-initiated lead email through Resend. HARD-FAIL: throws
 * Error with the real reason on any failure, including the 200-with-no-id
 * suppression case. Returns Resend's message id (the 5c webhook key).
 */
export async function sendLeadOutbound(args: OutboundSendArgs): Promise<OutboundSendResult> {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured')

  const onDomain = args.senderEmail.toLowerCase().endsWith(SENDER_DOMAIN)
  const fromEmail = onDomain ? `${args.senderName} <${args.senderEmail}>` : FALLBACK_FROM

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail,
      to: [args.to],
      reply_to: [args.senderEmail, TEAM_EMAIL],
      bcc: [TEAM_EMAIL],
      subject: args.subject,
      html: args.html,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend ${res.status}: ${body || 'no response body'}`)
  }

  let data: { id?: string } = {}
  try { data = await res.json() } catch { /* fall through to the id check */ }
  if (!data.id) {
    // Resend returns 200 with no id for suppressed addresses (v0.6.13).
    throw new Error('Resend accepted the request but returned no message id — the address may be on the suppression list. Check Resend → Suppressions.')
  }

  return { resendId: data.id, fromEmail }
}
