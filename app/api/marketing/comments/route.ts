import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get('entity_type')
    const entityId = searchParams.get('entity_id')
    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 })
    }

    const svc = createServiceClient()
    const { data, error } = await svc
      .from('marketing_comments')
      .select('id, content, comment_type, created_at, updated_at, author:author_id(full_name, email)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data: data || [] })
  } catch (err) {
    console.error('GET /api/marketing/comments:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await req.json()
    const { entity_type, entity_id, content, comment_type = 'note' } = body

    if (!entity_type || !entity_id || !content?.trim()) {
      return NextResponse.json({ error: 'entity_type, entity_id, and content required' }, { status: 400 })
    }

    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
    if (!['admin', 'supervisor'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await svc
      .from('marketing_comments')
      .insert({
        entity_type,
        entity_id,
        content: content.trim(),
        comment_type,
        author_id: user.id,
      })
      .select('id, content, comment_type, created_at, author:author_id(full_name, email)')
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('POST /api/marketing/comments:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()

    // Only admins or the author can delete
    const { data: comment } = await svc
      .from('marketing_comments')
      .select('author_id')
      .eq('id', id)
      .single()

    if (comment?.author_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await svc.from('marketing_comments').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/marketing/comments:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
