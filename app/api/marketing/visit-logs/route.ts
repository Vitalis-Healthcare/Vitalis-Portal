import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

async function requireAdminOrSupervisor() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('id, role, full_name').eq('id', user.id).single()
    if (!['admin', 'supervisor'].includes(profile?.role || '')) return null
    return { user, svc, profile }
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { svc } = auth

    const { searchParams } = new URL(req.url)
    const centerId = searchParams.get('center_id')
    const loggedBy = searchParams.get('logged_by')
    const limit = parseInt(searchParams.get('limit') || '200')

    let query = svc
      .from('marketing_visit_logs')
      .select(`
        id, visit_date, activity_type, notes, week_number, created_at,
        center:marketing_influence_centers(id, name),
        contact:marketing_contacts(id, name, role),
        logger:logged_by(id, full_name)
      `)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (centerId) query = query.eq('influence_center_id', centerId)
    if (loggedBy) query = query.eq('logged_by', loggedBy)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ data: data || [] })
  } catch (err) {
    console.error('GET /api/marketing/visit-logs:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { user, svc } = auth
    const body = await req.json()

    const { influence_center_id, contact_id, visit_date, activity_type, notes, week_number } = body
    if (!influence_center_id || !visit_date || !activity_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await svc
      .from('marketing_visit_logs')
      .insert({
        influence_center_id,
        contact_id: contact_id || null,
        logged_by: user.id,
        visit_date,
        activity_type,
        notes: notes || null,
        week_number: week_number || null,
      })
      .select(`
        id, visit_date, activity_type, notes, week_number, created_at,
        center:marketing_influence_centers(id, name),
        contact:marketing_contacts(id, name, role),
        logger:logged_by(id, full_name)
      `)
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('POST /api/marketing/visit-logs:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { user, svc, profile } = auth
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Only admin can delete others' logs; supervisors can only delete their own
    const { data: log } = await svc.from('marketing_visit_logs').select('logged_by').eq('id', id).single()
    if (profile.role !== 'admin' && log?.logged_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await svc.from('marketing_visit_logs').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/marketing/visit-logs:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
