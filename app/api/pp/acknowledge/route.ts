import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Always verify server-side — never trust the client payload alone
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { docId, docVersion, timestamp } = await request.json()

  if (!docId || !docVersion) {
    return NextResponse.json({ error: 'docId and docVersion required' }, { status: 400 })
  }

  // Verify the policy exists
  const { data: policy } = await supabase
    .from('pp_policies')
    .select('doc_id, version, applicable_roles')
    .eq('doc_id', docId)
    .single()

  if (!policy) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  // Map portal role to PP role
  const userRole = profile?.role || ''
  const ppRole = userRole === 'admin' ? 'Administrator'
    : userRole === 'supervisor' ? 'Director of Nursing'
    : userRole === 'caregiver' ? 'CNA'
    : 'All Staff'

  // Verify this policy applies to the user
  const roles = policy.applicable_roles || []
  const applies = roles.includes('All Staff') || roles.includes(ppRole)
  if (!applies && userRole !== 'admin' && userRole !== 'supervisor') {
    return NextResponse.json({ error: 'This policy does not apply to your role' }, { status: 403 })
  }

  // Insert acknowledgment — ON CONFLICT DO NOTHING prevents duplicate taps on mobile
  const { error } = await supabase
    .from('pp_acknowledgments')
    .insert({
      doc_id: docId,
      doc_version: docVersion,
      user_id: user.id,
      user_role: ppRole,
      acknowledged_at: timestamp || new Date().toISOString(),
    })

  if (error && error.code !== '23505') {
    // 23505 = unique violation = already acknowledged = success
    console.error('Acknowledgment insert error:', error)
    return NextResponse.json({ error: 'Failed to record acknowledgment' }, { status: 500 })
  }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: `Acknowledged policy ${docId} v${docVersion}`,
    entity_type: 'policy',
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
