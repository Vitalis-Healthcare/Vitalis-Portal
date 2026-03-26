import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile } = await svc
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get all acknowledgments with policy and user details
  const { data: acks } = await svc
    .from('pp_acknowledgments')
    .select('doc_id, doc_version, user_id, user_role, acknowledged_at, ip_address')
    .order('acknowledged_at', { ascending: false })

  const { data: policies } = await svc
    .from('pp_policies')
    .select('doc_id, title, domain, tier')

  const { data: profiles } = await svc
    .from('profiles')
    .select('id, full_name, email, role')

  const policyMap = Object.fromEntries((policies||[]).map(p => [p.doc_id, p]))
  const profileMap = Object.fromEntries((profiles||[]).map(p => [p.id, p]))

  const tierLabels: Record<number, string> = { 1: 'Policy', 2: 'Procedure', 3: 'Work Instruction' }

  // Build CSV
  const headers = ['doc_id', 'doc_title', 'domain', 'document_type', 'doc_version', 'staff_name', 'staff_email', 'staff_role', 'acknowledged_at', 'ip_address']
  const rows = (acks||[]).map(a => {
    const pol = policyMap[a.doc_id]
    const prof = profileMap[a.user_id]
    return [
      a.doc_id,
      pol?.title || '',
      pol?.domain || '',
      tierLabels[pol?.tier || 1] || 'Policy',
      a.doc_version,
      prof?.full_name || '',
      prof?.email || '',
      a.user_role || '',
      a.acknowledged_at ? new Date(a.acknowledged_at).toISOString() : '',
      a.ip_address || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`)
  })

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const date = new Date().toISOString().split('T')[0]

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="vitalis-pp-acknowledgments-${date}.csv"`,
    }
  })
}
