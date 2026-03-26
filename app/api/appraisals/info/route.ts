// app/api/appraisals/info/route.ts
// Public — returns appraisal data needed to render the sign-off page.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const svc = createServiceClient()

  const { data: appraisal } = await svc
    .from('appraisals')
    .select(`
      status, signed_at, caregiver_signature, appraisal_period, comments,
      s_patient_care_duties, s_medications, s_care_conferences, s_personal_care,
      s_shampoo, s_bed_linen, s_vitals, s_reports_changes, s_height_weight,
      s_bedpan, s_enemas, s_specimens, s_room_order, s_household_services,
      s_safety_devices, s_body_mechanics, s_therapy_extension, s_equipment_cleaning,
      s_documentation, s_asks_for_help, s_own_actions, s_completes_work,
      s_no_unqualified_assignments, s_confidentiality, s_meetings, s_chart_documentation,
      s_variance_reporting, s_qapi, s_policies_adherence, s_agency_standards,
      s_attendance, s_tardiness, s_reports_incomplete, s_appearance,
      s_time_management, s_inservices, s_clean_environment, s_judgment,
      s_cpr_certification, s_other_duties,
      caregiver:caregiver_id(full_name),
      appraiser:appraiser_id(full_name)
    `)
    .eq('sign_off_token', token)
    .single()

  if (!appraisal) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  return NextResponse.json({
    ...appraisal,
    caregiver_name: (appraisal.caregiver as any)?.full_name || 'Unknown',
    appraiser_name: (appraisal.appraiser as any)?.full_name || 'Supervisor',
  })
}
