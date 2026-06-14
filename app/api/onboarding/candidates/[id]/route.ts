// app/api/onboarding/candidates/[id]/route.ts
// Staff-only candidate review actions:
//   - begin_review:      application_submitted -> in_review
//   - request_documents: (application_submitted | in_review) -> applying, mints a
//                        fresh token, and emails the candidate a link back to the
//                        application form to add the requested documents.
// Auth happens inside the handler (this repo has no middleware): getUser() +
// role check via the service client.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ONB_DOCUMENT_TYPES, docTypeLabel } from '@/lib/onboarding/documents'

export const dynamic = 'force-dynamic'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const TEAM_NOTIFY = process.env.TEAM_NOTIFY_EMAIL || 'team@vitalishealthcare.com'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const RESEND_KEY = process.env.RESEND_API_KEY
const TOKEN_TTL_DAYS = 30

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function buildRequestEmail(opts: { firstName: string; link: string; items: string[]; note: string }) {
  const { firstName, link, items, note } = opts
  const itemsHtml = items.map((i) =>
    `<li style="margin-bottom:6px;color:#4A6070;font-size:14px;line-height:1.6;">${i}</li>`).join('')
  const noteHtml = note
    ? `<div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
         <div style="font-size:11px;font-weight:700;color:#8FA0B0;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">A note from our team</div>
         <div style="font-size:13.5px;color:#4A6070;line-height:1.6;">${note}</div>
       </div>` : ''
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">A Few More Documents</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Vitalis HealthCare</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 10px;">Hi ${firstName},</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 8px;">
      Thank you for your application. To continue, we need the following from you:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;">${itemsHtml}</ul>
    ${noteHtml}
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${link}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#0E7C7B,#1A9B87);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(14,124,123,0.3);">
        Add Your Documents
      </a>
    </div>
    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#8FA0B0;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Button not working? Copy this link</div>
      <div style="font-size:11px;color:#4A6070;word-break:break-all;line-height:1.6;">${link}</div>
    </div>
    <p style="color:#94A3B8;font-size:12px;margin:0;line-height:1.6;">
      Your previously entered information is saved — you only need to add what is listed above. This link stays active for ${TOKEN_TTL_DAYS} days.
    </p>
  </div>
  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
    Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910
  </div>
</div>
</body>
</html>`
}

async function sendRequest(to: string, firstName: string, link: string, items: string[], note: string): Promise<boolean> {
  if (!RESEND_KEY || !to) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        bcc: [TEAM_NOTIFY],
        subject: 'Vitalis caregiver application — a few documents needed',
        html: buildRequestEmail({ firstName, link, items, note }),
      }),
    })
    if (!res.ok) { console.error('[candidate-review] request email error:', await res.text()); return false }
    return true
  } catch (e) {
    console.error('[candidate-review] request email threw:', e)
    return false
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // ── Staff gate ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }

  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, email, status')
    .eq('id', id)
    .single()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const action = body.action
  const nowIso = new Date().toISOString()

  if (action === 'begin_review') {
    if (cand.status !== 'application_submitted') {
      return NextResponse.json({ error: 'Review can only begin once an application is submitted.' }, { status: 409 })
    }
    await svc.from('onb_candidates').update({ status: 'in_review', updated_at: nowIso }).eq('id', cand.id)
    return NextResponse.json({ success: true, status: 'in_review' })
  }

  if (action === 'request_documents') {
    if (!(cand.status === 'application_submitted' || cand.status === 'in_review')) {
      return NextResponse.json({ error: 'Documents can only be requested after the application is submitted.' }, { status: 409 })
    }
    const keys: string[] = Array.isArray(body.doc_keys) ? body.doc_keys : []
    const validKeys = keys.filter((k) => ONB_DOCUMENT_TYPES.some((d) => d.key === k))
    if (validKeys.length === 0) return NextResponse.json({ error: 'Select at least one document to request.' }, { status: 400 })
    const note = typeof body.note === 'string' ? body.note.slice(0, 1000) : ''
    const items = validKeys.map((k) => docTypeLabel(k))

    // Mint a fresh token and reopen the application.
    const rawToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    await svc.from('onb_candidates')
      .update({ status: 'applying', access_token: hashToken(rawToken), token_expires_at: expires, updated_at: nowIso })
      .eq('id', cand.id)

    const link = `${PORTAL_URL}/onboarding/application?token=${rawToken}`
    const emailed = await sendRequest(cand.email, cand.first_name, link, items, note)
    // Soft-fail: status is already updated; a failed email doesn't roll it back.
    return NextResponse.json({ success: true, status: 'applying', emailed })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
