import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function requireAdmin(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) return null
  return { user, svc }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data } = await auth.svc.from('lead_stages').select('*').eq('is_active', true).order('order_index')
  return NextResponse.json({ stages: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const { action, id, ...fields } = body
  if (action === 'delete') {
    const { data: stage } = await auth.svc.from('lead_stages').select('is_system').eq('id', id).single()
    if (stage?.is_system) return NextResponse.json({ error: 'Cannot delete system stages' }, { status: 400 })
    await auth.svc.from('lead_stages').delete().eq('id', id)
    return NextResponse.json({ success: true })
  }
  if (id) {
    const { data, error } = await auth.svc.from('lead_stages').update(fields).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ stage: data })
  }
  if (!fields.label?.trim() || !fields.key?.trim()) return NextResponse.json({ error: 'Label and key required' }, { status: 400 })
  const { data: maxOrder } = await auth.svc.from('lead_stages').select('order_index').order('order_index', { ascending: false }).limit(1).single()
  const { data, error } = await auth.svc.from('lead_stages').insert({ ...fields, label: fields.label.trim(), order_index: (maxOrder?.order_index || 0) + 1 }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ stage: data })
}
