// app/api/onboarding/test/mastery/route.ts
// One mastery round. Grades the candidate's submitted answers against the
// server-held "still to master" set (onb_attempts.answers.mastery_remaining),
// removes the ones now correct, and completes the test when none remain.
// On completion, issues the certificate and emails it.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { issueCertificateIfNeeded, sendCertificateEmail, formatCertNo } from '@/lib/onboarding/certificate'

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

async function finish(
  svc: ReturnType<typeof createServiceClient>,
  cand: { id: string; first_name: string; last_name: string; email: string },
  attemptId: string,
  scoreInfo: { score: number | null; total: number | null },
  token: string,
  extraAttemptUpdate: Record<string, unknown> = {},
) {
  const nowIso = new Date().toISOString()
  await svc.from('onb_attempts').update({ mastery_reached: true, completed_at: nowIso, ...extraAttemptUpdate }).eq('id', attemptId)
  await svc.from('onb_candidates').update({ status: 'test_passed', test_passed_at: nowIso, updated_at: nowIso }).eq('id', cand.id)
  const cert = await issueCertificateIfNeeded(svc, {
    candidateId: cand.id,
    name: `${cand.first_name} ${cand.last_name}`.trim(),
    score: scoreInfo.score, total: scoreInfo.total,
  })
  if (cert) {
    await sendCertificateEmail({
      to: cand.email,
      firstName: cand.first_name,
      certNo: formatCertNo(cert.certificate_number),
      certUrl: `${PORTAL_URL}/onboarding/certificate?token=${token}`,
    })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const token: string = body.token || ''
  const answers: Record<string, string> = body.answers || {}
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, email, token_expires_at')
    .eq('access_token', hashToken(token))
    .single()
  if (!cand) return NextResponse.json({ error: 'invalid_token' }, { status: 404 })
  if (cand.token_expires_at && new Date(cand.token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'expired_token' }, { status: 410 })
  }

  const { data: attempt } = await svc
    .from('onb_attempts')
    .select('*')
    .eq('candidate_id', cand.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!attempt) return NextResponse.json({ error: 'no_attempt' }, { status: 409 })
  if (attempt.first_passed || attempt.mastery_reached) {
    return NextResponse.json({ done: true })
  }

  const answersJson = (attempt.answers || {}) as {
    first?: Record<string, { selected: string | null; correct: boolean }>
    mastery_remaining?: string[]
  }
  const remainingIds: string[] = answersJson.mastery_remaining || []

  if (remainingIds.length === 0) {
    await finish(svc, cand, attempt.id, { score: attempt.first_score, total: attempt.first_total }, token)
    return NextResponse.json({ done: true })
  }

  const { data: questions } = await svc
    .from('onb_questions')
    .select('id, prompt, options, correct_key, rationale')
    .in('id', remainingIds)
  const qById = new Map((questions || []).map((q) => [q.id, q]))

  const stillWrong: string[] = []
  for (const id of remainingIds) {
    const q = qById.get(id)
    if (!q) continue
    if (answers[id] !== q.correct_key) stillWrong.push(id)
  }

  const updatedAnswers = { ...answersJson, mastery_remaining: stillWrong }

  if (stillWrong.length === 0) {
    await finish(svc, cand, attempt.id, { score: attempt.first_score, total: attempt.first_total }, token, { answers: updatedAnswers })
    return NextResponse.json({ done: true })
  }

  await svc.from('onb_attempts').update({ answers: updatedAnswers }).eq('id', attempt.id)

  const remaining = stillWrong.map((id) => {
    const q = qById.get(id)!
    return {
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      correct_key: q.correct_key,
      rationale: q.rationale || '',
      selected: answers[id] ?? null,
    }
  })

  return NextResponse.json({ done: false, remaining })
}
