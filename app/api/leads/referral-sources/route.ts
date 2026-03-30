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
  const { data } = await auth.svc.from('referral_sources').select('*').order('name')
  return NextResponse.json({ sources: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const { action, id, ...fields } = body
  if (action === 'delete') {
    await auth.svc.from('referral_sources').delete().eq('id', id)
    return NextResponse.json({ success: true })
  }
  if (action === 'toggle') {
    const { data: current } = await auth.svc.from('referral_sources').select('is_active').eq('id', id).single()
    await auth.svc.from('referral_sources').update({ is_active: !current?.is_active }).eq('id', id)
    return NextResponse.json({ success: true })
  }
  if (id) {
    const { data, error } = await auth.svc.from('referral_sources').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ source: data })
  }
  if (!fields.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const { data, error } = await auth.svc.from('referral_sources').insert({ ...fields, name: fields.name.trim() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ source: data })
}
