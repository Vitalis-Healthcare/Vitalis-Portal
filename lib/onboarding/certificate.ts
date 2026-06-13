// lib/onboarding/certificate.ts
// Shared helpers for issuing a candidate's competency certificate and emailing
// it. Pure data + Resend fetch — no filesystem assets (safe to import from
// multiple routes). Called on test completion from submit + mastery routes.
import { createServiceClient } from '@/lib/supabase/service'

type Svc = ReturnType<typeof createServiceClient>

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const RESEND_KEY = process.env.RESEND_API_KEY

export function formatCertNo(n: number): string {
  return String(n).padStart(10, '0')
}

export type IssuedCert = { certificate_number: number; issued_at: string; issued_to_name: string }

// Idempotent: one certificate per candidate. Returns the existing or new cert.
export async function issueCertificateIfNeeded(
  svc: Svc,
  opts: { candidateId: string; name: string; score: number | null; total: number | null }
): Promise<IssuedCert | null> {
  const { data: existing } = await svc
    .from('onb_certificates')
    .select('certificate_number, issued_at, issued_to_name')
    .eq('candidate_id', opts.candidateId)
    .maybeSingle()
  if (existing) return existing as IssuedCert

  const { data: nextNum, error: rpcErr } = await svc.rpc('onb_next_certificate_number')
  if (rpcErr || typeof nextNum !== 'number') {
    console.error('[certificate] could not allocate number:', rpcErr?.message)
    return null
  }

  const { data: inserted, error: insErr } = await svc
    .from('onb_certificates')
    .insert({
      candidate_id: opts.candidateId,
      certificate_number: nextNum,
      issued_to_name: opts.name,
      score: opts.score,
      total: opts.total,
    })
    .select('certificate_number, issued_at, issued_to_name')
    .single()

  if (insErr || !inserted) {
    // Likely a race on the unique candidate index — re-read the winning row.
    const { data: again } = await svc
      .from('onb_certificates')
      .select('certificate_number, issued_at, issued_to_name')
      .eq('candidate_id', opts.candidateId)
      .maybeSingle()
    return (again as IssuedCert) || null
  }
  return inserted as IssuedCert
}

function buildCertificateEmail(opts: { firstName: string; certNo: string; certUrl: string }) {
  const { firstName, certNo, certUrl } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#0E7C7B,#F4A261);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Congratulations!</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0;letter-spacing:0.8px;text-transform:uppercase;">Caregiver Competency Certificate</p>
  </div>

  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;color:#1A2E44;margin:0 0 10px;">Well done, ${firstName}! 🎓</h2>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 8px;">
      You have successfully completed the Vitalis Caregiver Basic Competency Test. Your certificate is ready.
    </p>
    <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Certificate number: <strong>${certNo}</strong>
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${certUrl}"
        style="display:inline-block;padding:16px 44px;background:linear-gradient(135deg,#2D5A1B,#5A9E2F);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(45,90,27,0.3);">
        View &amp; Print Your Certificate
      </a>
    </div>

    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#8FA0B0;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Button not working? Copy this link</div>
      <div style="font-size:11px;color:#4A6070;word-break:break-all;line-height:1.6;">${certUrl}</div>
    </div>

    <p style="color:#94A3B8;font-size:12px;margin:0;line-height:1.6;">
      The Vitalis team will be in touch with your next steps. Welcome aboard!
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

export async function sendCertificateEmail(opts: { to: string; firstName: string; certNo: string; certUrl: string }): Promise<void> {
  if (!RESEND_KEY) return
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [opts.to],
        subject: '🎓 Your Vitalis caregiver competency certificate',
        html: buildCertificateEmail({ firstName: opts.firstName, certNo: opts.certNo, certUrl: opts.certUrl }),
      }),
    })
    if (!res.ok) console.error('[certificate] email send failed:', await res.text())
  } catch (e) {
    console.error('[certificate] email threw:', e)
  }
}
