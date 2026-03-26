import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify caller is admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await request.json()
  if (!userId || userId === user.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  // Delete profile (cascades to auth user via trigger if set, otherwise delete both)
  await supabase.from('profiles').delete().eq('id', userId)

  return NextResponse.json({ success: true })
}
