// app/api/onboarding/test/mastery/route.ts
// One mastery round. Grades the candidate's submitted answers against the
// server-held "still to master" set (onb_attempts.answers.mastery_remaining),
// removes the ones now correct, and completes the test when none remain.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

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
  const nowIso = new Date().toISOString()

  if (remainingIds.length === 0) {
    await svc.from('onb_attempts').update({ mastery_reached: true, completed_at: nowIso }).eq('id', attempt.id)
    await svc.from('onb_candidates').update({ status: 'test_passed', test_passed_at: nowIso, updated_at: nowIso }).eq('id', cand.id)
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
    await svc.from('onb_attempts')
      .update({ answers: updatedAnswers, mastery_reached: true, completed_at: nowIso })
      .eq('id', attempt.id)
    await svc.from('onb_candidates')
      .update({ status: 'test_passed', test_passed_at: nowIso, updated_at: nowIso })
      .eq('id', cand.id)
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
