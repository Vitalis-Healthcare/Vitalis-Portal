// lib/reports.ts
// Shared data-fetching + computation layer for the Reports module.
// Phase 1: Compliance Matrix, Expiry Timeline, Snapshots
// Phase 2: Training Gap Analysis, Appraisal Heatmap, References Pipeline
//
// RULES:
//  - createServiceClient() only — never anon client
//  - required_for_roles is JSONB — always guard with Array.isArray()
//  - No profiles join in any client-side query (all server-only here)
//  - Supabase joined relations type-guarded with Array.isArray()

import { createServiceClient } from '@/lib/supabase/service'

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type CredStatus =
  | 'current' | 'expiring' | 'expired' | 'missing' | 'na' | 'not_required'

export interface CredCell {
  status: CredStatus
  expiry_date?: string | null
  does_not_expire?: boolean
  document_url?: string | null
}

export interface CredTypeInfo {
  id: string
  name: string
  short_name: string
  validity_days: number | null
  required_for_roles: string[]
}

export interface MatrixRow {
  id: string
  full_name: string
  hire_date: string | null
  position_name: string | null
  credentials: Record<string, CredCell>
  training_pct: number
  refs_received: number
  policies_signed: number
  latest_appraisal: {
    status: 'draft' | 'sent' | 'signed'
    created_at: string
    avg_score: number
  } | null
  credential_compliance_pct: number
}

export interface TimelineItem {
  caregiver_id: string
  caregiver_name: string
  credential_type_id: string
  credential_type_name: string
  expiry_date: string
  days_until: number
  status: string
}

