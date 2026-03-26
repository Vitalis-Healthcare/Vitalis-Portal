import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { message, history, userRole } = await req.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  // Fetch all active policies — titles, doc_ids, and a text excerpt for context
  const { data: policies } = await supabase
    .from('pp_policies')
    .select('doc_id, domain, tier, title, applicable_roles, comar_refs, keywords, owner_role, version, review_date')
    .in('status', ['active', 'under-review'])
    .order('doc_id')

  // Find the most relevant policies based on keywords in the question
  const questionLower = message.toLowerCase()
  const relevant = (policies||[]).filter(p => {
    const searchFields = [
      p.title?.toLowerCase(),
      (p.keywords||[]).join(' ').toLowerCase(),
      (p.comar_refs||[]).join(' ').toLowerCase(),
      p.domain?.toLowerCase(),
    ].join(' ')
    return questionLower.split(' ').some(word =>
      word.length > 3 && searchFields.includes(word)
    )
  }).slice(0, 5)

  // If we found relevant ones, fetch their HTML for full context
  let policyContext = ''
  if (relevant.length > 0) {
    const { data: fullPolicies } = await supabase
      .from('pp_policies')
      .select('doc_id, title, html_content')
      .in('doc_id', relevant.map(p => p.doc_id))

    policyContext = (fullPolicies||[]).map(p => {
      // Strip HTML tags for text-only context
      const text = p.html_content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000) || ''
      return `=== ${p.doc_id}: ${p.title} ===\n${text}\n`
    }).join('\n')
  }

  // Build the policy catalogue summary
  const catalogue = (policies||[]).map(p =>
    `${p.doc_id} | ${p.title} | ${p.domain} | Applies to: ${(p.applicable_roles||[]).join(', ')} | Review due: ${p.review_date}`
  ).join('\n')

  const systemPrompt = `You are the Vitalis Healthcare Services Policy Assistant — an expert AI embedded in the Vitalis staff portal. Your purpose is to help staff understand company policies, find relevant procedures, and get answers to compliance questions.

ABOUT VITALIS:
Vitalis Healthcare Services, LLC is a Maryland Level 3 Residential Service Agency (RSA) licensed by OHCQ. We provide skilled nursing, CNA, personal assistance, and companion services in clients' homes in the Maryland/DC area.

THE CURRENT USER: Role = ${userRole}

COMPLETE POLICY CATALOGUE:
${catalogue}

${policyContext ? `RELEVANT POLICY CONTENT FOR THIS QUESTION:\n${policyContext}` : ''}

YOUR RULES:
1. Answer only based on Vitalis policy documents. Do not invent policies.
2. Always cite the specific policy ID(s) (e.g. VHS-D1-004) that support your answer.
3. If you are not certain, say so and direct the user to speak with their supervisor or the Administrator.
4. Be concise and practical — staff are often reading this on a phone between visits.
5. If a question is about something not covered in our policies, say so clearly.
6. When answering about procedures, give step-by-step guidance where possible.
7. At the end of relevant answers, include a JSON block formatted exactly like this:
   [CITATIONS:{"docId":"VHS-D1-001","title":"Mission, Vision & Values"}]
   Include one citation object per document referenced. This is machine-parsed — format it exactly.

Respond in plain English. Be helpful, warm, and professional.`

  const messages = [
    ...(history||[]).slice(-8).map((h: any) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message }
  ]

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    })

    const data = await response.json()
    const rawAnswer = data.content?.[0]?.text || 'I was unable to generate a response. Please try again.'

    // Extract citations from the response
    const citationMatch = rawAnswer.match(/\[CITATIONS:(.*?)\]/g)
    const citations: { docId: string; title: string }[] = []

    let cleanAnswer = rawAnswer
    if (citationMatch) {
      for (const match of citationMatch) {
        try {
          const inner = match.replace('[CITATIONS:', '').replace(']', '')
          const parsed = JSON.parse(inner)
          if (Array.isArray(parsed)) citations.push(...parsed)
          else if (parsed.docId) citations.push(parsed)
        } catch {}
      }
      cleanAnswer = rawAnswer.replace(/\[CITATIONS:.*?\]/g, '').trim()
    }

    return NextResponse.json({ answer: cleanAnswer, citations })

  } catch (err) {
    console.error('AI chat error:', err)
    return NextResponse.json({ error: 'AI service error' }, { status: 500 })
  }
}
