// app/api/reports/snapshot/save/route.ts
// Saves a dated compliance snapshot to the compliance_snapshots table.
// Admin/supervisor only. POST body: { label, adminId, adminName, matrixRows, ... }

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  // ── Auth + role gate ──────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: viewer } = await svc
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!['admin', 'supervisor'].includes(viewer?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: {
    label: string
    adminId: string
    adminName: string
    matrixRows: unknown[]
    caregiverCredTypes: unknown[]
    generatedAt: string
    totalCaregivers: number
    overallCompliancePct: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    label,
    adminName,
    matrixRows,
    caregiverCredTypes,
    generatedAt,
    totalCaregivers,
    overallCompliancePct,
  } = body

  if (!label?.trim()) {
    return NextResponse.json({ error: 'label is required' }, { status: 400 })
  }

  // ── Insert snapshot ───────────────────────────────────────────────────────
  const { data: inserted, error } = await svc
    .from('compliance_snapshots')
    .insert({
      label: label.trim(),
      created_by: user.id,
      created_by_name: viewer?.full_name || adminName,
      snapshot_data: { matrixRows, caregiverCredTypes, generatedAt },
      caregiver_count: totalCaregivers,
      overall_compliance_pct: overallCompliancePct,
    })
    .select('id, created_at, label, created_by_name, caregiver_count, overall_compliance_pct')
    .single()

  if (error) {
    console.error('[snapshot/save] Supabase error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save snapshot' },
      { status: 500 },
    )
  }

  return NextResponse.json({ snapshot: inserted })
}
