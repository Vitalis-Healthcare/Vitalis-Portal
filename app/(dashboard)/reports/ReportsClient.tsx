'use client'
// app/(dashboard)/reports/ReportsClient.tsx
// Three-tab compliance reporting UI:
//   Tab 1 — Compliance Matrix (caregiver × dimension grid, PDF + CSV export)
//   Tab 2 — Credential Expiry Timeline (90 / 180 / 365 day views)
//   Tab 3 — Compliance Snapshots (save dated audit-trail states)

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3, Download, FileText, Camera,
  AlertTriangle, CheckCircle, XCircle, Clock, Minus,
  ChevronDown, ChevronUp, Search, Filter, Calendar, Save,
  RefreshCw, Shield
} from 'lucide-react'
import type { MatrixRow, CredTypeInfo, TimelineItem, CredStatus } from '@/lib/reports'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Snapshot {
  id: string
  created_at: string
  label: string
  created_by_name: string
  caregiver_count: number
  overall_compliance_pct: number
}

interface Props {
  matrixRows: MatrixRow[]
  caregiverCredTypes: CredTypeInfo[]
  timelineItems: TimelineItem[]
  generatedAt: string
  totalCaregivers: number
  overallCompliancePct: number
  initialSnapshots: Snapshot[]
  adminId: string
  adminName: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  primary:   '#1A2E44',
  teal:      '#0E7C7B',
  tealLight: '#E6F4F4',
  tealBg:    '#F0FAF9',
  green:     '#2A9D8F',
  amber:     '#F4A261',
  red:       '#E63946',
  purple:    '#9B59B6',
  purpleLight:'#F3EBF9',
  grey:      '#8FA0B0',
  greyLight: '#F8FAFB',
  border:    '#D1D9E0',
  white:     '#ffffff',
  text:      '#1A2E44',
  muted:     '#8FA0B0',
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

type StatusConfig = {
  color: string
  bg: string
  label: string
  icon: string
}

const STATUS_CONFIG: Record<CredStatus, StatusConfig> = {
  current:      { color: C.green,  bg: '#E8F8F5', label: 'Current',  icon: '●' },
  expiring:     { color: C.amber,  bg: '#FEF3EA', label: 'Expiring', icon: '◐' },
  expired:      { color: C.red,    bg: '#FDECEA', label: 'Expired',  icon: '✕' },
  missing:      { color: C.purple, bg: C.purpleLight, label: 'Missing', icon: '◉' },
  na:           { color: C.grey,   bg: C.greyLight,   label: 'N/A',    icon: '—' },
  not_required: { color: '#C8D4DC',bg: 'transparent',  label: '',       icon: '' },
}

// ─── Status cell ─────────────────────────────────────────────────────────────

function CredCell({ cell }: { cell: { status: CredStatus; expiry_date?: string | null; does_not_expire?: boolean } }) {
  const cfg = STATUS_CONFIG[cell.status]
  if (cell.status === 'not_required') return <span style={{ color: '#D1D9E0', fontSize: 16 }}>—</span>

  const tooltip =
    cell.status === 'na'           ? 'Not Applicable' :
    cell.does_not_expire           ? 'No Expiry Required' :
    cell.expiry_date               ? `${cfg.label}: ${fmt(cell.expiry_date)}` :
    cfg.label

  return (
    <div
      title={tooltip}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: '50%',
        background: cfg.bg, border: `2px solid ${cfg.color}22`,
        cursor: 'default',
      }}
    >
      <span style={{ color: cfg.color, fontSize: cell.status === 'missing' ? 13 : 14, fontWeight: 700 }}>
        {cfg.icon}
      </span>
    </div>
  )
}

// ─── Training bar ─────────────────────────────────────────────────────────────

function TrainingBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? C.green : pct >= 50 ? C.amber : C.red
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ width: 52, height: 6, background: '#E8EDF0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color }}>{pct}%</span>
    </div>
  )
}

// ─── Refs pill ────────────────────────────────────────────────────────────────

function RefsPill({ received }: { received: number }) {
  const color = received === 3 ? C.green : received >= 1 ? C.amber : C.grey
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color,
      background: received === 3 ? '#E8F8F5' : received >= 1 ? '#FEF3EA' : C.greyLight,
      border: `1px solid ${color}44`, borderRadius: 20,
      padding: '2px 8px', whiteSpace: 'nowrap'
    }}>
      {received}/3
    </span>
  )
}

