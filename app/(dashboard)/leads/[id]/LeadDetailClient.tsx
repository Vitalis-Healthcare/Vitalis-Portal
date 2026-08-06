'use client'
// ═════════════════════════════════════════════════════════════════════════
// Lead Workspace (v0.6.44) — Ship 4c: floor fix + full edit palette.
// The below-min floor is now hours-based with a revenue buy-out (see
// lib/leads/model.ts); the Edit form gains Source, Referral, Relationship,
// and the LIVE service-type chips; the header date renders correctly.
//
// Layout, top to bottom:
//   Header      — identity + chips, contact links, TWO primary buttons
//                 (Log Activity, Edit); everything else behind "⋯ More".
//   Journey     — stage stepper + status controls (unchanged behavior).
//   Next Action — the Ship 2 panel (unchanged behavior).
//   Milestones  — Consent (interactive) · Assessment (live since 4a) ·
//                 Conversion (NOW LIVE: convert to client, atomic via the
//                 convert_lead_to_client RPC; 5/5 ready converts clean,
//                 fewer demands a logged override reason; payer picker
//                 from the canonical lib/payers list).
//   Body        — timeline (day-grouped, filterable, slim status lines)
//                 beside a three-card rail (Numbers / People / Details).
//
// v0.6.45 (Ship 5a) adds outbound email: a Send Email primary button,
// the composer modal (templates from lib/leads/email-templates.ts,
// self/other variants), timeline entries with delivery-status badges.
//
// Behavior from Ships 1–4a is preserved verbatim: same routes, same guards,
// same handlers. This ship adds the conversion slot; it moves nothing else.
// ═════════════════════════════════════════════════════════════════════════
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MessageSquare, Edit3, Save, X, MoreHorizontal, Send } from 'lucide-react'
import {
  LEAD_STATUSES, statusMeta, calcRevenue, effectiveProbability,
  PROBABILITY_OPTIONS, LOST_REASONS, lostReasonLabel, prettyKey,
  MIN_HOURS_WEEK, MIN_WEEKLY_REVENUE, isBelowFloor,
  NEXT_ACTION_TYPES, nextActionLabel,
  CONSENT_STATUSES, consentMeta,
  LEAD_SOURCES as SOURCES, LEAD_RELATIONSHIPS as RELATIONSHIPS,
  FALLBACK_CARE_TYPES as CARE_TYPES,
} from '@/lib/leads/model'
import { LEAD_EMAIL_TEMPLATES, templateByKey } from '@/lib/leads/email-templates'
import { PAYER_TYPES } from '@/lib/payers'

const ACTIVITY_TYPES = [
  { key: 'call',        label: 'Phone Call',   icon: '📞' },
  { key: 'email',       label: 'Email',        icon: '✉️' },
  { key: 'meeting',     label: 'Meeting',      icon: '🤝' },
  { key: 'assessment',  label: 'Assessment',   icon: '📋' },
  { key: 'follow_up',   label: 'Follow-up',    icon: '🔔' },
  { key: 'note',        label: 'Note',         icon: '📝' },
]

const OUTCOMES = [
  { key: 'positive',       label: '✅ Positive' },
  { key: 'neutral',        label: '➖ Neutral' },
  { key: 'negative',       label: '❌ Negative' },
  { key: 'no_answer',      label: '📵 No Answer' },
  { key: 'left_voicemail', label: '📬 Left Voicemail' },
]

const TIMELINE_FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'call',    label: '📞 Calls' },
  { key: 'email',   label: '✉️ Emails' },
  { key: 'note',    label: '📝 Notes' },
  { key: 'changes', label: '🔄 Changes' },
]

// CARE_TYPES (the fallback), SOURCES and RELATIONSHIPS moved to
// lib/leads/model.ts in v0.6.51 and are imported above under the same
// local names — the Add New Lead form and this Edit form now read one
// list, so they cannot disagree.

