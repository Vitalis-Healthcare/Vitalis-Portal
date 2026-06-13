// app/api/onboarding/candidates/route.ts
// Staff-only. Creates a candidate (or resends their invite), generates a
// single-use magic-link token, and emails the competency-test invite via Resend.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'
const RESEND_KEY = process.env.RESEND_API_KEY
const TOKEN_TTL_DAYS = 30

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function buildInviteEmail(opts: { firstName: string; testLink: string }) {
  const { firstName, testLink } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Welcome to Vitalis HealthCare</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Caregiver Competency Test</p>
  </div>

  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 10px;">Hi ${firstName}! 👋</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 8px;">
      Thank you for your interest in joining the Vitalis caregiver team. The first step is a short
      <strong>caregiver competency test</strong>.
    </p>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Tap the button below to begin — <strong>no password needed.</strong> This link is just for you
      and stays active for <strong>${TOKEN_TTL_DAYS} days</strong>.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${testLink}"
        style="display:inline-block;padding:16px 44px;background:linear-gradient(135deg,#0E7C7B,#1A9B87);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(14,124,123,0.3);">
        Start the Competency Test
      </a>
    </div>

    <div style="background:#F8FAFC;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <div style="font-size:13px;color:#4A6070;line-height:1.7;">
        <strong>What to expect:</strong> 86 multiple-choice questions on everyday caregiving — communication,
        safety, infection control, documentation, and client care. Take your time; there is no time limit.
      </div>
    </div>

    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#8FA0B0;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Button not working? Copy this link</div>
      <div style="font-size:11px;color:#4A6070;word-break:break-all;line-height:1.6;">${testLink}</div>
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

async function sendInvite(to: string, firstName: string, rawToken: string): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_KEY) return { ok: false, error: 'Email service not configured.' }
  const testLink = `${PORTAL_URL}/onboarding/test?token=${rawToken}`
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: 'Welcome to Vitalis — start your caregiver competency test',
        html: buildInviteEmail({ firstName, testLink }),
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

export async function POST(req: NextRequest) {
  // ── Staff-only gate (no middleware on this repo — check inside the handler) ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const action = body.action || 'create'
  const expires = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  if (action === 'resend') {
    const { id } = body
    if (!id) return NextResponse.json({ error: 'Missing candidate id.' }, { status: 400 })
    const { data: cand } = await svc.from('onb_candidates').select('*').eq('id', id).single()
    if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

    const rawToken = crypto.randomBytes(32).toString('hex')
    await svc.from('onb_candidates')
      .update({ access_token: hashToken(rawToken), token_expires_at: expires, updated_at: new Date().toISOString() })
      .eq('id', id)

    const sent = await sendInvite(cand.email, cand.first_name, rawToken)
    return NextResponse.json({ success: true, id, email: cand.email, emailed: sent.ok, error: sent.error })
  }

  // ── create ──
  const first_name = (body.first_name || '').trim()
  const last_name = (body.last_name || '').trim()
  const email = (body.email || '').trim().toLowerCase()
  if (!first_name || !last_name) return NextResponse.json({ error: 'First and last name are required.' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })

  const rawToken = crypto.randomBytes(32).toString('hex')
  const { data: inserted, error: insErr } = await svc
    .from('onb_candidates')
    .insert({
      first_name, last_name, email,
      status: 'invited',
      access_token: hashToken(rawToken),
      token_expires_at: expires,
      invited_by: user.id,
    })
    .select('id')
    .single()

  if (insErr || !inserted) {
    console.error('[onboarding-candidates] insert failed:', insErr?.message)
    return NextResponse.json({ error: 'Could not save the candidate. Please try again.' }, { status: 500 })
  }

  const sent = await sendInvite(email, first_name, rawToken)
  // Soft-fail: the record is saved; the invite can be re-sent from the UI.
  return NextResponse.json({ success: true, id: inserted.id, email, emailed: sent.ok, error: sent.error })
}
