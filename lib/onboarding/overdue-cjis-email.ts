// lib/onboarding/overdue-cjis-email.ts
//
// The escalation ladder, as recipients and copy.
//
// Okezie, 6 August 2026: "candidates actually will get the fingerprinting done
// — what usually happens is staff forget." So this is aimed squarely at staff
// memory, and it gets louder on a schedule rather than repeating the same
// note forever:
//
//   tier 1 (day 1 over)   coordinators
//   tier 2 (day 8 over)   + Director of Nursing and Compliance, and a banner
//                           on every dashboard in the agency
//   tier 3 (day 16 over)  + the Chairman, personally
//
// One email per day carrying EVERY overdue candidate, addressed to the set for
// the worst tier present. Not one email per tier: three mails a morning is how
// a mailbox rule gets written and the whole thing goes quiet.

import type { OverdueCjis } from '@/lib/onboarding/overdue-cjis'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const TEAM_NOTIFY = process.env.TEAM_NOTIFY_EMAIL || 'team@vitalishealthcare.com'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const RESEND_KEY = process.env.RESEND_API_KEY

/** portal_settings keys. All optional — every one has a working fallback. */
export const PAUSE_KEY = 'cjis_alerts_paused'
export const LAST_SENT_KEY = 'cjis_alerts_last_sent_on'
export const COORDINATORS_KEY = 'cjis_alert_recipients'
export const ESCALATION_KEY = 'cjis_escalation_recipients'
export const CHAIRMAN_KEY = 'cjis_chairman_email'

type Svc = ReturnType<typeof import('@/lib/supabase/service').createServiceClient>

function splitList(v: unknown): string[] {
  if (typeof v !== 'string') return []
  return v.split(',').map((s) => s.trim()).filter(Boolean)
}

async function readSetting(svc: Svc, key: string): Promise<string> {
  try {
    const { data } = await svc.from('portal_settings').select('value').eq('key', key).maybeSingle()
    return typeof data?.value === 'string' ? data.value.trim() : ''
  } catch {
    // A missing row or a cold schema cache must never silence an escalation.
    return ''
  }
}

