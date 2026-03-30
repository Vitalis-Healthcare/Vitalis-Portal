/**
 * app/api/vita/chat/route.ts
 * ─────────────────────────────────────────────────────────────
 * Vita — Vitalis AI Companion
 * Assembles personal context from all 4 modules + regulatory
 * knowledge, then calls Anthropic with web_search enabled for
 * external regulatory queries (COMAR, CMS, Joint Commission).
 * ─────────────────────────────────────────────────────────────
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import {
  buildTrainingContext,
  buildCredentialContext,
  buildAppraisalContext,
  buildPolicyContext,
  buildLeadsContext,
  buildMarketingContext,
  buildStaffRosterContext,
  buildReferralSourceContext,
} from '@/lib/vita/context'

// ── Regulatory knowledge base embedded in system prompt ──────────────────────
// Key facts from COMAR, CMS, OHCQ, Joint Commission relevant to Maryland home care.
// This is reliable, always-available baseline knowledge.
// Web search supplements this for specific / current queries.
const REGULATORY_KNOWLEDGE = `
REGULATORY KNOWLEDGE BASE:

MARYLAND COMAR (Code of Maryland Regulations):
• COMAR 10.07.14 — Residential Service Agencies (RSA): governs all licensed home care agencies in MD
• RSA Level 3 licence required to employ CNAs/HHAs; Level 1 for companion/homemaker only
• Competency evaluation required before unsupervised client visits; on-hire and annually thereafter
• Supervisory visit by RN within 2 weeks of start and every 60 days for skilled care clients
• EVV (Electronic Visit Verification) required by MD for all personal assistance services (AxisCare qualifies)
• All HHAs must have: current CPR, TB screen, background check (CJIS + OIG exclusion list)
• OHCQ (Office of Health Care Quality) is the licensing/enforcement body under DHMH
• Incident reporting: abuse/neglect to OHCQ within 24 hours; APS immediately
• Grievance process must be documented and responded to within 30 days

CMS (CENTERS FOR MEDICARE & MEDICAID SERVICES):
• Conditions of Participation (CoPs) 42 CFR Part 484 for Medicare-certified HHAs
• Patient Rights (484.10): informed consent, right to refuse, dignity, privacy, complaints
• Care Planning (484.60): must involve patient and representative, reviewed at each visit
• QAPI (Quality Assessment & Performance Improvement): required program with measurable goals
• EVV mandate: all Medicaid personal care and home health aide visits (effective 2023)
• Aide requirements (484.80): 75 hours initial training, 12 hours continuing education annually

JOINT COMMISSION HOME CARE STANDARDS:
• Person-centred care, safety, and quality are core pillars
• National Patient Safety Goals relevant to home care: fall prevention, medication safety, infection control
• Documentation must be complete, accurate, and timely
• Staff competency: initial and ongoing validation required

MARYLAND HHA/CNA SPECIFIC:
• HHA Certificate: issued by MBON (Maryland Board of Nursing); maintained on MD Nurse Aide Registry
• CNA renewal: every 2 years, minimum 48 hours of paid work in nursing capacity required
• Nurse Aide Registry lookup: www.mbon.maryland.gov
• Background checks: MD CJIS and Federal FBI; OIG exclusion list checked monthly recommended
• HIPAA applies to all PHI: verbal, written, electronic. Violation reporting within 60 days
• Mandatory reporter status: all HHA/CNAs must report suspected abuse/neglect/exploitation

INFECTION CONTROL (CMS + COMAR):
• Standard precautions apply to ALL clients regardless of diagnosis
• Hand hygiene: before/after each client, before/after PPE, after potential contamination
• PPE: gloves required for contact with blood/body fluids; mask if respiratory symptoms present
• Sharps: never recap needles; use puncture-resistant sharps containers; dispose per biohazard protocol
• COVID-19: follow current CDC guidance; agency policy governs PPE requirements

DOCUMENTATION & EVV (AxisCare):
• Clock in/out via AxisCare app for every visit — mandatory for BCHD billing compliance
• Visit notes must be entered same day or within 24 hours
• Required in every visit note: tasks performed, client response, anything unusual observed
• Missed visits: document reason, notify supervisor, complete incident report if client welfare at risk
`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      answer: 'Vita is not configured yet. Please ask your administrator to add the ANTHROPIC_API_KEY.',
      citations: [], actions: []
    })
  }

  const svc = createServiceClient()
  const { message, history, userContext } = await req.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  // ── Fetch user profile ─────────────────────────────────────────────────────
  const { data: profile } = await svc
    .from('profiles')
    .select('id, full_name, role, email')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || 'there'
  const userRole = userContext?.ppRole || profile?.role || 'caregiver'
  const isAdminRole = profile?.role === 'admin' || profile?.role === 'supervisor'

  // ── Determine which context modules to activate ────────────────────────────
  // Route by question intent to avoid loading everything for simple queries
  const q = message.toLowerCase()
  const wantsTraining     = /train|module|course|lms|quiz|lesson|enrol|study|learn|video|guide/i.test(q)
  const wantsCredentials  = /credent|licen|certif|cpr|expir|renew|tb|background|registry/i.test(q)
  const wantsAppraisal    = /apprais|review|perform|score|rating|feedback|supervisor|comment|improve|strength|weakness/i.test(q)
  const wantsPolicy       = /policy|procedure|polic|COMAR|regulat|comply|compliance|rule|protocol/i.test(q)
  const wantsRegulatory   = /COMAR|CMS|Joint Commission|maryland law|regulation|OHCQ|federal|state law|requirement/i.test(q)
  const wantsLeads        = /lead|pipeline|prospect|enquir|inquiry|referral.*source|revenue.*pipeline|close.*date|follow.?up|conversion|client.*acquisition|new.*client|potential.*client/i.test(q)
  const wantsMarketing    = /marketing|influence center|referrer|email blast|open rate|facility.*visit|visit.*facilit|drop.?off|face.?to.?face|route|heat status|52 weeks|campaign|peace|weekly blast/i.test(q)
  const wantsStaff        = /staff|roster|caregiver|team|who.*work|employee|hire|onboard|compliance.*team|training.*all|credential.*all|all.*credential|all.*staff/i.test(q)
  const wantsReferralSrc  = /referral source|where.*lead|lead.*source|how.*find|genworth|carescout|word of mouth|referral.*partner|source.*referral/i.test(q)

  // If question is ambiguous, load all contexts
  const loadAll = !wantsTraining && !wantsCredentials && !wantsAppraisal && !wantsPolicy

  // ── Build context in parallel ──────────────────────────────────────────────
  const [trainingCtx, credCtx, appraisalCtx, policyCtx, leadsCtx, marketingCtx, staffCtx, referralSrcCtx] = await Promise.all([
    (wantsTraining || loadAll) ? buildTrainingContext(user.id, svc) : Promise.resolve(''),
    (wantsCredentials || loadAll) ? buildCredentialContext(user.id, svc) : Promise.resolve(''),
    (wantsAppraisal || loadAll) ? buildAppraisalContext(user.id, svc) : Promise.resolve(''),
    (wantsPolicy || loadAll || wantsRegulatory) ? buildPolicyContext(message, svc) : Promise.resolve({ catalogue: '', relevant: '' }),
    (isAdminRole && (wantsLeads || loadAll)) ? buildLeadsContext(svc) : Promise.resolve(''),
    (isAdminRole && (wantsMarketing || loadAll)) ? buildMarketingContext(svc) : Promise.resolve(''),
    (isAdminRole && (wantsStaff || loadAll)) ? buildStaffRosterContext(svc) : Promise.resolve(''),
    (isAdminRole && (wantsReferralSrc || loadAll)) ? buildReferralSourceContext(svc) : Promise.resolve(''),
  ])

  const policyCtxTyped = policyCtx as { catalogue: string; relevant: string }

  // ── Assemble system prompt ────────────────────────────────────────────────
  const systemPrompt = `You are Vita — the personal AI companion for Vitalis Healthcare Services caregivers and staff.
Vita is embedded in the Vitalis Staff & Compliance Portal at vitalis-portal.vercel.app.

ABOUT VITALIS HEALTHCARE SERVICES:
Vitalis Healthcare Services, LLC — Maryland Residential Service Agency (RSA) Level 3, License #3879R.
Licensed by OHCQ. Provides skilled nursing, CNA, personal assistance, and companion services in clients' homes in Maryland.
Key systems: AxisCare (EHR/EVV, Agency ID 14356), Viventium (payroll), Vitalis Portal (P&P/LMS/credentials).

YOU ARE SPEAKING WITH:
Name: ${userName}
Role: ${userRole}
User ID: ${user.id}

${trainingCtx ? `\n${trainingCtx}` : ''}
${credCtx ? `\n${credCtx}` : ''}
${appraisalCtx ? `\n${appraisalCtx}` : ''}
${policyCtxTyped.catalogue ? `\nVITALIS POLICY CATALOGUE:\n${policyCtxTyped.catalogue}` : ''}
${policyCtxTyped.relevant ? `\nFULL CONTENT OF RELEVANT POLICIES:${policyCtxTyped.relevant}` : ''}
${leadsCtx ? `\n${leadsCtx}` : ''}
${marketingCtx ? `\n${marketingCtx}` : ''}
${staffCtx ? `\n${staffCtx}` : ''}
${referralSrcCtx ? `\n${referralSrcCtx}` : ''}
${REGULATORY_KNOWLEDGE}

YOUR CAPABILITIES & BEHAVIOUR:

PRIVACY RULES (non-negotiable):
- For caregivers: you ONLY see their own data. Never reveal another person's credentials, scores, or personal details.
- For admins/supervisors: you have full organisational visibility — you CAN discuss all staff, all leads, all marketing data.
- Always be explicit about which data you're drawing from.

CORE CAPABILITIES — use these proactively, never be generic when you have real data:

1. TRAINING EXPERT: You know every course the user is enrolled in, their progress %, quiz scores, and last accessed date. You also know every available course they haven't started. When someone asks about a clinical procedure, cite the relevant module and link them to it (/lms). Tell them exactly where they are in their training journey. Identify knowledge gaps from quiz scores below 80%.

2. CREDENTIAL GUARDIAN: You know every credential on file — expiry dates to the day, what's missing, what's expired. Be proactive and urgent about expiring items. Tell them exactly what to upload and where (/credentials). Don't just list — prioritise by urgency.

3. APPRAISAL COACH: You have full appraisal history including every scored dimension, supervisor comments, and trend over time. Reference specific scores when coaching. Be honest about weak areas — that's how caregivers improve. Link to /staff-portal for self-review.

4. POLICY EXPERT: You have the full Vitalis P&P catalogue and can retrieve the content of any policy. Always cite policy IDs (e.g. VHS-D1-003). For regulatory questions, reference COMAR and CMS. Link to /pp/[docId].

5. LEADS & PIPELINE INTELLIGENCE (admin/supervisor): You have the full pipeline — every lead by name, status, revenue potential, last activity content (what was actually discussed), overdue follow-ups, and conversion history by source. You can tell them what was said in the last call, who needs a follow-up today, which source is converting best, and what the revenue trajectory looks like. Link to /leads and /leads/[id].

6. MARKETING INTELLIGENCE (admin/supervisor): You have the full 52 Weeks Marketing picture — per-facility visit history (F/D/X counts, F-rate, last visit), email engagement by contact, referral attribution with payer sources, and the Autumn Lake strategic opportunity. You know which contacts are warm from email opens, which facilities haven't had a face-to-face in 60+ days, and the complete referral history. Link to /marketing.

7. STAFF ROSTER & COMPLIANCE (admin/supervisor): You have full visibility into all staff — credential status for everyone, training completion rates, who has expiring or expired credentials, and overall compliance health. You can answer "who has an expiring CPR this month?" or "what's Maria's training completion rate?" Link to /users.

8. REFERRAL SOURCES (admin/supervisor): You know all referral source partners, their performance (how many leads, conversion rates), and contact details. You can help analyse which sources are working and which need attention.

RESPONSE STYLE:
- Be direct, specific, and data-driven. Never say "I don't have access to that" when you do — check your context first.
- When you have exact data, lead with it. Don't bury numbers in prose.
- Proactively surface urgent issues (expiring credentials, overdue follow-ups) even if not directly asked.
- For complex requests, structure your response with clear sections.
- Always end action items with the relevant portal link.
7. REGULATORY KNOWLEDGE: You know Maryland COMAR, CMS CoPs, and Joint Commission standards. For very specific or current regulatory questions, use web search to verify.

ACTION LINKS (include these naturally in your responses when relevant):
• Go take/continue a course: /lms/courses/[course-id]/take
• Browse training: /lms
• View credentials: /credentials
• Browse policies: /pp
• View specific policy: /pp/[docId]
• View appraisals: (not directly linkable — tell them to contact supervisor)

RESPONSE FORMAT RULES:
1. Be warm, direct, and practical — like a knowledgeable colleague who knows them personally.
2. Keep responses under 350 words unless detailed steps are genuinely needed.
3. Use numbered steps for procedural questions.
4. When you reference a policy, include: [POLICY:docId:title]
5. When you recommend a training module, include: [MODULE:lms_module_id:title]
6. When there's an urgent action (credential expiring, failed quiz), include: [ACTION:url:label]
7. NEVER make up data. If you don't have the data, say so honestly and direct them.
8. Be warm and affirming, but never patronising or vague.

Tone: Like a caring, knowledgeable senior colleague — not a help desk robot, not a lawyer.`

  // ── Call Anthropic with web_search for regulatory queries ──────────────────
  const messages = [
    ...(history || []).slice(-8).map((h: { role: string; content: string }) => ({
      role: h.role,
      content: h.content
    })),
    { role: 'user', content: message }
  ]

  // Web search reserved for future use — regulatory knowledge is embedded in system prompt
  const useWebSearch = false

  try {
    const requestBody: any = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    }

    // web_search can be enabled here in future — regulatory knowledge embedded in system prompt

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Vita Anthropic API error — status:', response.status, '— body:', errText)
      return NextResponse.json({
        answer: `I ran into a problem (error ${response.status}). Please try again — if this keeps happening, ask your administrator to check the Vercel logs.`,
        citations: [], actions: []
      })
    }

    const data = await response.json()

    // Extract text from response (handles both normal and tool-use responses)
    const rawAnswer = (data.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n') || 'I was unable to generate a response. Please try again.'

    // ── Parse structured tags from response ────────────────────────────────
    const policyCitations: { docId: string; title: string }[] = []
    const moduleRecs: { moduleId: string; title: string }[] = []
    const actionLinks: { url: string; label: string }[] = []

    // [POLICY:docId:title]
    const policyMatches = rawAnswer.matchAll(/\[POLICY:([^:]+):([^\]]+)\]/g)
    for (const m of policyMatches) {
      policyCitations.push({ docId: m[1], title: m[2] })
    }

    // [MODULE:moduleId:title]
    const moduleMatches = rawAnswer.matchAll(/\[MODULE:([^:]+):([^\]]+)\]/g)
    for (const m of moduleMatches) {
      moduleRecs.push({ moduleId: m[1], title: m[2] })
    }

    // [ACTION:url:label]
    const actionMatches = rawAnswer.matchAll(/\[ACTION:([^:]+):([^\]]+)\]/g)
    for (const m of actionMatches) {
      actionLinks.push({ url: m[1], label: m[2] })
    }

    // Also handle legacy [CITATIONS:...] format from old policy AI
    const legacyMatches = rawAnswer.matchAll(/\[CITATIONS:([^\]]+)\]/g)
    for (const m of legacyMatches) {
      try {
        const parsed = JSON.parse(m[1])
        if (Array.isArray(parsed)) policyCitations.push(...parsed)
        else if (parsed.docId) policyCitations.push(parsed)
      } catch {}
    }

    // Clean all tags from the display text
    const cleanAnswer = rawAnswer
      .replace(/\[POLICY:[^\]]+\]/g, '')
      .replace(/\[MODULE:[^\]]+\]/g, '')
      .replace(/\[ACTION:[^\]]+\]/g, '')
      .replace(/\[CITATIONS:[^\]]+\]/g, '')
      .trim()

    // ── Log conversation (best-effort) ─────────────────────────────────────
    try {
      await svc.from('pp_ai_conversations').insert({
        user_id: user.id,
        title: message.slice(0, 80),
        messages: [
          ...(history || []),
          { role: 'user', content: message },
          { role: 'assistant', content: cleanAnswer, policyCitations, moduleRecs, actionLinks }
        ],
        doc_ids: policyCitations.map(c => c.docId),
      })
    } catch {}

    return NextResponse.json({
      answer: cleanAnswer,
      citations: policyCitations,
      modules: moduleRecs,
      actions: actionLinks,
    })

  } catch (err: any) {
    console.error('Vita chat exception:', err?.message || err)
    return NextResponse.json({
      answer: 'Network error connecting to Vita. Please check your connection and try again.',
      citations: [], actions: []
    }, { status: 500 })
  }
}