export interface ComplianceData {
  matrixRows: MatrixRow[]
  caregiverCredTypes: CredTypeInfo[]
  allCredTypes: CredTypeInfo[]
  timelineItems: TimelineItem[]
  generatedAt: string
  totalCaregivers: number
  overallCompliancePct: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — TYPES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 2.1 Training Gap ─────────────────────────────────────────────────────────

export interface ProgrammeInfo {
  id: string
  title: string
  slug: string
  status: string
  total_modules: number
  est_hours: number
}

export interface ProgrammeEnrollment {
  programme_id: string
  programme_title: string
  programme_status: string
  enroll_status: string                // 'enrolled' | 'completed'
  completed_at: string | null
  due_date: string | null
  completed_modules: number
  total_modules: number
  progress_pct: number
  is_overdue: boolean
  is_completed: boolean
}

export interface TrainingGapRow {
  caregiver_id: string
  caregiver_name: string
  hire_date: string | null
  enrollments: ProgrammeEnrollment[]
  not_enrolled_count: number           // live programmes they have no enrollment in
  overall_pct: number                  // avg across all enrollments
  has_overdue: boolean
  completed_all: boolean
}

// ─── 2.2 Appraisal Heatmap ───────────────────────────────────────────────────

export interface HeatmapCompetency {
  key: string
  short_label: string
  section: 'clinical' | 'professional'
}

export interface HeatmapRow {
  caregiver_id: string
  caregiver_name: string
  appraisal_id: string
  appraisal_date: string
  status: 'draft' | 'sent' | 'signed'
  scores: Record<string, number>       // key → 1-4, 0 = not scored
  clinical_avg: number
  professional_avg: number
  overall_avg: number
}

// ─── 2.3 References Pipeline ─────────────────────────────────────────────────

export interface RefPipelineRow {
  id: string
  caregiver_id: string
  caregiver_name: string
  slot: number                         // 1, 2, 3
  reference_type: string               // 'professional' | 'character'
  slot_label: string                   // 'Professional 1' etc.
  status: string                       // 'not_sent' | 'sent' | 'received'
  sent_at: string | null
  received_at: string | null
  days_to_receive: number | null       // null if not yet received
  days_outstanding: number | null      // days since sent (if still outstanding)
  overall_recommendation: string | null
}

export interface Phase2Data {
  // Training
  trainingGapRows: TrainingGapRow[]
  programmes: ProgrammeInfo[]
  // Heatmap
  heatmapRows: HeatmapRow[]
  heatmapCompetencies: HeatmapCompetency[]
  teamClinicalAvg: number
  teamProfessionalAvg: number
  teamOverallAvg: number
  // References
  refPipelineRows: RefPipelineRow[]
  avgDaysToReceive: number | null
  refStats: {
    total: number
    not_sent: number
    sent: number
    received: number
    pct_received: number
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPRAISAL COMPETENCY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const CLINICAL_COMPETENCIES: HeatmapCompetency[] = [
  { key: 's_patient_care_duties',        short_label: 'Patient Care',      section: 'clinical' },
  { key: 's_medications',                short_label: 'Medications',        section: 'clinical' },
  { key: 's_care_conferences',           short_label: 'Care Conf.',         section: 'clinical' },
  { key: 's_personal_care',             short_label: 'Personal Care',      section: 'clinical' },
  { key: 's_shampoo',                    short_label: 'Shampoo/Hair',       section: 'clinical' },
  { key: 's_bed_linen',                  short_label: 'Bed Linen',          section: 'clinical' },
  { key: 's_vitals',                     short_label: 'Vitals',             section: 'clinical' },
  { key: 's_reports_changes',            short_label: 'Rpt. Changes',       section: 'clinical' },
  { key: 's_height_weight',              short_label: 'Ht/Wt',             section: 'clinical' },
  { key: 's_bedpan',                     short_label: 'Bedpan',             section: 'clinical' },
  { key: 's_enemas',                     short_label: 'Enemas',             section: 'clinical' },
  { key: 's_specimens',                  short_label: 'Specimens',          section: 'clinical' },
  { key: 's_room_order',                 short_label: 'Room Order',         section: 'clinical' },
  { key: 's_household_services',         short_label: 'Household',          section: 'clinical' },
  { key: 's_safety_devices',             short_label: 'Safety Dev.',        section: 'clinical' },
  { key: 's_body_mechanics',             short_label: 'Body Mech.',         section: 'clinical' },
  { key: 's_therapy_extension',          short_label: 'Therapy Ext.',       section: 'clinical' },
  { key: 's_equipment_cleaning',         short_label: 'Equip. Clean',       section: 'clinical' },
  { key: 's_documentation',             short_label: 'Documentation',      section: 'clinical' },
  { key: 's_asks_for_help',              short_label: 'Asks Help',          section: 'clinical' },
  { key: 's_own_actions',               short_label: 'Own Actions',        section: 'clinical' },
  { key: 's_completes_work',             short_label: 'Completes Work',     section: 'clinical' },
  { key: 's_no_unqualified_assignments', short_label: 'No Unqual.',         section: 'clinical' },
  { key: 's_confidentiality',            short_label: 'Confidential.',      section: 'clinical' },
  { key: 's_meetings',                   short_label: 'Meetings',           section: 'clinical' },
  { key: 's_chart_documentation',        short_label: 'Chart Docs',         section: 'clinical' },
]

export const PROFESSIONAL_COMPETENCIES: HeatmapCompetency[] = [
  { key: 's_variance_reporting',  short_label: 'Variance Rpt',   section: 'professional' },
  { key: 's_qapi',                short_label: 'QAPI',           section: 'professional' },
  { key: 's_policies_adherence',  short_label: 'Policy Adh.',    section: 'professional' },
  { key: 's_agency_standards',    short_label: 'Agency Std.',    section: 'professional' },
  { key: 's_attendance',          short_label: 'Attendance',     section: 'professional' },
  { key: 's_tardiness',           short_label: 'Tardiness',      section: 'professional' },
  { key: 's_reports_incomplete',  short_label: 'Rpt. Incompl.',  section: 'professional' },
  { key: 's_appearance',          short_label: 'Appearance',     section: 'professional' },
  { key: 's_time_management',     short_label: 'Time Mgmt.',     section: 'professional' },
  { key: 's_inservices',          short_label: 'In-Services',    section: 'professional' },
  { key: 's_clean_environment',   short_label: 'Clean Env.',     section: 'professional' },
  { key: 's_judgment',            short_label: 'Judgment',       section: 'professional' },
  { key: 's_cpr_certification',   short_label: 'CPR Cert.',      section: 'professional' },
  { key: 's_other_duties',        short_label: 'Other Duties',   section: 'professional' },
]

export const ALL_COMPETENCIES: HeatmapCompetency[] = [
  ...CLINICAL_COMPETENCIES,
  ...PROFESSIONAL_COMPETENCIES,
]

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function shortenCredName(name: string): string {
  const map: Record<string, string> = {
    'CPR Certification': 'CPR', 'First Aid Certificate': '1st Aid',
    'Background Check': 'Bg Check', 'TB Test/Screening': 'TB Test',
    'CNA License': 'CNA', "Driver's License": "Driver's",
    'I-9 Work Authorization': 'I-9', 'HIPAA Training Certificate': 'HIPAA',
  }
  return map[name] || (name.length > 10 ? name.slice(0, 9) + '…' : name)
}

const SCORE_KEYS = ALL_COMPETENCIES.map((c) => c.key)
const CLINICAL_KEYS = new Set(CLINICAL_COMPETENCIES.map((c) => c.key))
const PROFESSIONAL_KEYS = new Set(PROFESSIONAL_COMPETENCIES.map((c) => c.key))

function avgScores(appraisal: Record<string, unknown>, keys: Set<string>): number {
  const scores = SCORE_KEYS
    .filter((k) => keys.has(k))
    .map((k) => appraisal[k])
    .filter((v): v is number => typeof v === 'number' && v > 0)
  if (scores.length === 0) return 0
  return Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — FETCH
// ═══════════════════════════════════════════════════════════════════════════════

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
    svc.from('profiles').select('id, full_name, hire_date, position_name')
      .eq('status', 'active').eq('role', 'caregiver').order('full_name'),
    svc.from('credential_types').select('id, name, validity_days, required_for_roles').order('name'),
    svc.from('staff_credentials').select('id, user_id, credential_type_id, status, expiry_date, does_not_expire, not_applicable, document_url, review_status'),
    svc.from('course_enrollments').select('user_id, progress_pct, completed_at'),
    svc.from('caregiver_references').select('caregiver_id, status'),
    svc.from('pp_acknowledgments').select('user_id'),
    svc.from('appraisals').select('*').order('created_at', { ascending: false }),
  ])

