// app/api/reports/ai-chat/route.ts
// AI Compliance Analyst — answers questions about the full compliance state of the workforce.
// Fetches live data from all 6 dimensions, builds a structured context, calls Claude.
// Admin / supervisor only.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getComplianceData, getPhase2Data } from '@/lib/reports'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Data summary builder ─────────────────────────────────────────────────────
// Converts live portal data into a compact, structured text summary for Claude.
// Keeps it under ~6000 tokens while giving enough detail to answer all key questions.

async function buildComplianceContext(): Promise<string> {
  const [p1, p2] = await Promise.all([getComplianceData(), getPhase2Data()])

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // ── Fleet summary ──────────────────────────────────────────────────────────
  let ctx = `=== VITALIS HEALTHCARE — LIVE COMPLIANCE DATA ===
Generated: ${today}
Total Active Caregivers: ${p1.totalCaregivers}
Fleet Credential Compliance: ${p1.overallCompliancePct}%
Team Appraisal Average: ${p2.teamOverallAvg > 0 ? p2.teamOverallAvg.toFixed(1) + '/4.0' : 'No appraisals yet'}
References: ${p2.refStats.received}/${p2.refStats.total} slots received (${p2.refStats.pct_received}%)
Avg Reference Turnaround: ${p2.avgDaysToReceive !== null ? p2.avgDaysToReceive + ' days' : 'N/A'}

`

  // ── Credential counts ──────────────────────────────────────────────────────
  let current = 0, expiring = 0, expired = 0, missing = 0
  for (const row of p1.matrixRows) {
    for (const cell of Object.values(row.credentials)) {
      if (cell.status === 'current')  current++
      if (cell.status === 'expiring') expiring++
      if (cell.status === 'expired')  expired++
      if (cell.status === 'missing')  missing++
    }
  }

  ctx += `=== CREDENTIAL OVERVIEW ===
Current: ${current} | Expiring Soon: ${expiring} | Expired: ${expired} | Missing: ${missing}

`

  // ── Per-caregiver summary table ────────────────────────────────────────────
  ctx += `=== CAREGIVER COMPLIANCE SUMMARY ===
Format: Name | Cred% | Missing | Expiring | Expired | Training% | Overdue Training | Refs | Appraisal | Score
`

  for (const row of p1.matrixRows) {
    const credCells = Object.values(row.credentials)
    const missingCount  = credCells.filter((c) => c.status === 'missing').length
    const expiringCount = credCells.filter((c) => c.status === 'expiring').length
    const expiredCount  = credCells.filter((c) => c.status === 'expired').length

    const trainingRow = p2.trainingGapRows.find((t) => t.caregiver_id === row.id)
    const heatmapRow  = p2.heatmapRows.find((h) => h.caregiver_id === row.id)

    const appraisalStatus = row.latest_appraisal?.status || 'none'
    const appraisalScore  = row.latest_appraisal?.avg_score
      ? row.latest_appraisal.avg_score.toFixed(1) : '—'

    ctx += `${row.full_name} | ${row.credential_compliance_pct}% | ${missingCount} missing | ${expiringCount} expiring | ${expiredCount} expired | ${row.training_pct}% | ${trainingRow?.has_overdue ? 'YES' : 'no'} | ${row.refs_received}/3 refs | appraisal:${appraisalStatus} | score:${appraisalScore}\n`
  }

  // ── Missing credential detail ──────────────────────────────────────────────
  ctx += `\n=== MISSING CREDENTIALS DETAIL ===\n`
  for (const row of p1.matrixRows) {
    const missingTypes = p1.caregiverCredTypes
      .filter((ct) => row.credentials[ct.id]?.status === 'missing')
      .map((ct) => ct.name)
    if (missingTypes.length > 0) {
      ctx += `${row.full_name}: missing ${missingTypes.join(', ')}\n`
    }
  }

  // ── Expiring within 30 days ────────────────────────────────────────────────
  const urgent = p1.timelineItems.filter((i) => i.days_until <= 30)
  if (urgent.length > 0) {
    ctx += `\n=== CREDENTIALS EXPIRING WITHIN 30 DAYS ===\n`
    for (const item of urgent) {
      ctx += `${item.caregiver_name} — ${item.credential_type_name} expires in ${item.days_until} days (${item.expiry_date})\n`
    }
  }

  // ── Training detail ────────────────────────────────────────────────────────
  ctx += `\n=== TRAINING PROGRAMMES ===\n`
  for (const prog of p2.programmes) {
    const enrolled  = p2.trainingGapRows.filter((r) => r.enrollments.some((e) => e.programme_id === prog.id)).length
    const completed = p2.trainingGapRows.filter((r) => r.enrollments.some((e) => e.programme_id === prog.id && e.is_completed)).length
    const overdue   = p2.trainingGapRows.filter((r) => r.enrollments.some((e) => e.programme_id === prog.id && e.is_overdue)).length
    ctx += `${prog.title}: ${enrolled} enrolled, ${completed} completed, ${overdue} overdue\n`
  }

  const overdueTraining = p2.trainingGapRows.filter((r) => r.has_overdue)
  if (overdueTraining.length > 0) {
    ctx += `\nCaregivers with overdue training: ${overdueTraining.map((r) => r.caregiver_name).join(', ')}\n`
  }

  const notFullyEnrolled = p2.trainingGapRows.filter((r) => r.not_enrolled_count > 0)
  if (notFullyEnrolled.length > 0) {
    ctx += `Caregivers not enrolled in all programmes: ${notFullyEnrolled.map((r) => `${r.caregiver_name} (${r.not_enrolled_count} missing)`).join(', ')}\n`
  }

  // ── Appraisal summary ─────────────────────────────────────────────────────
  ctx += `\n=== APPRAISAL SUMMARY ===\n`
  ctx += `Team Clinical Average: ${p2.teamClinicalAvg.toFixed(1)}/4.0\n`
  ctx += `Team Professional Average: ${p2.teamProfessionalAvg.toFixed(1)}/4.0\n`
  ctx += `Caregivers with signed appraisal: ${p2.heatmapRows.filter((r) => r.status === 'signed').length}\n`
  ctx += `Caregivers with no appraisal: ${p1.totalCaregivers - p2.heatmapRows.length}\n`

  if (p2.heatmapRows.length > 0) {
    const sorted = [...p2.heatmapRows].sort((a, b) => b.overall_avg - a.overall_avg)
    ctx += `Top 3 appraisal scores: ${sorted.slice(0, 3).map((r) => `${r.caregiver_name} (${r.overall_avg.toFixed(1)})`).join(', ')}\n`
    const lowest = sorted.slice(-3).reverse()
    ctx += `Lowest 3 appraisal scores: ${lowest.map((r) => `${r.caregiver_name} (${r.overall_avg.toFixed(1)})`).join(', ')}\n`
  }

  // ── References detail ──────────────────────────────────────────────────────
  const outstandingRefs = p2.refPipelineRows
    .filter((r) => r.status === 'sent' && r.days_outstanding !== null)
    .sort((a, b) => (b.days_outstanding || 0) - (a.days_outstanding || 0))

  if (outstandingRefs.length > 0) {
    ctx += `\n=== OUTSTANDING REFERENCES (sent, awaiting response) ===\n`
    for (const r of outstandingRefs.slice(0, 10)) {
      ctx += `${r.caregiver_name} — ${r.slot_label} — outstanding ${r.days_outstanding} days\n`
    }
  }

  const noRefs = p1.matrixRows.filter((r) => r.refs_received === 0)
  if (noRefs.length > 0) {
    ctx += `Caregivers with 0 references received: ${noRefs.map((r) => r.full_name).join(', ')}\n`
  }

  return ctx
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth + role gate ──────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles').select('role, full_name').eq('id', user.id).single()

  if (!['admin', 'supervisor'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── API key ────────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      answer: 'The AI Compliance Analyst is not configured. Please add the ANTHROPIC_API_KEY environment variable in Vercel.',
    })
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  const { message, history } = await req.json() as { message: string; history: ChatMessage[] }
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  // ── Build live compliance context ──────────────────────────────────────────
  const complianceContext = await buildComplianceContext()

  // ── System prompt ──────────────────────────────────────────────────────────
  const systemPrompt = `You are the Vitalis Healthcare Services AI Compliance Analyst — an intelligent assistant embedded in the Vitalis staff compliance portal.

You have access to real-time compliance data for the entire caregiver workforce. Your job is to help administrators understand the state of their team, identify risks, and prepare for regulatory reviews.

ABOUT VITALIS:
Vitalis Healthcare Services, LLC is a Maryland Level 3 Residential Service Agency (RSA), License #3879R, licensed by OHCQ. We provide CNA, personal care, and companion services in clients' homes across Maryland. The primary regulatory body is the Baltimore City Health Department (BCHD).

CURRENT USER: ${profile?.full_name || 'Administrator'} (${profile?.role})

COMPLIANCE DIMENSIONS TRACKED:
1. Credentials — 8 required types (CPR, First Aid, Background Check, TB Test, CNA License, Driver's License, I-9, HIPAA)
2. Training — LMS programme completion and progress
3. References — 3 slots per caregiver (2 professional + 1 character)
4. Policies — P&P acknowledgment count
5. Appraisals — HHA performance appraisal scores (1-4 scale)

${complianceContext}

YOUR RULES:
1. Answer directly from the live data above. Be specific — use actual caregiver names, percentages, and counts.
2. For risk assessments, consider: missing/expired credentials, overdue training, low appraisal scores, and outstanding references together.
3. For BCHD summaries, be formal and structured — use headings, give specific numbers.
4. For "top performers", consider: credential compliance %, training completion, appraisal score, and references received holistically.
5. Keep answers concise but complete. Use bullet points or numbered lists where they help clarity.
6. If asked about something not in the data (e.g. specific client incidents), say clearly that this data is not available in the compliance system.
7. Never invent data or extrapolate numbers not explicitly in the context above.
8. Tone: professional and direct — this is an operational tool for healthcare compliance managers.`

  // ── Messages ───────────────────────────────────────────────────────────────
  const messages = [
    ...(history || []).slice(-8),
    { role: 'user' as const, content: message },
  ]

  // ── Call Claude ────────────────────────────────────────────────────────────
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[ai-chat] Anthropic error:', response.status, err)
      return NextResponse.json({
        answer: 'The AI analyst encountered an error. Please try again in a moment.',
      })
    }

    const data = await response.json()
    const answer = data.content?.[0]?.text || 'Unable to generate a response. Please try again.'

    return NextResponse.json({ answer })

  } catch (err) {
    console.error('[ai-chat] Network error:', err)
    return NextResponse.json({
      answer: 'Network error connecting to the AI service. Please check your connection and try again.',
    }, { status: 500 })
  }
}
