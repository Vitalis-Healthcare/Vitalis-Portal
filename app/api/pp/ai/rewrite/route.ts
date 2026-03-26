import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { docId, sectionId, sectionTitle, originalText, instruction, changeReason } = await req.json()

  if (!docId || !originalText || !instruction) {
    return NextResponse.json({ error: 'docId, originalText, and instruction are required' }, { status: 400 })
  }

  // Fetch the full policy for context
  const { data: policy } = await supabase
    .from('pp_policies')
    .select('doc_id, title, domain, comar_refs, version')
    .eq('doc_id', docId)
    .single()

  if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 })

  const systemPrompt = `You are an expert healthcare policy writer helping to update Vitalis Healthcare Services policies.

POLICY BEING EDITED:
ID: ${policy.doc_id}
Title: ${policy.title}
Domain: ${policy.domain}
COMAR References: ${(policy.comar_refs||[]).join(', ')}
Current Version: ${policy.version}
Section: ${sectionTitle || sectionId || 'Unknown section'}

YOUR TASK:
Rewrite the provided policy section text based on the administrator's instruction. Your rewrite must:
1. Maintain the professional, clear tone of Maryland RSA compliance documentation
2. Keep all regulatory references accurate and intact
3. Preserve the HTML structure and any existing links
4. Be practically useful for home care staff
5. Remain compliant with COMAR 10.07.05 and applicable federal regulations
6. Match the length and depth of the original unless asked to expand or condense

IMPORTANT: Return ONLY the rewritten text — no explanation, no preamble, no "Here is the rewrite:" — just the clean rewritten content ready to replace the original.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `INSTRUCTION: ${instruction}\n\nCHANGE REASON: ${changeReason || 'Not specified'}\n\nORIGINAL TEXT:\n${originalText}`
        }]
      })
    })

    const data = await response.json()
    const proposedText = data.content?.[0]?.text || ''

    // Save as a proposal in the database
    const { data: proposal, error } = await supabase
      .from('pp_edit_proposals')
      .insert({
        doc_id: docId,
        section_id: sectionId,
        section_title: sectionTitle,
        original_text: originalText,
        proposed_text: proposedText,
        change_reason: changeReason,
        ai_prompt: instruction,
        proposed_by: user.id,
        proposed_by_role: profile.role === 'admin' ? 'Administrator' : 'Director of Nursing',
        status: 'pending'
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ proposedText, proposalId: proposal.id })

  } catch (err) {
    console.error('AI rewrite error:', err)
    return NextResponse.json({ error: 'AI service error' }, { status: 500 })
  }
}