  const ppAcks: Array<{ user_id: string }> = ppAcksErr ? [] : (rawPpAcks || [])

  const allCredTypes: CredTypeInfo[] = (rawCredTypes || []).map((ct: any) => ({
    id: ct.id, name: ct.name, short_name: shortenCredName(ct.name),
    validity_days: ct.validity_days,
    required_for_roles: Array.isArray(ct.required_for_roles) ? ct.required_for_roles : [],
  }))

  const caregiverCredTypes = allCredTypes.filter((ct) => ct.required_for_roles.includes('caregiver'))
  const today = new Date()
  const caregivers: Array<{ id: string; full_name: string; hire_date: string | null; position_name: string | null }> =
    rawCaregivers || []

  const matrixRows: MatrixRow[] = caregivers.map((caregiver) => {
    const credentials: Record<string, CredCell> = {}
    let requiredCount = 0, okCount = 0
    for (const ct of allCredTypes) {
      if (!ct.required_for_roles.includes('caregiver')) { credentials[ct.id] = { status: 'not_required' }; continue }
      requiredCount++
      const cred = (rawCreds || []).find((c: any) => c.user_id === caregiver.id && c.credential_type_id === ct.id)
      if (!cred) { credentials[ct.id] = { status: 'missing' } }
      else if (cred.not_applicable) { credentials[ct.id] = { status: 'na' }; okCount++ }
      else if (cred.does_not_expire) { credentials[ct.id] = { status: 'current', expiry_date: null, does_not_expire: true, document_url: cred.document_url }; okCount++ }
      else {
        credentials[ct.id] = { status: cred.status, expiry_date: cred.expiry_date, does_not_expire: false, document_url: cred.document_url }
        if (cred.status === 'current' || cred.status === 'expiring') okCount++
      }
    }
    const myEnrollments = (rawEnrollments || []).filter((e: any) => e.user_id === caregiver.id)
    const trainingPct = myEnrollments.length > 0
      ? Math.round(myEnrollments.reduce((s: number, e: any) => s + (e.progress_pct || 0), 0) / myEnrollments.length) : 0
    const refsReceived = (rawRefs || []).filter((r: any) => r.caregiver_id === caregiver.id && r.status === 'received').length
    const policiesSigned = ppAcks.filter((p) => p.user_id === caregiver.id).length
    const myAppraisals = (rawAppraisals || []).filter((a: any) => a.caregiver_id === caregiver.id)
    const latest = myAppraisals[0] || null
    const computeAvg = (a: Record<string, unknown>) => {
      const scores = SCORE_KEYS.map((k) => a[k]).filter((v): v is number => typeof v === 'number' && v > 0)
      return scores.length > 0 ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : 0
    }
    return {
      id: caregiver.id, full_name: caregiver.full_name,
      hire_date: caregiver.hire_date, position_name: caregiver.position_name,
      credentials, training_pct: trainingPct,
      refs_received: refsReceived, policies_signed: policiesSigned,
      latest_appraisal: latest ? { status: latest.status, created_at: latest.created_at, avg_score: computeAvg(latest) } : null,
      credential_compliance_pct: requiredCount > 0 ? Math.round((okCount / requiredCount) * 100) : 100,
    }
  })