// ─── Appraisal cell ───────────────────────────────────────────────────────────

function AppraisalCell({ appraisal }: { appraisal: MatrixRow['latest_appraisal'] }) {
  if (!appraisal) return <span style={{ color: C.muted, fontSize: 11 }}>None</span>
  const scoreColor =
    appraisal.avg_score >= 3.5 ? C.green :
    appraisal.avg_score >= 2.5 ? C.teal :
    appraisal.avg_score >= 1.5 ? C.amber : C.red
  const statusColor = appraisal.status === 'signed' ? C.green : appraisal.status === 'sent' ? C.amber : C.grey
  const statusLabel = appraisal.status === 'signed' ? '✓ Signed' : appraisal.status === 'sent' ? '⏳ Sent' : 'Draft'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
      {appraisal.avg_score > 0 && (
        <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>{appraisal.avg_score.toFixed(1)}/4</span>
      )}
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      {(Object.entries(STATUS_CONFIG) as [CredStatus, StatusConfig][])
        .filter(([k]) => k !== 'not_required')
        .map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: cfg.bg, border: `2px solid ${cfg.color}`, flexShrink: 0
            }} />
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{cfg.label}</span>
          </div>
        ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ color: '#D1D9E0', fontSize: 14 }}>—</span>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Not Required</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportsClient({
  matrixRows,
  caregiverCredTypes,
  timelineItems,
  generatedAt,
  totalCaregivers,
  overallCompliancePct,
  initialSnapshots,
  adminId,
  adminName,
}: Props) {
  const router = useRouter()

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'matrix' | 'timeline' | 'snapshots'>('matrix')

  // ── Matrix filters ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CredStatus>('all')
  const [showFilters, setShowFilters] = useState(false)

  // ── Timeline ───────────────────────────────────────────────────────────────
  const [horizon, setHorizon] = useState<90 | 180 | 365>(90)
  const [groupBy, setGroupBy] = useState<'caregiver' | 'type'>('caregiver')

  // ── Snapshots ──────────────────────────────────────────────────────────────
  const [snapshots, setSnapshots] = useState<Snapshot[]>(initialSnapshots)
  const [snapshotLabel, setSnapshotLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [viewingSnapshot, setViewingSnapshot] = useState<Snapshot | null>(null)

  // ── Filtered matrix rows ───────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = matrixRows
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((r) => r.full_name.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') {
      rows = rows.filter((r) =>
        Object.values(r.credentials).some((c) => c.status === statusFilter),
      )
    }
    return rows
  }, [matrixRows, search, statusFilter])

  // ── Filtered timeline ──────────────────────────────────────────────────────
  const filteredTimeline = useMemo(
    () => timelineItems.filter((i) => i.days_until <= horizon),
    [timelineItems, horizon],
  )

  // ── Summary stats ──────────────────────────────────────────────────────────
  const matrixStats = useMemo(() => {
    let current = 0, expiring = 0, expired = 0, missing = 0
    for (const row of matrixRows) {
      for (const cell of Object.values(row.credentials)) {
        if (cell.status === 'current')  current++
        if (cell.status === 'expiring') expiring++
        if (cell.status === 'expired')  expired++
        if (cell.status === 'missing')  missing++
      }
    }
    return { current, expiring, expired, missing }
  }, [matrixRows])

  // ── Save snapshot ──────────────────────────────────────────────────────────
  const handleSaveSnapshot = useCallback(async () => {
    if (!snapshotLabel.trim()) {
      setSaveMsg({ type: 'error', text: 'Please enter a label for this snapshot.' })
      return
    }
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/reports/snapshot/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: snapshotLabel.trim(),
          adminId,
          adminName,
          matrixRows,
          caregiverCredTypes,
          generatedAt,
          totalCaregivers,
          overallCompliancePct,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      // Prepend to local snapshots list
      setSnapshots((prev) => [json.snapshot, ...prev])
      setSnapshotLabel('')
      setSaveMsg({ type: 'success', text: `Snapshot "${json.snapshot.label}" saved.` })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setSaveMsg({ type: 'error', text: msg })
    } finally {
      setSaving(false)
    }
  }, [snapshotLabel, adminId, adminName, matrixRows, caregiverCredTypes, generatedAt, totalCaregivers, overallCompliancePct])

  // ── PDF export ─────────────────────────────────────────────────────────────
  const handlePdfExport = () => {
    window.open('/api/reports/compliance-pdf', '_blank')
  }

  // ── CSV export ─────────────────────────────────────────────────────────────
  const handleCsvExport = () => {
    window.open('/api/reports/compliance-csv', '_blank')
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1600, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.primary, margin: 0 }}>Compliance Reports</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            Vitalis Healthcare Services · Generated {fmt(generatedAt)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleCsvExport}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
              background: C.greyLight, border: `1px solid ${C.border}`, borderRadius: 8,
              color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={handlePdfExport}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
              background: C.teal, border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <FileText size={14} /> PDF / Print
          </button>
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Caregivers',       value: totalCaregivers,             color: C.teal,   sub: 'Active' },
          { label: 'Fleet Compliance', value: `${overallCompliancePct}%`,  color: overallCompliancePct >= 80 ? C.green : overallCompliancePct >= 60 ? C.amber : C.red, sub: 'Credential avg' },
          { label: 'Current',          value: matrixStats.current,         color: C.green,  sub: 'Credentials ok' },
          { label: 'Expiring',         value: matrixStats.expiring,        color: C.amber,  sub: 'Need renewal' },
          { label: 'Expired',          value: matrixStats.expired,         color: C.red,    sub: 'Overdue' },
          { label: 'Missing',          value: matrixStats.missing,         color: C.purple, sub: 'Not on file' },
        ].map((card, i) => (
          <div key={i} style={{
            background: C.white, borderRadius: 10, padding: '16px 18px',
            borderLeft: `4px solid ${card.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginTop: 4 }}>{card.label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 0,
        borderBottom: `1px solid ${C.border}`, paddingBottom: 0
      }}>
        {([
          { key: 'matrix',    label: 'Compliance Matrix', icon: <BarChart3 size={14}/> },
          { key: 'timeline',  label: 'Expiry Timeline',   icon: <Calendar  size={14}/> },
          { key: 'snapshots', label: 'Snapshots',         icon: <Camera    size={14}/> },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 18px', fontSize: 13, fontWeight: activeTab === key ? 700 : 500,
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: activeTab === key ? C.teal : C.muted,
              borderBottom: activeTab === key ? `3px solid ${C.teal}` : '3px solid transparent',
              marginBottom: -1,
            }}
          >
            {icon} {label}
            {key === 'snapshots' && snapshots.length > 0 && (
              <span style={{
                background: C.tealLight, color: C.teal, borderRadius: 20,
                fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 2
              }}>{snapshots.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — COMPLIANCE MATRIX
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'matrix' && (
        <div style={{ marginTop: 20 }}>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search caregiver…"
                style={{
                  width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8,
                  border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
                  background: C.white, outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                fontSize: 13, color: C.text, background: C.white, cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="expiring">Has Expiring</option>
              <option value="expired">Has Expired</option>
              <option value="missing">Has Missing</option>
              <option value="current">Current Only</option>
            </select>

            <span style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}>
              Showing <strong>{filteredRows.length}</strong> of <strong>{matrixRows.length}</strong> caregivers
            </span>
          </div>

          {/* Legend */}
          <div style={{ marginBottom: 12 }}><Legend /></div>

          {/* Matrix table */}
          {filteredRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: C.muted, fontSize: 14 }}>
              No caregivers match the current filters.
            </div>
          ) : (
            <div style={{
              overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 12,
              background: C.white, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
                <thead>
                  <tr style={{ background: C.greyLight }}>
                    {/* Sticky name column */}
                    <th style={{
                      position: 'sticky', left: 0, zIndex: 3,
                      background: C.greyLight, padding: '12px 16px',
                      textAlign: 'left', fontSize: 11, fontWeight: 700,
                      color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px',
                      borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap',
                      minWidth: 180
                    }}>
                      Caregiver
                    </th>

                    {/* Credential type columns */}
                    {caregiverCredTypes.map((ct) => (
                      <th key={ct.id} title={ct.name} style={{
                        padding: '8px 6px', textAlign: 'center', fontSize: 10,
                        fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                        letterSpacing: '0.5px', borderBottom: `2px solid ${C.border}`,
                        width: 70, minWidth: 70, maxWidth: 70,
                        whiteSpace: 'normal', lineHeight: 1.3
                      }}>
                        {ct.short_name}
                      </th>
                    ))}

                    {/* Non-credential columns */}
                    {[
                      { label: 'Training', w: 72 },
                      { label: 'Refs',     w: 60 },
                      { label: 'Policies', w: 66 },
                      { label: 'Appraisal',w: 90 },
                    ].map(({ label, w }) => (
                      <th key={label} style={{
                        padding: '12px 8px', textAlign: 'center', fontSize: 11,
                        fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                        letterSpacing: '0.8px', borderBottom: `2px solid ${C.border}`,
                        width: w, whiteSpace: 'nowrap'
                      }}>
                        {label}
                      </th>
                    ))}

                    {/* Compliance % */}
                    <th style={{
                      padding: '12px 12px', textAlign: 'center', fontSize: 11,
                      fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                      letterSpacing: '0.8px', borderBottom: `2px solid ${C.border}`,
                      width: 80, whiteSpace: 'nowrap'
                    }}>
                      Cred %
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row, idx) => {
                    const pctColor = row.credential_compliance_pct >= 80 ? C.green : row.credential_compliance_pct >= 60 ? C.amber : C.red
                    return (
                      <tr key={row.id} style={{
                        background: idx % 2 === 0 ? C.white : C.greyLight,
                        borderBottom: `1px solid ${C.border}22`
                      }}>
                        {/* Sticky name cell */}
                        <td style={{
                          position: 'sticky', left: 0, zIndex: 1,
                          background: idx % 2 === 0 ? C.white : C.greyLight,
                          padding: '10px 16px', borderRight: `1px solid ${C.border}44`
                        }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: C.primary, whiteSpace: 'nowrap' }}>
                            {row.full_name}
                          </div>
                          {row.position_name && (
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                              {row.position_name}
                            </div>
                          )}
                        </td>

                        {/* Credential cells */}
                        {caregiverCredTypes.map((ct) => (
                          <td key={ct.id} style={{ textAlign: 'center', padding: '8px 4px' }}>
                            <CredCell cell={row.credentials[ct.id] || { status: 'missing' }} />
                          </td>
                        ))}

                        {/* Training */}
                        <td style={{ textAlign: 'center', padding: '8px 6px' }}>
                          <TrainingBar pct={row.training_pct} />
                        </td>

                        {/* References */}
                        <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                          <RefsPill received={row.refs_received} />
                        </td>

                        {/* Policies */}
                        <td style={{ textAlign: 'center', padding: '8px 6px' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: row.policies_signed > 0 ? C.teal : C.muted }}>
                            {row.policies_signed}
                          </span>
                        </td>

                        {/* Appraisal */}
                        <td style={{ textAlign: 'center', padding: '8px 6px' }}>
                          <AppraisalCell appraisal={row.latest_appraisal} />
                        </td>

                        {/* Cred % */}
                        <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color: pctColor,
                            background: pctColor + '18', borderRadius: 20,
                            padding: '3px 8px', whiteSpace: 'nowrap'
                          }}>
                            {row.credential_compliance_pct}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* Summary footer */}
                <tfoot>
                  <tr style={{ background: '#EFF8F8', borderTop: `2px solid ${C.teal}22` }}>
                    <td style={{
                      position: 'sticky', left: 0, background: '#EFF8F8',
                      padding: '10px 16px', fontWeight: 700, fontSize: 12,
                      color: C.teal, textTransform: 'uppercase', letterSpacing: '0.6px'
                    }}>
                      Summary ({filteredRows.length})
                    </td>
                    {caregiverCredTypes.map((ct) => {
                      const cells = filteredRows.map((r) => r.credentials[ct.id]?.status)
                      const ok = cells.filter((s) => s === 'current' || s === 'na').length
                      const warn = cells.filter((s) => s === 'expiring').length
                      const bad = cells.filter((s) => s === 'expired' || s === 'missing').length
                      return (
                        <td key={ct.id} style={{ textAlign: 'center', padding: '8px 4px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: 10, fontWeight: 600 }}>
                            {ok > 0    && <span style={{ color: C.green  }}>✓ {ok}</span>}
                            {warn > 0  && <span style={{ color: C.amber  }}>⚠ {warn}</span>}
                            {bad > 0   && <span style={{ color: C.red    }}>✕ {bad}</span>}
                          </div>
                        </td>
                      )
                    })}
                    <td style={{ textAlign: 'center', padding: '8px 6px', fontSize: 11, fontWeight: 700, color: C.teal }}>
                      {filteredRows.length > 0
                        ? `${Math.round(filteredRows.reduce((s, r) => s + r.training_pct, 0) / filteredRows.length)}%`
                        : '—'
                      }
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 4px', fontSize: 11, fontWeight: 700, color: C.teal }}>
                      {filteredRows.reduce((s, r) => s + r.refs_received, 0)}/{filteredRows.length * 3}
                    </td>
                    <td colSpan={2} style={{ textAlign: 'center', padding: '8px 6px' }} />
                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.teal }}>
                        {filteredRows.length > 0
                          ? `${Math.round(filteredRows.reduce((s, r) => s + r.credential_compliance_pct, 0) / filteredRows.length)}%`
                          : '—'
                        }
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <p style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>
            * Credential % = required credentials that are Current, Expiring, or N/A ÷ total required credentials.
            Expiring credentials count as ok for compliance calculation; they appear in amber as an action signal.
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — EXPIRY TIMELINE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'timeline' && (
        <div style={{ marginTop: 20 }}>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 0, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {([90, 180, 365] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  style={{
                    padding: '8px 16px', fontSize: 13, fontWeight: horizon === h ? 700 : 500,
                    border: 'none', borderRight: h !== 365 ? `1px solid ${C.border}` : 'none',
                    background: horizon === h ? C.teal : C.white,
                    color: horizon === h ? '#fff' : C.text, cursor: 'pointer'
                  }}
                >
                  {h} days
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 0, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {([['caregiver','By Caregiver'],['type','By Credential']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setGroupBy(val)}
                  style={{
                    padding: '8px 14px', fontSize: 13, fontWeight: groupBy === val ? 700 : 500,
                    border: 'none', borderRight: val === 'caregiver' ? `1px solid ${C.border}` : 'none',
                    background: groupBy === val ? C.primary : C.white,
                    color: groupBy === val ? '#fff' : C.text, cursor: 'pointer'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <span style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}>
              <strong>{filteredTimeline.length}</strong> credential{filteredTimeline.length !== 1 ? 's' : ''} expiring within {horizon} days
            </span>
          </div>

          {filteredTimeline.length === 0 ? (
            <div style={{
              background: C.tealBg, border: `1px solid ${C.teal}33`, borderRadius: 12,
              padding: '40px 24px', textAlign: 'center'
            }}>
              <CheckCircle size={32} color={C.green} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>All clear!</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                No credentials expiring within the next {horizon} days.
              </div>
            </div>
          ) : (
            <TimelineView items={filteredTimeline} groupBy={groupBy} />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — SNAPSHOTS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'snapshots' && (
        <div style={{ marginTop: 20 }}>

          {/* Save new snapshot */}
          <div style={{
            background: C.tealBg, border: `1px solid ${C.teal}44`,
            borderRadius: 12, padding: '20px 24px', marginBottom: 24
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.primary, marginBottom: 4 }}>
              Save Compliance Snapshot
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
              Saves the current compliance state as a dated audit record. Use before BCHD submissions or quarterly reviews.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                placeholder={`e.g. Q1 2026 BCHD Submission — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                style={{
                  flex: '1 1 320px', padding: '9px 14px', borderRadius: 8,
                  border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
                  background: C.white, outline: 'none'
                }}
              />
              <button
                onClick={handleSaveSnapshot}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px',
                  background: saving ? C.muted : C.teal, border: 'none', borderRadius: 8,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Snapshot'}
              </button>
            </div>
            {saveMsg && (
              <div style={{
                marginTop: 10, padding: '8px 14px', borderRadius: 8, fontSize: 13,
                background: saveMsg.type === 'success' ? '#E8F8F5' : '#FDECEA',
                color: saveMsg.type === 'success' ? C.green : C.red,
                border: `1px solid ${saveMsg.type === 'success' ? C.green : C.red}44`
              }}>
                {saveMsg.type === 'success' ? '✓ ' : '✕ '}{saveMsg.text}
              </div>
            )}
          </div>

          {/* Snapshot list */}
          {snapshots.length === 0 ? (
            <div style={{
              background: C.greyLight, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '40px 24px', textAlign: 'center'
            }}>
              <Shield size={32} color={C.muted} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>No snapshots yet</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                Save your first snapshot above to begin your audit trail.
              </div>
            </div>
          ) : (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 100px 120px 100px',
                padding: '10px 20px', background: C.greyLight,
                borderBottom: `1px solid ${C.border}`
              }}>
                {['Snapshot Label', 'Date Saved', 'Caregivers', 'Compliance', 'Saved By'].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    {h}
                  </span>
                ))}
              </div>
              {snapshots.map((snap, idx) => {
                const pctColor = snap.overall_compliance_pct >= 80 ? C.green : snap.overall_compliance_pct >= 60 ? C.amber : C.red
                return (
                  <div
                    key={snap.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 140px 100px 120px 100px',
                      padding: '14px 20px',
                      background: idx % 2 === 0 ? C.white : C.greyLight,
                      borderBottom: `1px solid ${C.border}22`,
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{snap.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: C.text }}>{fmt(snap.created_at)}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{snap.caregiver_count}</div>
                    <div>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: pctColor,
                        background: pctColor + '18', borderRadius: 20, padding: '3px 10px'
                      }}>
                        {snap.overall_compliance_pct}%
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>{snap.created_by_name || 'Admin'}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

// ─── Timeline sub-component ───────────────────────────────────────────────────

function TimelineView({ items, groupBy }: { items: TimelineItem[]; groupBy: 'caregiver' | 'type' }) {
  // Build groups
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groups.map((group) => (
        <TimelineGroup key={group.key} group={group} groupBy={groupBy} />
      ))}
    </div>
  )
}

function TimelineGroup({
  group,
  groupBy,
}: {
  group: { key: string; label: string; items: TimelineItem[] }
  groupBy: 'caregiver' | 'type'
}) {
  const [open, setOpen] = useState(true)

  const urgentCount = group.items.filter((i) => i.days_until <= 30).length
  const warnCount   = group.items.filter((i) => i.days_until > 30 && i.days_until <= 90).length
  const borderColor = urgentCount > 0 ? C.red : warnCount > 0 ? C.amber : C.green

  return (
    <div style={{
      background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10,
      overflow: 'hidden', borderLeft: `4px solid ${borderColor}`
    }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', cursor: 'pointer',
          background: open ? '#fff' : C.greyLight
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.primary }}>{group.label}</span>
          <span style={{ fontSize: 11, color: C.muted }}>{group.items.length} expiring</span>
          {urgentCount > 0 && (
            <span style={{
              background: '#FDECEA', color: C.red, borderRadius: 20,
              fontSize: 10, fontWeight: 700, padding: '2px 7px'
            }}>
              {urgentCount} within 30d
            </span>
          )}
        </div>
        {open ? <ChevronUp size={14} color={C.muted}/> : <ChevronDown size={14} color={C.muted}/>}
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${C.border}33` }}>
          {group.items.map((item, idx) => {
            const urgency = item.days_until <= 14 ? 'critical' : item.days_until <= 30 ? 'urgent' : item.days_until <= 90 ? 'warn' : 'ok'
            const urgencyColor = urgency === 'critical' ? C.red : urgency === 'urgent' ? '#E07800' : urgency === 'warn' ? C.amber : C.green
            const urgencyBg    = urgency === 'critical' ? '#FDECEA' : urgency === 'urgent' ? '#FEF3EA' : urgency === 'warn' ? '#FEF9EF' : '#E8F8F5'
            const label        = groupBy === 'caregiver' ? item.credential_type_name : item.caregiver_name

            return (
              <div
                key={`${item.caregiver_id}-${item.credential_type_id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                  background: idx % 2 === 0 ? '#fff' : C.greyLight,
                  borderBottom: idx < group.items.length - 1 ? `1px solid ${C.border}22` : 'none'
                }}
              >
                {/* Days badge */}
                <div style={{
                  minWidth: 64, textAlign: 'center', background: urgencyBg,
                  border: `1px solid ${urgencyColor}44`, borderRadius: 8, padding: '4px 8px'
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: urgencyColor, lineHeight: 1 }}>
                    {item.days_until}
                  </div>
                  <div style={{ fontSize: 10, color: urgencyColor, fontWeight: 600 }}>days</div>
                </div>

                {/* Name + date */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    Expires {fmtShort(item.expiry_date)}
                  </div>
                </div>

                {/* Status badge */}
                <span style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                  color: urgencyColor, background: urgencyBg,
                  border: `1px solid ${urgencyColor}44`,
                  borderRadius: 20, padding: '3px 10px'
                }}>
                  {item.status}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
