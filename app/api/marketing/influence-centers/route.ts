import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

async function requireAdminOrSupervisor() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('id, role').eq('id', user.id).single()
    if (!['admin', 'supervisor'].includes(profile?.role || '')) return null
    return { user, svc }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { svc } = auth
    const { data, error } = await svc
      .from('marketing_influence_centers')
      .select('*, contacts:marketing_contacts(id, name, role, email)')
      .order('name')
    if (error) throw error
    return NextResponse.json({ data: data || [] })
  } catch (err) {
    console.error('GET /api/marketing/influence-centers:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { user, svc } = auth
    const body = await req.json()
    const { data, error } = await svc
      .from('marketing_influence_centers')
      .insert({ ...body, created_by: user.id })
      .select('*, contacts:marketing_contacts(id, name, role, email)')
      .single()
    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('POST /api/marketing/influence-centers:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { svc } = auth
    const body = await req.json()
    const { id, contacts: _contacts, created_by: _cb, created_at: _ca, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { data, error } = await svc
      .from('marketing_influence_centers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, contacts:marketing_contacts(id, name, role, email)')
      .single()
    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('PUT /api/marketing/influence-centers:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { svc } = auth
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { error } = await svc.from('marketing_influence_centers').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/marketing/influence-centers:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