async function activeEmailsForRoles(svc: Svc, roles: string[]): Promise<string[]> {
  try {
    const { data } = await svc
      .from('profiles')
      .select('email')
      .in('role', roles)
      .eq('status', 'active')
    return (Array.isArray(data) ? data : [])
      .map((p: { email?: string | null }) => (p.email || '').trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Who hears about it at this tier. Cumulative by design: tier 3 reaches the
 * Chairman AND everyone below, because the point is that the people who could
 * have fixed it see that it went up the chain.
 */
export async function resolveRecipients(svc: Svc, tier: 1 | 2 | 3): Promise<string[]> {
  const set = new Set<string>()

  // Tier 1 — the coordinators. Falls back to team@, which is monitored.
  const coordinators = splitList(await readSetting(svc, COORDINATORS_KEY))
  if (coordinators.length > 0) coordinators.forEach((e) => set.add(e))
  else set.add(TEAM_NOTIFY)

  if (tier >= 2) {
    const escalation = splitList(await readSetting(svc, ESCALATION_KEY))
    if (escalation.length > 0) escalation.forEach((e) => set.add(e))
    else (await activeEmailsForRoles(svc, ['supervisor', 'admin'])).forEach((e) => set.add(e))
  }

  if (tier >= 3) {
    const chairman = splitList(await readSetting(svc, CHAIRMAN_KEY))
    if (chairman.length > 0) chairman.forEach((e) => set.add(e))
    // No hard-coded address. Absent an explicit setting, every active admin is
    // the honest approximation of "the person accountable for this".
    else (await activeEmailsForRoles(svc, ['admin'])).forEach((e) => set.add(e))
  }

  return Array.from(set)
}

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmt(d: string): string {
  const p = d.split('-').map(Number)
  return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function subjectFor(list: OverdueCjis[], tier: 1 | 2 | 3): string {
  const n = list.length
  const worst = list[0]
  const who = n === 1 ? `${list[0].firstName} ${list[0].lastName}` : `${n} caregivers`
  if (tier >= 3) return `ACTION REQUIRED — CJIS outstanding ${worst.daysOverdue} days: ${who}`
  if (tier >= 2) return `Escalated — CJIS background checks overdue: ${who}`
  return `CJIS background checks overdue: ${who}`
}

export function renderOverdueHtml(list: OverdueCjis[], tier: 1 | 2 | 3): string {
  const rows = list.map((o) => {
    const url = `${PORTAL_URL}/candidates/${o.candidateId}/credentials`
    const converted = o.convertedProfileId
      ? '<span style="color:#B91C1C;font-weight:700;"> — already working as a caregiver</span>'
      : ''
    const ext = o.extensionCount > 0
      ? `<span style="color:#B45309;"> · extended ${o.extensionCount}&times;</span>`
      : ''
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #EFF2F5;font-size:13.5px;color:#1A2E44;">
        <a href="${url}" style="color:#0E7C7B;font-weight:700;text-decoration:none;">${esc(o.firstName)} ${esc(o.lastName)}</a>${converted}<br>
        <span style="color:#8FA0B0;font-size:12px;">Form sent ${fmt(o.sentAt)} · expected ${fmt(o.expectedBy)}${o.note ? ` · ${esc(o.note)}` : ''}</span>${ext}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #EFF2F5;font-size:15px;font-weight:800;color:#B91C1C;text-align:right;white-space:nowrap;">
        ${o.daysOverdue}d
      </td>
    </tr>`
  }).join('')

  const preamble = tier >= 3
    ? 'These CJIS background checks were promised and have not arrived. This has now been outstanding long enough to reach you directly. Somebody has to pick up the phone today.'
    : tier >= 2
      ? 'These CJIS background checks are past the date they were expected. The Director of Nursing and Compliance are copied because the first round of chasing did not resolve it.'
      : 'A coordinator recorded that the fingerprinting form was sent and results were expected by the date shown. They have not arrived. Chase the result and upload the record — or, if it is genuinely still coming, extend the attestation and say why.'

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F8FAFC;font-family:'DM Sans','Segoe UI',Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:24px 16px;">
    <div style="background:${tier >= 3 ? '#7F1D1D' : tier >= 2 ? '#9A3412' : '#1A2E44'};padding:22px 26px;border-radius:14px 14px 0 0;">
      <h1 style="color:#ffffff;margin:0;font-size:18px;font-weight:800;">CJIS background checks overdue</h1>
      <p style="color:rgba(255,255,255,0.65);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">
        Vitalis HealthCare · ${list.length} outstanding
      </p>
    </div>
    <div style="background:#ffffff;padding:24px 26px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 14px 14px;">
      <p style="color:#4A6070;font-size:14px;line-height:1.7;margin:0 0 18px;">${preamble}</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 18px;">${rows}</table>
      <p style="color:#8FA0B0;font-size:12.5px;line-height:1.7;margin:0;">
        Uploading the CJIS record on the candidate&rsquo;s credentials page closes this automatically —
        there is nothing else to tick. This email repeats every morning until the list is empty.
      </p>
    </div>
    <div style="text-align:center;padding:18px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
      Vitalis Healthcare Services, LLC &middot; 8757 Georgia Avenue, Suite 440 &middot; Silver Spring, MD 20910
    </div>
  </div>
</body></html>`
}

export interface SendResult { ok: boolean; id?: string; error?: string }

export async function sendOverdueCjisEmail(
  to: string[],
  list: OverdueCjis[],
  tier: 1 | 2 | 3,
): Promise<SendResult> {
  if (!RESEND_KEY) return { ok: false, error: 'RESEND_API_KEY is not configured.' }
  if (to.length === 0) return { ok: false, error: 'No recipients resolved.' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject: subjectFor(list, tier),
        html: renderOverdueHtml(list, tier),
      }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, error: (body && body.message) || `Resend returned ${res.status}.` }
    const id = body && typeof body.id === 'string' ? body.id : undefined
    if (!id) return { ok: false, error: 'Resend accepted the request but returned no id.' }
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error reaching Resend.' }
  }
}
