// lib/assessments/email.ts
// Shared email helpers for the Assessment Planning & Scheduling module.
// All exported send functions are SOFT-FAIL — callers must wrap in
// try/catch and log; never let an email failure propagate to DB work.
//
// ASSESSMENT_EMAILS_PAUSED=true  — set in Vercel env vars to suppress all
// outbound emails from this module without a redeploy. Flip back to false
// (or delete the var) to re-enable. Takes effect on the next invocation.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL =
  process.env.NOTIFY_FROM_EMAIL ||
  'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

// ─── internal helpers ─────────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function cadenceLabel(days: number): string {
  const labels: Record<number, string> = {
    30: 'Monthly (every 30 days)',
    60: 'Every 60 days',
    90: 'Every 90 days',
    120: 'Every 120 days',
  }
  return labels[days] ?? `Every ${days} days`
}

async function resendSend(to: string, subject: string, html: string): Promise<void> {
  // Pause all outbound assessment emails without a redeploy.
  if (process.env.ASSESSMENT_EMAILS_PAUSED === 'true') {
    console.log(`[assessments/email] ASSESSMENT_EMAILS_PAUSED=true — suppressed: "${subject}" → ${to}`)
    return
  }
  if (!RESEND_API_KEY) {
    console.warn('[assessments/email] RESEND_API_KEY not set — email skipped')
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  })
  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Resend ${res.status}: ${errBody}`)
  }
}

function wrapLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:580px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:44px;height:44px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;margin-bottom:10px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:800;">Vitalis Portal</h1>
    <p style="color:rgba(255,255,255,0.55);font-size:11px;margin:3px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Assessment Planning &amp; Scheduling</p>
  </div>

  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    ${content}
  </div>

  <div style="text-align:center;padding:18px 0;font-size:11px;color:#94A3B8;">
    Vitalis Healthcare Services, LLC &nbsp;&middot;&nbsp; 8757 Georgia Avenue, Suite 440 &middot; Silver Spring, MD 20910<br>
    This is an automated message &mdash; please do not reply directly to this email.
  </div>

</div>
</body>
</html>`
}

// ─── 1. Assignment / reassignment email ──────────────────────────────────────

export interface AssignmentEmailParams {
  nurseEmail:      string
  nurseName:       string
  clientName:      string
  clientPhone:     string | null
  clientAddress:   string
  cadenceDays:     number
  nextDueDate:     string | null  // YYYY-MM-DD, or null when unknown
  isReassignment?: boolean
}

export async function sendAssignmentEmail(p: AssignmentEmailParams): Promise<void> {
  const firstName = p.nurseName.split(' ')[0] || 'Nurse'
  const verb      = p.isReassignment ? 'reassigned to' : 'assigned to'
  const subject   = p.isReassignment
    ? `Assessment reassignment \u2014 ${p.clientName}`
    : `New assessment assignment \u2014 ${p.clientName}`

  const rows: Array<[string, string]> = [
    ['Client',               p.clientName],
    ['Phone',                p.clientPhone || '\u2014'],
    ['Address',              p.clientAddress || 'See portal'],
    ['Cadence',              cadenceLabel(p.cadenceDays)],
    ['Next Assessment Due',  p.nextDueDate ? fmtDate(p.nextDueDate) : 'See portal'],
  ]

  const content = `
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 6px;">Hi ${firstName},</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 22px;">
      You have been <strong>${verb}</strong> a client for assessment scheduling. Details below.
    </p>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:700;color:#0E7C7B;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:14px;">Assignment Details</div>
      ${rows.map(([label, value]) => `
      <div style="display:flex;gap:12px;margin-bottom:10px;font-size:13px;align-items:flex-start;">
        <span style="color:#94A3B8;min-width:170px;font-weight:600;flex-shrink:0;">${label}</span>
        <span style="color:#1A2E44;font-weight:500;">${value}</span>
      </div>`).join('')}
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${PORTAL_URL}/assessments"
        style="display:inline-block;padding:12px 32px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        View My Schedule &rarr;
      </a>
    </div>

    <p style="color:#94A3B8;font-size:12px;margin:0;text-align:center;">
      Log in to mark assessments complete and view your full schedule.
    </p>`

  await resendSend(p.nurseEmail, subject, wrapLayout(content))
}

// ─── 2. Weekly Monday digest ──────────────────────────────────────────────────

export interface DigestItem {
  clientName:    string
  clientPhone:   string | null
  clientAddress: string
  scheduledDate: string  // YYYY-MM-DD
}

export interface WeeklyDigestParams {
  nurseEmail: string
  nurseName:  string
  weekLabel:  string   // e.g. "April 14–20, 2025"
  items:      DigestItem[]
}

