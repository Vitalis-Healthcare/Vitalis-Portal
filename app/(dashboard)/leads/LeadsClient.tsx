'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Phone, Mail, Globe, Users, Building2, MessageSquare,
         TrendingUp, Calendar, DollarSign, X, ChevronRight, Search,
         UserCheck, RefreshCw } from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────────
const STAGES = [
  { key: 'new',                  label: 'New',                 color: '#8FA0B0', bg: '#EFF2F5' },
  { key: 'contacted',            label: 'Contacted',           color: '#457B9D', bg: '#EBF4FF' },
  { key: 'assessment_scheduled', label: 'Assessment Scheduled',color: '#7C3AED', bg: '#EDE9FE' },
  { key: 'proposal_sent',        label: 'Proposal Sent',       color: '#D97706', bg: '#FEF3C7' },
  { key: 'won',                  label: 'Won ✓',               color: '#0B6B5C', bg: '#D1FAE5' },
  { key: 'on_hold',              label: 'On Hold',             color: '#92400E', bg: '#FDE68A' },
  { key: 'cold',                 label: 'Cold',                color: '#6B7280', bg: '#F3F4F6' },
  { key: 'lost',                 label: 'Lost',                color: '#DC2626', bg: '#FEE2E2' },
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

// ── Revenue helpers ────────────────────────────────────────────────────────────
function calcRevenue(hours?: number | null, rate?: number | null) {
  if (!hours || !rate) return null
  const weekly = hours * rate
  return { weekly, monthly: weekly * 4.33, annual: weekly * 52 }
}

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
  source: string; referral_name?: string; status: string; relationship?: string
  care_types?: string[]; condition_notes?: string; preferred_schedule?: string
  estimated_hours_week?: number; hourly_rate?: number
  expected_start_date?: string; expected_close_date?: string
  won_date?: string; lost_date?: string; lost_reason?: string; notes?: string
  created_at: string; updated_at: string; assigned_to?: string; created_by?: string
  assignee?: any; creator?: any
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

// ── Source icon helper ────────────────────────────────────────────────────────
function SourceIcon({ source }: { source: string }) {
  const s = SOURCES.find(x => x.key === source)
  return <span title={s?.label || source}>{s?.icon || '📋'}</span>
}

function StageChip({ status }: { status: string }) {
  const s = STAGES.find(x => x.key === status)
  if (!s) return null
  return (
    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LeadsClient({ leads, staff, stages: dbStages, serviceTypes: dbServiceTypes, referralSources, currentUserId, currentUserName, lastActivity, nextFollowUp }: Props) {
  // Use DB stages/serviceTypes if available, fall back to constants
  const ACTIVE_STAGES = dbStages.length > 0 ? dbStages.map(s => ({ key: s.key, label: s.label, color: s.color, bg: s.bg_color })) : STAGES.map(s => ({ key: s.key, label: s.label, color: s.color, bg: s.bg }))
  const ACTIVE_CARE_TYPES = dbServiceTypes.length > 0 ? dbServiceTypes.map(s => s.label) : CARE_TYPES
  const router = useRouter()
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const BLANK_FORM = {
    full_name: '', client_name: '', email: '', phone: '',
    source: 'phone', referral_name: '', relationship: 'family_member',
    care_types: [] as string[], condition_notes: '', preferred_schedule: '',
    estimated_hours_week: '', hourly_rate: '', notes: '',
    expected_close_date: '', expected_start_date: '',
    assigned_to: currentUserId, status: 'new',
  }
  const [form, setForm] = useState(BLANK_FORM)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  // ── Filtered leads ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter(l => {
      if (!showArchived && l.status === 'archived') return false
      if (filterStatus !== 'all' && l.status !== filterStatus) return false
      if (filterSource !== 'all' && l.source !== filterSource) return false
      if (q) {
        const haystack = [l.full_name, l.client_name, l.phone, l.email, l.referral_name].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [leads, search, filterStatus, filterSource])

  // ── Revenue summary ───────────────────────────────────────────────────────
  const revenueStats = useMemo(() => {
    const active = leads.filter(l => !['lost', 'cold'].includes(l.status))
    const won = leads.filter(l => l.status === 'won')
    const pipeline = active.filter(l => l.status !== 'won')

    const sumRevenue = (arr: Lead[]) =>
      arr.reduce((sum, l) => {
        const r = calcRevenue(l.estimated_hours_week, l.hourly_rate)
        return sum + (r?.monthly || 0)
      }, 0)

    // Monthly trajectory by close date
    const trajectory: Record<string, number> = {}
    const today = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      trajectory[key] = 0
    }
    for (const l of pipeline) {
      if (!l.expected_close_date) continue
      const d = new Date(l.expected_close_date)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const r = calcRevenue(l.estimated_hours_week, l.hourly_rate)
      if (trajectory[key] !== undefined && r) trajectory[key] += r.monthly
    }

    return {
      wonMonthly: sumRevenue(won),
      pipelineMonthly: sumRevenue(pipeline),
      totalLeads: leads.length,
      activeLeads: active.length,
      trajectory,
    }
  }, [leads])

  // ── Add lead ─────────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      estimated_hours_week: form.estimated_hours_week ? parseFloat(form.estimated_hours_week) : null,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      care_types: form.care_types.length ? form.care_types : null,
      referral_name: form.source === 'referral' ? form.referral_name : null,
      client_name: form.client_name || null,
      expected_close_date: form.expected_close_date || null,
      expected_start_date: form.expected_start_date || null,
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

  // ── Quick status move ─────────────────────────────────────────────────────
  const moveStatus = async (lead: Lead, newStatus: string) => {
    setMovingId(lead.id)
    await fetch('/api/leads/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, status: newStatus, previousStatus: lead.status }),
    })
    setMovingId(null)
    router.refresh()
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }
  const today = new Date().toISOString().split('T')[0]

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
            {revenueStats.activeLeads} active leads · {fmtMoney(revenueStats.pipelineMonthly)}/mo pipeline
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
          { label: 'Won — Monthly Revenue', value: fmtMoney(revenueStats.wonMonthly), sub: `${fmtMoney(revenueStats.wonMonthly * 12)}/yr`, color: '#0B6B5C', bg: '#D1FAE5' },
          { label: 'Pipeline Monthly Value', value: fmtMoney(revenueStats.pipelineMonthly), sub: 'potential revenue', color: '#7C3AED', bg: '#EDE9FE' },
          { label: 'Total Leads', value: revenueStats.totalLeads, sub: `${revenueStats.activeLeads} active`, color: '#1A2E44', bg: '#EFF2F5' },
          { label: 'Won Leads', value: leads.filter(l => l.status === 'won').length, sub: `${leads.filter(l => l.status === 'lost').length} lost`, color: '#D97706', bg: '#FEF3C7' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1A2E44' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Revenue trajectory ── */}
      {trajEntries.some(([,v]) => v > 0) && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2E44', marginBottom: 14 }}>
            📈 Pipeline Revenue Trajectory — next 6 months (by expected close date)
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

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fff', border: '1.5px solid #D1D9E0', borderRadius: 8 }}>
          <Search size={14} color="#8FA0B0"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…" style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', flex: 1 }}/>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: 'auto', padding: '8px 12px' }}>
          <option value="all">All Stages</option>
          {ACTIVE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ ...inp, width: 'auto', padding: '8px 12px' }}>
          <option value="all">All Sources</option>
          {SOURCES.map(s => <option key={s.key} value={s.key}>{s.icon} {s.label}</option>)}
        </select>
        <button onClick={() => setShowArchived(a => !a)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: showArchived ? '#FEF3C7' : '#F8FAFB', border: showArchived ? '1px solid #F59E0B' : '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, color: showArchived ? '#92400E' : '#8FA0B0', cursor: 'pointer' }}>
          📦 {showArchived ? 'Hide Archived' : 'Show Archived'}
        </button>
        <div style={{ display: 'flex', background: '#F8FAFB', borderRadius: 8, padding: 3, border: '1px solid #E2E8F0' }}>
          {(['pipeline','list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: view === v ? '#fff' : 'transparent', color: view === v ? '#0B6B5C' : '#8FA0B0', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {v === 'pipeline' ? '⬛ Pipeline' : '☰ List'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pipeline view ── */}
      {view === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {ACTIVE_STAGES.map(stage => {
            const stageLeads = filtered.filter(l => l.status === stage.key)
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
                    const followUp = nextFollowUp[lead.id]
                    const isOverdue = followUp && followUp < today
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
                          {rev && (
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#0B6B5C', marginTop: 5 }}>
                              {fmtMoney(rev.monthly)}/mo
                            </div>
                          )}
                          {lead.estimated_hours_week && (
                            <div style={{ fontSize: 10, color: '#8FA0B0', marginTop: 2 }}>
                              {lead.estimated_hours_week}h/wk {lead.hourly_rate ? `@ $${lead.hourly_rate}/hr` : ''}
                            </div>
                          )}
                          {followUp && (
                            <div style={{ fontSize: 10, marginTop: 5, fontWeight: 600, color: isOverdue ? '#DC2626' : '#457B9D' }}>
                              {isOverdue ? '⚠️ Follow-up overdue' : `📅 Follow up ${fmtDate(followUp)}`}
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
                {['Contact / Client', 'Source', 'Stage', 'Hours/Rate', 'Monthly Value', 'Close Date', 'Follow Up', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#8FA0B0' }}>No leads match these filters.</td></tr>
              ) : filtered.map((lead, i) => {
                const rev = calcRevenue(lead.estimated_hours_week, lead.hourly_rate)
                const followUp = nextFollowUp[lead.id]
                const isOverdue = followUp && followUp < today
                const assigneeName = (Array.isArray(lead.assignee) ? lead.assignee[0] : lead.assignee)?.full_name
                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #EFF2F5', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <Link href={`/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ fontWeight: 700, color: '#1A2E44' }}>{lead.client_name || lead.full_name}</div>
                        {lead.client_name && <div style={{ fontSize: 11, color: '#8FA0B0' }}>via {lead.full_name}</div>}
                        {lead.phone && <div style={{ fontSize: 11, color: '#457B9D' }}>{lead.phone}</div>}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <SourceIcon source={lead.source}/>
                        <span style={{ fontSize: 12, color: '#4A6070' }}>{SOURCES.find(s => s.key === lead.source)?.label || lead.source}</span>
                      </div>
                      {lead.referral_name && <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>from {lead.referral_name}</div>}
                    </td>
                    <td style={{ padding: '12px 14px' }}><StageChip status={lead.status}/></td>
                    <td style={{ padding: '12px 14px', color: '#4A6070', fontSize: 12 }}>
                      {lead.estimated_hours_week ? `${lead.estimated_hours_week}h/wk` : '—'}
                      {lead.hourly_rate ? <><br/><span style={{ color: '#8FA0B0' }}>${lead.hourly_rate}/hr</span></> : null}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: rev ? '#0B6B5C' : '#CBD5E0' }}>
                      {rev ? fmtMoney(rev.monthly) : '—'}
                      {rev && <div style={{ fontSize: 10, color: '#8FA0B0', fontWeight: 400 }}>{fmtMoney(rev.annual)}/yr</div>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#8FA0B0' }}>{fmtDate(lead.expected_close_date)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {followUp ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: isOverdue ? '#DC2626' : '#457B9D' }}>
                          {isOverdue ? '⚠️ ' : '📅 '}{fmtDate(followUp)}
                        </span>
                      ) : <span style={{ color: '#CBD5E0' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
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
                  <label style={lbl}>Phone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(xxx) xxx-xxxx" style={inp}/>
                </div>

                <div>
                  <label style={lbl}>Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" style={inp}/>
                </div>

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

                {/* Stage */}
                <div>
                  <label style={lbl}>Initial Stage</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} style={inp}>
                    {STAGES.slice(0,4).map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
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

                {/* Financials */}
                <div>
                  <label style={lbl}>Est. Hours / Week</label>
                  <input type="number" value={form.estimated_hours_week} onChange={e => set('estimated_hours_week', e.target.value)} placeholder="e.g. 20" min="1" max="168" step="0.5" style={inp}/>
                </div>

                <div>
                  <label style={lbl}>Hourly Rate Quoted ($)</label>
                  <input type="number" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} placeholder="e.g. 28.00" min="1" step="0.25" style={inp}/>
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
                  <label style={lbl}>Expected Close Date</label>
                  <input type="date" value={form.expected_close_date} onChange={e => set('expected_close_date', e.target.value)} min={today} style={inp}/>
                </div>

                <div>
                  <label style={lbl}>Expected Start Date</label>
                  <input type="date" value={form.expected_start_date} onChange={e => set('expected_start_date', e.target.value)} min={today} style={inp}/>
                </div>

                {/* Assign */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Assigned To</label>
                  <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} style={inp}>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}{s.id === currentUserId ? ' (me)' : ''}</option>)}
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
