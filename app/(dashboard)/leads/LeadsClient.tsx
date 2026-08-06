'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, X, ChevronRight, Search } from 'lucide-react'
import {
  LEAD_STATUSES, statusMeta, calcRevenue, effectiveProbability,
  PROBABILITY_OPTIONS, lostReasonLabel,
  MIN_HOURS_WEEK, MIN_HOURLY_RATE, MIN_WEEKLY_REVENUE, isBelowFloor,
  NEXT_ACTION_TYPES, nextActionLabel, attentionDate,
} from '@/lib/leads/model'

// ── Constants ──────────────────────────────────────────────────────────────────
// Fallback ONLY — the real stage list lives in lead_stages and arrives via
// props. This list is journey-only: outcomes (won/lost) and pauses are the
// lead's STATUS, never a stage. (v0.6.38 stage/status split.)
const FALLBACK_STAGES = [
  { key: 'new',                  label: 'New',                  color: '#8FA0B0', bg: '#EFF2F5' },
  { key: 'contacted',            label: 'Contacted',            color: '#457B9D', bg: '#EBF4FF' },
  { key: 'assessment_scheduled', label: 'Assessment Scheduled', color: '#7C3AED', bg: '#EDE9FE' },
  { key: 'proposal_sent',        label: 'Proposal Sent',        color: '#D97706', bg: '#FEF3C7' },
]

const SOURCES = [
  { key: 'phone',         label: 'Phone Call',       icon: '📞' },
  { key: 'email',         label: 'Email',             icon: '✉️' },
  { key: 'website',       label: 'Website Form',      icon: '🌐' },
  { key: 'referral',      label: 'Referral',          icon: '🤝' },
  { key: 'hospital',      label: 'Hospital/Facility', icon: '🏥' },
  { key: 'doctor_office', label: 'Doctor Office',     icon: '👨‍⚕️' },
  { key: 'word_of_mouth', label: 'Word of Mouth',     icon: '💬' },
  { key: 'social_media',  label: 'Social Media',      icon: '📱' },
  { key: 'other',         label: 'Other',             icon: '📋' },
]

const CARE_TYPES = [
  'Personal Care', 'Companion Care', 'Skilled Nursing', 'Respite Care', 'Overnight', 'Live-In'
]

const RELATIONSHIPS = ['Self', 'Family Member', 'Social Worker', 'Hospital Discharge Planner', 'Doctor Office', 'Other']

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Lead {
  id: string; full_name: string; client_name?: string; email?: string; phone?: string
  source: string; referral_name?: string
  status: string; stage?: string | null
  standby_until?: string | null; standby_reason?: string | null
  lost_reason_code?: string | null; close_probability?: number | null
  next_action_type?: string | null; next_action_due?: string | null; next_action_note?: string | null
  legacy_status?: string | null; archived_at?: string | null
  relationship?: string
  care_types?: string[]; condition_notes?: string; preferred_schedule?: string
  estimated_hours_week?: number; hourly_rate?: number
  expected_start_date?: string; expected_close_date?: string
  won_date?: string; lost_date?: string; lost_reason?: string; notes?: string
  created_at: string; updated_at: string
  assigned_to?: string; secondary_assigned_to?: string; created_by?: string
  address?: string; city?: string; state?: string; zip?: string; date_of_birth?: string
  assignee?: any; secondary?: any; creator?: any
}

interface Stage { key: string; label: string; color: string; bg_color: string; order_index: number }
interface ServiceType { id: string; label: string }
interface ReferralSource { id: string; name: string; type: string; organization?: string }

interface Props {
  leads: Lead[]; staff: { id: string; full_name: string }[]
  stages: Stage[]; serviceTypes: ServiceType[]; referralSources: ReferralSource[]
  currentUserId: string; currentUserName: string
  lastActivity: Record<string, any>; nextFollowUp: Record<string, string>
}

// ── Small display helpers ─────────────────────────────────────────────────────
function SourceIcon({ source }: { source: string }) {
  const s = SOURCES.find(x => x.key === source)
  return <span title={s?.label || source}>{s?.icon || '📋'}</span>
}

