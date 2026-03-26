import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const { data: alert, error } = await supabase.from('pp_regulatory_alerts').insert({
    doc_id: body.doc_id || null,
    alert_type: body.alert_type || 'regulation_change',
    title: body.title,
    description: body.description || null,
    regulatory_ref: body.regulatory_ref || null,
    severity: body.severity || 'medium',
    status: 'open',
    created_by: user.id,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alert })
}