  const horizon365 = new Date(); horizon365.setDate(horizon365.getDate() + 365)
  const credTypeMap = Object.fromEntries(allCredTypes.map((ct) => [ct.id, ct]))
  const caregiverMap = Object.fromEntries(caregivers.map((c) => [c.id, c]))
  const timelineItems: TimelineItem[] = (rawCreds || [])
    .filter((c: any) => { if (!c.expiry_date) return false; const e = new Date(c.expiry_date); return e >= today && e <= horizon365 })
    .map((c: any) => {
      const expiry = new Date(c.expiry_date)
      const daysUntil = Math.max(0, Math.ceil((expiry.getTime() - today.getTime()) / 86400000))
      return { caregiver_id: c.user_id, caregiver_name: caregiverMap[c.user_id]?.full_name || 'Unknown', credential_type_id: c.credential_type_id, credential_type_name: credTypeMap[c.credential_type_id]?.name || 'Unknown', expiry_date: c.expiry_date, days_until: daysUntil, status: c.status }
    })
    .sort((a: TimelineItem, b: TimelineItem) => a.days_until - b.days_until)

  const overallCompliancePct = matrixRows.length > 0
    ? Math.round(matrixRows.reduce((s, r) => s + r.credential_compliance_pct, 0) / matrixRows.length) : 100