export async function sendWeeklyDigestEmail(p: WeeklyDigestParams): Promise<void> {
  const firstName = p.nurseName.split(' ')[0] || 'Nurse'
  const subject   = `Your assessments this week \u2014 ${p.weekLabel}`

  // Phone shown as a second line under the client name to keep 3 columns.
  const tableRows = p.items.map(item => `
    <tr>
      <td style="padding:10px 12px;font-size:13px;color:#1A2E44;border-bottom:1px solid #F1F5F9;font-weight:600;white-space:nowrap;">${fmtDate(item.scheduledDate)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;">
        <div style="font-size:13px;color:#1A2E44;font-weight:600;">${item.clientName}</div>
        ${item.clientPhone ? `<div style="font-size:11px;color:#4A6070;margin-top:2px;">${item.clientPhone}</div>` : ''}
      </td>
      <td style="padding:10px 12px;font-size:12px;color:#4A6070;border-bottom:1px solid #F1F5F9;">${item.clientAddress || '&mdash;'}</td>
    </tr>`).join('')

  const bodyTable = p.items.length === 0
    ? `<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:center;font-size:14px;color:#15803D;">
         &#x2705; No assessments scheduled this week.
       </div>`
    : `<div style="overflow-x:auto;margin-bottom:24px;">
         <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
           <thead>
             <tr style="background:#F8FAFC;">
               <th style="padding:10px 12px;font-size:11px;color:#94A3B8;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Date</th>
               <th style="padding:10px 12px;font-size:11px;color:#94A3B8;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Client</th>
               <th style="padding:10px 12px;font-size:11px;color:#94A3B8;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Address</th>
             </tr>
           </thead>
           <tbody>${tableRows}</tbody>
         </table>
       </div>`

  const content = `
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 6px;">Hi ${firstName},</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 22px;">
      Here are your assessments for the week of <strong>${p.weekLabel}</strong>.
    </p>
    ${bodyTable}
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${PORTAL_URL}/assessments/calendar"
        style="display:inline-block;padding:12px 32px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        Open Calendar &rarr;
      </a>
    </div>`

  await resendSend(p.nurseEmail, subject, wrapLayout(content))
}

// ─── 3. Monthly schedule email ────────────────────────────────────────────────

export interface MonthlyScheduleParams {
  nurseEmail: string
  nurseName:  string
  monthLabel: string   // e.g. "May 2025"
  items:      DigestItem[]
}

export async function sendMonthlyScheduleEmail(p: MonthlyScheduleParams): Promise<void> {
  const firstName = p.nurseName.split(' ')[0] || 'Nurse'
  const subject   = `Your assessment schedule \u2014 ${p.monthLabel}`

  const tableRows = p.items.map(item => `
    <tr>
      <td style="padding:10px 12px;font-size:13px;color:#1A2E44;border-bottom:1px solid #F1F5F9;font-weight:600;white-space:nowrap;">${fmtDate(item.scheduledDate)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;">
        <div style="font-size:13px;color:#1A2E44;font-weight:600;">${item.clientName}</div>
        ${item.clientPhone ? `<div style="font-size:11px;color:#4A6070;margin-top:2px;">${item.clientPhone}</div>` : ''}
      </td>
      <td style="padding:10px 12px;font-size:12px;color:#4A6070;border-bottom:1px solid #F1F5F9;">${item.clientAddress || '&mdash;'}</td>
    </tr>`).join('')

  const bodyTable = p.items.length === 0
    ? `<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:center;font-size:14px;color:#15803D;">
         &#x2705; No assessments scheduled for ${p.monthLabel}.
       </div>`
    : `<div style="overflow-x:auto;margin-bottom:24px;">
         <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
           <thead>
             <tr style="background:#F8FAFC;">
               <th style="padding:10px 12px;font-size:11px;color:#94A3B8;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Date</th>
               <th style="padding:10px 12px;font-size:11px;color:#94A3B8;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Client</th>
               <th style="padding:10px 12px;font-size:11px;color:#94A3B8;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Address</th>
             </tr>
           </thead>
           <tbody>${tableRows}</tbody>
         </table>
       </div>`

  const content = `
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 6px;">Hi ${firstName},</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 22px;">
      Here is your full assessment schedule for <strong>${p.monthLabel}</strong>.
    </p>
    ${bodyTable}
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${PORTAL_URL}/assessments/calendar"
        style="display:inline-block;padding:12px 32px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        Open Calendar &rarr;
      </a>
    </div>`

  await resendSend(p.nurseEmail, subject, wrapLayout(content))
}
