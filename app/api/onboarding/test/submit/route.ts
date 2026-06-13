// app/api/onboarding/test/submit/route.ts
// Grades the candidate's first attempt server-side (answer key never leaves the
// server until this point). Records the canonical onb_attempts row. Pass = 90%.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

const PASS_FRACTION = 0.9

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const token: string = body.token || ''
  const answers: Record<string, string> = body.answers || {}
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, token_expires_at')
    .eq('access_token', hashToken(token))
    .single()
  if (!cand) return NextResponse.json({ error: 'invalid_token' }, { status: 404 })
  if (cand.token_expires_at && new Date(cand.token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'expired_token' }, { status: 410 })
  }

  // First attempt happens exactly once.
  const { data: existing } = await svc
    .from('onb_attempts')
    .select('id')
    .eq('candidate_id', cand.id)
    .limit(1)
    .maybeSingle()
  if (existing) return NextResponse.json({ error: 'already_submitted' }, { status: 409 })

  const { data: questions } = await svc
    .from('onb_questions')
    .select('id, prompt, options, correct_key, rationale')
    .eq('active', true)
  const qList = questions || []
  const total = qList.length
  if (total === 0) return NextResponse.json({ error: 'no_questions' }, { status: 500 })

  let score = 0
  const firstSnapshot: Record<string, { selected: string | null; correct: boolean }> = {}
  const missedIds: string[] = []
  for (const q of qList) {
    const sel = answers[q.id] ?? null
    const correct = sel === q.correct_key
    if (correct) score++
    else missedIds.push(q.id)
    firstSnapshot[q.id] = { selected: sel, correct }
  }
  const passed = score / total >= PASS_FRACTION
  const nowIso = new Date().toISOString()

  const answersJson: Record<string, unknown> = { first: firstSnapshot }
  if (!passed) answersJson.mastery_remaining = missedIds

  await svc.from('onb_attempts').insert({
    candidate_id: cand.id,
    first_score: score,
    first_total: total,
    first_passed: passed,
    answers: answersJson,
    mastery_reached: false,
    started_at: nowIso,
    completed_at: passed ? nowIso : null,
  })

  await svc.from('onb_candidates')
    .update(passed
      ? { status: 'test_passed', test_passed_at: nowIso, updated_at: nowIso }
      : { status: 'testing', updated_at: nowIso })
    .eq('id', cand.id)

  if (passed) {
    return NextResponse.json({ passed: true, score, total })
  }

  const missed = qList
    .filter((q) => missedIds.includes(q.id))
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      selected: firstSnapshot[q.id]?.selected ?? null,
      correct_key: q.correct_key,
      rationale: q.rationale || '',
    }))

  return NextResponse.json({ passed: false, score, total, missed })
}
