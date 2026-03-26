'use client'
// app/(dashboard)/reports/ReportsClient.tsx
// 6-tab compliance intelligence UI
//  Phase 1: Compliance Matrix · Expiry Timeline · Snapshots
//  Phase 2: Training Gap · Appraisal Heatmap · References Pipeline

import { useState, useMemo, useCallback } from 'react'
import {
  BarChart3, Download, FileText, Camera, Calendar, Save,
  RefreshCw, Shield, Search, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Users, TrendingUp, BookOpen, UserCheck
} from 'lucide-react'
import type {
  MatrixRow, CredTypeInfo, TimelineItem, CredStatus,
  TrainingGapRow, ProgrammeInfo, HeatmapRow, HeatmapCompetency,
  RefPipelineRow,
} from '@/lib/reports'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Snapshot {
  id: string; created_at: string; label: string
  created_by_name: string; caregiver_count: number; overall_compliance_pct: number
}

interface Props {
  // Phase 1
  matrixRows: MatrixRow[]; caregiverCredTypes: CredTypeInfo[]
  timelineItems: TimelineItem[]; generatedAt: string
  totalCaregivers: number; overallCompliancePct: number
  initialSnapshots: Snapshot[]; adminId: string; adminName: string
  // Phase 2
  trainingGapRows: TrainingGapRow[]; programmes: ProgrammeInfo[]
  heatmapRows: HeatmapRow[]; heatmapCompetencies: HeatmapCompetency[]
  teamClinicalAvg: number; teamProfessionalAvg: number; teamOverallAvg: number
  refPipelineRows: RefPipelineRow[]; avgDaysToReceive: number | null
  refStats: { total: number; not_sent: number; sent: number; received: number; pct_received: number }
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary: '#1A2E44', teal: '#0E7C7B', tealLight: '#E6F4F4', tealBg: '#F0FAF9',
  green: '#2A9D8F', amber: '#F4A261', red: '#E63946', purple: '#9B59B6',
  purpleLight: '#F3EBF9', grey: '#8FA0B0', greyLight: '#F8FAFB',
  border: '#D1D9E0', white: '#ffffff', text: '#1A2E44', muted: '#8FA0B0',
  blue: '#457B9D', blueBg: '#EBF4FF',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (iso?: string | null) => iso
  ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })

// Score → color (appraisal heatmap)
function scoreColor(score: number): string {
  if (score === 0) return '#E8EDF0'
  if (score >= 3.5) return '#2A9D8F'
  if (score >= 2.5) return '#457B9D'
  if (score >= 1.5) return '#F4A261'
  return '#E63946'
}
function scoreTextColor(score: number): string {
  return score === 0 ? '#8FA0B0' : '#fff'
}

type CredStatusConf = { color: string; bg: string; label: string; icon: string }
const STATUS_CONFIG: Record<CredStatus, CredStatusConf> = {
  current:      { color: C.green,  bg: '#E8F8F5', label: 'Current',  icon: '●' },
  expiring:     { color: C.amber,  bg: '#FEF3EA', label: 'Expiring', icon: '◐' },
  expired:      { color: C.red,    bg: '#FDECEA', label: 'Expired',  icon: '✕' },
  missing:      { color: C.purple, bg: C.purpleLight, label: 'Missing', icon: '◉' },
  na:           { color: C.grey,   bg: C.greyLight,   label: 'N/A',    icon: '—' },
  not_required: { color: '#C8D4DC', bg: 'transparent', label: '',       icon: '' },
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function StatCard({ value, label, sub, color }: { value: string | number; label: string; sub: string; color: string }) {
  return (
    <div style={{ background: C.white, borderRadius: 10, padding: '16px 18px', borderLeft: `4px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function CredCell({ cell }: { cell: { status: CredStatus; expiry_date?: string | null; does_not_expire?: boolean } }) {
  const cfg = STATUS_CONFIG[cell.status]
  if (cell.status === 'not_required') return <span style={{ color: '#D1D9E0', fontSize: 16 }}>—</span>
  const tooltip = cell.status === 'na' ? 'N/A' : cell.does_not_expire ? 'No Expiry' : cell.expiry_date ? `${cfg.label}: ${fmt(cell.expiry_date)}` : cfg.label
  return (
    <div title={tooltip} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.color}22`, cursor: 'default' }}>
      <span style={{ color: cfg.color, fontSize: cell.status === 'missing' ? 13 : 14, fontWeight: 700 }}>{cfg.icon}</span>
    </div>
  )
}

function TrainingBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? C.green : pct >= 50 ? C.amber : C.red
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ width: 52, height: 6, background: '#E8EDF0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color }}>{pct}%</span>
    </div>
  )
}