  return { matrixRows, caregiverCredTypes, allCredTypes, timelineItems, generatedAt: today.toISOString(), totalCaregivers: caregivers.length, overallCompliancePct }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — FETCH
// ═══════════════════════════════════════════════════════════════════════════════

export async function getPhase2Data(): Promise<Phase2Data> {
  const svc = createServiceClient()

  const [
    { data: rawCaregivers },
    { data: rawProgrammes },
    { data: rawProgEnrollments },
    { data: rawCourses },
    { data: rawCourseEnrollments },
    { data: rawAppraisals },
    { data: rawRefs },
  ] = await Promise.all([
    svc.from('profiles').select('id, full_name, hire_date')
      .eq('status', 'active').eq('role', 'caregiver').order('full_name'),
    svc.from('programmes').select('id, title, slug, status, total_modules, est_hours').order('id'),
    svc.from('programme_enrollments').select('user_id, programme_id, status, completed_at, due_date'),
    svc.from('courses').select('id, programme_id, status').not('programme_id', 'is', null),
    svc.from('course_enrollments').select('user_id, course_id, completed_at, progress_pct'),
    svc.from('appraisals').select('*').order('created_at', { ascending: false }),
    // Joined relation — must guard with Array.isArray()
    svc.from('caregiver_references')
      .select('id, caregiver_id, slot, reference_type, status, sent_at, submission:reference_submissions(submitted_at, overall_recommendation)')
      .order('caregiver_id').order('slot'),
  ])

  const caregivers: Array<{ id: string; full_name: string; hire_date: string | null }> = rawCaregivers || []
  const programmes: ProgrammeInfo[] = (rawProgrammes || []).map((p: any) => ({
    id: p.id, title: p.title, slug: p.slug, status: p.status,
    total_modules: p.total_modules || 0, est_hours: p.est_hours || 0,
  }))
  const liveProgrammes = programmes.filter((p) => p.status !== 'archived')

  // Courses per programme
  const coursesPerProg: Record<string, string[]> = {}
  for (const c of rawCourses || []) {
    if (!coursesPerProg[c.programme_id]) coursesPerProg[c.programme_id] = []
    coursesPerProg[c.programme_id].push(c.id)
  }

  // Course enrollments lookup: user_id+course_id → enrollment
  const courseEnrollMap: Record<string, { completed_at: string | null; progress_pct: number }> = {}
  for (const ce of rawCourseEnrollments || []) {
    courseEnrollMap[`${ce.user_id}::${ce.course_id}`] = { completed_at: ce.completed_at, progress_pct: ce.progress_pct || 0 }
  }

  const today = new Date()

  // ── 2.1 Training Gap ───────────────────────────────────────────────────────
  const trainingGapRows: TrainingGapRow[] = caregivers.map((c) => {
    const myProgEnrolls = (rawProgEnrollments || []).filter((e: any) => e.user_id === c.id)
    const enrolledProgIds = new Set(myProgEnrolls.map((e: any) => e.programme_id))
    const notEnrolledCount = liveProgrammes.filter((p) => !enrolledProgIds.has(p.id)).length

    const enrollments: ProgrammeEnrollment[] = myProgEnrolls.map((pe: any) => {
      const prog = programmes.find((p) => p.id === pe.programme_id)
      const courseIds = coursesPerProg[pe.programme_id] || []
      const completedModules = courseIds.filter((cid) => courseEnrollMap[`${c.id}::${cid}`]?.completed_at).length
      const totalModules = courseIds.length || prog?.total_modules || 0
      const progressPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
      const isCompleted = !!pe.completed_at
      const isOverdue = pe.due_date && !isCompleted && new Date(pe.due_date) < today

      return {
        programme_id: pe.programme_id,
        programme_title: prog?.title || pe.programme_id,
        programme_status: prog?.status || '',
        enroll_status: pe.status,
        completed_at: pe.completed_at,
        due_date: pe.due_date,
        completed_modules: completedModules,
        total_modules: totalModules,
        progress_pct: isCompleted ? 100 : progressPct,
        is_overdue: !!isOverdue,
        is_completed: isCompleted,
      }
    })

    const overallPct = enrollments.length > 0
      ? Math.round(enrollments.reduce((s, e) => s + e.progress_pct, 0) / enrollments.length) : 0

    return {
      caregiver_id: c.id,
      caregiver_name: c.full_name,
      hire_date: c.hire_date,
      enrollments,
      not_enrolled_count: notEnrolledCount,
      overall_pct: overallPct,
      has_overdue: enrollments.some((e) => e.is_overdue),
      completed_all: enrollments.length > 0 && enrollments.every((e) => e.is_completed) && notEnrolledCount === 0,
    }
  })

  // ── 2.2 Appraisal Heatmap ──────────────────────────────────────────────────
  // Pick the best appraisal per caregiver: signed > sent > draft, then latest
  const appraisalsByCg: Record<string, any[]> = {}
  for (const a of rawAppraisals || []) {
    if (!appraisalsByCg[a.caregiver_id]) appraisalsByCg[a.caregiver_id] = []
    appraisalsByCg[a.caregiver_id].push(a)
  }

  const heatmapRows: HeatmapRow[] = caregivers
    .map((c) => {
      const appraisals = appraisalsByCg[c.id] || []
      if (appraisals.length === 0) return null
      // Prefer signed, then sent, then draft; within each group take latest
      const prioritized = ['signed', 'sent', 'draft']
        .map((s) => appraisals.filter((a) => a.status === s))
        .find((group) => group.length > 0)
      const best = prioritized?.[0] || appraisals[0]

      const scores: Record<string, number> = {}
      for (const comp of ALL_COMPETENCIES) {
        scores[comp.key] = typeof best[comp.key] === 'number' ? best[comp.key] : 0
      }

      const clinicalAvg  = avgScores(best, CLINICAL_KEYS)
      const professionalAvg = avgScores(best, PROFESSIONAL_KEYS)
      const allScoreVals = Object.values(scores).filter((v) => v > 0)
      const overallAvg = allScoreVals.length > 0
        ? Math.round((allScoreVals.reduce((s, v) => s + v, 0) / allScoreVals.length) * 10) / 10 : 0

      return {
        caregiver_id: c.id, caregiver_name: c.full_name,
        appraisal_id: best.id, appraisal_date: best.created_at,
        status: best.status, scores,
        clinical_avg: clinicalAvg, professional_avg: professionalAvg, overall_avg: overallAvg,
      }
    })
    .filter((r): r is HeatmapRow => r !== null)

  // Team averages
  const teamAvg = (key: 'clinical_avg' | 'professional_avg' | 'overall_avg') => {
    const vals = heatmapRows.map((r) => r[key]).filter((v) => v > 0)
    return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0
  }

  // ── 2.3 References Pipeline ────────────────────────────────────────────────
  const slotLabels: Record<number, string> = {
    1: 'Professional 1', 2: 'Professional 2', 3: 'Character',
  }

  const refPipelineRows: RefPipelineRow[] = (rawRefs || []).map((r: any) => {
    // submission is a joined relation — guard Array.isArray
    const sub = Array.isArray(r.submission) ? r.submission[0] : r.submission
    const receivedAt = sub?.submitted_at || null
    const daysToReceive = r.sent_at && receivedAt
      ? Math.round((new Date(receivedAt).getTime() - new Date(r.sent_at).getTime()) / 86400000) : null
    const daysOutstanding = r.sent_at && !receivedAt
      ? Math.round((today.getTime() - new Date(r.sent_at).getTime()) / 86400000) : null

    return {
      id: r.id,
      caregiver_id: r.caregiver_id,
      caregiver_name: '',                           // filled below
      slot: r.slot,
      reference_type: r.reference_type,
      slot_label: slotLabels[r.slot] || `Slot ${r.slot}`,
      status: r.status,
      sent_at: r.sent_at,
      received_at: receivedAt,
      days_to_receive: daysToReceive,
      days_outstanding: daysOutstanding,
      overall_recommendation: sub?.overall_recommendation || null,
    }
  })

  // Fill caregiver names
  const cgMap = Object.fromEntries(caregivers.map((c) => [c.id, c.full_name]))
  for (const row of refPipelineRows) {
    row.caregiver_name = cgMap[row.caregiver_id] || 'Unknown'
  }

  // Stats
  const totalRefs = refPipelineRows.length
  const receivedRefs = refPipelineRows.filter((r) => r.status === 'received')
  const sentRefs = refPipelineRows.filter((r) => r.status === 'sent')
  const notSentRefs = refPipelineRows.filter((r) => r.status === 'not_sent')
  const receivedTimes = receivedRefs.filter((r) => r.days_to_receive !== null).map((r) => r.days_to_receive as number)
  const avgDaysToReceive = receivedTimes.length > 0
    ? Math.round(receivedTimes.reduce((s, v) => s + v, 0) / receivedTimes.length) : null

  return {
    trainingGapRows, programmes: liveProgrammes,
    heatmapRows, heatmapCompetencies: ALL_COMPETENCIES,
    teamClinicalAvg: teamAvg('clinical_avg'),
    teamProfessionalAvg: teamAvg('professional_avg'),
    teamOverallAvg: teamAvg('overall_avg'),
    refPipelineRows, avgDaysToReceive,
    refStats: {
      total: totalRefs,
      not_sent: notSentRefs.length,
      sent: sentRefs.length,
      received: receivedRefs.length,
      pct_received: totalRefs > 0 ? Math.round((receivedRefs.length / totalRefs) * 100) : 0,
    },
  }
}
