// ═════════════════════════════════════════════════════════════════════════
// Conversion approval notifications (v0.6.24-c)
//
// v0.6.24-b shipped the approval workflow and it was complete and SILENT: a
// request sat on the candidate page until somebody happened to look, and a
// returned request took its reason with it. This module is the part that tells
// people.
//
// Three notifications, all soft-fail:
//   requested → every approver      "X has sent someone for your approval"
//   returned  → the requester       the reason, verbatim
//   approved  → the requester       it went through
//
// Nothing here throws. A failed notification must never undo an approval that
// has already created a caregiver account — but it must never be reported as
// success either. See sendPortalEmail.
// ═════════════════════════════════════════════════════════════════════════

import { esc } from '@/lib/onboarding/contract-templates'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const TEAM_NOTIFY = process.env.TEAM_NOTIFY_EMAIL || 'team@vitalishealthcare.com'
const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app').replace(/\/+$/, '')
const RESEND_KEY = process.env.RESEND_API_KEY

/** portal_settings key holding an optional comma-separated approver list. */
const RECIPIENTS_KEY = 'conversion_approval_recipients'

export interface SendOutcome {
  ok: boolean
  /** Who it actually went to. Empty when there was nobody to tell. */
  recipients: string[]
  /** Present only on failure, phrased for a person to read. */
  error?: string
}

// Minimal shape of the service client, so this module stays testable without
// dragging in the Supabase types.
type Svc = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

// ── Sending ──────────────────────────────────────────────────────────────
/**
 * Resend answers **HTTP 200 with no `id`** for an address on its suppression
 * list, and silently drops the mail. That is precisely how the magic-link
 * invites "worked" for weeks while nothing arrived, and these notifications go
 * to the same @vitalishealthcare.com addresses one of which was suppressed.
 *
 * So success is `id` present, never `res.ok`.
 */
async function sendPortalEmail(to: string[], subject: string, html: string): Promise<SendOutcome> {
  const recipients = to.map((t) => t.trim()).filter(Boolean)
  if (!recipients.length) {
    return { ok: false, recipients: [], error: 'There was nobody to notify.' }
  }
  if (!RESEND_KEY) {
    return { ok: false, recipients, error: 'Email is not configured on this deployment.' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: recipients, bcc: [TEAM_NOTIFY], subject, html }),
    })

    let body: Record<string, unknown> = {}
    try { body = await res.json() } catch { /* handled below */ }

    if (!res.ok) {
      const detail = typeof body.message === 'string' ? body.message : `HTTP ${res.status}`
      console.error('[approval-emails] send failed:', res.status, detail)
      return { ok: false, recipients, error: `The email could not be sent (${detail}).` }
    }

    if (!body.id) {
      // 200 with no id: accepted at the edge and dropped. Almost always a
      // suppressed address after a prior hard bounce. Fix is operational —
      // Resend dashboard → Suppressions → remove, then re-send.
      console.error('[approval-emails] accepted with no id (suppressed address?):', recipients.join(', '))
      return {
        ok: false,
        recipients,
        error: 'Resend accepted the email but returned no id, which means the address is on its suppression list and the mail was dropped.',
      }
    }

    return { ok: true, recipients }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[approval-emails] send threw:', message)
    return { ok: false, recipients, error: 'The email could not be sent.' }
  }
}

// ── Recipients ───────────────────────────────────────────────────────────
/**
 * Who decides conversion requests.
 *
 * An explicit list in `portal_settings.conversion_approval_recipients`
 * (comma-separated) wins. Blank or absent falls back to every active admin —
 * the same query the enrolment-request notifier already uses, so there is one
 * idea of "the administrators" rather than two.
 */