// v0.6.42 — cadence options mirror the assessments module.
const CADENCE_OPTIONS = [
  { value: '120', label: '120 days (standard)' },
  { value: '90',  label: '90 days' },
  { value: '60',  label: '60 days' },
  { value: '30',  label: '30 days' },
  { value: '365', label: '365 days (annual)' },
]

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
// v0.6.44 — for full timestamps (created_at). fmtDate appends T12:00:00 for
// date-only values and produces Invalid Date when fed a real timestamp.
function fmtStamp(d?: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function dayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const that = new Date(d); that.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - that.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

const getName = (v: any) => Array.isArray(v) ? v[0]?.full_name : v?.full_name

interface Lead {
  id: string; full_name: string; client_name?: string; email?: string; phone?: string
  source: string; referral_name?: string
  status: string; stage?: string | null
  standby_until?: string | null; standby_reason?: string | null
  lost_reason_code?: string | null; close_probability?: number | null
  next_action_type?: string | null; next_action_due?: string | null; next_action_note?: string | null
  consent_status?: string | null
  legacy_status?: string | null; archived_at?: string | null
  assessment_client_id?: string | null
  referral_source_id?: string | null
  relationship?: string
  care_types?: string[]; condition_notes?: string; preferred_schedule?: string
  estimated_hours_week?: number; hourly_rate?: number
  expected_start_date?: string; expected_close_date?: string
  won_date?: string; lost_date?: string; lost_reason?: string; notes?: string
  created_at: string; updated_at: string
  assigned_to?: string; secondary_assigned_to?: string
  address?: string; city?: string; state?: string; zip?: string; date_of_birth?: string
  assignee?: any; secondary?: any; creator?: any
}
interface Activity {
  id: string; lead_id: string; created_at: string
  activity_type: string; content: string; outcome?: string; next_follow_up?: string
  author?: any
}
interface Stage { key: string; label: string; color: string; bg_color: string; order_index: number }

// v0.6.42 — assessment context from the server page.
interface AssessmentClientInfo { id: string; full_name: string; status: string }
interface AssessmentRow {
  id: string; status: string; scheduled_date: string | null
  completed_date: string | null; is_initial: boolean; nurse_name: string | null
}

// v0.6.45 — outbound email rows for timeline badges.
interface LeadEmail {
  id: string; activity_id?: string | null
  to_email: string; subject: string; template_key?: string | null
  status: string; failure_reason?: string | null
  delivered_at?: string | null; bounced_at?: string | null; opened_at?: string | null
  created_at: string
}

// v0.6.46 — the latest consent record for the milestone panel.
interface ConsentInfo {
  id: string; status: string; agreement_version: string
  created_at: string; viewed_at?: string | null; signed_at?: string | null
  signer_name?: string | null; rep_name?: string | null
  email_status?: string | null; email_to?: string | null
}

interface Props {
  lead: Lead; activities: Activity[]; staff: { id: string; full_name: string }[]
  stages: Stage[]
  serviceTypes: { label: string }[]
  referralSources: { id: string; name: string; organization?: string | null }[]
  currentUserId: string; currentUserName: string; currentUserEmail: string; isAdmin: boolean
  leadEmails: LeadEmail[]
  latestConsent: ConsentInfo | null
  assessmentClient: AssessmentClientInfo | null
  assessment: AssessmentRow | null
  nurses: { id: string; full_name: string }[]
  linkableClients: { id: string; full_name: string }[]
}

export default function LeadDetailClient({ lead: initialLead, activities: initialActivities, staff, stages, serviceTypes, referralSources, currentUserId, currentUserName, currentUserEmail, isAdmin, assessmentClient, assessment, nurses, linkableClients, leadEmails: initialLeadEmails, latestConsent: initialConsent }: Props) {
  const ACTIVE_CARE_TYPES = serviceTypes.length > 0 ? serviceTypes.map(s => s.label) : CARE_TYPES
  const router = useRouter()
  const [lead, setLead] = useState(initialLead)
  const [activities, setActivities] = useState(initialActivities)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  // ── v0.6.45: outbound email composer ──
  const [leadEmails, setLeadEmails] = useState(initialLeadEmails)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailForm, setEmailForm] = useState({ template_key: '', to: '', subject: '', body: '', follow_up: '' })
  // ── v0.6.46: consent Prepare & Send ──
  const [latestConsent, setLatestConsent] = useState(initialConsent)
  const [consentOpen, setConsentOpen] = useState(false)
  const [consentSending, setConsentSending] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [consentForm, setConsentForm] = useState({
    to: '', client_name: '', dob: '', address: '', city: '', state: '', zip: '',
    start_of_care: '', ltc_insurer: '', ltc_claim: '',
    billing_method: 'medicaid_waiver', private_pay_rate: '', insurance_projected: '',
  })
  const [timelineFilter, setTimelineFilter] = useState('all')
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    ...initialLead,
    estimated_hours_week: initialLead.estimated_hours_week?.toString() || '',
    hourly_rate: initialLead.hourly_rate?.toString() || '',
    close_probability: initialLead.close_probability != null ? String(initialLead.close_probability) : '',
  })
  const [actForm, setActForm] = useState({ activity_type: 'call', content: '', outcome: '', next_follow_up: '' })
  const setE = (k: string, v: any) => setEditForm(f => ({ ...f, [k]: v }))
  const setA = (k: string, v: any) => setActForm(f => ({ ...f, [k]: v }))

  // ── Status prompt panels (standby needs a date; lost needs a reason) ──
  const [statusPrompt, setStatusPrompt] = useState<'standby' | 'lost' | null>(null)
  const [standbyForm, setStandbyForm] = useState({ standby_until: '', standby_reason: '' })
  const [lostForm, setLostForm] = useState({ lost_reason_code: '', lost_reason: '' })

  // ── Next action ──
  const [actionEdit, setActionEdit] = useState(false)
  const [actionForm, setActionForm] = useState({
    next_action_type: initialLead.next_action_type || 'call',
    next_action_due: initialLead.next_action_due || '',
    next_action_note: initialLead.next_action_note || '',
  })
  const [markDone, setMarkDone] = useState(false)

  // ── CareMatch360 sync state ──
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string>('')

  // ── v0.6.42: assessment milestone state ──
  // Local copies win over props after a successful schedule, because
  // useState(initialProp) does not re-seed on router.refresh().
  const [acLocal, setAcLocal] = useState<AssessmentClientInfo | null>(assessmentClient)
  // ── v0.6.50 (Ship 5d): link an existing client record, nothing else ──
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkClientId, setLinkClientId] = useState('')
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [asmtLocal, setAsmtLocal] = useState<AssessmentRow | null>(assessment)
  const [schedOpen, setSchedOpen] = useState(false)
  const [schedForm, setSchedForm] = useState({
    mode: 'create' as 'create' | 'link',
    existing_client_id: '',
    nurse_id: '',
    first_due_date: '',
    cadence_days: '120',
    is_initial: true,
  })
  const setS = (k: string, v: any) => setSchedForm(f => ({ ...f, [k]: v }))

  // ── v0.6.43: convert-to-client state ──
  const [convOpen, setConvOpen] = useState(false)
  const [convForm, setConvForm] = useState({ payer_type: '', override_reason: '' })

  const handleSyncToCarematch = async () => {
    setMoreOpen(false)
    setSyncing(true); setSyncError('')
    try {
      const res = await fetch(`/api/leads/sync-to-carematch/${lead.id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setSyncError(data.error || 'Sync failed')
      } else {
        setLastSyncedAt(data.sent_at || new Date().toISOString())
      }
    } catch (err: any) {
      setSyncError(err.message || 'Sync failed')
    } finally {
      setSyncing(false)
      setTimeout(() => { setSyncError(''); }, 6000)
    }
  }

  const rev = calcRevenue(lead.estimated_hours_week, lead.hourly_rate)
  const status = statusMeta(lead.status)
  const currentStage = stages.find(s => s.key === lead.stage)
  const isOpen = lead.status === 'ongoing' || lead.status === 'standby'
  const isArchived = !!lead.archived_at
  const consent = consentMeta(lead.consent_status)

  const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 7, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: 4 }
  const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px' }

  // ── Generic update helper — all writes go through /api/leads/update ──
  const updateLead = async (fields: Record<string, any>): Promise<boolean> => {
    setSaving(true)
    const res = await fetch('/api/leads/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, ...fields }),
    })
    if (res.ok) {
      const { lead: updated } = await res.json()
      setLead(updated)
      router.refresh()
      setSaving(false)
      return true
    }
    const d = await res.json().catch(() => ({}))
    alert(d.error || 'Failed to save changes')
    setSaving(false)
    return false
  }

  const pushLocalActivity = (content: string) => {
    const a: Activity = {
      id: Date.now().toString(), lead_id: lead.id,
      created_at: new Date().toISOString(), activity_type: 'status_change',
      content, author: [{ full_name: currentUserName }],
    }
    setActivities(prev => [a, ...prev])
  }

  const handleSave = async () => {
    // Below the floor demands a deliberate yes.
    const h = editForm.estimated_hours_week ? parseFloat(editForm.estimated_hours_week as string) : null
    const r = editForm.hourly_rate ? parseFloat(editForm.hourly_rate as string) : null
    if (isBelowFloor(h, r)) {
      if (!confirm(`This is below the Vitalis minimum (${MIN_HOURS_WEEK}h/week, or $${MIN_WEEKLY_REVENUE}/week in revenue). The lead will be flagged as below-minimum. Continue anyway?`)) return
    }
    const payload: Record<string, any> = {
      ...editForm,
      estimated_hours_week: h,
      hourly_rate: r,
      close_probability: editForm.close_probability !== '' ? parseInt(editForm.close_probability as string, 10) : null,
    }
    // Never send status through the edit form — outcomes are deliberate
    // acts through the status buttons, with their own guards.
    delete payload.status
    delete payload.consent_status
    const ok = await updateLead(payload)
    if (ok) setEditing(false)
  }

  const saveNextAction = async () => {
    if (!actionForm.next_action_due) { alert('A due date is required.') ; return }
    const ok = await updateLead({
      next_action_type: actionForm.next_action_type,
      next_action_due: actionForm.next_action_due,
      next_action_note: actionForm.next_action_note || null,
    })
    if (ok) setActionEdit(false)
  }

  const openMarkDone = () => {
    setMarkDone(true)
    setEditingActivity(null)
    setActForm({
      activity_type: lead.next_action_type === 'call' ? 'call' : lead.next_action_type === 'email' ? 'email' : 'follow_up',
      content: lead.next_action_note ? `Done: ${nextActionLabel(lead.next_action_type)} — ${lead.next_action_note}` : `Done: ${nextActionLabel(lead.next_action_type)}`,
      outcome: '', next_follow_up: '',
    })
    setLogOpen(true)
  }

  const statusLabelOf = (k: string) => LEAD_STATUSES.find(s => s.key === k)?.label || prettyKey(k)

  const handleStageChange = async (newStage: string) => {
    if (newStage === lead.stage) return
    const ok = await updateLead({ stage: newStage })
    if (ok) pushLocalActivity(`Stage moved: ${prettyKey(lead.stage)} → ${prettyKey(newStage)}`)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === lead.status) return
    if (newStatus === 'standby') {
      setStandbyForm({ standby_until: lead.standby_until || '', standby_reason: lead.standby_reason || '' })
      setStatusPrompt('standby'); return
    }
    if (newStatus === 'lost') {
      setLostForm({ lost_reason_code: lead.lost_reason_code || '', lost_reason: lead.lost_reason || '' })
      setStatusPrompt('lost'); return
    }
    if (newStatus === 'cancelled' && !confirm('Mark this lead as Cancelled? Use Lost if it went to another provider — Cancelled is for cases that did not proceed for other reasons.')) return
    const prev = lead.status
    const ok = await updateLead({ status: newStatus })
    if (ok) pushLocalActivity(`Status changed: ${statusLabelOf(prev)} → ${statusLabelOf(newStatus)}`)
  }

  const confirmStandby = async () => {
    if (!standbyForm.standby_until) { alert('Standby requires a follow-up date.'); return }
    const prev = lead.status
    const ok = await updateLead({ status: 'standby', standby_until: standbyForm.standby_until, standby_reason: standbyForm.standby_reason || null })
    if (ok) {
      pushLocalActivity(`Status changed: ${statusLabelOf(prev)} → Standby (until ${standbyForm.standby_until})`)
      setStatusPrompt(null)
    }
  }

  const confirmLost = async () => {
    if (!lostForm.lost_reason_code) { alert('Marking a lead Lost requires a reason.'); return }
    const prev = lead.status
    const ok = await updateLead({ status: 'lost', lost_reason_code: lostForm.lost_reason_code, lost_reason: lostForm.lost_reason || null })
    if (ok) {
      pushLocalActivity(`Status changed: ${statusLabelOf(prev)} → Lost (${lostReasonLabel(lostForm.lost_reason_code)})`)
      setStatusPrompt(null)
    }
  }

  const setConsent = async (newConsent: string) => {
    if (newConsent === (lead.consent_status || 'not_started')) return
    const prev = lead.consent_status || 'not_started'
    const ok = await updateLead({ consent_status: newConsent })
    if (ok) pushLocalActivity(`Consent milestone: ${prettyKey(prev)} → ${prettyKey(newConsent)}`)
  }

  // ── v0.6.42: schedule an assessment from the lead ────────────────────
  const handleScheduleAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schedForm.nurse_id || !schedForm.first_due_date) { alert('A nurse and a first due date are required.'); return }
    if (!acLocal && schedForm.mode === 'link' && !schedForm.existing_client_id) { alert('Choose the existing client record to link.'); return }
    setSaving(true)
    const res = await fetch('/api/leads/assessment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: lead.id,
        existing_client_id: !acLocal && schedForm.mode === 'link' ? schedForm.existing_client_id : null,
        nurse_id: schedForm.nurse_id,
        first_due_date: schedForm.first_due_date,
        cadence_days: parseInt(schedForm.cadence_days, 10),
        is_initial: schedForm.is_initial,
      }),
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      if (d.client) setAcLocal(d.client)
      if (d.assessment) setAsmtLocal(d.assessment)
      setLead(l => ({ ...l, assessment_client_id: d.client?.id || l.assessment_client_id }))
      pushLocalActivity(`Assessment scheduled for ${d.assessment?.scheduled_date || schedForm.first_due_date} with ${d.assessment?.nurse_name || 'nurse'}`)
      setSchedOpen(false)
      router.refresh()
    } else if (res.status === 409 && d.assessment) {
      // Duplicate prevention: an assessment is already open — show it.
      if (d.client) setAcLocal(d.client)
      setAsmtLocal(d.assessment)
      setLead(l => ({ ...l, assessment_client_id: d.client?.id || l.assessment_client_id }))
      alert(d.error || 'An assessment is already open for this client.')
      setSchedOpen(false)
    } else {
      alert(d.error || 'Failed to schedule the assessment')
    }
    setSaving(false)
  }

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actForm.content.trim()) return
    // Completing an action means immediately scheduling the next one —
    // or going to the status buttons to close/pause the lead instead.
    if (markDone && !actForm.next_follow_up && lead.status === 'ongoing') {
      alert('Schedule the next follow-up date — or close/pause the lead through the Status buttons instead.')
      return
    }
    setSaving(true)
    const res = await fetch('/api/leads/activity', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id, ...actForm }),
    })
    if (res.ok) {
      const { activity } = await res.json()
      const enriched = { ...activity, author: [{ full_name: currentUserName }] }
      setActivities(prev => [enriched, ...prev])
      // The activity route mirrored the follow-up onto the lead.
      if (actForm.next_follow_up) {
        setLead(l => ({ ...l, next_action_type: 'follow_up', next_action_due: actForm.next_follow_up, next_action_note: null }))
        setActionForm({ next_action_type: 'follow_up', next_action_due: actForm.next_follow_up, next_action_note: '' })
      }
      setActForm({ activity_type: 'call', content: '', outcome: '', next_follow_up: '' })
      setLogOpen(false)
      setMarkDone(false)
      router.refresh()
    } else {
      alert('Failed to log activity')
    }
    setSaving(false)
  }

  const handleEditActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingActivity || !actForm.content.trim()) return
    setSaving(true)
    const res = await fetch('/api/leads/update-activity', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingActivity.id, ...actForm }),
    })
    if (res.ok) {
      const { activity } = await res.json()
      setActivities(prev => prev.map(a => a.id === editingActivity.id
        ? { ...a, ...activity } : a))
      setEditingActivity(null)
      setActForm({ activity_type: 'call', content: '', outcome: '', next_follow_up: '' })
    } else { alert('Failed to update activity') }
    setSaving(false)
  }

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Delete this activity log entry?')) return
    setDeletingActivityId(id)
    const res = await fetch('/api/leads/delete-activity', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setActivities(prev => prev.filter(a => a.id !== id))
    else alert('Failed to delete activity')
    setDeletingActivityId(null)
  }

  const openEditActivity = (a: Activity) => {
    setEditingActivity(a)
    setActForm({ activity_type: a.activity_type, content: a.content, outcome: a.outcome || '', next_follow_up: a.next_follow_up || '' })
    setLogOpen(true)
  }

  const handleArchive = async () => {
    setMoreOpen(false)
    if (!confirm('Archive this lead? It keeps its stage and status and disappears from the working views. You can restore it any time.')) return
    setSaving(true)
    const res = await fetch('/api/leads/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, action: 'archive' }),
    })
    if (res.ok) {
      router.push('/leads')
    } else {
      const d = await res.json(); alert(d.error || 'Failed to archive lead')
    }
    setSaving(false)
  }

  const handleRestore = async () => {
    setSaving(true)
    const res = await fetch('/api/leads/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, action: 'restore' }),
    })
    if (res.ok) {
      setLead(l => ({ ...l, archived_at: null }))
      pushLocalActivity('Lead restored from the archive.')
      router.refresh()
    } else {
      const d = await res.json(); alert(d.error || 'Failed to restore lead')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    setMoreOpen(false)
    if (!confirm('⚠️ Permanently delete this lead and ALL its activity history? This cannot be undone.')) return
    if (!confirm('Are you absolutely sure? This will delete all calls, notes, and activity logs for this lead.')) return
    setSaving(true)
    const res = await fetch('/api/leads/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, action: 'delete' }),
    })
    if (res.ok) {
      router.push('/leads')
    } else {
      const d = await res.json(); alert(d.error || 'Failed to delete lead')
    }
    setSaving(false)
  }

  const actIcon = (type: string) => ACTIVITY_TYPES.find(a => a.key === type)?.icon || '📝'
  const today = new Date().toISOString().split('T')[0]

  // ── v0.6.45: outbound email handlers ──────────────────────────────────
  function openEmailComposer() {
    setEmailError(null)
    setEmailForm({ template_key: '', to: lead.email || '', subject: '', body: '', follow_up: '' })
    setEmailOpen(true)
  }
  function applyTemplate(key: string) {
    const t = templateByKey(key)
    if (!t) { setEmailForm(f => ({ ...f, template_key: '' })); return }
    const draft = t.build(lead, currentUserName.split(' ')[0] || currentUserName)
    setEmailForm(f => ({ ...f, template_key: key, subject: draft.subject, body: draft.body }))
  }
  async function handleSendEmail() {
    setEmailSending(true); setEmailError(null)
    try {
      const res = await fetch('/api/leads/emails', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id, to: emailForm.to, subject: emailForm.subject,
          body: emailForm.body, template_key: emailForm.template_key || null,
          follow_up: emailForm.follow_up || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setEmailError(data.error || `Send failed (HTTP ${res.status})`); return }
      if (data.email) setLeadEmails(prev => [data.email, ...prev])
      if (data.activity_id) {
        setActivities(prev => [{
          id: data.activity_id, lead_id: lead.id, created_at: new Date().toISOString(),
          activity_type: 'email', content: `Email sent: ${emailForm.subject}`,
          next_follow_up: emailForm.follow_up || undefined,
          author: { full_name: currentUserName },
        }, ...prev])
      }
      if (emailForm.follow_up) {
        setLead(prev => ({ ...prev, next_action_type: 'follow_up', next_action_due: emailForm.follow_up, next_action_note: undefined }))
      }
      setEmailOpen(false)
    } finally {
      setEmailSending(false)
    }
  }
  function emailBadgeFor(activityId: string) {
    const e = leadEmails.find(x => x.activity_id === activityId)
    if (!e) return null
    if (e.status === 'bounced') return { label: 'Bounced', color: '#DC2626', bg: '#FEE2E2', title: e.failure_reason || 'The receiving server rejected this email' }
    if (e.status === 'complained') return { label: 'Marked spam', color: '#DC2626', bg: '#FEE2E2', title: 'The recipient reported this email as spam' }
    if (e.status === 'delivered' || e.delivered_at) {
      if (e.opened_at) return { label: 'Opened', color: '#065F46', bg: '#A7F3D0', title: 'Open reported \u2014 best-effort signal; many mail apps block or fake opens' }
      return { label: 'Delivered', color: '#0B6B5C', bg: '#D1FAE5', title: 'The receiving server accepted this email' }
    }
    return { label: 'Sent', color: '#4A6070', bg: '#EFF2F5', title: 'Handed to Resend \u2014 the delivery result lands here within a minute or two' }
  }

  // ── v0.6.46: consent handlers ──
  function openConsentPrepare() {
    setConsentError(null)
    setConsentForm({
      to: lead.email || '',
      client_name: lead.client_name || lead.full_name || '',
      dob: lead.date_of_birth || '',
      address: lead.address || '', city: lead.city || '',
      state: lead.state || 'MD', zip: lead.zip || '',
      start_of_care: lead.expected_start_date || lead.expected_close_date || '',
      ltc_insurer: '', ltc_claim: '',
      billing_method: 'medicaid_waiver',
      private_pay_rate: lead.hourly_rate ? `$${Number(lead.hourly_rate).toFixed(2)}/hour` : '',
      insurance_projected: '',
    })
    setConsentOpen(true)
  }
  async function handleSendConsent() {
    setConsentSending(true); setConsentError(null)
    try {
      const res = await fetch('/api/leads/consent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id, to: consentForm.to,
          prefill: {
            client_name: consentForm.client_name, dob: consentForm.dob || null,
            address: consentForm.address || null, city: consentForm.city || null,
            state: consentForm.state || null, zip: consentForm.zip || null,
            start_of_care: consentForm.start_of_care || null,
            ltc_insurer: consentForm.ltc_insurer || null, ltc_claim: consentForm.ltc_claim || null,
            billing_method: consentForm.billing_method,
            private_pay_rate: consentForm.private_pay_rate || null,
            insurance_projected: consentForm.insurance_projected || null,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setConsentError(data.error || `Send failed (HTTP ${res.status})`); return }
      const prevConsent = lead.consent_status || 'not_started'
      setLead(prev => ({ ...prev, consent_status: 'sent' }))
      if (data.consent) setLatestConsent({ id: data.consent.id, status: 'sent', agreement_version: '', created_at: data.consent.created_at })
      if (prevConsent !== 'sent') pushLocalActivity(`Consent milestone: ${prettyKey(prevConsent)} → ${prettyKey('sent')}`)
      if (data.email) setLeadEmails(prev => [data.email, ...prev])
      if (data.activity_id) {
        setActivities(prev => [{
          id: data.activity_id, lead_id: lead.id, created_at: new Date().toISOString(),
          activity_type: 'email', content: `Email sent: Your Vitalis Service Agreement is ready to sign`,
          author: { full_name: currentUserName },
        }, ...prev])
      }
      setConsentOpen(false)
    } finally {
      setConsentSending(false)
    }
  }

  // ── v0.6.50: link-only client attach (no schedule, no nurse, no email) ──
  async function handleLinkClient() {
    if (!linkClientId) { setLinkError('Choose the client record to link.'); return }
    setLinkSaving(true); setLinkError(null)
    try {
      const res = await fetch('/api/leads/link-client', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, client_id: linkClientId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setLinkError(data.error || `Link failed (HTTP ${res.status})`); return }
      setAcLocal({ id: data.client.id, full_name: data.client.full_name, status: 'active' } as AssessmentClientInfo)
      setLead(l => ({ ...l, assessment_client_id: data.client.id }))
      pushLocalActivity(`Linked to client record: ${data.client.full_name}`)
      setLinkOpen(false)
      setLinkClientId('')
    } finally {
      setLinkSaving(false)
    }
  }

  // ── Timeline: filter, then group by day ──────────────────────────────
  const visibleActivities = activities.filter(a => {
    if (timelineFilter === 'all') return true

    if (timelineFilter === 'changes') return a.activity_type === 'status_change'
    if (timelineFilter === 'note') return a.activity_type === 'note'
    return a.activity_type === timelineFilter
  })
  const dayGroups: { label: string; items: Activity[] }[] = []
  for (const a of visibleActivities) {
    const label = dayLabel(a.created_at)
    const last = dayGroups[dayGroups.length - 1]
    if (last && last.label === label) last.items.push(a)
    else dayGroups.push({ label, items: [a] })
  }

  // ── Conversion readiness (computed; the Convert button is Ship 4b) ───
  const readiness = [
    { label: 'Contact info', ok: !!(lead.phone || lead.email) },
    { label: 'Hours & rate', ok: !!(lead.estimated_hours_week && lead.hourly_rate) },
    { label: 'Meets minimum', ok: !isBelowFloor(lead.estimated_hours_week, lead.hourly_rate) },
    { label: 'Target close date', ok: !!lead.expected_close_date },
    { label: 'Consent signed', ok: (lead.consent_status || '') === 'signed' },
  ]
  const readyCount = readiness.filter(r => r.ok).length
  const unmetItems = readiness.filter(r => !r.ok).map(r => r.label)

  // ── v0.6.43: convert the lead to a client (atomic server-side RPC) ───
  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!convForm.payer_type) { alert('Choose the payer.'); return }
    if (unmetItems.length > 0 && !convForm.override_reason.trim()) { alert('Converting with unmet readiness items requires a reason.'); return }
    setSaving(true)
    const res = await fetch('/api/leads/convert', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id, payer_type: convForm.payer_type, override_reason: convForm.override_reason }),
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      if (d.lead) setLead(d.lead)
      if (d.client) setAcLocal(d.client)
      pushLocalActivity(d.timeline_content || `Converted to client · Payer: ${convForm.payer_type}`)
      setConvOpen(false)
      router.refresh()
    } else {
      alert(d.error || 'Failed to convert the lead')
    }
    setSaving(false)
  }

  // ── v0.6.42: assessment milestone derived view ───────────────────────
  const asmtIsOpen = !!asmtLocal && ['scheduled', 'overdue'].includes(asmtLocal.status)
  const asmtIsOverdue = asmtIsOpen && (asmtLocal!.status === 'overdue' || (!!asmtLocal!.scheduled_date && asmtLocal!.scheduled_date < today))
  const asmtIsCompleted = !!asmtLocal && asmtLocal.status === 'completed'
  const clientDischarged = acLocal?.status === 'discharged'
  const asmtBadge = asmtIsOpen
    ? (asmtIsOverdue
        ? { label: 'Overdue', bg: '#FEE2E2', color: '#DC2626' }
        : { label: 'Scheduled', bg: '#D1FAE5', color: '#065F46' })
    : asmtIsCompleted
      ? { label: 'Completed', bg: '#EDE9FE', color: '#7C3AED' }
      : acLocal
        ? { label: 'None open', bg: '#EFF2F5', color: '#8FA0B0' }
        : { label: 'Not scheduled', bg: '#EFF2F5', color: '#8FA0B0' }
  const openSchedModal = () => {
    setSchedForm({ mode: 'create', existing_client_id: '', nurse_id: nurses.length === 1 ? nurses[0].id : '', first_due_date: '', cadence_days: '120', is_initial: !asmtLocal })
    setSchedOpen(true)
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>

      {/* Back */}
      <div style={{ marginBottom: 16 }}>
        <Link href="/leads" style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <ArrowLeft size={13}/> All Leads
        </Link>
      </div>

      {/* Archived banner */}
      {isArchived && (
        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📦</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>This lead is archived</div>
              <div style={{ fontSize: 12, color: '#B45309' }}>Archived {fmtDateTime(lead.archived_at!)} — hidden from the working views. Its stage and status are preserved.</div>
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={handleRestore} disabled={saving} style={{ padding: '7px 14px', background: '#D1FAE5', border: '1px solid #0B6B5C', borderRadius: 8, color: '#0B6B5C', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                ♻️ Restore
              </button>
              <button onClick={handleDelete} style={{ padding: '7px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                🗑️ Delete Permanently
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Header: identity + contact + two primary buttons ── */}
      <div style={{ ...card, borderRadius: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {status && (
                <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: status.bg, color: status.color }}>
                  {status.label}
                </span>
              )}
              {isOpen && currentStage && (
                <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: currentStage.bg_color, color: currentStage.color }}>
                  {currentStage.label}
                </span>
              )}
              {lead.close_probability != null && (
                <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#EDE9FE', color: '#7C3AED' }}>
                  {lead.close_probability}%
                </span>
              )}
              {isBelowFloor(lead.estimated_hours_week, lead.hourly_rate) && (
                <span title={`Below the Vitalis minimum (${MIN_HOURS_WEEK}h/week or $${MIN_WEEKLY_REVENUE}/week)`} style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#FEF3C7', color: '#B45309' }}>
                  ⬇ Below min
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: '#1A2E44', margin: '0 0 2px' }}>
              {lead.client_name || lead.full_name}
            </h1>
            <div style={{ fontSize: 12.5, color: '#8FA0B0' }}>
              {lead.client_name ? `Enquired by ${lead.full_name} · ` : ''}Added {fmtStamp(lead.created_at)}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#457B9D', textDecoration: 'none', fontWeight: 600 }}>
                  <Phone size={13}/> {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#457B9D', textDecoration: 'none', fontWeight: 600 }}>
                  <Mail size={13}/> {lead.email}
                </a>
              )}
            </div>
          </div>

          {/* Two primary buttons + More */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'flex-start', position: 'relative' }}>
            <button onClick={openEmailComposer} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Send size={13}/> Send Email
            </button>
            <button onClick={() => setLogOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#457B9D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <MessageSquare size={13}/> Log Activity
            </button>
            <button onClick={() => setEditing(!editing)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: editing ? '#E63946' : '#EFF2F5', color: editing ? '#fff' : '#4A6070', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {editing ? <><X size={13}/> Cancel</> : <><Edit3 size={13}/> Edit</>}
            </button>
            {editing && (
              <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                <Save size={13}/> {saving ? 'Saving…' : 'Save'}
              </button>
            )}
            {!editing && (
              <>
                <button onClick={() => setMoreOpen(o => !o)} title="More actions" style={{ display: 'flex', alignItems: 'center', padding: '9px 11px', background: '#F8FAFB', color: '#4A6070', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer' }}>
                  <MoreHorizontal size={16}/>
                </button>
                {moreOpen && (
                  <>
                    {/* click-away layer */}
                    <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}/>
                    <div style={{ position: 'absolute', top: 42, right: 0, zIndex: 50, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 230, overflow: 'hidden' }}>
                      <button onClick={handleSyncToCarematch} disabled={syncing} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: '#7E22CE', cursor: 'pointer' }}>
                        {syncing ? '⏳ Syncing…' : '🔗 Send to CareMatch360'}
                      </button>
                      {isAdmin && !isArchived && (
                        <button onClick={handleArchive} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', background: 'none', border: 'none', borderTop: '1px solid #EFF2F5', fontSize: 13, fontWeight: 600, color: '#92400E', cursor: 'pointer' }}>
                          📦 Archive lead
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={handleDelete} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', background: 'none', border: 'none', borderTop: '1px solid #EFF2F5', fontSize: 13, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}>
                          🗑️ Delete permanently
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* CareMatch360 sync status banner */}
        {(lastSyncedAt || syncError) && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8, fontSize: 12.5,
            background: syncError ? '#FEF2F2' : '#FAF5FF',
            color:      syncError ? '#DC2626' : '#7E22CE',
            border:     `1px solid ${syncError ? '#FECACA' : '#E9D5FF'}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {syncError
              ? <><span>⚠️</span> CareMatch360 sync failed: {syncError}</>
              : <><span>✓</span> Sent to CareMatch360 at {new Date(lastSyncedAt!).toLocaleTimeString()}. A draft case is now available for pre-matching.</>
            }
          </div>
        )}

        {/* Journey: stage stepper (open leads only) */}
        {isOpen && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Journey Stage</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {stages.map(s => {
                const isCurrent = lead.stage === s.key
                return (
                  <button key={s.key} onClick={() => !isCurrent && handleStageChange(s.key)} disabled={saving}
                    style={{ padding: '6px 12px', borderRadius: 20, border: `2px solid ${isCurrent ? s.color : '#E2E8F0'}`, background: isCurrent ? s.bg_color : '#fff', color: isCurrent ? s.color : '#8FA0B0', fontSize: 12, fontWeight: isCurrent ? 800 : 500, cursor: isCurrent ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Outcome: status controls */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Status</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {LEAD_STATUSES.map(s => {
              const isCurrent = lead.status === s.key
              return (
                <button key={s.key} onClick={() => !isCurrent && handleStatusChange(s.key)} disabled={saving}
                  style={{ padding: '6px 12px', borderRadius: 20, border: `2px solid ${isCurrent ? s.color : '#E2E8F0'}`, background: isCurrent ? s.bg : '#fff', color: isCurrent ? s.color : '#8FA0B0', fontSize: 12, fontWeight: isCurrent ? 800 : 500, cursor: isCurrent ? 'default' : 'pointer' }}>
                  {s.label}
                </button>
              )
            })}
            {lead.status === 'standby' && lead.standby_until && (
              <span style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                ⏸ until {fmtDate(lead.standby_until)}{lead.standby_reason ? ` — ${lead.standby_reason}` : ''}
              </span>
            )}
            {lead.status === 'lost' && lead.lost_reason_code && (
              <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                {lostReasonLabel(lead.lost_reason_code)}
              </span>
            )}
          </div>
        </div>

        {/* Standby prompt */}
        {statusPrompt === 'standby' && (
          <div style={{ marginTop: 14, background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E', marginBottom: 10 }}>⏸ Put this lead on Standby</div>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 10, alignItems: 'end' }}>
              <div>
                <label style={lbl}>Follow up on <span style={{ color: '#E63946' }}>*</span></label>
                <input type="date" value={standbyForm.standby_until} min={today} onChange={e => setStandbyForm(f => ({ ...f, standby_until: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Why is it paused?</label>
                <input value={standbyForm.standby_reason} onChange={e => setStandbyForm(f => ({ ...f, standby_reason: e.target.value }))} placeholder="e.g. Family deciding after hospital discharge" style={inp}/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={confirmStandby} disabled={saving} style={{ padding: '8px 16px', background: '#92400E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving…' : 'Confirm Standby'}
              </button>
              <button onClick={() => setStatusPrompt(null)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#4A6070', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Lost prompt */}
        {statusPrompt === 'lost' && (
          <div style={{ marginTop: 14, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', marginBottom: 10 }}>Mark this lead as Lost</div>
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 10, alignItems: 'end' }}>
              <div>
                <label style={lbl}>Reason <span style={{ color: '#E63946' }}>*</span></label>
                <select value={lostForm.lost_reason_code} onChange={e => setLostForm(f => ({ ...f, lost_reason_code: e.target.value }))} style={inp}>
                  <option value="">— Select a reason —</option>
                  {LOST_REASONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Explanatory note (optional)</label>
                <input value={lostForm.lost_reason} onChange={e => setLostForm(f => ({ ...f, lost_reason: e.target.value }))} placeholder="Any detail worth remembering" style={inp}/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={confirmLost} disabled={saving} style={{ padding: '8px 16px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving…' : 'Confirm Lost'}
              </button>
              <button onClick={() => setStatusPrompt(null)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#4A6070', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Next Action (Ship 2 behavior, unchanged) */}
        {lead.status === 'ongoing' && (
          <div style={{ marginTop: 14, background: lead.next_action_due ? (lead.next_action_due < today ? '#FEF2F2' : '#F0FDF9') : '#FFFBEB', border: `1px solid ${lead.next_action_due ? (lead.next_action_due < today ? '#FCA5A5' : '#0B6B5C') : '#F59E0B'}`, borderRadius: 10, padding: '12px 16px' }}>
            {!actionEdit ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3 }}>Next Action</div>
                  {lead.next_action_due ? (
                    <div style={{ fontSize: 14, fontWeight: 800, color: lead.next_action_due < today ? '#DC2626' : '#0B6B5C' }}>
                      {lead.next_action_due < today ? '⚠️ ' : ''}{nextActionLabel(lead.next_action_type)} · {fmtDate(lead.next_action_due)}
                      {lead.next_action_note && <span style={{ fontSize: 12, fontWeight: 500, color: '#4A6070' }}> — {lead.next_action_note}</span>}
                    </div>
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#B45309' }}>🚫 No next action — this lead will be forgotten. Set one now.</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {lead.next_action_due && (
                    <button onClick={openMarkDone} disabled={saving} style={{ padding: '7px 14px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      ✓ Mark Done & Log
                    </button>
                  )}
                  <button onClick={() => { setActionForm({ next_action_type: lead.next_action_type || 'call', next_action_due: lead.next_action_due || '', next_action_note: lead.next_action_note || '' }); setActionEdit(true) }} disabled={saving}
                    style={{ padding: '7px 14px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#4A6070', cursor: 'pointer' }}>
                    {lead.next_action_due ? 'Edit' : '+ Set Next Action'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Set Next Action</div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 160px 1fr', gap: 10, alignItems: 'end' }}>
                  <div>
                    <label style={lbl}>Action <span style={{ color: '#E63946' }}>*</span></label>
                    <select value={actionForm.next_action_type} onChange={e => setActionForm(f => ({ ...f, next_action_type: e.target.value }))} style={inp}>
                      {NEXT_ACTION_TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Due <span style={{ color: '#E63946' }}>*</span></label>
                    <input type="date" value={actionForm.next_action_due} min={today} onChange={e => setActionForm(f => ({ ...f, next_action_due: e.target.value }))} style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>Note</label>
                    <input value={actionForm.next_action_note} onChange={e => setActionForm(f => ({ ...f, next_action_note: e.target.value }))} placeholder="What exactly, and why" style={inp}/>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={saveNextAction} disabled={saving} style={{ padding: '8px 16px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {saving ? 'Saving…' : 'Save Next Action'}
                  </button>
                  <button onClick={() => setActionEdit(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#4A6070', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Intake Milestones: Consent · Assessment (LIVE v0.6.42) · Conversion ── */}
      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Intake Milestones</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

          {/* Consent — interactive */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1A2E44' }}>📄 Consent</span>
              <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: consent.bg, color: consent.color }}>{consent.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {CONSENT_STATUSES.map(c => {
                const isCurrent = (lead.consent_status || 'not_started') === c.key
                return (
                  <button key={c.key} onClick={() => !isCurrent && setConsent(c.key)} disabled={saving || isArchived}
                    style={{ padding: '4px 10px', borderRadius: 16, border: `1.5px solid ${isCurrent ? c.color : '#E2E8F0'}`, background: isCurrent ? c.bg : '#fff', color: isCurrent ? c.color : '#8FA0B0', fontSize: 11, fontWeight: isCurrent ? 800 : 500, cursor: isCurrent || isArchived ? 'default' : 'pointer' }}>
                    {c.label}
                  </button>
                )
              })}
            </div>
            {(lead.consent_status || '') !== 'signed' && !isArchived && (
              <button onClick={openConsentPrepare} disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '7px 14px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Send size={12}/> {latestConsent && (latestConsent.status === 'sent' || latestConsent.status === 'viewed') ? 'Re-send Agreement' : 'Prepare & Send Agreement'}
              </button>
            )}
            {/* v0.6.49: a bounced agreement email means they never got the link. */}
            {latestConsent && latestConsent.status !== 'signed' &&
             (latestConsent.email_status === 'bounced' || latestConsent.email_status === 'complained') && (
              <div style={{ fontSize: 11.5, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 11px', marginTop: 8, fontWeight: 600, lineHeight: 1.5 }}>
                {latestConsent.email_status === 'bounced'
                  ? `The agreement email bounced — ${latestConsent.email_to || 'the recipient'} never got the signing link. Check the address, then re-send.`
                  : `${latestConsent.email_to || 'The recipient'} marked the agreement email as spam — speak to them before re-sending.`}
              </div>
            )}
            {latestConsent && latestConsent.status === 'signed' && (
              <a href={`/api/leads/consent/${latestConsent.id}/document`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '7px 13px',
                  borderRadius: 8, border: '1.5px solid #0B6B5C', background: '#EFF6F4', color: '#0B6B5C',
                  fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                🖨️ View / print signed agreement
              </a>
            )}
            <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 6 }}>
              {latestConsent
                ? latestConsent.status === 'signed'
                  ? `Signed by ${latestConsent.signer_name || 'the client'} on ${fmtStamp(latestConsent.signed_at)}.`
                  : latestConsent.status === 'viewed'
                    ? `Sent ${fmtStamp(latestConsent.created_at)} · viewed by the recipient ${fmtStamp(latestConsent.viewed_at)}. Re-sending replaces the link.`
                    : latestConsent.status === 'sent'
                      ? `Sent ${fmtStamp(latestConsent.created_at)}${latestConsent.email_status === 'delivered' ? ' · delivered' : ''} — not opened yet. Re-sending replaces the link.`
                      : 'The previous link was replaced.'
                : 'Sends the Service Agreement for e-signature — the milestone advances by itself as the client opens and signs.'}
            </div>
          </div>

          {/* Assessment — LIVE (v0.6.42) */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1A2E44' }}>📋 Assessment</span>
              <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: asmtBadge.bg, color: asmtBadge.color }}>{asmtBadge.label}</span>
            </div>
            {asmtLocal ? (
              <div style={{ fontSize: 12.5, color: '#1A2E44', fontWeight: 600, marginBottom: 4 }}>
                {asmtIsCompleted
                  ? <>Completed {fmtDate(asmtLocal.completed_date)}{asmtLocal.nurse_name ? ` · ${asmtLocal.nurse_name}` : ''}</>
                  : <>{asmtIsOverdue ? '⚠️ ' : ''}{fmtDate(asmtLocal.scheduled_date)}{asmtLocal.nurse_name ? ` · ${asmtLocal.nurse_name}` : ''}{asmtLocal.is_initial ? ' · Initial' : ''}</>
                }
              </div>
            ) : acLocal ? (
              <div style={{ fontSize: 12, color: '#8FA0B0', marginBottom: 4 }}>Linked to client record — no assessment on the books yet.</div>
            ) : (
              <div style={{ fontSize: 12, color: '#8FA0B0', marginBottom: 4 }}>Schedule a nurse assessment — the client record is created or linked in the same step.</div>
            )}
            {clientDischarged && (
              <div style={{ fontSize: 11, color: '#B45309', marginBottom: 4 }}>⚠️ The linked client record is discharged.</div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {!asmtIsOpen && !clientDischarged && (
                <button onClick={openSchedModal} disabled={saving || isArchived}
                  style={{ padding: '6px 12px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: saving || isArchived ? 'default' : 'pointer', opacity: isArchived ? 0.5 : 1 }}>
                  📋 {asmtLocal ? 'Schedule Next Assessment' : 'Schedule Assessment'}
                </button>
              )}
              {!acLocal && !isArchived && linkableClients.length > 0 && (
                <button onClick={() => { setLinkError(null); setLinkClientId(''); setLinkOpen(true) }} disabled={saving}
                  style={{ padding: '6px 12px', background: '#fff', color: '#457B9D', border: '1.5px solid #457B9D', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                  🔗 Link client record
                </button>
              )}
              {acLocal && (
                <Link href={`/assessments/clients/${acLocal.id}`} style={{ fontSize: 12, fontWeight: 700, color: '#457B9D', textDecoration: 'none' }}>
                  View in Assessments →
                </Link>
              )}
            </div>
            {!acLocal && !isArchived && linkableClients.length > 0 && (
              <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 6, lineHeight: 1.5 }}>
                Care already started? Link the existing client record without booking anything.
              </div>
            )}
          </div>

          {/* Conversion — LIVE (v0.6.43) */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1A2E44' }}>🎯 Conversion</span>
              {lead.status === 'won' ? (
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#A7F3D0', color: '#065F46' }}>Converted</span>
              ) : (
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: readyCount === readiness.length ? '#A7F3D0' : '#EFF2F5', color: readyCount === readiness.length ? '#065F46' : '#8FA0B0' }}>
                  {readyCount}/{readiness.length} ready
                </span>
              )}
            </div>
            {lead.status === 'won' ? (
              <>
                <div style={{ fontSize: 12.5, color: '#065F46', fontWeight: 600, marginBottom: 6 }}>
                  ✓ Converted{lead.won_date ? ` on ${fmtDate(lead.won_date)}` : ''}
                </div>
                {acLocal && (
                  <Link href={`/assessments/clients/${acLocal.id}`} style={{ fontSize: 12, fontWeight: 700, color: '#457B9D', textDecoration: 'none' }}>
                    Client record: {acLocal.full_name} →
                  </Link>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                  {readiness.map(r => (
                    <div key={r.label} style={{ fontSize: 12, color: r.ok ? '#065F46' : '#8FA0B0' }}>
                      {r.ok ? '✓' : '○'} {r.label}
                    </div>
                  ))}
                </div>
                <button onClick={() => { setConvForm({ payer_type: '', override_reason: '' }); setConvOpen(true) }} disabled={saving || isArchived}
                  style={{ padding: '6px 12px', background: readyCount === readiness.length ? '#0B6B5C' : '#fff', color: readyCount === readiness.length ? '#fff' : '#B45309', border: readyCount === readiness.length ? 'none' : '1.5px solid #F59E0B', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: saving || isArchived ? 'default' : 'pointer', opacity: isArchived ? 0.5 : 1 }}>
                  🎯 {readyCount === readiness.length ? 'Convert to Client' : 'Convert with Override…'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Body: timeline + rail (wraps on narrow screens) ── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* LEFT — Timeline */}
        <div style={{ ...card, flex: 2, minWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1A2E44', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={15} color="#8FA0B0"/> Timeline
              <span style={{ fontSize: 12, fontWeight: 500, color: '#8FA0B0' }}>({visibleActivities.length})</span>
            </h3>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {TIMELINE_FILTERS.map(f => (
                <button key={f.key} onClick={() => setTimelineFilter(f.key)}
                  style={{ padding: '4px 10px', borderRadius: 16, border: `1.5px solid ${timelineFilter === f.key ? '#457B9D' : '#E2E8F0'}`, background: timelineFilter === f.key ? '#EBF4FF' : '#fff', color: timelineFilter === f.key ? '#457B9D' : '#8FA0B0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {visibleActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#CBD5E0', fontSize: 13 }}>
              Nothing here{timelineFilter !== 'all' ? ' under this filter' : ' yet'}.<br/>
              <button onClick={() => setLogOpen(true)} style={{ marginTop: 10, background: 'none', border: 'none', color: '#0B6B5C', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Log an activity →
              </button>
            </div>
          ) : (
            <div>
              {dayGroups.map(group => (
                <div key={group.label + group.items[0].id}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '8px 0 10px', borderBottom: '1px solid #EFF2F5', marginBottom: 12 }}>
                    {group.label}
                  </div>
                  {group.items.map(a => {
                    const isStatusChange = a.activity_type === 'status_change'
                    if (isStatusChange) {
                      // Slim one-liner: changes are context, not content.
                      return (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0 12px', fontSize: 12, color: '#8FA0B0' }}>
                          <span>🔄</span>
                          <span style={{ color: '#4A6070' }}>{a.content}</span>
                          <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap', fontSize: 11, color: '#CBD5E0' }}>{fmtTime(a.created_at)} · {getName(a.author) || '—'}</span>
                        </div>
                      )
                    }
                    return (
                      <div key={a.id} style={{ display: 'flex', gap: 12, paddingBottom: 16 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                          {actIcon(a.activity_type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#1A2E44' }}>
                                {ACTIVITY_TYPES.find(t => t.key === a.activity_type)?.label || a.activity_type}
                              </span>
                              {a.activity_type === 'email' && (() => {
                                const b = emailBadgeFor(a.id)
                                return b ? (
                                  <span title={b.title} style={{ fontSize: 10, fontWeight: 800, color: b.color, background: b.bg, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.4px', cursor: 'default' }}>{b.label}</span>
                                ) : null
                              })()}
                              {a.outcome && (
                                <span style={{ fontSize: 11, color: '#8FA0B0' }}>
                                  {OUTCOMES.find(o => o.key === a.outcome)?.label || a.outcome}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: 11, color: '#CBD5E0', whiteSpace: 'nowrap' }}>{fmtTime(a.created_at)}</span>
                          </div>
                          <p style={{ fontSize: 13, color: '#4A6070', margin: '0 0 4px', lineHeight: 1.6, overflowWrap: 'break-word' }}>{a.content}</p>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            {a.next_follow_up && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: a.next_follow_up < today ? '#DC2626' : '#457B9D' }}>
                                {a.next_follow_up < today ? '⚠️' : '📅'} Follow up: {fmtDate(a.next_follow_up)}
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: '#CBD5E0' }}>by {getName(a.author) || 'Unknown'}</span>
                            <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                              <button onClick={() => openEditActivity(a)} style={{ padding: '3px 8px', background: '#EFF2F5', border: 'none', borderRadius: 5, fontSize: 11, color: '#4A6070', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                              <button onClick={() => handleDeleteActivity(a.id)} disabled={deletingActivityId === a.id} style={{ padding: '3px 8px', background: '#FEE2E2', border: 'none', borderRadius: 5, fontSize: 11, color: '#DC2626', cursor: 'pointer', fontWeight: 600 }}>
                                {deletingActivityId === a.id ? '…' : 'Delete'}
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Rail: three cards */}
        <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {editing ? (
            /* Edit form takes over the rail while editing */
            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Edit Lead</div>
              <div><label style={lbl}>Full Name</label><input value={editForm.full_name} onChange={e => setE('full_name', e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Client Name</label><input value={editForm.client_name || ''} onChange={e => setE('client_name', e.target.value)} style={inp}/></div>
              <div>
                <label style={lbl}>Relationship to Client</label>
                <select value={editForm.relationship || ''} onChange={e => setE('relationship', e.target.value)} style={inp}>
                  <option value="">— Not set —</option>
                  {RELATIONSHIPS.map(r => <option key={r} value={r.toLowerCase().replace(/ /g, '_')}>{r}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Phone</label><input value={editForm.phone || ''} onChange={e => setE('phone', e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Email</label><input type="email" value={editForm.email || ''} onChange={e => setE('email', e.target.value)} style={inp}/></div>
              <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px dashed #E2E8F0', fontSize: 11, fontWeight: 700, color: '#0B6B5C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Client Home Address & DOB
              </div>
              <div><label style={lbl}>Street Address</label><input value={editForm.address || ''} onChange={e => setE('address', e.target.value)} placeholder="123 Main St" style={inp}/></div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>City</label><input value={editForm.city || ''} onChange={e => setE('city', e.target.value)} placeholder="Silver Spring" style={inp}/></div>
                <div><label style={lbl}>State</label><input value={editForm.state || ''} onChange={e => setE('state', e.target.value)} placeholder="MD" maxLength={2} style={inp}/></div>
                <div><label style={lbl}>ZIP</label><input value={editForm.zip || ''} onChange={e => setE('zip', e.target.value)} placeholder="20910" maxLength={10} style={inp}/></div>
              </div>
              <div><label style={lbl}>Date of Birth</label><input type="date" value={editForm.date_of_birth || ''} onChange={e => setE('date_of_birth', e.target.value)} style={{ ...inp, maxWidth: 220 }}/></div>
              <div style={{ paddingBottom: 4, borderBottom: '1px dashed #E2E8F0' }} />
              <div>
                <label style={lbl}>Lead Source</label>
                <select value={editForm.source} onChange={e => setE('source', e.target.value)} style={inp}>
                  {SOURCES.map(s => <option key={s.key} value={s.key}>{s.icon} {s.label}</option>)}
                </select>
              </div>
              {editForm.source === 'referral' && (
                <div><label style={lbl}>Referred By (free text)</label><input value={editForm.referral_name || ''} onChange={e => setE('referral_name', e.target.value)} placeholder="Referrer name / organisation" style={inp}/></div>
              )}
              {referralSources.length > 0 && (
                <div>
                  <label style={lbl}>Link to Referral Source</label>
                  <select value={editForm.referral_source_id || ''} onChange={e => setE('referral_source_id', e.target.value || null)} style={inp}>
                    <option value="">— None —</option>
                    {referralSources.map(rs => <option key={rs.id} value={rs.id}>{rs.name}{rs.organization ? ` · ${rs.organization}` : ''}</option>)}
                  </select>
                </div>
              )}
              <div style={{ paddingBottom: 4, borderBottom: '1px dashed #E2E8F0' }} />
              <div>
                <label style={lbl}>Care Types</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ACTIVE_CARE_TYPES.map((ct: string) => {
                    const active = (editForm.care_types || []).includes(ct)
                    return (
                      <button key={ct} type="button"
                        onClick={() => setE('care_types', active ? (editForm.care_types || []).filter((x: string) => x !== ct) : [...(editForm.care_types || []), ct])}
                        style={{ padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${active ? '#0B6B5C' : '#D1D9E0'}`, background: active ? '#D1FAE5' : '#fff', color: active ? '#0B6B5C' : '#4A6070', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        {ct}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Hours / Week</label><input type="number" value={editForm.estimated_hours_week} onChange={e => setE('estimated_hours_week', e.target.value)} style={inp} min="0" step="0.5"/></div>
                <div><label style={lbl}>Hourly Rate ($)</label><input type="number" value={editForm.hourly_rate} onChange={e => setE('hourly_rate', e.target.value)} style={inp} min="0" step="0.25"/></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Target Close Date</label><input type="date" value={editForm.expected_close_date || ''} onChange={e => setE('expected_close_date', e.target.value)} style={inp}/></div>
                <div><label style={lbl}>Start Date</label><input type="date" value={editForm.expected_start_date || ''} onChange={e => setE('expected_start_date', e.target.value)} style={inp}/></div>
              </div>
              <div>
                <label style={lbl}>Probability of Closing</label>
                <select value={editForm.close_probability} onChange={e => setE('close_probability', e.target.value)} style={inp}>
                  <option value="">— Not rated —</option>
                  {PROBABILITY_OPTIONS.map(p => <option key={p} value={String(p)}>{p}%</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Primary Owner</label>
                <select value={editForm.assigned_to || ''} onChange={e => setE('assigned_to', e.target.value)} style={inp}>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Secondary Owner</label>
                <select value={editForm.secondary_assigned_to || ''} onChange={e => setE('secondary_assigned_to', e.target.value)} style={inp}>
                  <option value="">— None —</option>
                  {staff.filter(s => s.id !== editForm.assigned_to).map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              {lead.status === 'standby' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={lbl}>Standby Until</label><input type="date" value={editForm.standby_until || ''} onChange={e => setE('standby_until', e.target.value)} style={inp}/></div>
                  <div><label style={lbl}>Standby Reason</label><input value={editForm.standby_reason || ''} onChange={e => setE('standby_reason', e.target.value)} style={inp}/></div>
                </div>
              )}
              {lead.status === 'lost' && (
                <>
                  <div>
                    <label style={lbl}>Lost Reason</label>
                    <select value={editForm.lost_reason_code || ''} onChange={e => setE('lost_reason_code', e.target.value)} style={inp}>
                      <option value="">— Select a reason —</option>
                      {LOST_REASONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Lost Reason Note</label><input value={editForm.lost_reason || ''} onChange={e => setE('lost_reason', e.target.value)} style={inp}/></div>
                </>
              )}
              <div><label style={lbl}>Condition / Situation Notes</label><textarea value={editForm.condition_notes || ''} onChange={e => setE('condition_notes', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }}/></div>
              <div><label style={lbl}>Preferred Schedule</label><input value={editForm.preferred_schedule || ''} onChange={e => setE('preferred_schedule', e.target.value)} placeholder="e.g. Mon–Fri 8am–2pm" style={inp}/></div>
              <div><label style={lbl}>Notes</label><textarea value={editForm.notes || ''} onChange={e => setE('notes', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }}/></div>
            </div>
          ) : (
            <>
              {/* Card 1 — The Numbers */}
              <div style={card}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>The Numbers</div>
                {rev ? (
                  <>
                    <div style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {[{ label: 'Weekly', val: rev.weekly }, { label: 'Monthly', val: rev.monthly }, { label: 'Annual', val: rev.annual }].map(x => (
                          <div key={x.label}>
                            <div style={{ fontSize: 10, color: '#065F46', fontWeight: 600 }}>{x.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#064E3B' }}>{fmtMoney(x.val)}</div>
                          </div>
                        ))}
                      </div>
                      {isOpen && (
                        <div style={{ marginTop: 6, fontSize: 11, color: '#065F46' }}>
                          Weighted: <strong>{fmtMoney(rev.monthly * effectiveProbability(lead.close_probability) / 100)}/mo</strong> at {effectiveProbability(lead.close_probability)}%{lead.close_probability == null ? ' (default)' : ''}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: '#8FA0B0', marginBottom: 10 }}>No hours/rate captured.</div>
                )}
                {[
                  { label: 'Hours / Week', value: lead.estimated_hours_week ? `${lead.estimated_hours_week} hrs${isBelowFloor(lead.estimated_hours_week, lead.hourly_rate) ? ' ⬇' : ''}` : '—' },
                  { label: 'Hourly Rate', value: lead.hourly_rate ? `$${lead.hourly_rate}/hr` : '—' },
                  { label: 'Probability', value: lead.close_probability != null ? `${lead.close_probability}%` : '—' },
                  { label: 'Target Close', value: fmtDate(lead.expected_close_date) },
                  { label: 'Expected Start', value: fmtDate(lead.expected_start_date) },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0', borderBottom: '1px solid #F8FAFB' }}>
                    <span style={{ fontSize: 12, color: '#8FA0B0' }}>{row.label}</span>
                    <span style={{ fontSize: 12.5, color: '#1A2E44', fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
                {lead.won_date && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0' }}>
                    <span style={{ fontSize: 12, color: '#8FA0B0' }}>Won On</span>
                    <span style={{ fontSize: 12.5, color: '#065F46', fontWeight: 700 }}>{fmtDate(lead.won_date)}</span>
                  </div>
                )}
                {lead.status === 'lost' && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#DC2626' }}>
                    Lost {fmtDate(lead.lost_date)}{lead.lost_reason_code ? ` — ${lostReasonLabel(lead.lost_reason_code)}` : ''}
                    {lead.lost_reason && <div style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>{lead.lost_reason}</div>}
                  </div>
                )}
              </div>

              {/* Card 2 — The People */}
              <div style={card}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>The People</div>
                {[
                  { label: 'Primary Owner', value: getName(lead.assignee) || '—' },
                  { label: 'Secondary Owner', value: getName(lead.secondary) || '—' },
                  { label: 'Source', value: prettyKey(lead.source) + (lead.referral_name ? ` — ${lead.referral_name}` : '') },
                  { label: 'Relationship', value: lead.relationship ? prettyKey(lead.relationship) : '—' },
                  { label: 'Created By', value: getName(lead.creator) || '—' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0', borderBottom: '1px solid #F8FAFB' }}>
                    <span style={{ fontSize: 12, color: '#8FA0B0', flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: 12.5, color: '#1A2E44', fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Card 3 — The Details */}
              <div style={card}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>The Details</div>
                {(() => {
                  const addrLine = [lead.address, [lead.city, lead.state].filter(Boolean).join(', '), lead.zip].filter(Boolean).join(' · ')
                  let ageStr = '—'
                  if (lead.date_of_birth) {
                    const dob = new Date(lead.date_of_birth)
                    if (!isNaN(dob.getTime())) {
                      const now = new Date()
                      let age = now.getFullYear() - dob.getFullYear()
                      const m = now.getMonth() - dob.getMonth()
                      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
                      ageStr = `${age} yrs (${dob.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
                    }
                  }
                  return (
                    <>
                      {[
                        { label: 'Home Address', value: addrLine || '—' },
                        { label: 'Date of Birth', value: ageStr },
                        { label: 'Care Types', value: (lead.care_types || []).join(', ') || '—' },
                        { label: 'Schedule', value: lead.preferred_schedule || '—' },
                      ].map(row => (
                        <div key={row.label} style={{ padding: '5px 0', borderBottom: '1px solid #F8FAFB' }}>
                          <div style={{ fontSize: 11, color: '#8FA0B0' }}>{row.label}</div>
                          <div style={{ fontSize: 12.5, color: '#1A2E44', fontWeight: 600 }}>{row.value}</div>
                        </div>
                      ))}
                      {lead.condition_notes && (
                        <div style={{ padding: '5px 0', borderBottom: '1px solid #F8FAFB' }}>
                          <div style={{ fontSize: 11, color: '#8FA0B0' }}>Situation Notes</div>
                          <div style={{ fontSize: 12.5, color: '#1A2E44', lineHeight: 1.5 }}>{lead.condition_notes}</div>
                        </div>
                      )}
                      {lead.notes && (
                        <div style={{ padding: '5px 0' }}>
                          <div style={{ fontSize: 11, color: '#8FA0B0' }}>General Notes</div>
                          <div style={{ fontSize: 12.5, color: '#1A2E44', lineHeight: 1.5 }}>{lead.notes}</div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Link client record modal (v0.6.50, Ship 5d) ── */}
      {linkOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,46,68,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Link an existing client record</h3>
              <button onClick={() => setLinkOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}><X size={18}/></button>
            </div>
            <div style={{ fontSize: 12, color: '#4A6070', background: '#EBF4FF', border: '1px solid #C7DCF0', borderRadius: 8, padding: '9px 12px', marginBottom: 14, lineHeight: 1.55 }}>
              This only connects <strong>{lead.client_name || lead.full_name}</strong> to an existing client record. It does not schedule an assessment, assign a nurse, or send anyone an email — use it when care is already underway.
            </div>
            {linkError && (
              <div style={{ fontSize: 12.5, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '9px 12px', marginBottom: 12, fontWeight: 600 }}>{linkError}</div>
            )}
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Client record</label>
            <select value={linkClientId} onChange={e => setLinkClientId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', background: '#fff' }}>
              <option value="">— Choose an existing client record —</option>
              {linkableClients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => setLinkOpen(false)} style={{ padding: '9px 16px', background: '#EFF2F5', color: '#4A6070', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleLinkClient} disabled={linkSaving || !linkClientId}
                style={{ padding: '9px 18px', background: '#457B9D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: linkSaving ? 'wait' : 'pointer', opacity: linkSaving || !linkClientId ? 0.6 : 1 }}>
                {linkSaving ? 'Linking…' : 'Link record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Prepare & Send Agreement Modal (v0.6.46) ── */}
      {consentOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,46,68,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Prepare &amp; Send the Service Agreement</h3>
              <button onClick={() => setConsentOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}><X size={18}/></button>
            </div>
            <div style={{ fontSize: 12, color: '#4A6070', background: '#EFF6F4', border: '1px solid #D1E7E2', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
              Fill in what you know — anything you leave blank, the client completes on the signing page, and their answers print on the agreement. You sign for Vitalis as <strong>{currentUserName}</strong> when this sends, so the client opens an already-executed document.{latestConsent && (latestConsent.status === 'sent' || latestConsent.status === 'viewed') ? ' Sending again replaces the previous link — the old one stops working.' : ''}
            </div>
            {consentError && (
              <div style={{ fontSize: 12.5, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '9px 12px', marginBottom: 12, fontWeight: 600 }}>{consentError}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Send to (email)</label>
                <input type="email" value={consentForm.to} onChange={e => setConsentForm(f => ({ ...f, to: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Client name (on the agreement)</label>
                <input value={consentForm.client_name} onChange={e => setConsentForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Leave blank if you don’t have it"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Date of birth</label>
                <input type="date" value={consentForm.dob} onChange={e => setConsentForm(f => ({ ...f, dob: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Address</label>
                <input value={consentForm.address} onChange={e => setConsentForm(f => ({ ...f, address: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>City</label>
                <input value={consentForm.city} onChange={e => setConsentForm(f => ({ ...f, city: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>State</label>
                  <input value={consentForm.state} onChange={e => setConsentForm(f => ({ ...f, state: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Zip</label>
                  <input value={consentForm.zip} onChange={e => setConsentForm(f => ({ ...f, zip: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Start of care date</label>
                <input type="date" value={consentForm.start_of_care} onChange={e => setConsentForm(f => ({ ...f, start_of_care: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>LTC insurer (optional)</label>
                  <input value={consentForm.ltc_insurer} onChange={e => setConsentForm(f => ({ ...f, ltc_insurer: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Claim # (optional)</label>
                  <input value={consentForm.ltc_claim} onChange={e => setConsentForm(f => ({ ...f, ltc_claim: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Billed as</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[{ k: 'medicaid_waiver', l: 'Medicaid Waiver' }, { k: 'insurance', l: 'Insurance' }, { k: 'private_pay', l: 'Private Pay' }].map(b => (
                  <button key={b.k} type="button" onClick={() => setConsentForm(f => ({ ...f, billing_method: b.k }))}
                    style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${consentForm.billing_method === b.k ? '#0B6B5C' : '#E2E8F0'}`, background: consentForm.billing_method === b.k ? '#EFF6F4' : '#fff', color: consentForm.billing_method === b.k ? '#0B6B5C' : '#4A6070', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {b.l}
                  </button>
                ))}
              </div>
              {consentForm.billing_method === 'private_pay' && (
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Agreed rate (prints on the agreement)</label>
                  <input value={consentForm.private_pay_rate} onChange={e => setConsentForm(f => ({ ...f, private_pay_rate: e.target.value }))} placeholder="e.g., $34.00/hour"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
                </div>
              )}
              {consentForm.billing_method === 'insurance' && (
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Projected coverage, if known (optional)</label>
                  <input value={consentForm.insurance_projected} onChange={e => setConsentForm(f => ({ ...f, insurance_projected: e.target.value }))} placeholder="e.g., 80% of charges after deductible met"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConsentOpen(false)} style={{ padding: '9px 16px', background: '#EFF2F5', color: '#4A6070', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSendConsent} disabled={consentSending || !consentForm.to || (consentForm.billing_method === 'private_pay' && !consentForm.private_pay_rate.trim())}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: consentSending ? 'wait' : 'pointer', opacity: consentSending || !consentForm.to || (consentForm.billing_method === 'private_pay' && !consentForm.private_pay_rate.trim()) ? 0.6 : 1 }}>
                <Send size={13}/> {consentSending ? 'Sending…' : 'Sign & Send Agreement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Email Modal (v0.6.45) ── */}
      {emailOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,46,68,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Send Email</h3>
              <button onClick={() => setEmailOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}><X size={18}/></button>
            </div>
            <div style={{ fontSize: 12, color: '#4A6070', background: '#EFF6F4', border: '1px solid #D1E7E2', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
              Sends as <strong>{currentUserName}</strong> ({currentUserEmail}). Replies go to you and team@vitalishealthcare.com; team@ is BCC'd. Replies land in your inbox — they do not appear on this timeline.
            </div>
            {emailError && (
              <div style={{ fontSize: 12.5, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '9px 12px', marginBottom: 12, fontWeight: 600 }}>
                {emailError}
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Template</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {LEAD_EMAIL_TEMPLATES.map(t => (
                  <button key={t.key} type="button" onClick={() => applyTemplate(t.key)}
                    style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${emailForm.template_key === t.key ? '#0B6B5C' : '#E2E8F0'}`, background: emailForm.template_key === t.key ? '#EFF6F4' : '#fff', color: emailForm.template_key === t.key ? '#0B6B5C' : '#4A6070', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 5 }}>Picking a template replaces the subject and message below. The Service Agreement is sent from the Consent milestone above, not from here.</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>To</label>
              <input type="email" value={emailForm.to} onChange={e => setEmailForm(f => ({ ...f, to: e.target.value }))} placeholder="recipient@example.com"
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Subject</label>
              <input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}/>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Message</label>
              <textarea value={emailForm.body} onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))} rows={12} placeholder="Pick a template above, or write your own message. It sends in the Vitalis letterhead with your signature added automatically."
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, lineHeight: 1.55, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}/>
              <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 5 }}>Sends in the Vitalis letterhead. Your signature block ("Warm regards, {currentUserName}") is added automatically — no need to type it.</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Follow up on (optional — becomes this lead's next action)</label>
              <input type="date" value={emailForm.follow_up} onChange={e => setEmailForm(f => ({ ...f, follow_up: e.target.value }))}
                style={{ padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13 }}/>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEmailOpen(false)} style={{ padding: '9px 16px', background: '#EFF2F5', color: '#4A6070', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSendEmail} disabled={emailSending || !emailForm.to || !emailForm.subject.trim() || !emailForm.body.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: emailSending ? 'wait' : 'pointer', opacity: emailSending || !emailForm.to || !emailForm.subject.trim() || !emailForm.body.trim() ? 0.6 : 1 }}>
                <Send size={13}/> {emailSending ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Activity Modal ── */}
      {logOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setLogOpen(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>{editingActivity ? 'Edit Activity' : markDone ? 'Mark Done & Log' : 'Log Activity'}</h3>
              <button onClick={() => { setLogOpen(false); setMarkDone(false); setEditingActivity(null); setActForm({ activity_type: 'call', content: '', outcome: '', next_follow_up: '' }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}><X size={18}/></button>
            </div>
            <form onSubmit={editingActivity ? handleEditActivity : handleLogActivity} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Activity Type</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {ACTIVITY_TYPES.map(t => (
                    <button key={t.key} type="button" onClick={() => setA('activity_type', t.key)}
                      style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${actForm.activity_type === t.key ? '#457B9D' : '#E2E8F0'}`, background: actForm.activity_type === t.key ? '#EBF4FF' : '#fff', color: actForm.activity_type === t.key ? '#457B9D' : '#4A6070', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Notes / Summary <span style={{ color: '#E63946' }}>*</span></label>
                <textarea value={actForm.content} onChange={e => setA('content', e.target.value)} required rows={4} placeholder="What happened? Key points from the conversation…" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}/>
              </div>
              <div>
                <label style={lbl}>Outcome</label>
                <select value={actForm.outcome} onChange={e => setA('outcome', e.target.value)} style={inp}>
                  <option value="">— Select outcome —</option>
                  {OUTCOMES.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Next Follow-Up Date {markDone && lead.status === 'ongoing' ? <span style={{ color: '#E63946' }}>*</span> : null}</label>
                <input type="date" value={actForm.next_follow_up} onChange={e => setA('next_follow_up', e.target.value)} min={today} required={markDone && lead.status === 'ongoing'} style={inp}/>
                {markDone && lead.status === 'ongoing' && (
                  <div style={{ fontSize: 11, color: '#92400E', marginTop: 4 }}>
                    Completing an action means scheduling the next one — or close/pause the lead through the Status buttons instead.
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '11px', background: '#457B9D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editingActivity ? '💾 Save Changes' : '📝 Log Activity'}
                </button>
                <button type="button" onClick={() => { setLogOpen(false); setMarkDone(false); setEditingActivity(null); setActForm({ activity_type: 'call', content: '', outcome: '', next_follow_up: '' }) }} style={{ padding: '11px 18px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#4A6070' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Schedule Assessment Modal (v0.6.42) ── */}
      {schedOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setSchedOpen(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>📋 Schedule Assessment</h3>
              <button onClick={() => setSchedOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}><X size={18}/></button>
            </div>
            <form onSubmit={handleScheduleAssessment} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Client record */}
              <div>
                <label style={lbl}>Client Record</label>
                {acLocal ? (
                  <div style={{ fontSize: 13, color: '#1A2E44', fontWeight: 600, padding: '8px 11px', background: '#F0FDF9', border: '1.5px solid #0B6B5C', borderRadius: 7 }}>
                    ✓ Linked: {acLocal.full_name}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <button type="button" onClick={() => setS('mode', 'create')}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${schedForm.mode === 'create' ? '#0B6B5C' : '#E2E8F0'}`, background: schedForm.mode === 'create' ? '#D1FAE5' : '#fff', color: schedForm.mode === 'create' ? '#0B6B5C' : '#8FA0B0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Create new client
                      </button>
                      <button type="button" onClick={() => setS('mode', 'link')}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${schedForm.mode === 'link' ? '#457B9D' : '#E2E8F0'}`, background: schedForm.mode === 'link' ? '#EBF4FF' : '#fff', color: schedForm.mode === 'link' ? '#457B9D' : '#8FA0B0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Link existing client
                      </button>
                    </div>
                    {schedForm.mode === 'create' ? (
                      <div style={{ fontSize: 12, color: '#4A6070', lineHeight: 1.5 }}>
                        A client record will be created for <strong>{lead.client_name || lead.full_name}</strong>. Address, phone, and date of birth copy over from this lead automatically — no re-entry.
                      </div>
                    ) : (
                      <select value={schedForm.existing_client_id} onChange={e => setS('existing_client_id', e.target.value)} style={inp}>
                        <option value="">— Choose an existing client record —</option>
                        {linkableClients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                      </select>
                    )}
                  </>
                )}
              </div>

              {/* Nurse */}
              <div>
                <label style={lbl}>Assigned Nurse <span style={{ color: '#E63946' }}>*</span></label>
                <select value={schedForm.nurse_id} onChange={e => setS('nurse_id', e.target.value)} style={inp}>
                  <option value="">— Choose a nurse —</option>
                  {nurses.map(n => <option key={n.id} value={n.id}>{n.full_name}</option>)}
                </select>
                <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 4 }}>The nurse receives the standard assignment email.</div>
              </div>

              {/* Date + cadence */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>First Due Date <span style={{ color: '#E63946' }}>*</span></label>
                  <input type="date" value={schedForm.first_due_date} min={today} onChange={e => setS('first_due_date', e.target.value)} style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Cadence</label>
                  <select value={schedForm.cadence_days} onChange={e => setS('cadence_days', e.target.value)} style={inp}>
                    {CADENCE_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Initial flag */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1A2E44', cursor: 'pointer' }}>
                <input type="checkbox" checked={schedForm.is_initial} onChange={e => setS('is_initial', e.target.checked)}/>
                This is the initial assessment
              </label>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '11px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Scheduling…' : '📋 Schedule Assessment'}
                </button>
                <button type="button" onClick={() => setSchedOpen(false)} style={{ padding: '11px 18px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#4A6070' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Convert to Client Modal (v0.6.43) ── */}
      {convOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setConvOpen(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>🎯 Convert to Client</h3>
              <button onClick={() => setConvOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}><X size={18}/></button>
            </div>
            <form onSubmit={handleConvert} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Client Record</label>
                {acLocal ? (
                  <div style={{ fontSize: 13, color: '#1A2E44', fontWeight: 600, padding: '8px 11px', background: '#F0FDF9', border: '1.5px solid #0B6B5C', borderRadius: 7 }}>
                    ✓ Reusing linked record: {acLocal.full_name}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#4A6070', lineHeight: 1.5 }}>
                    A client record will be created for <strong>{lead.client_name || lead.full_name}</strong> — address, phone, and date of birth copy over from this lead automatically.
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Payer <span style={{ color: '#E63946' }}>*</span></label>
                <select value={convForm.payer_type} onChange={e => setConvForm(f => ({ ...f, payer_type: e.target.value }))} style={inp}>
                  <option value="">— Choose the payer —</option>
                  {PAYER_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {unmetItems.length > 0 && (
                <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E', marginBottom: 6 }}>⚠️ Converting with unmet readiness items:</div>
                  <div style={{ fontSize: 12, color: '#B45309', marginBottom: 8 }}>{unmetItems.join(' · ')}</div>
                  <label style={lbl}>Override reason <span style={{ color: '#E63946' }}>*</span></label>
                  <textarea value={convForm.override_reason} onChange={e => setConvForm(f => ({ ...f, override_reason: e.target.value }))} rows={3} placeholder="Why is this lead converting anyway? Logged to the timeline verbatim." style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}/>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '11px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Converting\u2026' : '🎯 Convert to Client'}
                </button>
                <button type="button" onClick={() => setConvOpen(false)} style={{ padding: '11px 18px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#4A6070' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