function StatusChip({ status }: { status: string }) {
  const s = statusMeta(status)
  if (!s) return null
  return (
    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

const getName = (v: any) => Array.isArray(v) ? v[0]?.full_name : v?.full_name

// ── Main Component ────────────────────────────────────────────────────────────
export default function LeadsClient({ leads, staff, stages: dbStages, serviceTypes: dbServiceTypes, referralSources, currentUserId, currentUserName, lastActivity, nextFollowUp }: Props) {
  const JOURNEY_STAGES = dbStages.length > 0
    ? dbStages.map(s => ({ key: s.key, label: s.label, color: s.color, bg: s.bg_color }))
    : FALLBACK_STAGES.map(s => ({ key: s.key, label: s.label, color: s.color, bg: s.bg }))
  const ACTIVE_CARE_TYPES = dbServiceTypes.length > 0 ? dbServiceTypes.map(s => s.label) : CARE_TYPES
  const router = useRouter()
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [filterStatus, setFilterStatus] = useState('open')
  const [filterSource, setFilterSource] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  // ── v0.6.39: attention queues ──
  const [queue, setQueue] = useState<'all' | 'overdue' | 'due_today' | 'no_action' | 'waking'>('all')

  // Closed statuses have no board columns — viewing them switches to List
  // so the filter never appears to "empty" the screen.
  const pickStatusFilter = (v: string) => {
    setFilterStatus(v)
    if (v === 'won' || v === 'lost' || v === 'cancelled') setView('list')
  }
  const jumpToStatus = (v: string) => { setQueue('all'); setShowArchived(false); pickStatusFilter(v) }

  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

  const stageChipFor = (key?: string | null) => {
    const s = JOURNEY_STAGES.find(x => x.key === key)
    if (!s) return null
    return (
      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
        {s.label}
      </span>
    )
  }

  const BLANK_FORM = {
    full_name: '', client_name: '', email: '', phone: '',
    source: 'phone', referral_name: '', relationship: 'family_member',
    care_types: [] as string[], condition_notes: '', preferred_schedule: '',
    // The floor is the default: 12h/week at $32.50. Edit upward freely;
    // below the floor demands confirmation.
    estimated_hours_week: String(MIN_HOURS_WEEK), hourly_rate: MIN_HOURLY_RATE.toFixed(2), notes: '',
    expected_close_date: '', expected_start_date: '',
    close_probability: '',
    next_action_type: 'call', next_action_due: tomorrow, next_action_note: '',
    address: '', city: '', state: 'MD', zip: '', date_of_birth: '',
    assigned_to: currentUserId, secondary_assigned_to: '', stage: 'new',
  }
  const [form, setForm] = useState(BLANK_FORM)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  // ── Filtered leads ────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]
  const weekOut = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] })()

  const inQueue = (l: Lead, q: typeof queue): boolean => {
    if (q === 'all') return true
    const open = l.status === 'ongoing' || l.status === 'standby'
    if (!open || l.archived_at) return false
    const due = attentionDate(l)
    if (q === 'overdue') return !!due && due < todayStr
    if (q === 'due_today') return due === todayStr
    if (q === 'no_action') return !due
    if (q === 'waking') return l.status === 'standby' && !!l.standby_until && l.standby_until >= todayStr && l.standby_until <= weekOut
    return true
  }

  const queueCounts = useMemo(() => {
    const counts = { overdue: 0, due_today: 0, no_action: 0, waking: 0 }
    for (const l of leads) {
      if (inQueue(l, 'overdue')) counts.overdue++
      if (inQueue(l, 'due_today')) counts.due_today++
      if (inQueue(l, 'no_action')) counts.no_action++
      if (inQueue(l, 'waking')) counts.waking++
    }
    return counts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter(l => {
      if (!showArchived && l.archived_at) return false
      if (showArchived && !l.archived_at) return false
      if (!inQueue(l, queue)) return false
      if (filterStatus === 'open') {
        if (l.status !== 'ongoing' && l.status !== 'standby') return false
      } else if (filterStatus !== 'all' && l.status !== filterStatus) return false
      if (filterStage !== 'all' && l.stage !== filterStage) return false
      if (filterSource !== 'all' && l.source !== filterSource) return false
      if (q) {
        const haystack = [l.full_name, l.client_name, l.phone, l.email, l.referral_name].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, search, filterStage, filterStatus, filterSource, showArchived, queue])

  // ── Revenue summary ───────────────────────────────────────────────────────
  const revenueStats = useMemo(() => {
    const working = leads.filter(l => !l.archived_at)
    const open = working.filter(l => l.status === 'ongoing' || l.status === 'standby')
    const won = working.filter(l => l.status === 'won')
    const lost = working.filter(l => l.status === 'lost')

    const sumRevenue = (arr: Lead[]) =>
      arr.reduce((sum, l) => {
        const r = calcRevenue(l.estimated_hours_week, l.hourly_rate)
        return sum + (r?.monthly || 0)
      }, 0)

    // Probability-weighted pipeline: an unrated lead counts at even odds.
    const weighted = open.reduce((sum, l) => {
      const r = calcRevenue(l.estimated_hours_week, l.hourly_rate)
      if (!r) return sum
      return sum + r.monthly * (effectiveProbability(l.close_probability) / 100)
    }, 0)

    // Monthly trajectory by close date
    const trajectory: Record<string, number> = {}
    const today = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      trajectory[key] = 0
    }
    for (const l of open) {
      if (!l.expected_close_date) continue
      const d = new Date(l.expected_close_date)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const r = calcRevenue(l.estimated_hours_week, l.hourly_rate)
      if (trajectory[key] !== undefined && r) trajectory[key] += r.monthly
    }

    return {
      wonMonthly: sumRevenue(won),
      pipelineMonthly: sumRevenue(open),
      weightedMonthly: weighted,
      totalLeads: working.length,
      openLeads: open.length,
      wonCount: won.length,
      lostCount: lost.length,
      trajectory,
    }
  }, [leads])

  // ── Add lead ─────────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    // At least one way to reach them.
    if (!form.phone.trim() && !form.email.trim()) {
      alert('A phone number or an email is required — at least one way to reach them.')
      return
    }
    // Below the floor demands a deliberate yes.
    const h = parseFloat(form.estimated_hours_week)
    const r = parseFloat(form.hourly_rate)
    if (isBelowFloor(h, r)) {
      if (!confirm(`This is below the Vitalis minimum (${MIN_HOURS_WEEK}h/week, or $${MIN_WEEKLY_REVENUE}/week in revenue). The lead will be flagged as below-minimum. Continue anyway?`)) return
    }
    setSaving(true)
    const payload = {
      ...form,
      estimated_hours_week: form.estimated_hours_week ? parseFloat(form.estimated_hours_week) : null,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      close_probability: form.close_probability !== '' ? parseInt(form.close_probability, 10) : null,
      care_types: form.care_types.length ? form.care_types : null,
      referral_name: form.source === 'referral' ? form.referral_name : null,
      client_name: form.client_name || null,
      expected_close_date: form.expected_close_date || null,
      expected_start_date: form.expected_start_date || null,
      secondary_assigned_to: form.secondary_assigned_to || null,
      next_action_type: form.next_action_type,
      next_action_due: form.next_action_due || null,
      next_action_note: form.next_action_note || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip || null,
      date_of_birth: form.date_of_birth || null,
    }
    const res = await fetch('/api/leads/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setShowAdd(false); setForm(BLANK_FORM); router.refresh()
    } else {
      const d = await res.json()
      alert(d.error || 'Failed to create lead')
    }
    setSaving(false)
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }
  const today = new Date().toISOString().split('T')[0]

  // Board: open leads grouped by stage; leads whose stage is empty (e.g.
  // migrated standby rows) get an honest "Unstaged" column instead of
  // silently vanishing.
  const boardLeads = filtered.filter(l => l.status === 'ongoing' || l.status === 'standby')
  const unstaged = boardLeads.filter(l => !l.stage || !JOURNEY_STAGES.some(s => s.key === l.stage))
  const boardColumns = [
    ...JOURNEY_STAGES,
    ...(unstaged.length > 0 ? [{ key: '__unstaged', label: 'Unstaged', color: '#B45309', bg: '#FEF3C7' }] : []),
  ]

  // ── Revenue bar chart (simple CSS) ────────────────────────────────────────
  const trajEntries = Object.entries(revenueStats.trajectory)
  const maxTraj = Math.max(...trajEntries.map(([,v]) => v), 1)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E44', margin: '0 0 4px' }}>Leads & Pipeline</h1>
          <p style={{ fontSize: 13, color: '#8FA0B0', margin: 0 }}>
            {revenueStats.openLeads} open leads · {fmtMoney(revenueStats.pipelineMonthly)}/mo pipeline · {fmtMoney(revenueStats.weightedMonthly)}/mo weighted
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={15}/> Add Lead
        </button>
        <Link href="/leads/settings" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#F8FAFB', color: '#4A6070', border: '1px solid #E2E8F0', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          ⚙️ Settings
        </Link>
      </div>

      {/* ── Revenue summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Won — Monthly Revenue', value: fmtMoney(revenueStats.wonMonthly), sub: `${fmtMoney(revenueStats.wonMonthly * 12)}/yr`, color: '#0B6B5C', jump: 'won' },
          { label: 'Pipeline Monthly Value', value: fmtMoney(revenueStats.pipelineMonthly), sub: `${fmtMoney(revenueStats.weightedMonthly)}/mo probability-weighted`, color: '#7C3AED', jump: null },
          { label: 'Total Leads', value: revenueStats.totalLeads, sub: `${revenueStats.openLeads} open`, color: '#1A2E44', jump: null },
          { label: 'Won Leads', value: revenueStats.wonCount, sub: `${revenueStats.lostCount} lost — view`, color: '#D97706', jump: 'won', subJump: 'lost' },
        ].map((s: any, i) => (
          <div key={i}
            onClick={() => s.jump && jumpToStatus(s.jump)}
            title={s.jump ? 'Click to view these leads' : undefined}
            style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: `3px solid ${s.color}`, cursor: s.jump ? 'pointer' : 'default' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1A2E44' }}>{s.value}</div>
            {s.subJump ? (
              <div style={{ fontSize: 11, color: '#DC2626', marginTop: 2, fontWeight: 600 }}
                onClick={e => { e.stopPropagation(); jumpToStatus(s.subJump) }}>
                {s.sub}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>{s.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── Revenue trajectory ── */}
      {trajEntries.some(([,v]) => v > 0) && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2E44', marginBottom: 14 }}>
            📈 Pipeline Revenue Trajectory — next 6 months (by target close date)
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 80 }}>
            {trajEntries.map(([month, value]) => (
              <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#0B6B5C' }}>{value > 0 ? fmtMoney(value) : ''}</div>
                <div style={{ width: '100%', background: value > 0 ? 'linear-gradient(180deg,#0B6B5C,#1A9B87)' : '#EFF2F5', borderRadius: '4px 4px 0 0', height: `${Math.max((value / maxTraj) * 60, value > 0 ? 8 : 4)}px`, transition: 'height 0.3s' }} />
                <div style={{ fontSize: 10, color: '#8FA0B0', textAlign: 'center', whiteSpace: 'nowrap' }}>{month}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Attention queues ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Needs attention:</span>
        {([
          { key: 'overdue',   label: '⚠️ Overdue',        count: queueCounts.overdue,   color: '#DC2626', bg: '#FEE2E2' },
          { key: 'due_today', label: '📅 Due Today',      count: queueCounts.due_today, color: '#457B9D', bg: '#EBF4FF' },
          { key: 'no_action', label: '🚫 No Next Action', count: queueCounts.no_action, color: '#92400E', bg: '#FDE68A' },
          { key: 'waking',    label: '⏰ Waking Up',      count: queueCounts.waking,    color: '#7C3AED', bg: '#EDE9FE' },
        ] as const).map(c => {
          const active = queue === c.key
          return (
            <button key={c.key} onClick={() => setQueue(active ? 'all' : c.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, border: `2px solid ${active ? c.color : '#E2E8F0'}`, background: active ? c.bg : '#fff', color: c.count > 0 ? c.color : '#8FA0B0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {c.label}
              <span style={{ background: c.count > 0 ? c.color : '#EFF2F5', color: c.count > 0 ? '#fff' : '#8FA0B0', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{c.count}</span>
            </button>
          )
        })}
        {queue !== 'all' && (
          <button onClick={() => setQueue('all')} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', background: 'transparent', color: '#457B9D', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Clear ×
          </button>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fff', border: '1.5px solid #D1D9E0', borderRadius: 8 }}>
          <Search size={14} color="#8FA0B0"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…" style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', flex: 1 }}/>
        </div>
        <select value={filterStatus} onChange={e => pickStatusFilter(e.target.value)} style={{ ...inp, width: 'auto', padding: '8px 12px' }}>
          <option value="open">Open (Ongoing + Standby)</option>
          {LEAD_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          <option value="all">All Statuses</option>
        </select>
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ ...inp, width: 'auto', padding: '8px 12px' }}>
          <option value="all">All Stages</option>
          {JOURNEY_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ ...inp, width: 'auto', padding: '8px 12px' }}>
          <option value="all">All Sources</option>
          {SOURCES.map(s => <option key={s.key} value={s.key}>{s.icon} {s.label}</option>)}
        </select>
        <button onClick={() => setShowArchived(a => !a)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: showArchived ? '#FEF3C7' : '#F8FAFB', border: showArchived ? '1px solid #F59E0B' : '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, color: showArchived ? '#92400E' : '#8FA0B0', cursor: 'pointer' }}>
          📦 {showArchived ? 'Viewing Archived' : 'Show Archived'}
        </button>
        <div style={{ display: 'flex', background: '#F8FAFB', borderRadius: 8, padding: 3, border: '1px solid #E2E8F0' }}>
          {(['pipeline','list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: view === v ? '#fff' : 'transparent', color: view === v ? '#0B6B5C' : '#8FA0B0', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {v === 'pipeline' ? '⬛ Pipeline' : '☰ List'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pipeline view — journey stages only; outcomes live in the list ── */}
      {view === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(boardColumns.length, 4)},1fr)`, gap: 12 }}>
          {boardColumns.map(stage => {
            const stageLeads = stage.key === '__unstaged'
              ? unstaged
              : boardLeads.filter(l => l.stage === stage.key)
            const stageValue = stageLeads.reduce((sum, l) => {
              const r = calcRevenue(l.estimated_hours_week, l.hourly_rate)
              return sum + (r?.monthly || 0)
            }, 0)
            return (
              <div key={stage.key} style={{ background: '#F8FAFB', borderRadius: 10, padding: '12px 10px', minHeight: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: stage.color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{stage.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', background: '#fff', padding: '2px 7px', borderRadius: 10 }}>{stageLeads.length}</span>
                </div>
                {stageValue > 0 && (
                  <div style={{ fontSize: 11, color: stage.color, fontWeight: 700, marginBottom: 8 }}>{fmtMoney(stageValue)}/mo</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stageLeads.map(lead => {
                    const rev = calcRevenue(lead.estimated_hours_week, lead.hourly_rate)
                    const followUp = attentionDate(lead)
                    const isOverdue = followUp && followUp < today
                    const prob = lead.close_probability
                    const belowFloor = isBelowFloor(lead.estimated_hours_week, lead.hourly_rate)
                    return (
                      <Link key={lead.id} href={`/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ background: '#fff', borderRadius: 8, padding: '10px 11px', border: `1px solid ${isOverdue ? '#FCA5A5' : '#E2E8F0'}`, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2E44', lineHeight: 1.3 }}>
                              {lead.client_name || lead.full_name}
                            </div>
                            <SourceIcon source={lead.source}/>
                          </div>
                          {lead.client_name && (
                            <div style={{ fontSize: 10, color: '#8FA0B0', marginTop: 1 }}>via {lead.full_name}</div>
                          )}
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 5, flexWrap: 'wrap' }}>
                            {rev && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#0B6B5C' }}>{fmtMoney(rev.monthly)}/mo</span>
                            )}
                            {prob !== null && prob !== undefined && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', background: '#EDE9FE', padding: '1px 7px', borderRadius: 10 }}>{prob}%</span>
                            )}
                            {lead.status === 'standby' && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E', background: '#FDE68A', padding: '1px 7px', borderRadius: 10 }}>
                                ⏸ Standby{lead.standby_until ? ` → ${fmtDate(lead.standby_until)}` : ''}
                              </span>
                            )}
                            {belowFloor && (
                              <span title={`Below the Vitalis minimum (${MIN_HOURS_WEEK}h/week or $${MIN_WEEKLY_REVENUE}/week)`} style={{ fontSize: 10, fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '1px 7px', borderRadius: 10 }}>
                                ⬇ Below min
                              </span>
                            )}
                          </div>
                          {lead.estimated_hours_week && (
                            <div style={{ fontSize: 10, color: '#8FA0B0', marginTop: 2 }}>
                              {lead.estimated_hours_week}h/wk {lead.hourly_rate ? `@ $${lead.hourly_rate}/hr` : ''}
                            </div>
                          )}
                          {followUp ? (
                            <div style={{ fontSize: 10, marginTop: 5, fontWeight: 600, color: isOverdue ? '#DC2626' : '#457B9D' }}>
                              {isOverdue ? '⚠️ Overdue: ' : '📅 '}{nextActionLabel(lead.status === 'standby' ? 'follow_up' : lead.next_action_type)} · {fmtDate(followUp)}
                            </div>
                          ) : lead.status === 'ongoing' && (
                            <div style={{ fontSize: 10, marginTop: 5, fontWeight: 700, color: '#92400E' }}>
                              🚫 No next action
                            </div>
                          )}
                          {lead.expected_close_date && (
                            <div style={{ fontSize: 10, color: '#8FA0B0', marginTop: 2 }}>
                              Close {fmtDate(lead.expected_close_date)}
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFB', borderBottom: '1px solid #EFF2F5' }}>
                {['Contact / Client', 'Source', 'Stage', 'Status', 'Owner', 'Hours/Rate', 'Monthly Value', 'Prob.', 'Close Date', 'Next Action', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '11px 12px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: 40, textAlign: 'center', color: '#8FA0B0' }}>No leads match these filters.</td></tr>
              ) : filtered.map((lead, i) => {
                const rev = calcRevenue(lead.estimated_hours_week, lead.hourly_rate)
                const followUp = attentionDate(lead)
                const isOverdue = followUp && followUp < today
                const belowFloor = isBelowFloor(lead.estimated_hours_week, lead.hourly_rate)
                const owner = getName(lead.assignee)
                const secondary = getName(lead.secondary)
                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #EFF2F5', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                    <td style={{ padding: '12px 12px' }}>
                      <Link href={`/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ fontWeight: 700, color: '#1A2E44' }}>{lead.client_name || lead.full_name}</div>
                        {lead.client_name && <div style={{ fontSize: 11, color: '#8FA0B0' }}>via {lead.full_name}</div>}
                        {lead.phone && <div style={{ fontSize: 11, color: '#457B9D' }}>{lead.phone}</div>}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <SourceIcon source={lead.source}/>
                        <span style={{ fontSize: 12, color: '#4A6070' }}>{SOURCES.find(s => s.key === lead.source)?.label || lead.source}</span>
                      </div>
                      {lead.referral_name && <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>from {lead.referral_name}</div>}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      {(lead.status === 'ongoing' || lead.status === 'standby')
                        ? (stageChipFor(lead.stage) || <span style={{ color: '#B45309', fontSize: 11, fontWeight: 700 }}>Unstaged</span>)
                        : <span style={{ color: '#CBD5E0' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <StatusChip status={lead.status}/>
                      {lead.status === 'standby' && lead.standby_until && (
                        <div style={{ fontSize: 10, color: '#92400E', marginTop: 2 }}>until {fmtDate(lead.standby_until)}</div>
                      )}
                      {lead.status === 'lost' && lead.lost_reason_code && (
                        <div style={{ fontSize: 10, color: '#DC2626', marginTop: 2 }}>{lostReasonLabel(lead.lost_reason_code)}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 12, color: '#4A6070' }}>
                      {owner || <span style={{ color: '#DC2626', fontWeight: 700 }}>Unassigned</span>}
                      {secondary && <div style={{ fontSize: 10, color: '#8FA0B0' }}>+ {secondary}</div>}
                    </td>
                    <td style={{ padding: '12px 12px', color: '#4A6070', fontSize: 12 }}>
                      {lead.estimated_hours_week ? `${lead.estimated_hours_week}h/wk` : '—'}
                      {lead.hourly_rate ? <><br/><span style={{ color: '#8FA0B0' }}>${lead.hourly_rate}/hr</span></> : null}
                      {belowFloor && <div style={{ fontSize: 10, color: '#B45309', fontWeight: 700 }}>⬇ Below min</div>}
                    </td>
                    <td style={{ padding: '12px 12px', fontWeight: 700, color: rev ? '#0B6B5C' : '#CBD5E0' }}>
                      {rev ? fmtMoney(rev.monthly) : '—'}
                      {rev && <div style={{ fontSize: 10, color: '#8FA0B0', fontWeight: 400 }}>{fmtMoney(rev.annual)}/yr</div>}
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 12, fontWeight: 700, color: lead.close_probability != null ? '#7C3AED' : '#CBD5E0' }}>
                      {lead.close_probability != null ? `${lead.close_probability}%` : '—'}
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 12, color: '#8FA0B0' }}>{fmtDate(lead.expected_close_date)}</td>
                    <td style={{ padding: '12px 12px' }}>
                      {followUp ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: isOverdue ? '#DC2626' : '#457B9D' }}>
                          {isOverdue ? '⚠️ ' : '📅 '}{nextActionLabel(lead.status === 'standby' ? 'follow_up' : lead.next_action_type)}<br/>{fmtDate(followUp)}
                        </span>
                      ) : lead.status === 'ongoing' ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>🚫 None</span>
                      ) : <span style={{ color: '#CBD5E0' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <Link href={`/leads/${lead.id}`} style={{ fontSize: 12, color: '#0B6B5C', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                        View <ChevronRight size={13}/>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Lead Modal ── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, padding: '24px 16px', overflowY: 'auto' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginBottom: 24 }}>

            {/* Modal header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Add New Lead</h3>
                <p style={{ fontSize: 12, color: '#8FA0B0', margin: '2px 0 0' }}>Capture a new enquiry into the pipeline</p>
              </div>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}><X size={18}/></button>
            </div>

            <form onSubmit={handleAdd} style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                {/* Caller / contact */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Enquirer Name <span style={{ color: '#E63946' }}>*</span></label>
                  <input value={form.full_name} onChange={e => set('full_name', e.target.value)} required placeholder="Who called or emailed?" style={inp}/>
                </div>

                <div>
                  <label style={lbl}>Relationship to Client</label>
                  <select value={form.relationship} onChange={e => set('relationship', e.target.value)} style={inp}>
                    {RELATIONSHIPS.map(r => <option key={r} value={r.toLowerCase().replace(/ /g, '_')}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Client / Care Recipient Name</label>
                  <input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="If different from enquirer" style={inp}/>
                </div>

                <div>
                  <label style={lbl}>Phone <span style={{ color: '#E63946' }}>*</span></label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(xxx) xxx-xxxx" style={inp}/>
                </div>

                <div>
                  <label style={lbl}>Email <span style={{ color: '#E63946' }}>*</span></label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" style={inp}/>
                  <div style={{ fontSize: 10, color: '#8FA0B0', marginTop: 3 }}>* phone or email — at least one</div>
                </div>

                <div style={{ gridColumn: '1/-1', marginTop: 4, paddingTop: 14, borderTop: '1px dashed #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0B6B5C', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Client Home Address & DOB
                  </div>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Street Address</label>
                  <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St" style={inp}/>
                </div>

                <div>
                  <label style={lbl}>City</label>
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Silver Spring" style={inp}/>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>State</label>
                    <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="MD" maxLength={2} style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>ZIP</label>
                    <input value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="20910" maxLength={10} style={inp}/>
                  </div>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} max={today} style={{ ...inp, maxWidth: 220 }}/>
                </div>

                <div style={{ gridColumn: '1/-1', marginTop: 4, paddingTop: 14, borderTop: '1px dashed #E2E8F0' }} />

                {/* Source */}
                <div>
                  <label style={lbl}>Lead Source <span style={{ color: '#E63946' }}>*</span></label>
                  <select value={form.source} onChange={e => set('source', e.target.value)} required style={inp}>
                    {SOURCES.map(s => <option key={s.key} value={s.key}>{s.icon} {s.label}</option>)}
                  </select>
                </div>

                {form.source === 'referral' && (
                  <div>
                    <label style={lbl}>Referred By (free text)</label>
                    <input value={form.referral_name} onChange={e => set('referral_name', e.target.value)} placeholder="Referrer name / organisation" style={inp}/>
                  </div>
                )}
                {referralSources.length > 0 && (
                  <div>
                    <label style={lbl}>Link to Referral Source</label>
                    <select value={(form as any).referral_source_id || ''} onChange={e => set('referral_source_id', e.target.value)} style={inp}>
                      <option value="">— None —</option>
                      {referralSources.map(rs => <option key={rs.id} value={rs.id}>{rs.name}{rs.organization ? ` · ${rs.organization}` : ''}</option>)}
                    </select>
                  </div>
                )}

                {/* Stage + probability */}
                <div>
                  <label style={lbl}>Initial Stage</label>
                  <select value={form.stage} onChange={e => set('stage', e.target.value)} style={inp}>
                    {JOURNEY_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Probability of Closing</label>
                  <select value={form.close_probability} onChange={e => set('close_probability', e.target.value)} style={inp}>
                    <option value="">— Not rated —</option>
                    {PROBABILITY_OPTIONS.map(p => <option key={p} value={p}>{p}%</option>)}
                  </select>
                </div>

                {/* Care types */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Care Services Requested</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ACTIVE_CARE_TYPES.map((ct: string) => {
                      const active = form.care_types.includes(ct)
                      return (
                        <button key={ct} type="button"
                          onClick={() => set('care_types', active ? form.care_types.filter(x => x !== ct) : [...form.care_types, ct])}
                          style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? '#0B6B5C' : '#D1D9E0'}`, background: active ? '#D1FAE5' : '#fff', color: active ? '#0B6B5C' : '#4A6070', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          {ct}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Financials — prefilled at the Vitalis floor */}
                <div>
                  <label style={lbl}>Est. Hours / Week <span style={{ color: '#E63946' }}>*</span></label>
                  <input type="number" value={form.estimated_hours_week} onChange={e => set('estimated_hours_week', e.target.value)} required min="1" max="168" step="0.5" style={inp}/>
                  <div style={{ fontSize: 10, color: '#8FA0B0', marginTop: 3 }}>floor: {MIN_HOURS_WEEK}h/week or ${MIN_WEEKLY_REVENUE}/week</div>
                </div>

                <div>
                  <label style={lbl}>Hourly Rate ($) <span style={{ color: '#E63946' }}>*</span></label>
                  <input type="number" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} required min="1" step="0.25" style={inp}/>
                  <div style={{ fontSize: 10, color: '#8FA0B0', marginTop: 3 }}>default: ${MIN_HOURLY_RATE.toFixed(2)}/hr</div>
                </div>

                {/* Revenue preview */}
                {form.estimated_hours_week && form.hourly_rate && (() => {
                  const r = calcRevenue(parseFloat(form.estimated_hours_week), parseFloat(form.hourly_rate))
                  return r ? (
                    <div style={{ gridColumn: '1/-1', background: '#D1FAE5', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 20 }}>
                      <div><div style={{ fontSize: 10, color: '#0B6B5C', fontWeight: 700, textTransform: 'uppercase' }}>Weekly</div><div style={{ fontSize: 14, fontWeight: 800, color: '#0B6B5C' }}>{fmtMoney(r.weekly)}</div></div>
                      <div><div style={{ fontSize: 10, color: '#0B6B5C', fontWeight: 700, textTransform: 'uppercase' }}>Monthly</div><div style={{ fontSize: 14, fontWeight: 800, color: '#0B6B5C' }}>{fmtMoney(r.monthly)}</div></div>
                      <div><div style={{ fontSize: 10, color: '#0B6B5C', fontWeight: 700, textTransform: 'uppercase' }}>Annual</div><div style={{ fontSize: 14, fontWeight: 800, color: '#0B6B5C' }}>{fmtMoney(r.annual)}</div></div>
                    </div>
                  ) : null
                })()}

                <div>
                  <label style={lbl}>Target Close Date <span style={{ color: '#E63946' }}>*</span></label>
                  <input type="date" value={form.expected_close_date} onChange={e => set('expected_close_date', e.target.value)} required min={today} style={inp}/>
                </div>

                <div>
                  <label style={lbl}>Expected Start Date</label>
                  <input type="date" value={form.expected_start_date} onChange={e => set('expected_start_date', e.target.value)} min={today} style={inp}/>
                </div>

                {/* First next action — no open lead without one */}
                <div style={{ gridColumn: '1/-1', marginTop: 4, paddingTop: 14, borderTop: '1px dashed #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0B6B5C', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    First Next Action
                  </div>
                </div>

                <div>
                  <label style={lbl}>Action <span style={{ color: '#E63946' }}>*</span></label>
                  <select value={form.next_action_type} onChange={e => set('next_action_type', e.target.value)} required style={inp}>
                    {NEXT_ACTION_TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Due <span style={{ color: '#E63946' }}>*</span></label>
                  <input type="date" value={form.next_action_due} onChange={e => set('next_action_due', e.target.value)} required min={today} style={inp}/>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Action Note</label>
                  <input value={form.next_action_note} onChange={e => set('next_action_note', e.target.value)} placeholder="e.g. Call back after they speak with the discharge planner" style={inp}/>
                </div>

                {/* Assign */}
                <div>
                  <label style={lbl}>Primary Owner</label>
                  <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} style={inp}>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}{s.id === currentUserId ? ' (me)' : ''}</option>)}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Secondary Owner</label>
                  <select value={form.secondary_assigned_to} onChange={e => set('secondary_assigned_to', e.target.value)} style={inp}>
                    <option value="">— None —</option>
                    {staff.filter(s => s.id !== form.assigned_to).map(s => <option key={s.id} value={s.id}>{s.full_name}{s.id === currentUserId ? ' (me)' : ''}</option>)}
                  </select>
                </div>

                {/* Notes */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Initial Notes</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Key details from the initial enquiry…" rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}/>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : '+ Add Lead'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '12px 20px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#4A6070' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
