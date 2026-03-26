// lib/reports.ts
// Shared data-fetching + computation layer for the Reports module.
// Called by: app/(dashboard)/reports/page.tsx
//            app/api/reports/compliance-pdf/route.ts
//            app/api/reports/compliance-csv/route.ts
//            app/api/reports/snapshot/save/route.ts
//
// RULES:
//  - createServiceClient() only — never anon client
//  - required_for_roles is JSONB — always guard with Array.isArray()
//  - No profiles join in any client-side query (N/A here — all server-only)

import { createServiceClient } from '@/lib/supabase/service'

// ─── Types ───────────────────────────────────────────────────────────────────

export type CredStatus =
  | 'current'
  | 'expiring'
  | 'expired'
  | 'missing'
  | 'na'
  | 'not_required'

export interface CredCell {
  status: CredStatus
  expiry_date?: string | null
  does_not_expire?: boolean
  document_url?: string | null
}

export interface CredTypeInfo {
  id: string
  name: string
  short_name: string        // abbreviated for matrix header
  validity_days: number | null
  required_for_roles: string[]
}

export interface MatrixRow {
  id: string
  full_name: string
  hire_date: string | null
  position_name: string | null
  credentials: Record<string, CredCell>   // keyed by credential_type_id
  training_pct: number                     // 0-100 avg across all enrollments
  refs_received: number                    // out of 3
  policies_signed: number                  // count of pp_acknowledgments
  latest_appraisal: {
    status: 'draft' | 'sent' | 'signed'
    created_at: string
    avg_score: number                      // 1.0 – 4.0
  } | null
  credential_compliance_pct: number        // % required creds that are ok (current/expiring/na)
}

export interface TimelineItem {
  caregiver_id: string
  caregiver_name: string
  credential_type_id: string
  credential_type_name: string
  expiry_date: string
  days_until: number
  status: string                           // 'current' | 'expiring' | 'expired'
}

