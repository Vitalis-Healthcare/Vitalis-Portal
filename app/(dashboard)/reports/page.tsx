// app/(dashboard)/reports/page.tsx
// Server component — admin and supervisor access only.
// Fetches all compliance data + snapshots, passes to ReportsClient.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getComplianceData } from '@/lib/reports'
import ReportsClient from './ReportsClient'

export const dynamic = 'force-dynamic'   // always fresh — compliance data must not be stale

export default async function ReportsPage() {
  // ── Auth + role gate ────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // ── Compliance data ─────────────────────────────────────────────────────────
  const data = await getComplianceData()

  // ── Saved snapshots (fail gracefully if migration not yet run) ──────────────
  let snapshots: Array<{
    id: string
    created_at: string
    label: string
    created_by_name: string
    caregiver_count: number
    overall_compliance_pct: number
  }> = []

  try {
    const { data: snapshotData } = await svc
      .from('compliance_snapshots')
      .select('id, created_at, label, created_by_name, caregiver_count, overall_compliance_pct')
      .order('created_at', { ascending: false })
      .limit(30)
    snapshots = snapshotData || []
  } catch {
    // Table not yet created — snapshots tab will show migration prompt
    snapshots = []
  }

  return (
    <ReportsClient
      matrixRows={data.matrixRows}
      caregiverCredTypes={data.caregiverCredTypes}
      timelineItems={data.timelineItems}
      generatedAt={data.generatedAt}
      totalCaregivers={data.totalCaregivers}
      overallCompliancePct={data.overallCompliancePct}
      initialSnapshots={snapshots}
      adminId={user.id}
      adminName={profile.full_name || 'Admin'}
    />
  )
}
