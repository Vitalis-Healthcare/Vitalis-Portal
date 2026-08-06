// lib/leads/email.ts
// Email helpers for the Leads & Pipeline module (v0.6.39).
// Mirrors lib/assessments/email.ts: all send functions are SOFT-FAIL —
// callers wrap in try/catch and log; an email failure must never block
// or fail lead work.
//
// LEADS_EMAILS_PAUSED=true — set in Vercel env vars to suppress all
// outbound emails from this module without a redeploy.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL =
  process.env.NOTIFY_FROM_EMAIL ||
  'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

async function resendSend(to: string, subject: string, html: string): Promise<void> {
  if (process.env.LEADS_EMAILS_PAUSED === 'true') {
    console.log(`[leads/email] LEADS_EMAILS_PAUSED=true — suppressed: "${subject}" → ${to}`)
    return
  }
  if (!RESEND_API_KEY) {
    console.warn('[leads/email] RESEND_API_KEY not set — email skipped')
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend ${res.status}: ${body}`)
  }
}

export interface DigestLead {
  id: string
  name: string
  due: string | null
  actionLabel: string
  note: string | null
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function leadRow(l: DigestLead, color: string): string {
  return (
    `<tr>` +
    `<td style="padding:6px 10px;border-bottom:1px solid #EFF2F5;">` +
    `<a href="${PORTAL_URL}/leads/${l.id}" style="color:#0B6B5C;font-weight:700;text-decoration:none;">${esc(l.name)}</a>` +
    (l.note ? `<div style="font-size:12px;color:#8FA0B0;">${esc(l.note)}</div>` : '') +
    `</td>` +
    `<td style="padding:6px 10px;border-bottom:1px solid #EFF2F5;color:#4A6070;">${esc(l.actionLabel)}</td>` +
    `<td style="padding:6px 10px;border-bottom:1px solid #EFF2F5;color:${color};font-weight:700;white-space:nowrap;">${l.due ? esc(l.due) : '—'}</td>` +
    `</tr>`
  )
}

function section(title: string, leads: DigestLead[], color: string): string {
  if (leads.length === 0) return ''
  return (
    `<h3 style="font-size:14px;color:#1A2E44;margin:18px 0 6px;">${esc(title)} (${leads.length})</h3>` +
    `<table style="width:100%;border-collapse:collapse;font-size:13px;font-family:Arial,sans-serif;">` +
    leads.map(l => leadRow(l, color)).join('') +
    `</table>`
  )
}

/** One morning digest per owner. Only called when there is something to say. */
export async function sendLeadsDigestEmail(
  to: string,
  ownerName: string,
  parts: {
    overdue: DigestLead[]
    dueToday: DigestLead[]
    wakingUp: DigestLead[]
    noActionCount: number
  },
): Promise<void> {
  const { overdue, dueToday, wakingUp, noActionCount } = parts
  const firstName = ownerName.split(' ')[0] || ownerName
  const counts: string[] = []
  if (overdue.length) counts.push(`${overdue.length} overdue`)
  if (dueToday.length) counts.push(`${dueToday.length} due today`)
  if (wakingUp.length) counts.push(`${wakingUp.length} waking up`)
  const subject = `Leads today: ${counts.join(', ') || 'review needed'}`

  const html =
    `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1A2E44;">` +
    `<h2 style="font-size:16px;margin:0 0 4px;">Good morning, ${esc(firstName)}</h2>` +
    `<p style="font-size:13px;color:#4A6070;margin:0 0 8px;">Your lead actions for today.</p>` +
    section('⚠️ Overdue', overdue, '#DC2626') +
    section('📅 Due today', dueToday, '#457B9D') +
    section('⏰ Standby leads waking up', wakingUp, '#92400E') +
    (noActionCount > 0
      ? `<p style="font-size:13px;color:#92400E;margin:18px 0 0;"><strong>${noActionCount}</strong> of your open leads have <strong>no next action</strong> — give each one a next step or close it honestly.</p>`
      : '') +
    `<p style="font-size:12px;color:#8FA0B0;margin:20px 0 0;">` +
    `<a href="${PORTAL_URL}/leads" style="color:#0B6B5C;">Open Leads &amp; Pipeline</a> · Vitalis Portal</p>` +
    `</div>`

  await resendSend(to, subject, html)
}