export interface ComplianceData {
  matrixRows: MatrixRow[]
  caregiverCredTypes: CredTypeInfo[]       // only types required for 'caregiver' role
  allCredTypes: CredTypeInfo[]
  timelineItems: TimelineItem[]            // all items expiring within 365 days
  generatedAt: string
  totalCaregivers: number
  overallCompliancePct: number             // fleet-wide average
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SCORE_KEYS = [
  's_patient_care_duties','s_medications','s_care_conferences','s_personal_care',
  's_shampoo','s_bed_linen','s_vitals','s_reports_changes','s_height_weight',
  's_bedpan','s_enemas','s_specimens','s_room_order','s_household_services',
  's_safety_devices','s_body_mechanics','s_therapy_extension','s_equipment_cleaning',
  's_documentation','s_asks_for_help','s_own_actions','s_completes_work',
  's_no_unqualified_assignments','s_confidentiality','s_meetings','s_chart_documentation',
  's_variance_reporting','s_qapi','s_policies_adherence','s_agency_standards',
  's_attendance','s_tardiness','s_reports_incomplete','s_appearance',
  's_time_management','s_inservices','s_clean_environment','s_judgment',
  's_cpr_certification','s_other_duties',
]

function computeAvgScore(appraisal: Record<string, unknown>): number {
  const scores = SCORE_KEYS
    .map((k) => appraisal[k])
    .filter((v): v is number => typeof v === 'number' && v > 0)
  if (scores.length === 0) return 0
  return Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
}

/** Shorten a credential type name for use in a compact matrix column header */
function shortenCredName(name: string): string {
  const map: Record<string, string> = {
    'CPR Certification':          'CPR',
    'First Aid Certificate':      '1st Aid',
    'Background Check':           'Bg Check',
    'TB Test/Screening':          'TB Test',
    'CNA License':                'CNA',
    "Driver's License":           "Driver's",
    'I-9 Work Authorization':     'I-9',
    'HIPAA Training Certificate': 'HIPAA',
  }
  return map[name] || (name.length > 10 ? name.slice(0, 9) + '…' : name)
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

export async function getComplianceData(): Promise<ComplianceData> {
  const svc = createServiceClient()

  const [
    { data: rawCaregivers },
    { data: rawCredTypes },
    { data: rawCreds },
    { data: rawEnrollments },
    { data: rawRefs },
    { data: rawPpAcks, error: ppAcksErr },
    { data: rawAppraisals },
  ] = await Promise.all([
    svc
      .from('profiles')
      .select('id, full_name, hire_date, position_name')
      .eq('status', 'active')
      .eq('role', 'caregiver')
      .order('full_name'),

    svc
      .from('credential_types')
      .select('id, name, validity_days, required_for_roles')
      .order('name'),

    svc
      .from('staff_credentials')
      .select('id, user_id, credential_type_id, status, expiry_date, does_not_expire, not_applicable, document_url, review_status'),

    svc
      .from('course_enrollments')
      .select('user_id, progress_pct, completed_at'),

    svc
      .from('caregiver_references')
      .select('caregiver_id, status'),

    // pp_acknowledgments — fail gracefully if table schema differs
    svc
      .from('pp_acknowledgments')
      .select('user_id'),

    svc
      .from('appraisals')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const ppAcks: Array<{ user_id: string }> = ppAcksErr ? [] : (rawPpAcks || [])

  // Normalise credential types — guard required_for_roles JSONB
  const allCredTypes: CredTypeInfo[] = (rawCredTypes || []).map((ct: any) => ({
    id: ct.id,
    name: ct.name,
    short_name: shortenCredName(ct.name),
    validity_days: ct.validity_days,
    required_for_roles: Array.isArray(ct.required_for_roles) ? ct.required_for_roles : [],
  }))

  const caregiverCredTypes = allCredTypes.filter((ct) =>
    ct.required_for_roles.includes('caregiver'),
  )

  const today = new Date()
  const caregivers: Array<{ id: string; full_name: string; hire_date: string | null; position_name: string | null }> =
    rawCaregivers || []

  // ── Build matrix rows ──────────────────────────────────────────────────────
  const matrixRows: MatrixRow[] = caregivers.map((caregiver) => {
    // --- Credentials ---
    const credentials: Record<string, CredCell> = {}
    let requiredCount = 0
    let okCount = 0

    for (const ct of allCredTypes) {
      if (!ct.required_for_roles.includes('caregiver')) {
        credentials[ct.id] = { status: 'not_required' }
        continue
      }
      requiredCount++

      const cred = (rawCreds || []).find(
        (c: any) => c.user_id === caregiver.id && c.credential_type_id === ct.id,
      )

      if (!cred) {
        credentials[ct.id] = { status: 'missing' }
      } else if (cred.not_applicable) {
        credentials[ct.id] = { status: 'na' }
        okCount++
      } else if (cred.does_not_expire) {
        credentials[ct.id] = {
          status: 'current',
          expiry_date: null,
          does_not_expire: true,
          document_url: cred.document_url,
        }
        okCount++
      } else {
        credentials[ct.id] = {
          status: cred.status,
          expiry_date: cred.expiry_date,
          does_not_expire: false,
          document_url: cred.document_url,
        }
        if (cred.status === 'current' || cred.status === 'expiring') okCount++
      }
    }

    // --- Training ---
    const myEnrollments = (rawEnrollments || []).filter((e: any) => e.user_id === caregiver.id)
    const trainingPct =
      myEnrollments.length > 0
        ? Math.round(
            myEnrollments.reduce((sum: number, e: any) => sum + (e.progress_pct || 0), 0) /
              myEnrollments.length,
          )
        : 0

    // --- References ---
    const refsReceived = (rawRefs || []).filter(
      (r: any) => r.caregiver_id === caregiver.id && r.status === 'received',
    ).length

    // --- Policies ---
    const policiesSigned = ppAcks.filter((p) => p.user_id === caregiver.id).length

    // --- Appraisal (latest) ---
    const myAppraisals = (rawAppraisals || []).filter(
      (a: any) => a.caregiver_id === caregiver.id,
    )
    const latest = myAppraisals[0] || null   // already sorted desc

    return {
      id: caregiver.id,
      full_name: caregiver.full_name,
      hire_date: caregiver.hire_date,
      position_name: caregiver.position_name,
      credentials,
      training_pct: trainingPct,
      refs_received: refsReceived,
      policies_signed: policiesSigned,
      latest_appraisal: latest
        ? {
            status: latest.status as 'draft' | 'sent' | 'signed',
            created_at: latest.created_at,
            avg_score: computeAvgScore(latest),
          }
        : null,
      credential_compliance_pct:
        requiredCount > 0 ? Math.round((okCount / requiredCount) * 100) : 100,
    }
  })

  // ── Timeline: creds expiring within 365 days ───────────────────────────────
  const horizon365 = new Date()
  horizon365.setDate(horizon365.getDate() + 365)

  const credTypeMap = Object.fromEntries(allCredTypes.map((ct) => [ct.id, ct]))
  const caregiverMap = Object.fromEntries(caregivers.map((c) => [c.id, c]))

  const timelineItems: TimelineItem[] = (rawCreds || [])
    .filter((c: any) => {
      if (!c.expiry_date) return false
      const expiry = new Date(c.expiry_date)
      return expiry >= today && expiry <= horizon365
    })
    .map((c: any) => {
      const expiry = new Date(c.expiry_date)
      const daysUntil = Math.max(
        0,
        Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      )
      return {
        caregiver_id: c.user_id,
        caregiver_name: caregiverMap[c.user_id]?.full_name || 'Unknown',
        credential_type_id: c.credential_type_id,
        credential_type_name: credTypeMap[c.credential_type_id]?.name || 'Unknown',
        expiry_date: c.expiry_date,
        days_until: daysUntil,
        status: c.status as string,
      }
    })
    .sort((a: TimelineItem, b: TimelineItem) => a.days_until - b.days_until)

  // ── Fleet-wide stats ───────────────────────────────────────────────────────
  const overallCompliancePct =
    matrixRows.length > 0
      ? Math.round(
          matrixRows.reduce((s, r) => s + r.credential_compliance_pct, 0) / matrixRows.length,
        )
      : 100

  return {
    matrixRows,
    caregiverCredTypes,
    allCredTypes,
    timelineItems,
    generatedAt: today.toISOString(),
    totalCaregivers: caregivers.length,
    overallCompliancePct,
  }
}
