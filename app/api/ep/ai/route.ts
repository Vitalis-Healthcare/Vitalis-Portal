/**
 * app/api/ep/ai/route.ts
 * Server-side proxy for EP page AI calls.
 * The EP page (client component) cannot access ANTHROPIC_API_KEY —
 * this route runs server-side and injects the key securely.
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI not configured — ask administrator to add ANTHROPIC_API_KEY' }, { status: 500 })
  }

  const { system, user: userMessage } = await req.json()
  if (!userMessage) return NextResponse.json({ error: 'Message required' }, { status: 400 })

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
        system: system || 'You are a helpful assistant for Vitalis Healthcare Services.',
        messages: [{ role: 'user', content: userMessage }],
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('EP AI error:', response.status, err)
      return NextResponse.json({ error: `AI error ${response.status}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.find((c: any) => c.type === 'text')?.text || ''
    return NextResponse.json({ text })

  } catch (err: any) {
    console.error('EP AI exception:', err?.message)
    return NextResponse.json({ error: 'Network error' }, { status: 500 })
  }
}
