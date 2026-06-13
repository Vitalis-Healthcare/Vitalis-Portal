// app/onboarding/test/page.tsx
// Public, token-gated competency test for invited candidates (no Supabase session).
// Server component: validates the magic-link token, decides which state the
// candidate is in (intro / mastery-in-progress / completed), and serves only
// what that state needs. The answer key is NEVER sent for the first attempt.
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import TestRunner from './TestRunner'

export const dynamic = 'force-dynamic'

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
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

type Opt = { key: string; text: string }

export default async function OnboardingTestPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  if (!token) return <InvalidLink />

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, token_expires_at')
    .eq('access_token', hashToken(token))
    .single()

  if (!cand) return <InvalidLink />
  if (cand.token_expires_at && new Date(cand.token_expires_at) < new Date()) return <InvalidLink />

  const { data: attempt } = await svc
    .from('onb_attempts')
    .select('*')
    .eq('candidate_id', cand.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Already finished (passed first try, or completed the mastery loop)
  if (attempt && (attempt.first_passed || attempt.mastery_reached)) {
    return (
      <TestRunner
        token={token}
        firstName={cand.first_name}
        initial={{ mode: 'completed', score: attempt.first_score ?? 0, total: attempt.first_total ?? 0, firstPassed: !!attempt.first_passed }}
      />
    )
  }

  // Failed the first attempt and still working through mastery
  if (attempt && !attempt.first_passed) {
    const answers = (attempt.answers || {}) as { first?: Record<string, { selected: string | null }>; mastery_remaining?: string[] }
    const remainingIds: string[] = answers.mastery_remaining || []
    if (remainingIds.length > 0) {
      const { data: qs } = await svc
        .from('onb_questions')
        .select('id, prompt, options, correct_key, rationale')
        .in('id', remainingIds)
      const firstAns = answers.first || {}
      const remaining = (qs || []).map((q) => ({
        id: q.id as string,
        prompt: q.prompt as string,
        options: q.options as Opt[],
        correct_key: q.correct_key as string,
        rationale: (q.rationale || '') as string,
        selected: firstAns[q.id]?.selected ?? null,
      }))
      return (
        <TestRunner
          token={token}
          firstName={cand.first_name}
          initial={{ mode: 'mastery_review', remaining, firstScore: attempt.first_score ?? 0, total: attempt.first_total ?? 0 }}
        />
      )
    }
    // Edge: attempt exists, not passed, nothing left to master — treat as done.
    return (
      <TestRunner
        token={token}
        firstName={cand.first_name}
        initial={{ mode: 'completed', score: attempt.first_score ?? 0, total: attempt.first_total ?? 0, firstPassed: false }}
      />
    )
  }

  // Fresh: serve the full test, shuffled, with NO answer key.
  const { data: questions } = await svc
    .from('onb_questions')
    .select('id, domain, prompt, options')
    .eq('active', true)
    .order('sort_order')

  const shuffled = shuffle(questions || []).map((q) => ({
    id: q.id as string,
    domain: q.domain as string,
    prompt: q.prompt as string,
    options: q.options as Opt[],
  }))

  return (
    <TestRunner
      token={token}
      firstName={cand.first_name}
      initial={{ mode: 'intro', questions: shuffled, total: shuffled.length }}
    />
  )
}