function RefsPill({ received }: { received: number }) {
  const color = received === 3 ? C.green : received >= 1 ? C.amber : C.grey
  return <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', border: `1px solid ${color}44`, borderRadius: 20, padding: '2px 8px' }}>{received}/3</span>
}

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
      {(Object.entries(STATUS_CONFIG) as [CredStatus, CredStatusConf][]).filter(([k]) => k !== 'not_required').map(([key, cfg]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.color}` }} />
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{cfg.label}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ color: '#D1D9E0', fontSize: 14 }}>—</span>
        <span style={{ fontSize: 11, color: C.muted }}>Not Required</span>
      </div>
    </div>
  )
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: 'matrix',    label: 'Compliance Matrix', icon: <BarChart3 size={13}/>,    group: 'CREDENTIALS' },
  { key: 'timeline',  label: 'Expiry Timeline',   icon: <Calendar  size={13}/>,    group: 'CREDENTIALS' },
  { key: 'snapshots', label: 'Snapshots',         icon: <Camera    size={13}/>,    group: 'CREDENTIALS' },
  { key: 'training',  label: 'Training Gap',      icon: <BookOpen  size={13}/>,    group: 'INTELLIGENCE' },
  { key: 'heatmap',   label: 'Appraisal Heatmap', icon: <TrendingUp size={13}/>,   group: 'INTELLIGENCE' },
  { key: 'refs',      label: 'Ref. Pipeline',     icon: <UserCheck size={13}/>,    group: 'INTELLIGENCE' },
] as const

type TabKey = typeof TABS[number]['key']

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ReportsClient(props: Props) {
  const {
    matrixRows, caregiverCredTypes, timelineItems, generatedAt,
    totalCaregivers, overallCompliancePct, initialSnapshots, adminId, adminName,
    trainingGapRows, programmes, heatmapRows, heatmapCompetencies,
    teamClinicalAvg, teamProfessionalAvg, teamOverallAvg,
    refPipelineRows, avgDaysToReceive, refStats,
  } = props

  const [activeTab, setActiveTab] = useState<TabKey>('matrix')

  // ── Matrix state ─────────────────────────────────────────────────────────
  const [matrixSearch, setMatrixSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CredStatus>('all')

  // ── Timeline state ───────────────────────────────────────────────────────
  const [horizon, setHorizon] = useState<90 | 180 | 365>(90)
  const [tlGroupBy, setTlGroupBy] = useState<'caregiver' | 'type'>('caregiver')

  // ── Snapshot state ───────────────────────────────────────────────────────
  const [snapshots, setSnapshots] = useState<Snapshot[]>(initialSnapshots)
  const [snapshotLabel, setSnapshotLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Training state ───────────────────────────────────────────────────────
  const [trainingSearch, setTrainingSearch] = useState('')
  const [trainingFilter, setTrainingFilter] = useState<'all' | 'overdue' | 'not_enrolled' | 'completed'>('all')

  // ── Heatmap state ────────────────────────────────────────────────────────
  const [heatmapSection, setHeatmapSection] = useState<'all' | 'clinical' | 'professional'>('clinical')
  const [heatmapSearch, setHeatmapSearch] = useState('')

  // ── Refs state ───────────────────────────────────────────────────────────
  const [refsFilter, setRefsFilter] = useState<'all' | 'sent' | 'not_sent' | 'received'>('all')
  const [refsGroupBy, setRefsGroupBy] = useState<'caregiver' | 'slot'>('caregiver')

  // ── Derived ──────────────────────────────────────────────────────────────
  const matrixStats = useMemo(() => {
    let current = 0, expiring = 0, expired = 0, missing = 0
    for (const row of matrixRows) for (const cell of Object.values(row.credentials)) {
      if (cell.status === 'current')  current++
      if (cell.status === 'expiring') expiring++
      if (cell.status === 'expired')  expired++
      if (cell.status === 'missing')  missing++
    }
    return { current, expiring, expired, missing }
  }, [matrixRows])

  const filteredMatrixRows = useMemo(() => {
    let rows = matrixRows
    if (matrixSearch.trim()) rows = rows.filter((r) => r.full_name.toLowerCase().includes(matrixSearch.toLowerCase()))
    if (statusFilter !== 'all') rows = rows.filter((r) => Object.values(r.credentials).some((c) => c.status === statusFilter))
    return rows
  }, [matrixRows, matrixSearch, statusFilter])

  const filteredTimeline = useMemo(() => timelineItems.filter((i) => i.days_until <= horizon), [timelineItems, horizon])

  const filteredTraining = useMemo(() => {
    let rows = trainingGapRows
    if (trainingSearch.trim()) rows = rows.filter((r) => r.caregiver_name.toLowerCase().includes(trainingSearch.toLowerCase()))
    if (trainingFilter === 'overdue') rows = rows.filter((r) => r.has_overdue)
    if (trainingFilter === 'not_enrolled') rows = rows.filter((r) => r.not_enrolled_count > 0)
    if (trainingFilter === 'completed') rows = rows.filter((r) => r.completed_all)
    return rows
  }, [trainingGapRows, trainingSearch, trainingFilter])

  const filteredHeatmapRows = useMemo(() => {
    let rows = heatmapRows
    if (heatmapSearch.trim()) rows = rows.filter((r) => r.caregiver_name.toLowerCase().includes(heatmapSearch.toLowerCase()))
    return rows
  }, [heatmapRows, heatmapSearch])

  const visibleCompetencies = useMemo(() =>
    heatmapSection === 'all' ? heatmapCompetencies :
    heatmapCompetencies.filter((c) => c.section === heatmapSection),
    [heatmapCompetencies, heatmapSection]
  )

  const filteredRefs = useMemo(() => {
    if (refsFilter === 'all') return refPipelineRows
    return refPipelineRows.filter((r) => r.status === refsFilter)
  }, [refPipelineRows, refsFilter])

  // ── Snapshot save ────────────────────────────────────────────────────────
  const handleSaveSnapshot = useCallback(async () => {
    if (!snapshotLabel.trim()) { setSaveMsg({ type: 'error', text: 'Please enter a label.' }); return }
    setSaving(true); setSaveMsg(null)
    try {
      const res = await fetch('/api/reports/snapshot/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: snapshotLabel.trim(), adminId, adminName, matrixRows, caregiverCredTypes, generatedAt, totalCaregivers, overallCompliancePct }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setSnapshots((prev) => [json.snapshot, ...prev])
      setSnapshotLabel('')
      setSaveMsg({ type: 'success', text: `Snapshot "${json.snapshot.label}" saved.` })
    } catch (err: unknown) {
      setSaveMsg({ type: 'error', text: err instanceof Error ? err.message : 'Unknown error' })
    } finally { setSaving(false) }
  }, [snapshotLabel, adminId, adminName, matrixRows, caregiverCredTypes, generatedAt, totalCaregivers, overallCompliancePct])

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1600, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.primary, margin: 0 }}>Compliance Reports</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Vitalis Healthcare Services · Generated {fmt(generatedAt)}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.open('/api/reports/compliance-csv', '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: C.greyLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={() => window.open('/api/reports/compliance-pdf', '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: C.teal, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <FileText size={14} /> PDF / Print
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 22 }}>
        <StatCard value={totalCaregivers}                label="Caregivers"       sub="Active"          color={C.teal} />
        <StatCard value={`${overallCompliancePct}%`}    label="Fleet Compliance" sub="Credential avg"  color={overallCompliancePct >= 80 ? C.green : overallCompliancePct >= 60 ? C.amber : C.red} />
        <StatCard value={matrixStats.missing}            label="Missing Creds"    sub="Not on file"     color={matrixStats.missing > 0 ? C.purple : C.green} />
        <StatCard value={matrixStats.expiring}           label="Expiring Soon"    sub="Need renewal"    color={matrixStats.expiring > 0 ? C.amber : C.green} />
        <StatCard value={`${refStats.pct_received}%`}   label="Refs Received"    sub={`${refStats.received}/${refStats.total} slots`} color={refStats.pct_received >= 80 ? C.green : C.amber} />
        <StatCard value={heatmapRows.length > 0 ? `${teamOverallAvg}/4` : '—'} label="Avg Appraisal" sub="Team score" color={teamOverallAvg >= 3.5 ? C.green : teamOverallAvg >= 2.5 ? C.blue : C.amber} />
      </div>

      {/* Tab bar — two groups */}
      <div style={{ marginBottom: 0, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: 0, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Group label: CREDENTIALS */}
          <div style={{ padding: '6px 12px 4px', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '1.2px', alignSelf: 'flex-end', paddingBottom: 10 }}>
            Credentials
          </div>
          {TABS.filter((t) => t.group === 'CREDENTIALS').map((tab) => (
            <TabBtn key={tab.key} tab={tab} active={activeTab === tab.key}
              badge={tab.key === 'snapshots' && snapshots.length > 0 ? snapshots.length : undefined}
              onClick={() => setActiveTab(tab.key)} />
          ))}
          <div style={{ width: 1, height: 32, background: C.border, margin: '0 8px', alignSelf: 'flex-end', marginBottom: 10 }} />
          {/* Group label: INTELLIGENCE */}
          <div style={{ padding: '6px 12px 4px', fontSize: 9, fontWeight: 800, color: C.purple, textTransform: 'uppercase', letterSpacing: '1.2px', alignSelf: 'flex-end', paddingBottom: 10 }}>
            Intelligence
          </div>
          {TABS.filter((t) => t.group === 'INTELLIGENCE').map((tab) => (
            <TabBtn key={tab.key} tab={tab} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} intelligence />
          ))}
        </div>
      </div>

      {/* ── TAB 1: COMPLIANCE MATRIX ── */}
      {activeTab === 'matrix' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
              <input value={matrixSearch} onChange={(e) => setMatrixSearch(e.target.value)} placeholder="Search caregiver…" style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.white, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.white, cursor: 'pointer' }}>
              <option value="all">All Statuses</option>
              <option value="expiring">Has Expiring</option>
              <option value="expired">Has Expired</option>
              <option value="missing">Has Missing</option>
            </select>
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}>
              <strong>{filteredMatrixRows.length}</strong> of <strong>{matrixRows.length}</strong>
            </span>
          </div>
          <div style={{ marginBottom: 10 }}><Legend /></div>
          {filteredMatrixRows.length === 0 ? (
            <EmptyState text="No caregivers match the current filters." />
          ) : (
            <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 12, background: C.white, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
                <thead>
                  <tr style={{ background: C.greyLight }}>
                    <th style={{ position: 'sticky', left: 0, zIndex: 3, background: C.greyLight, padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: `2px solid ${C.border}`, minWidth: 180 }}>Caregiver</th>
                    {caregiverCredTypes.map((ct) => (
                      <th key={ct.id} title={ct.name} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', borderBottom: `2px solid ${C.border}`, width: 66, minWidth: 66, wordBreak: 'break-word', lineHeight: 1.3 }}>{ct.short_name}</th>
                    ))}
                    {['Training', 'Refs', 'Policies', 'Appraisal', 'Cred %'].map((h) => (
                      <th key={h} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMatrixRows.map((row, idx) => {
                    const pctColor = row.credential_compliance_pct >= 80 ? C.green : row.credential_compliance_pct >= 60 ? C.amber : C.red
                    return (
                      <tr key={row.id} style={{ background: idx % 2 === 0 ? C.white : C.greyLight, borderBottom: `1px solid ${C.border}22` }}>
                        <td style={{ position: 'sticky', left: 0, zIndex: 1, background: idx % 2 === 0 ? C.white : C.greyLight, padding: '10px 16px', borderRight: `1px solid ${C.border}44` }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: C.primary, whiteSpace: 'nowrap' }}>{row.full_name}</div>
                          {row.position_name && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{row.position_name}</div>}
                        </td>
                        {caregiverCredTypes.map((ct) => (
                          <td key={ct.id} style={{ textAlign: 'center', padding: '8px 4px' }}>
                            <CredCell cell={row.credentials[ct.id] || { status: 'missing' }} />
                          </td>
                        ))}
                        <td style={{ textAlign: 'center', padding: '8px 6px' }}><TrainingBar pct={row.training_pct} /></td>
                        <td style={{ textAlign: 'center', padding: '8px 4px' }}><RefsPill received={row.refs_received} /></td>
                        <td style={{ textAlign: 'center', padding: '8px 6px' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: row.policies_signed > 0 ? C.teal : C.muted }}>{row.policies_signed}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px 6px' }}>
                          {row.latest_appraisal ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: row.latest_appraisal.status === 'signed' ? C.green : row.latest_appraisal.status === 'sent' ? C.amber : C.grey }}>
                                {row.latest_appraisal.status === 'signed' ? '✓ Signed' : row.latest_appraisal.status === 'sent' ? '⏳ Sent' : 'Draft'}
                              </span>
                              {row.latest_appraisal.avg_score > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(row.latest_appraisal.avg_score) }}>{row.latest_appraisal.avg_score.toFixed(1)}</span>}
                            </div>
                          ) : <span style={{ fontSize: 11, color: C.muted }}>None</span>}
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: pctColor, background: pctColor + '18', borderRadius: 20, padding: '3px 8px' }}>{row.credential_compliance_pct}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>* Credential % = required credentials that are Current, Expiring, or N/A ÷ total required.</p>
        </div>
      )}

      {/* ── TAB 2: EXPIRY TIMELINE ── */}
      {activeTab === 'timeline' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <ToggleGroup options={[{ value: 90, label: '90 days' }, { value: 180, label: '180 days' }, { value: 365, label: '365 days' }]} value={horizon} onChange={(v) => setHorizon(v as any)} />
            <ToggleGroup options={[{ value: 'caregiver', label: 'By Caregiver' }, { value: 'type', label: 'By Credential' }]} value={tlGroupBy} onChange={(v) => setTlGroupBy(v as any)} dark />
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}><strong>{filteredTimeline.length}</strong> expiring within {horizon} days</span>
          </div>
          {filteredTimeline.length === 0 ? (
            <div style={{ background: C.tealBg, border: `1px solid ${C.teal}33`, borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
              <CheckCircle size={32} color={C.green} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>All clear!</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>No credentials expiring within {horizon} days.</div>
            </div>
          ) : <TimelineView items={filteredTimeline} groupBy={tlGroupBy} />}
        </div>
      )}

      {/* ── TAB 3: SNAPSHOTS ── */}
      {activeTab === 'snapshots' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: C.tealBg, border: `1px solid ${C.teal}44`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.primary, marginBottom: 4 }}>Save Compliance Snapshot</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Saves the current compliance state as a dated audit record for BCHD submissions.</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input value={snapshotLabel} onChange={(e) => setSnapshotLabel(e.target.value)} placeholder={`e.g. Q1 2026 BCHD Submission`} style={{ flex: '1 1 320px', padding: '9px 14px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.white, outline: 'none' }} />
              <button onClick={handleSaveSnapshot} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: saving ? C.muted : C.teal, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? <RefreshCw size={14} /> : <Save size={14} />} {saving ? 'Saving…' : 'Save Snapshot'}
              </button>
            </div>
            {saveMsg && <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, fontSize: 13, background: saveMsg.type === 'success' ? '#E8F8F5' : '#FDECEA', color: saveMsg.type === 'success' ? C.green : C.red, border: `1px solid ${(saveMsg.type === 'success' ? C.green : C.red)}44` }}>{saveMsg.type === 'success' ? '✓ ' : '✕ '}{saveMsg.text}</div>}
          </div>
          {snapshots.length === 0 ? (
            <div style={{ background: C.greyLight, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
              <Shield size={32} color={C.muted} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>No snapshots yet</div>
            </div>
          ) : (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 110px 100px', padding: '10px 20px', background: C.greyLight, borderBottom: `1px solid ${C.border}` }}>
                {['Label', 'Date', 'Caregivers', 'Compliance', 'By'].map((h) => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</span>)}
              </div>
              {snapshots.map((snap, idx) => {
                const pc = snap.overall_compliance_pct >= 80 ? C.green : snap.overall_compliance_pct >= 60 ? C.amber : C.red
                return (
                  <div key={snap.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 110px 100px', padding: '14px 20px', background: idx % 2 === 0 ? C.white : C.greyLight, borderBottom: `1px solid ${C.border}22`, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{snap.label}</span>
                    <span style={{ fontSize: 13, color: C.text }}>{fmt(snap.created_at)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{snap.caregiver_count}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pc, background: pc + '18', borderRadius: 20, padding: '3px 10px', display: 'inline-block' }}>{snap.overall_compliance_pct}%</span>
                    <span style={{ fontSize: 12, color: C.muted }}>{snap.created_by_name || 'Admin'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: TRAINING GAP ── */}
      {activeTab === 'training' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
              <input value={trainingSearch} onChange={(e) => setTrainingSearch(e.target.value)} placeholder="Search caregiver…" style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.white, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <select value={trainingFilter} onChange={(e) => setTrainingFilter(e.target.value as typeof trainingFilter)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.white, cursor: 'pointer' }}>
              <option value="all">All Caregivers</option>
              <option value="overdue">Has Overdue</option>
              <option value="not_enrolled">Not Fully Enrolled</option>
              <option value="completed">All Completed</option>
            </select>
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}>
              <strong>{filteredTraining.length}</strong> of <strong>{trainingGapRows.length}</strong>
            </span>
          </div>

          {/* Programme summary row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {programmes.map((p) => {
              const enrolled = trainingGapRows.filter((r) => r.enrollments.some((e) => e.programme_id === p.id)).length
              const completed = trainingGapRows.filter((r) => r.enrollments.some((e) => e.programme_id === p.id && e.is_completed)).length
              const pct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0
              const color = pct === 100 ? C.green : pct >= 50 ? C.amber : C.red
              return (
                <div key={p.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', minWidth: 160, flex: '1 1 160px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 6, lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#E8EDF0', borderRadius: 3 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{completed}/{enrolled}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{enrolled} enrolled · {completed} completed</div>
                </div>
              )
            })}
          </div>

          {filteredTraining.length === 0 ? <EmptyState text="No caregivers match the current filter." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredTraining.map((row) => <TrainingGapCard key={row.caregiver_id} row={row} />)}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: APPRAISAL HEATMAP ── */}
      {activeTab === 'heatmap' && (
        <div style={{ marginTop: 20 }}>
          {heatmapRows.length === 0 ? (
            <EmptyState text="No appraisals on record yet. Appraisals will appear here once sent or signed." />
          ) : (
            <>
              {/* Team averages banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Clinical Average',      value: teamClinicalAvg,      subtitle: `${CLINICAL_COMPETENCIES.length} competencies` },
                  { label: 'Professional Average',   value: teamProfessionalAvg,  subtitle: `${PROFESSIONAL_COMPETENCIES.length} competencies` },
                  { label: 'Overall Team Average',   value: teamOverallAvg,       subtitle: `${heatmapRows.length} appraisals` },
                ].map((item) => {
                  const color = scoreColor(item.value)
                  return (
                    <div key={item.label} style={{ background: C.white, borderRadius: 10, padding: '16px 20px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{item.value > 0 ? item.value.toFixed(1) : '—'}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.subtitle}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Scale: 1 (Does Not Meet) → 4 (Exceeds)</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <ToggleGroup
                  options={[{ value: 'clinical', label: `Clinical (${CLINICAL_COMPETENCIES.length})` }, { value: 'professional', label: `Professional (${PROFESSIONAL_COMPETENCIES.length})` }, { value: 'all', label: 'All 40' }]}
                  value={heatmapSection} onChange={(v) => setHeatmapSection(v as any)}
                />
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 260 }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
                  <input value={heatmapSearch} onChange={(e) => setHeatmapSearch(e.target.value)} placeholder="Search caregiver…" style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.white, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Score scale legend */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Scale:</span>
                {[{ s: 1, label: '1 — Does Not Meet' }, { s: 2, label: '2 — Needs Improvement' }, { s: 3, label: '3 — Meets Standards' }, { s: 4, label: '4 — Exceeds Standards' }].map(({ s, label }) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: scoreColor(s) }} />
                    <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: '#E8EDF0' }} />
                  <span style={{ fontSize: 11, color: C.muted }}>Not scored</span>
                </div>
              </div>

              {/* Heatmap grid */}
              <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 12, background: C.white, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
                  <thead>
                    <tr style={{ background: C.greyLight }}>
                      <th style={{ position: 'sticky', left: 0, zIndex: 3, background: C.greyLight, padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', borderBottom: `2px solid ${C.border}`, minWidth: 170 }}>Caregiver</th>
                      {visibleCompetencies.map((comp) => (
                        <th key={comp.key} title={comp.short_label} style={{ padding: '4px 3px', textAlign: 'center', fontSize: 9, fontWeight: 700, color: C.muted, borderBottom: `2px solid ${C.border}`, width: 48, minWidth: 48, maxWidth: 48 }}>
                          <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', lineHeight: 1.2, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: 70 }}>
                            {comp.short_label}
                          </div>
                        </th>
                      ))}
                      <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: C.muted, borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap' }}>Avg</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: C.muted, borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: C.muted, borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHeatmapRows.map((row, idx) => {
                      const sectionAvg = heatmapSection === 'clinical' ? row.clinical_avg : heatmapSection === 'professional' ? row.professional_avg : row.overall_avg
                      return (
                        <tr key={row.caregiver_id} style={{ background: idx % 2 === 0 ? C.white : C.greyLight, borderBottom: `1px solid ${C.border}22` }}>
                          <td style={{ position: 'sticky', left: 0, zIndex: 1, background: idx % 2 === 0 ? C.white : C.greyLight, padding: '8px 16px', borderRight: `1px solid ${C.border}44`, whiteSpace: 'nowrap', fontWeight: 600, fontSize: 13, color: C.primary }}>{row.caregiver_name}</td>
                          {visibleCompetencies.map((comp) => {
                            const score = row.scores[comp.key] || 0
                            return (
                              <td key={comp.key} title={`${comp.short_label}: ${score > 0 ? score : 'Not scored'}`} style={{ textAlign: 'center', padding: '6px 3px' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 6, background: scoreColor(score), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', cursor: 'default' }}>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: scoreTextColor(score) }}>{score > 0 ? score : ''}</span>
                                </div>
                              </td>
                            )
                          })}
                          <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(sectionAvg) }}>{sectionAvg > 0 ? sectionAvg.toFixed(1) : '—'}</span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: row.status === 'signed' ? C.green : row.status === 'sent' ? C.amber : C.grey, background: (row.status === 'signed' ? C.green : row.status === 'sent' ? C.amber : C.grey) + '18', borderRadius: 20, padding: '2px 8px' }}>
                              {row.status === 'signed' ? '✓ Signed' : row.status === 'sent' ? 'Sent' : 'Draft'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '8px 10px', fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>{fmt(row.appraisal_date)}</td>
                        </tr>
                      )
                    })}
                    {/* Team average footer */}
                    <tr style={{ background: '#EFF8F8', borderTop: `2px solid ${C.teal}22` }}>
                      <td style={{ position: 'sticky', left: 0, background: '#EFF8F8', padding: '10px 16px', fontWeight: 700, fontSize: 12, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Team Average</td>
                      {visibleCompetencies.map((comp) => {
                        const vals = filteredHeatmapRows.map((r) => r.scores[comp.key] || 0).filter((v) => v > 0)
                        const avg = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : 0
                        return (
                          <td key={comp.key} style={{ textAlign: 'center', padding: '6px 3px' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 6, background: avg > 0 ? scoreColor(avg) : '#E8EDF0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: avg > 0 ? '2px solid rgba(255,255,255,0.3)' : 'none' }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: avg > 0 ? '#fff' : C.muted }}>{avg > 0 ? avg.toFixed(1) : ''}</span>
                            </div>
                          </td>
                        )
                      })}
                      <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: C.teal }}>
                          {heatmapSection === 'clinical' ? teamClinicalAvg.toFixed(1) : heatmapSection === 'professional' ? teamProfessionalAvg.toFixed(1) : teamOverallAvg.toFixed(1)}
                        </span>
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>* Showing latest appraisal per caregiver. Signed appraisals shown first; falls back to sent, then draft.</p>
            </>
          )}
        </div>
      )}

      {/* ── TAB 6: REFERENCES PIPELINE ── */}
      {activeTab === 'refs' && (
        <div style={{ marginTop: 20 }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            <StatCard value={refStats.total}        label="Total Slots"    sub="3 per caregiver"     color={C.teal} />
            <StatCard value={refStats.received}     label="Received"       sub="Submitted by referee" color={C.green} />
            <StatCard value={refStats.sent}         label="Awaiting"       sub="Sent, not yet back"   color={C.amber} />
            <StatCard value={refStats.not_sent}     label="Not Sent"       sub="Request not sent yet" color={C.grey} />
            <StatCard value={`${refStats.pct_received}%`} label="Completion" sub="Of all reference slots" color={refStats.pct_received >= 80 ? C.green : refStats.pct_received >= 50 ? C.amber : C.red} />
            <StatCard value={avgDaysToReceive !== null ? `${avgDaysToReceive}d` : '—'} label="Avg. Turnaround" sub="Days sent → received" color={C.blue} />
          </div>

          {/* Slot-type breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[1, 2, 3].map((slot) => {
              const slotRows = refPipelineRows.filter((r) => r.slot === slot)
              const received = slotRows.filter((r) => r.status === 'received').length
              const sent = slotRows.filter((r) => r.status === 'sent').length
              const notSent = slotRows.filter((r) => r.status === 'not_sent').length
              const slotLabel = slot === 3 ? 'Character Reference' : `Professional Reference ${slot}`
              const receivedTimes = slotRows.filter((r) => r.days_to_receive !== null).map((r) => r.days_to_receive as number)
              const avgDays = receivedTimes.length > 0 ? Math.round(receivedTimes.reduce((s, v) => s + v, 0) / receivedTimes.length) : null
              const pct = slotRows.length > 0 ? Math.round((received / slotRows.length) * 100) : 0
              return (
                <div key={slot} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.primary, marginBottom: 10 }}>{slotLabel}</div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 12 }}>
                    <span style={{ color: C.green, fontWeight: 700 }}>✓ {received} received</span>
                    <span style={{ color: C.amber, fontWeight: 600 }}>⏳ {sent} sent</span>
                    <span style={{ color: C.grey }}>○ {notSent} not sent</span>
                  </div>
                  <div style={{ height: 6, background: '#E8EDF0', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? C.green : pct >= 50 ? C.amber : C.red, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>{pct}% complete{avgDays !== null ? ` · avg ${avgDays}d turnaround` : ''}</div>
                </div>
              )
            })}
          </div>

          {/* Filter + list */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={refsFilter} onChange={(e) => setRefsFilter(e.target.value as typeof refsFilter)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.white, cursor: 'pointer' }}>
              <option value="all">All Slots ({refStats.total})</option>
              <option value="received">Received ({refStats.received})</option>
              <option value="sent">Awaiting ({refStats.sent})</option>
              <option value="not_sent">Not Sent ({refStats.not_sent})</option>
            </select>
            <ToggleGroup options={[{ value: 'caregiver', label: 'By Caregiver' }, { value: 'slot', label: 'By Slot Type' }]} value={refsGroupBy} onChange={(v) => setRefsGroupBy(v as any)} dark />
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}><strong>{filteredRefs.length}</strong> slots</span>
          </div>

          <RefPipelineList rows={filteredRefs} groupBy={refsGroupBy} />
        </div>
      )}

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function TabBtn({ tab, active, badge, onClick, intelligence }: {
  tab: typeof TABS[number]; active: boolean; badge?: number
  onClick: () => void; intelligence?: boolean
}) {
  const activeColor = intelligence ? C.purple : C.teal
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13,
      fontWeight: active ? 700 : 500, border: 'none', background: 'transparent', cursor: 'pointer',
      color: active ? activeColor : C.muted,
      borderBottom: active ? `3px solid ${activeColor}` : '3px solid transparent', marginBottom: -1,
    }}>
      {tab.icon} {tab.label}
      {badge !== undefined && (
        <span style={{ background: active ? (intelligence ? C.purpleLight : C.tealLight) : C.greyLight, color: active ? activeColor : C.muted, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{badge}</span>
      )}
    </button>
  )
}

function ToggleGroup({ options, value, onChange, dark }: {
  options: { value: string | number; label: string }[]
  value: string | number; onChange: (v: string | number) => void; dark?: boolean
}) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      {options.map((opt, i) => (
        <button key={String(opt.value)} onClick={() => onChange(opt.value)} style={{
          padding: '8px 14px', fontSize: 13, fontWeight: value === opt.value ? 700 : 500, border: 'none',
          borderRight: i < options.length - 1 ? `1px solid ${C.border}` : 'none',
          background: value === opt.value ? (dark ? C.primary : C.teal) : C.white,
          color: value === opt.value ? '#fff' : C.text, cursor: 'pointer',
        }}>{opt.label}</button>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ background: C.greyLight, border: `1px solid ${C.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center', color: C.muted, fontSize: 14 }}>{text}</div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineView({ items, groupBy }: { items: TimelineItem[]; groupBy: 'caregiver' | 'type' }) {
  const groups: Array<{ key: string; label: string; items: TimelineItem[] }> = []
  const seen = new Map<string, TimelineItem[]>()
  for (const item of items) {
    const key = groupBy === 'caregiver' ? item.caregiver_id : item.credential_type_id
    const label = groupBy === 'caregiver' ? item.caregiver_name : item.credential_type_name
    if (!seen.has(key)) { seen.set(key, []); groups.push({ key, label, items: [] }) }
    seen.get(key)!.push(item)
  }
  for (const g of groups) g.items = seen.get(g.key)!
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {groups.map((g) => <TimelineGroup key={g.key} group={g} groupBy={groupBy} />)}
    </div>
  )
}

function TimelineGroup({ group, groupBy }: { group: { key: string; label: string; items: TimelineItem[] }; groupBy: 'caregiver' | 'type' }) {
  const [open, setOpen] = useState(true)
  const urgent = group.items.filter((i) => i.days_until <= 30).length
  const borderColor = urgent > 0 ? C.red : group.items.some((i) => i.days_until <= 90) ? C.amber : C.green
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', borderLeft: `4px solid ${borderColor}` }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.primary }}>{group.label}</span>
          <span style={{ fontSize: 11, color: C.muted }}>{group.items.length} expiring</span>
          {urgent > 0 && <span style={{ background: '#FDECEA', color: C.red, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 7px' }}>{urgent} within 30d</span>}
        </div>
        {open ? <ChevronUp size={14} color={C.muted} /> : <ChevronDown size={14} color={C.muted} />}
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}33` }}>
          {group.items.map((item, idx) => {
            const u = item.days_until <= 14 ? C.red : item.days_until <= 30 ? '#E07800' : item.days_until <= 90 ? C.amber : C.green
            const uBg = item.days_until <= 14 ? '#FDECEA' : item.days_until <= 30 ? '#FEF3EA' : item.days_until <= 90 ? '#FEF9EF' : '#E8F8F5'
            const label = groupBy === 'caregiver' ? item.credential_type_name : item.caregiver_name
            return (
              <div key={`${item.caregiver_id}-${item.credential_type_id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: idx % 2 === 0 ? C.white : C.greyLight, borderBottom: idx < group.items.length - 1 ? `1px solid ${C.border}22` : 'none' }}>
                <div style={{ minWidth: 60, textAlign: 'center', background: uBg, border: `1px solid ${u}44`, borderRadius: 8, padding: '4px 6px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: u, lineHeight: 1 }}>{item.days_until}</div>
                  <div style={{ fontSize: 9, color: u, fontWeight: 600 }}>days</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Expires {fmtShort(item.expiry_date)}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: u, background: uBg, border: `1px solid ${u}44`, borderRadius: 20, padding: '3px 10px', textTransform: 'capitalize' }}>{item.status}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Training Gap Card ────────────────────────────────────────────────────────

function TrainingGapCard({ row }: { row: TrainingGapRow }) {
  const [open, setOpen] = useState(false)
  const overallColor = row.completed_all ? C.green : row.has_overdue ? C.red : row.overall_pct >= 60 ? C.amber : C.grey
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', borderLeft: `4px solid ${overallColor}` }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.primary }}>{row.caregiver_name}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {row.enrollments.length} programme{row.enrollments.length !== 1 ? 's' : ''} enrolled
            {row.not_enrolled_count > 0 && <span style={{ color: C.amber, fontWeight: 600, marginLeft: 8 }}>· {row.not_enrolled_count} not enrolled</span>}
            {row.has_overdue && <span style={{ color: C.red, fontWeight: 600, marginLeft: 8 }}>· has overdue</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: overallColor }}>{row.overall_pct}%</div>
            <div style={{ fontSize: 10, color: C.muted }}>overall</div>
          </div>
          {open ? <ChevronUp size={14} color={C.muted} /> : <ChevronDown size={14} color={C.muted} />}
        </div>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}33`, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {row.enrollments.length === 0 ? (
            <div style={{ fontSize: 13, color: C.muted }}>No programme enrollments yet.</div>
          ) : row.enrollments.map((e) => {
            const color = e.is_completed ? C.green : e.is_overdue ? C.red : e.progress_pct >= 50 ? C.amber : C.grey
            return (
              <div key={e.programme_id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{e.programme_title}</span>
                    {e.is_overdue && <span style={{ fontSize: 10, fontWeight: 700, color: C.red, background: '#FDECEA', borderRadius: 20, padding: '1px 7px' }}>OVERDUE</span>}
                    {e.is_completed && <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: '#E8F8F5', borderRadius: 20, padding: '1px 7px' }}>✓ Complete</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#E8EDF0', borderRadius: 3 }}>
                      <div style={{ width: `${e.progress_pct}%`, height: '100%', background: color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{e.completed_modules}/{e.total_modules} modules</span>
                  </div>
                  {e.due_date && !e.is_completed && (
                    <div style={{ fontSize: 11, color: e.is_overdue ? C.red : C.muted, marginTop: 3 }}>
                      Due {new Date(e.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── References Pipeline List ─────────────────────────────────────────────────

function RefPipelineList({ rows, groupBy }: { rows: RefPipelineRow[]; groupBy: 'caregiver' | 'slot' }) {
  const groups = useMemo(() => {
    const map = new Map<string, RefPipelineRow[]>()
    for (const r of rows) {
      const key = groupBy === 'caregiver' ? r.caregiver_id : String(r.slot)
      const label = groupBy === 'caregiver' ? r.caregiver_name : r.slot_label
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key, label: groupBy === 'caregiver' ? items[0].caregiver_name : items[0].slot_label, items,
    }))
  }, [rows, groupBy])

  if (rows.length === 0) return <EmptyState text="No references match the current filter." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {groups.map((g) => <RefGroup key={g.key} group={g} groupBy={groupBy} />)}
    </div>
  )
}

function RefGroup({ group, groupBy }: { group: { key: string; label: string; items: RefPipelineRow[] }; groupBy: 'caregiver' | 'slot' }) {
  const [open, setOpen] = useState(true)
  const received = group.items.filter((r) => r.status === 'received').length
  const outstanding = group.items.filter((r) => r.status === 'sent').length
  const borderColor = outstanding > 0 ? C.amber : received === group.items.length ? C.green : C.grey

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', borderLeft: `4px solid ${borderColor}` }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.primary }}>{group.label}</span>
          <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>✓ {received}</span>
          {outstanding > 0 && <span style={{ fontSize: 11, color: C.amber, fontWeight: 600 }}>⏳ {outstanding} awaiting</span>}
        </div>
        {open ? <ChevronUp size={14} color={C.muted} /> : <ChevronDown size={14} color={C.muted} />}
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}33` }}>
          {group.items.map((r, idx) => {
            const statusColor = r.status === 'received' ? C.green : r.status === 'sent' ? C.amber : C.grey
            const label = groupBy === 'caregiver' ? r.slot_label : r.caregiver_name
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: idx % 2 === 0 ? C.white : C.greyLight, borderBottom: idx < group.items.length - 1 ? `1px solid ${C.border}22` : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {r.sent_at && <span>Sent {fmtShort(r.sent_at)}</span>}
                    {r.received_at && <span style={{ color: C.green }}>Received {fmtShort(r.received_at)}</span>}
                    {r.days_to_receive !== null && <span>Turnaround: {r.days_to_receive}d</span>}
                    {r.days_outstanding !== null && <span style={{ color: C.amber }}>Outstanding {r.days_outstanding}d</span>}
                    {r.overall_recommendation && <span style={{ color: C.teal, fontWeight: 600 }}>{r.overall_recommendation.replace(/_/g, ' ')}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusColor + '18', border: `1px solid ${statusColor}44`, borderRadius: 20, padding: '3px 10px', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {r.status === 'not_sent' ? 'Not Sent' : r.status === 'sent' ? 'Awaiting' : 'Received'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
