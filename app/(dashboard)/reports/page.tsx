// app/(dashboard)/reports/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getComplianceData, getPhase2Data } from '@/lib/reports'
import ReportsClient from './ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles').select('role, full_name').eq('id', user.id).single()

  if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Fetch Phase 1 and Phase 2 data in parallel
  const [p1, p2] = await Promise.all([
    getComplianceData(),
    getPhase2Data(),
  ])

  // Saved snapshots
  let snapshots: Array<{
    id: string; created_at: string; label: string
    created_by_name: string; caregiver_count: number; overall_compliance_pct: number
  }> = []
  try {
    const { data } = await svc
      .from('compliance_snapshots')
      .select('id, created_at, label, created_by_name, caregiver_count, overall_compliance_pct')
      .order('created_at', { ascending: false }).limit(30)
    snapshots = data || []
  } catch { snapshots = [] }

  return (
    <ReportsClient
      // Phase 1
      matrixRows={p1.matrixRows}
      caregiverCredTypes={p1.caregiverCredTypes}
      timelineItems={p1.timelineItems}
      generatedAt={p1.generatedAt}
      totalCaregivers={p1.totalCaregivers}
      overallCompliancePct={p1.overallCompliancePct}
      initialSnapshots={snapshots}
      adminId={user.id}
      adminName={profile.full_name || 'Admin'}
      // Phase 2
      trainingGapRows={p2.trainingGapRows}
      programmes={p2.programmes}
      heatmapRows={p2.heatmapRows}
      heatmapCompetencies={p2.heatmapCompetencies}
      teamClinicalAvg={p2.teamClinicalAvg}
      teamProfessionalAvg={p2.teamProfessionalAvg}
      teamOverallAvg={p2.teamOverallAvg}
      refPipelineRows={p2.refPipelineRows}
      avgDaysToReceive={p2.avgDaysToReceive}
      refStats={p2.refStats}
    />
  )
}
