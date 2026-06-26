// app/api/admin/credential-emails/route.ts
// Admin-gated read/write for the credential-email toggle (v0.6.12).
// Stores the flag in portal_settings.credential_emails_enabled ('true' | 'false').
// Both credential crons read this value before sending.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const KEY = 'credential_emails_enabled'

type Gate =
  | { ok: false; res: NextResponse }
  | { ok: true; userId: string }

async function requireAdmin(): Promise<Gate> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const svc = createServiceClient()
  const { data: me } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(me?.role || '')) {
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ok: true, userId: user.id }
}

export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.res

  const svc = createServiceClient()
  const { data } = await svc
    .from('portal_settings')
    .select('value')
    .eq('key', KEY)
    .maybeSingle()

  // Default ON unless explicitly 'false' (matches cron + page logic).
  return NextResponse.json({ enabled: data?.value !== 'false' })
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.res

  const body = await req.json()
  const enabled = body?.enabled === true
  const value = enabled ? 'true' : 'false'

  const svc = createServiceClient()
  const { error } = await svc
    .from('portal_settings')
    .upsert(
      { key: KEY, value, updated_at: new Date().toISOString(), updated_by: gate.userId },
      { onConflict: 'key' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, enabled })
}
