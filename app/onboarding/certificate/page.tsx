// app/onboarding/certificate/page.tsx
// Public, token-gated certificate view for a candidate who has completed the test.
// If the candidate completed BEFORE certificates existed (or any edge where no
// certificate row is present yet), issue it now — idempotent, one per candidate.
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { formatCertNo, issueCertificateIfNeeded } from '@/lib/onboarding/certificate'
import Certificate from './Certificate'

export const dynamic = 'force-dynamic'

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Segoe UI',Arial,sans-serif" }}>
      <div style={{ maxWidth: 480, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '32px' }}>
        <h2 style={{ fontSize: 18, color: '#1A2E44', margin: '0 0 10px' }}>{title}</h2>
        <p style={{ color: '#4A6070', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{body}</p>
      </div>
    </div>
  )
}

type CertRow = { certificate_number: number; issued_to_name: string; issued_at: string }

export default async function CertificatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  if (!token) return <Notice title="This link is not valid" body="Please use the certificate link from your completion email." />

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, token_expires_at')
    .eq('access_token', hashToken(token))
    .single()
  if (!cand) return <Notice title="This link is not valid" body="Please use the certificate link from your completion email, or contact the Vitalis office." />
  if (cand.token_expires_at && new Date(cand.token_expires_at) < new Date()) {
    return <Notice title="This link has expired" body="Please contact the Vitalis office and we will send you a fresh link." />
  }

  let certRow: CertRow | null = null
  const { data: existing } = await svc
    .from('onb_certificates')
    .select('certificate_number, issued_to_name, issued_at')
    .eq('candidate_id', cand.id)
    .maybeSingle()
  certRow = (existing as CertRow) || null

  // Self-heal: completed but no certificate yet (e.g. passed before certificates existed).
  if (!certRow) {
    const { data: attempt } = await svc
      .from('onb_attempts')
      .select('first_passed, mastery_reached, first_score, first_total')
      .eq('candidate_id', cand.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (attempt && (attempt.first_passed || attempt.mastery_reached)) {
      const issued = await issueCertificateIfNeeded(svc, {
        candidateId: cand.id,
        name: `${cand.first_name} ${cand.last_name}`.trim(),
        score: attempt.first_score ?? null,
        total: attempt.first_total ?? null,
      })
      if (issued) certRow = { certificate_number: issued.certificate_number, issued_to_name: issued.issued_to_name, issued_at: issued.issued_at }
    }
  }

  if (!certRow) {
    return <Notice title="No certificate yet" body="Your certificate appears once you have completed the competency test. If you have finished, please contact the Vitalis office." />
  }

  const issuedDate = new Date(certRow.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;700&display=swap" />
      <Certificate
        name={certRow.issued_to_name}
        certNo={formatCertNo(certRow.certificate_number)}
        issuedDate={issuedDate}
      />
    </>
  )
}