export async function resolveApproverRecipients(svc: Svc): Promise<string[]> {
  try {
    const { data: setting } = await svc
      .from('portal_settings')
      .select('value')
      .eq('key', RECIPIENTS_KEY)
      .maybeSingle()

    const override = typeof setting?.value === 'string' ? setting.value.trim() : ''
    if (override) {
      return override.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
  } catch {
    // A missing row or an unrefreshed schema cache must not stop the fallback.
  }

  try {
    const { data: admins } = await svc
      .from('profiles')
      .select('email')
      .eq('role', 'admin')
      .eq('status', 'active')

    const list = Array.isArray(admins) ? admins : []
    return list
      .map((a: { email?: string | null }) => (a.email || '').trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * The email address of the person who raised a request. Returns '' when the
 * profile is gone or has no address — the caller reports "nobody to notify"
 * rather than pretending the mail went out.
 */
export async function lookupStaffEmail(svc: Svc, userId: string | null | undefined): Promise<string> {
  if (!userId) return ''
  try {
    const { data } = await svc.from('profiles').select('email').eq('id', userId).maybeSingle()
    return (data?.email || '').trim()
  } catch {
    return ''
  }
}

// ── Templates ────────────────────────────────────────────────────────────
type Tone = 'teal' | 'amber' | 'red'

const TONE: Record<Tone, { bg: string; border: string; text: string }> = {
  teal:  { bg: '#E6F4F4', border: '#BFE0E0', text: '#0A5C5B' },
  amber: { bg: '#FEF3E2', border: '#F4D9A8', text: '#B26A00' },
  red:   { bg: '#F4EBEB', border: '#E3C9C9', text: '#9B3B3B' },
}

function shell(opts: {
  kicker: string
  heading: string
  intro: string
  panel?: { tone: Tone; label: string; body: string }
  ctaHref: string
  ctaLabel: string
  footnote?: string
}): string {
  const { kicker, heading, intro, panel, ctaHref, ctaLabel, footnote } = opts
  const panelHtml = panel
    ? `<div style="background:${TONE[panel.tone].bg};border:1px solid ${TONE[panel.tone].border};border-radius:8px;padding:14px 18px;margin-bottom:22px;">
         <div style="font-size:11px;font-weight:700;color:${TONE[panel.tone].text};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${panel.label}</div>
         <div style="font-size:14px;color:#4A6070;line-height:1.65;white-space:pre-wrap;">${panel.body}</div>
       </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">${heading}</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">${kicker}</p>
  </div>

  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <p style="color:#4A6070;font-size:14px;line-height:1.65;margin:0 0 20px;">${intro}</p>
    ${panelHtml}
    <div style="text-align:center;margin-bottom:22px;">
      <a href="${ctaHref}" style="display:inline-block;padding:14px 38px;background:linear-gradient(135deg,#0E7C7B,#1A9B87);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">${ctaLabel}</a>
    </div>
    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;">
      <div style="font-size:11px;font-weight:700;color:#8FA0B0;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Button not working? Copy this link</div>
      <div style="font-size:11px;color:#4A6070;word-break:break-all;line-height:1.6;">${ctaHref}</div>
    </div>
    ${footnote ? `<p style="color:#94A3B8;font-size:12px;margin:18px 0 0;line-height:1.6;">${footnote}</p>` : ''}
  </div>

  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
    Vitalis Healthcare Services, LLC &middot; 8757 Georgia Avenue, Suite 440 &middot; Silver Spring, MD 20910<br>
    This is an automated message from the Vitalis Portal.
  </div>
</div>
</body>
</html>`
}

export interface CandidateRef {
  id: string
  first_name: string
  last_name: string
}

function fullName(c: CandidateRef): string {
  return esc(`${c.first_name || ''} ${c.last_name || ''}`.trim() || 'this candidate')
}

function candidateHref(id: string): string {
  return `${PORTAL_URL}/candidates/${id}`
}

// ── The three notifications ──────────────────────────────────────────────

/** Someone has asked for a conversion to be approved. Goes to the approvers. */
export async function notifyApprovalRequested(
  svc: Svc,
  opts: { candidate: CandidateRef; requesterName: string; note?: string | null },
): Promise<SendOutcome> {
  const recipients = await resolveApproverRecipients(svc)
  const name = fullName(opts.candidate)
  const who = esc(opts.requesterName || 'A coordinator')

  return sendPortalEmail(
    recipients,
    `Approval needed: ${`${opts.candidate.first_name || ''} ${opts.candidate.last_name || ''}`.trim()}`,
    shell({
      kicker: 'Conversion approval',
      heading: 'A candidate is waiting on you',
      intro: `<strong>${who}</strong> has finished credentialing <strong>${name}</strong> and sent them for approval. Approving converts them into a Vitalis caregiver with a portal account.`,
      panel: opts.note ? { tone: 'teal', label: 'Note from the coordinator', body: esc(opts.note) } : undefined,
      ctaHref: candidateHref(opts.candidate.id),
      ctaLabel: 'Review and decide',
      footnote: 'You can approve it, or send it back with a reason the coordinator can act on.',
    }),
  )
}

/** An approver sent it back. Goes to whoever raised it — with the reason. */
export async function notifyApprovalReturned(
  opts: { candidate: CandidateRef; requesterEmail: string; deciderName: string; reason: string },
): Promise<SendOutcome> {
  const name = fullName(opts.candidate)
  const who = esc(opts.deciderName || 'An administrator')

  return sendPortalEmail(
    [opts.requesterEmail],
    `Sent back: ${`${opts.candidate.first_name || ''} ${opts.candidate.last_name || ''}`.trim()}`,
    shell({
      kicker: 'Conversion approval',
      heading: 'Returned to you',
      intro: `<strong>${who}</strong> has sent <strong>${name}</strong> back to you rather than approving the conversion. The reason is below.`,
      panel: { tone: 'red', label: 'Why it was returned', body: esc(opts.reason) },
      ctaHref: candidateHref(opts.candidate.id),
      ctaLabel: 'Open the candidate',
      footnote: 'Once you have dealt with it, send the candidate for approval again from the same page.',
    }),
  )
}

/** Approved and converted. Goes to whoever raised it. */
export async function notifyApprovalApproved(
  opts: { candidate: CandidateRef; requesterEmail: string; deciderName: string; note?: string | null },
): Promise<SendOutcome> {
  const name = fullName(opts.candidate)
  const who = esc(opts.deciderName || 'An administrator')

  return sendPortalEmail(
    [opts.requesterEmail],
    `Approved: ${`${opts.candidate.first_name || ''} ${opts.candidate.last_name || ''}`.trim()}`,
    shell({
      kicker: 'Conversion approval',
      heading: 'Approved and converted',
      intro: `<strong>${who}</strong> has approved <strong>${name}</strong>. They now have a Vitalis caregiver account, and their credentials board has been seeded from the documents on file.`,
      panel: opts.note ? { tone: 'teal', label: 'Note from the approver', body: esc(opts.note) } : undefined,
      ctaHref: candidateHref(opts.candidate.id),
      ctaLabel: 'Open the candidate',
      footnote: 'If they still need their AxisCare sign-in instructions, send those from the candidate page.',
    }),
  )
}
