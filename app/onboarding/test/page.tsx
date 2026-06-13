// app/onboarding/test/page.tsx
// Public, token-gated landing for invited candidates (no auth/Supabase session).
// v0.6.0 validates the magic-link token and greets the candidate; the full
// competency test is wired in here in v0.6.1.
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Segoe UI',Arial,sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ background: 'linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%)', padding: '28px 32px', borderRadius: '14px 14px 0 0', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#0E7C7B,#F4A261)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 12 }}>V+</div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 20, fontWeight: 800 }}>Vitalis Caregiver Competency Test</h1>
        </div>
        <div style={{ background: '#fff', padding: '32px', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 14px 14px' }}>
          {children}
        </div>
        <div style={{ textAlign: 'center', padding: '18px 0', fontSize: 11, color: '#94A3B8', lineHeight: 1.8 }}>
          Vitalis Healthcare Services, LLC · Silver Spring, MD
        </div>
      </div>
    </div>
  )
}

function InvalidLink() {
  return (
    <Shell>
      <h2 style={{ fontSize: 18, color: '#1A2E44', margin: '0 0 10px' }}>This link is not valid</h2>
      <p style={{ color: '#4A6070', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
        Your invitation link may have expired or already been replaced by a newer one. Please contact the
        Vitalis office and we will send you a fresh link.
      </p>
    </Shell>
  )
}

export default async function OnboardingTestPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  if (!token) return <InvalidLink />

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, status, token_expires_at')
    .eq('access_token', hashToken(token))
    .single()

  if (!cand) return <InvalidLink />
  if (cand.token_expires_at && new Date(cand.token_expires_at) < new Date()) return <InvalidLink />

  return (
    <Shell>
      <h2 style={{ fontSize: 20, color: '#1A2E44', margin: '0 0 10px' }}>Welcome, {cand.first_name}! 👋</h2>
      <p style={{ color: '#4A6070', fontSize: 14, lineHeight: 1.7, margin: '0 0 18px' }}>
        Thank you for taking the first step toward joining the Vitalis caregiver team. Your competency
        test is being prepared and will appear here shortly.
      </p>
      <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0A5C5B', marginBottom: 6 }}>What to expect</div>
        <div style={{ fontSize: 13, color: '#4A6070', lineHeight: 1.7 }}>
          86 multiple-choice questions on everyday caregiving — communication, safety, infection control,
          documentation, and client care. There is no time limit, and you can use this same link to return.
        </div>
      </div>
    </Shell>
  )
}
