import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      answer: 'The AI assistant is not configured yet. Please ask your administrator to add the ANTHROPIC_API_KEY to the portal settings.',
      citations: []
    })
  }

  const { message, history, userRole } = await req.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  // Fetch all active policies — metadata for the catalogue
  const { data: allPolicies } = await supabase
    .from('pp_policies')
    .select('doc_id, domain, tier, title, applicable_roles, comar_refs, keywords, owner_role, version, review_date, status')
    .in('status', ['active', 'under-review'])
    .order('doc_id')

  if (!allPolicies || allPolicies.length === 0) {
    return NextResponse.json({
      answer: 'No policies have been loaded into the system yet. Please ask your administrator to seed the policy library.',
      citations: []
    })
  }

  // Smart relevance scoring — keyword + title + domain matching
  const questionLower = message.toLowerCase()
  const questionWords = questionLower.split(/\s+/).filter((w: string) => w.length > 3)

  const scored = allPolicies.map(p => {
    let score = 0
    const searchTarget = [
      p.title?.toLowerCase() || '',
      (p.keywords || []).join(' ').toLowerCase(),
      (p.comar_refs || []).join(' ').toLowerCase(),
      p.domain?.toLowerCase() || '',
      p.doc_id?.toLowerCase() || '',
    ].join(' ')

    for (const word of questionWords) {
      if (searchTarget.includes(word)) score += 2
    }
    // Boost exact doc_id mentions
    if (questionLower.includes(p.doc_id.toLowerCase())) score += 10
    // Boost title word matches
    const titleWords = (p.title || '').toLowerCase().split(/\s+/)
    for (const word of questionWords) {
      if (titleWords.includes(word)) score += 3
    }
    return { ...p, score }
  }).sort((a, b) => b.score - a.score)

  const topRelevant = scored.filter(p => p.score > 0).slice(0, 4)

  // Fetch full HTML content for relevant policies
  let policyContext = ''
  if (topRelevant.length > 0) {
    const { data: fullPolicies } = await supabase
      .from('pp_policies')
      .select('doc_id, title, html_content')
      .in('doc_id', topRelevant.map(p => p.doc_id))

    policyContext = (fullPolicies || []).map(p => {
      // Strip HTML tags for plain text
      const text = (p.html_content || '')
        .replace(/<style[^>]*>.*?<\/style>/gs, '')
        .replace(/<script[^>]*>.*?<\/script>/gs, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000)
      return `\n\n=== ${p.doc_id}: ${p.title} ===\n${text}`
    }).join('')
  }

  // Full catalogue for awareness
  const catalogue = allPolicies.map(p =>
    `${p.doc_id} | ${p.title} | ${p.domain} | Applies to: ${(p.applicable_roles || []).join(', ')} | v${p.version} | Review: ${p.review_date}`
  ).join('\n')

  const systemPrompt = `You are the Vitalis Healthcare Services Policy Assistant — an AI embedded in the Vitalis staff portal at vitalis-portal.vercel.app.

ABOUT VITALIS:
Vitalis Healthcare Services, LLC is a Maryland Level 3 Residential Service Agency (RSA), License #3879R, licensed by the Office of Health Care Quality (OHCQ). We provide skilled nursing, CNA, personal assistance, and companion services in clients' homes in Maryland. Founded 2014. 1,200+ hours of care per week, 150+ caregivers, 75+ active clients.

Key technology: AxisCare (EHR/EVV, Agency ID 14356), Viventium (payroll), Vitalis Portal (P&P/LMS), online forms at vitalishealthcare.com/forms.

CURRENT USER ROLE: ${userRole}

COMPLETE POLICY CATALOGUE (${allPolicies.length} documents):
${catalogue}

${policyContext ? `FULL CONTENT OF MOST RELEVANT POLICIES FOR THIS QUESTION:${policyContext}` : ''}

YOUR RULES:
1. Answer based on Vitalis policy documents. Be specific and practical.
2. Always cite the specific policy ID (e.g. VHS-D1-004) that your answer is drawn from.
3. If the answer is clearly in the content above, give a direct, specific answer.
4. If uncertain, say so and direct the user to speak with their supervisor or the Administrator.
5. Be concise — staff are often reading on a phone between client visits.
6. For procedural questions, give numbered steps where possible.
7. At the end of your answer, include citations in this exact format on a new line:
   [CITATIONS:{"docId":"VHS-D1-001","title":"Mission, Vision & Values"}]
   Include one object per document cited. Use the exact doc_id from the catalogue.
8. Keep your entire response under 300 words unless the question genuinely requires more detail.

Tone: Professional, warm, and direct — like a knowledgeable colleague, not a legal document.`

  const messages = [
    ...(history || []).slice(-6).map((h: { role: string; content: string }) => ({
      role: h.role,
      content: h.content
    })),
    { role: 'user', content: message }
  ]

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
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', response.status, err)
      return NextResponse.json({
        answer: 'The AI assistant encountered an error. Please try again in a moment.',
        citations: []
      })
    }

    const data = await response.json()
    const rawAnswer = data.content?.[0]?.text || 'I was unable to generate a response. Please try again.'

    // Extract citations
    const citations: { docId: string; title: string }[] = []
    let cleanAnswer = rawAnswer
    const citationMatches = rawAnswer.match(/\[CITATIONS:(.*?)\]/gs)
    if (citationMatches) {
      for (const match of citationMatches) {
        try {
          const inner = match.replace('[CITATIONS:', '').replace(']', '')
          const parsed = JSON.parse(inner)
          if (Array.isArray(parsed)) citations.push(...parsed)
          else if (parsed.docId) citations.push(parsed)
        } catch {}
      }
      cleanAnswer = rawAnswer.replace(/\[CITATIONS:.*?\]/gs, '').trim()
    }

    // Save conversation (best effort)
    supabase.from('pp_ai_conversations').insert({
      user_id: user.id,
      title: message.slice(0, 80),
      messages: [
        ...(history || []),
        { role: 'user', content: message },
        { role: 'assistant', content: cleanAnswer, citations }
      ],
      doc_ids: citations.map((c: { docId: string }) => c.docId),
    }).then(() => {}).catch(() => {})

    return NextResponse.json({ answer: cleanAnswer, citations })

  } catch (err) {
    console.error('AI chat error:', err)
    return NextResponse.json({
      answer: 'Network error connecting to the AI service. Please check your connection and try again.',
      citations: []
    }, { status: 500 })
  }
}
