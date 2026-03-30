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
  const { data } = await auth.svc.from('lead_service_types').select('*').eq('is_active', true).order('order_index')
  return NextResponse.json({ serviceTypes: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const { action, id, label } = body
  if (action === 'delete') {
    await auth.svc.from('lead_service_types').delete().eq('id', id)
    return NextResponse.json({ success: true })
  }
  if (action === 'toggle') {
    const { data: current } = await auth.svc.from('lead_service_types').select('is_active').eq('id', id).single()
    await auth.svc.from('lead_service_types').update({ is_active: !current?.is_active }).eq('id', id)
    return NextResponse.json({ success: true })
  }
  if (!label?.trim()) return NextResponse.json({ error: 'Label required' }, { status: 400 })
  const { data: maxOrder } = await auth.svc.from('lead_service_types').select('order_index').order('order_index', { ascending: false }).limit(1).single()
  const { data, error } = await auth.svc.from('lead_service_types').insert({ label: label.trim(), order_index: (maxOrder?.order_index || 0) + 1 }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ serviceType: data })
}
