'use client'
// app/(dashboard)/assessments/clients/import/page.tsx
//
// v0.6.16 — the import screen no longer treats every AxisCare client as
// something to act on. Three tabs:
//
//   New              default view, selected by default — these get imported
//   Already in Vita  unselected by default — refresh address/phone on demand
//   Ignored          permanently dismissed; restore from here
//
// Previously every client (new and existing) was auto-selected, so the default
// action re-upserted the entire client list, and there was no way to say "this
// person is not ours" and have it stick.

import { useState } from 'react'
import Link from 'next/link'

type AxisCareClient = {
  id: number
  firstName: string
  lastName: string
  goesBy?: string | null
  mobilePhone?: string | null
  homePhone?: string | null
  residentialAddress?: { city?: string; state?: string; region?: string } | null
  mailingAddress?: { city?: string; state?: string; region?: string } | null
  medicaidNumber?: string | null
}

type ExistingRow = { axiscare_id: string; full_name: string; status: string }
type IgnoredRow = {
  axiscare_id: string
  full_name: string | null
  reason: string | null
  ignored_at: string
}

type TabKey = 'new' | 'existing' | 'ignored'

type ImportResult = {
  imported: number
  updated: number
  failed: number
  skipped_ignored: number
  errors: string[]
}

const TEAL = '#0E7C7B'
const NAVY = '#1A2E44'
const MUTED = '#4A6070'
const LINE = '#E2E8F0'

function getLocation(c: AxisCareClient): string {
  const addr = c.residentialAddress || c.mailingAddress || {}
  return [addr.city, addr.state || addr.region].filter(Boolean).join(', ') || '—'
}

function getPhone(c: AxisCareClient): string {
  return c.mobilePhone || c.homePhone || '—'
}

function fullName(c: AxisCareClient): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
}

export default function ImportAxisCareClientsPage() {
  const [fetching, setFetching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [clients, setClients] = useState<AxisCareClient[]>([])
  const [existing, setExisting] = useState<Map<string, ExistingRow>>(new Map())
  const [ignored, setIgnored] = useState<Map<string, IgnoredRow>>(new Map())
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [tab, setTab] = useState<TabKey>('new')
  const [result, setResult] = useState<ImportResult | null>(null)

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadStatus = async (): Promise<{
    existing: Map<string, ExistingRow>
    ignored: Map<string, IgnoredRow>
  }> => {
    const res = await fetch('/api/assessments/clients/import')
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'Could not load current client status')
    const ex = new Map<string, ExistingRow>()
    for (const r of (json.existing ?? []) as ExistingRow[]) {
      if (r.axiscare_id) ex.set(String(r.axiscare_id), r)
    }
    const ig = new Map<string, IgnoredRow>()
    for (const r of (json.ignored ?? []) as IgnoredRow[]) {
      if (r.axiscare_id) ig.set(String(r.axiscare_id), r)
    }
    return { existing: ex, ignored: ig }
  }

  const fetchClients = async () => {
    setFetching(true); setError(null); setResult(null)
    setClients([]); setSelected(new Set())
    try {
      const [axisRes, status] = await Promise.all([
        fetch('/api/axiscare/clients'),
        loadStatus(),
      ])
      const axisJson = await axisRes.json().catch(() => ({}))
      if (!axisRes.ok) throw new Error(axisJson.error || 'Failed to fetch from AxisCare')

      const list: AxisCareClient[] = axisJson.clients ?? []
      setClients(list)
      setExisting(status.existing)
      setIgnored(status.ignored)

      // Only genuinely new clients are selected by default.
      setSelected(new Set(
        list
          .filter(c => !status.existing.has(String(c.id)) && !status.ignored.has(String(c.id)))
          .map(c => c.id),
      ))
      setTab('new')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setFetching(false)
    }
  }

  // ── Buckets ───────────────────────────────────────────────────────────────

  const newClients = clients.filter(
    c => !existing.has(String(c.id)) && !ignored.has(String(c.id)),
  )
  const existingClients = clients.filter(
    c => existing.has(String(c.id)) && !ignored.has(String(c.id)),
  )
  const ignoredClients = clients.filter(c => ignored.has(String(c.id)))

  // Ignored rows we hold but AxisCare no longer returns (inactive over there).
  const orphanIgnored = Array.from(ignored.values()).filter(
    r => !clients.some(c => String(c.id) === r.axiscare_id),
  )

  const visible =
    tab === 'new' ? newClients : tab === 'existing' ? existingClients : ignoredClients

  // ── Actions ───────────────────────────────────────────────────────────────

  const toggle = (id: number) => {
    setSelected(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })
  }

  const selectAllVisible = () =>
    setSelected(prev => {
      const s = new Set(prev)
      visible.forEach(c => s.add(c.id))
      return s
    })

  const selectNoneVisible = () =>
    setSelected(prev => {
      const s = new Set(prev)
      visible.forEach(c => s.delete(c.id))
      return s
    })

  const handleIgnore = async (c: AxisCareClient) => {
    setBusyId(String(c.id)); setError(null)
    try {
      const res = await fetch('/api/assessments/clients/ignore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axiscare_id: String(c.id), full_name: fullName(c) }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not ignore this client')
      const status = await loadStatus()
      setExisting(status.existing); setIgnored(status.ignored)
      setSelected(prev => { const s = new Set(prev); s.delete(c.id); return s })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleRestore = async (axiscareId: string) => {
    setBusyId(axiscareId); setError(null)
    try {
      const res = await fetch('/api/assessments/clients/ignore', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axiscare_id: axiscareId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not restore this client')
      const status = await loadStatus()
      setExisting(status.existing); setIgnored(status.ignored)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleImport = async () => {
    const toImport = clients.filter(
      c => selected.has(c.id) && !ignored.has(String(c.id)),
    )
    if (!toImport.length) return
    setImporting(true); setError(null)
    try {
      const res = await fetch('/api/assessments/clients/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clients: toImport }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Import failed')
      setResult(json as ImportResult)
      setSelected(new Set())
      const status = await loadStatus()
      setExisting(status.existing); setIgnored(status.ignored)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setImporting(false)
    }
  }

  const selectableSelected = clients.filter(
    c => selected.has(c.id) && !ignored.has(String(c.id)),
  ).length

  // ── Render ────────────────────────────────────────────────────────────────

  const tabButton = (key: TabKey, label: string, count: number, accent: string) => {
    const active = tab === key
    return (
      <button
        key={key}
        onClick={() => setTab(key)}
        style={{
          padding: '9px 18px',
          background: active ? '#fff' : 'transparent',
          border: 'none',
          borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
          fontSize: 13,
          fontWeight: active ? 700 : 600,
          color: active ? accent : MUTED,
          cursor: 'pointer',
        }}
      >
        {label} <span style={{ opacity: 0.75 }}>({count})</span>
      </button>
    )
  }

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1100, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <Link href="/assessments/clients" style={{ color: TEAL, textDecoration: 'none', fontSize: 13 }}>
          ← Assessment Clients
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, margin: '8px 0 4px' }}>
          Import from AxisCare
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
          New clients are selected by default. Clients already in Vita are left alone unless
          you choose to refresh them. Ignored clients stay out of the way for good.
        </p>
      </div>

      <div style={{
        background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12,
        padding: '20px 24px', marginBottom: 20, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 3 }}>
            AxisCare Connection
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>
            Fetches all active clients from AxisCare and compares them against Vita.
          </div>
        </div>
        <button
          onClick={fetchClients}
          disabled={fetching}
          style={{
            padding: '10px 24px', background: fetching ? '#5BA8A8' : TEAL, color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: fetching ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {fetching ? 'Fetching…' : 'Fetch Clients'}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
          padding: '12px 16px', color: '#B91C1C', fontSize: 13, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12,
          padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46', marginBottom: 8 }}>
            ✓ Sync complete
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, flexWrap: 'wrap' }}>
            <span style={{ color: '#15803D' }}>✓ <strong>{result.imported}</strong> newly imported</span>
            <span style={{ color: TEAL }}>↻ <strong>{result.updated}</strong> refreshed</span>
            {result.skipped_ignored > 0 && (
              <span style={{ color: MUTED }}>⊘ <strong>{result.skipped_ignored}</strong> skipped (ignored)</span>
            )}
            {result.failed > 0 && (
              <span style={{ color: '#B91C1C' }}>⚠ <strong>{result.failed}</strong> failed</span>
            )}
          </div>
          {result.errors.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#B91C1C' }}>
              {result.errors.slice(0, 3).join(' · ')}
              {result.errors.length > 3 && ` +${result.errors.length - 3} more`}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <Link
              href="/assessments/clients"
              style={{
                display: 'inline-block', padding: '7px 16px', background: TEAL, color: '#fff',
                textDecoration: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
              }}
            >
              View All Clients →
            </Link>
          </div>
        </div>
      )}

      {clients.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${LINE}`, background: '#F8FAFC', paddingRight: 16, gap: 12,
          }}>
            <div style={{ display: 'flex' }}>
              {tabButton('new', 'New', newClients.length, '#15803D')}
              {tabButton('existing', 'Already in Vita', existingClients.length, TEAL)}
              {tabButton('ignored', 'Ignored', ignoredClients.length + orphanIgnored.length, MUTED)}
            </div>
            <div style={{ fontSize: 12, color: MUTED }}>
              {clients.length} from AxisCare · {selectableSelected} selected
            </div>
          </div>

          {tab !== 'ignored' && (
            <div style={{
              padding: '12px 20px', borderBottom: `1px solid ${LINE}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ fontSize: 12, color: MUTED }}>
                {tab === 'new'
                  ? 'These clients are not in Vita yet.'
                  : 'Already in Vita. Selecting refreshes address and phone from AxisCare.'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={selectAllVisible} style={{ padding: '5px 12px', background: '#F8FAFC', border: '1px solid #D1D9E0', borderRadius: 6, fontSize: 12, color: MUTED, cursor: 'pointer' }}>All</button>
                <button onClick={selectNoneVisible} style={{ padding: '5px 12px', background: '#F8FAFC', border: '1px solid #D1D9E0', borderRadius: 6, fontSize: 12, color: MUTED, cursor: 'pointer' }}>None</button>
                <button
                  onClick={handleImport}
                  disabled={importing || selectableSelected === 0}
                  style={{
                    padding: '8px 20px',
                    background: importing || selectableSelected === 0 ? '#5BA8A8' : TEAL,
                    color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
                    cursor: importing || selectableSelected === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {importing ? 'Syncing…' : `Sync ${selectableSelected} selected`}
                </button>
              </div>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {tab !== 'ignored' && <th style={{ width: 44, padding: '10px 16px', borderBottom: `1px solid ${LINE}` }} />}
                  {['Name', 'AxisCare ID', 'Location', 'Phone', 'Payer', ''].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      color: MUTED, textTransform: 'uppercase', letterSpacing: '0.6px',
                      borderBottom: `1px solid ${LINE}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((c, idx) => {
                  const axisId = String(c.id)
                  const ex = existing.get(axisId)
                  const isIgnored = ignored.has(axisId)
                  const isSelected = selected.has(c.id)
                  const busy = busyId === axisId
                  return (
                    <tr key={c.id} style={{
                      borderBottom: idx < visible.length - 1 ? '1px solid #F1F5F9' : 'none',
                      opacity: isIgnored ? 0.6 : (tab === 'existing' && !isSelected ? 0.75 : 1),
                    }}>
                      {tab !== 'ignored' && (
                        <td style={{ padding: '12px 16px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggle(c.id)}
                            style={{ cursor: 'pointer', width: 15, height: 15 }}
                          />
                        </td>
                      )}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: NAVY }}>{fullName(c)}</div>
                        {c.goesBy && <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 1 }}>&ldquo;{c.goesBy}&rdquo;</div>}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#8FA0B0' }}>#{c.id}</td>
                      <td style={{ padding: '12px 16px', color: MUTED }}>{getLocation(c)}</td>
                      <td style={{ padding: '12px 16px', color: MUTED }}>{getPhone(c)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {c.medicaidNumber ? (
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                            fontSize: 11, fontWeight: 600, background: '#EFF6FF',
                            color: '#1D4ED8', border: '1px solid #BFDBFE',
                          }}>Medicaid</span>
                        ) : <span style={{ color: '#8FA0B0', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {tab === 'new' && (
                          <button
                            onClick={() => handleIgnore(c)}
                            disabled={busy}
                            style={{
                              padding: '4px 12px', background: '#fff', border: '1px solid #D1D9E0',
                              borderRadius: 6, fontSize: 12, color: MUTED,
                              cursor: busy ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {busy ? '…' : 'Ignore'}
                          </button>
                        )}
                        {tab === 'existing' && ex && (
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: ex.status === 'discharged' ? '#6B7280' : TEAL,
                          }}>
                            {ex.status === 'discharged' ? 'discharged' : `in Vita · ${ex.status}`}
                          </span>
                        )}
                        {tab === 'ignored' && (
                          <button
                            onClick={() => handleRestore(axisId)}
                            disabled={busy}
                            style={{
                              padding: '4px 12px', background: '#fff', border: `1px solid ${TEAL}`,
                              borderRadius: 6, fontSize: 12, color: TEAL,
                              cursor: busy ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {busy ? '…' : 'Restore'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {tab === 'ignored' && orphanIgnored.map((r, idx) => {
                  const busy = busyId === r.axiscare_id
                  return (
                    <tr key={`orphan-${r.axiscare_id}`} style={{
                      borderBottom: idx < orphanIgnored.length - 1 ? '1px solid #F1F5F9' : 'none',
                      opacity: 0.6,
                    }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: NAVY }}>{r.full_name || '—'}</div>
                        <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 1 }}>
                          not in the current AxisCare list
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#8FA0B0' }}>#{r.axiscare_id}</td>
                      <td style={{ padding: '12px 16px', color: MUTED }}>—</td>
                      <td style={{ padding: '12px 16px', color: MUTED }}>—</td>
                      <td style={{ padding: '12px 16px', color: '#8FA0B0', fontSize: 12 }}>—</td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleRestore(r.axiscare_id)}
                          disabled={busy}
                          style={{
                            padding: '4px 12px', background: '#fff', border: `1px solid ${TEAL}`,
                            borderRadius: 6, fontSize: 12, color: TEAL,
                            cursor: busy ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {busy ? '…' : 'Restore'}
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {visible.length === 0 && (tab !== 'ignored' || orphanIgnored.length === 0) && (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: MUTED, fontSize: 13 }}>
                      {tab === 'new' && 'No new clients — everything in AxisCare is already in Vita or ignored.'}
                      {tab === 'existing' && 'No AxisCare clients are currently in Vita.'}
                      {tab === 'ignored' && 'Nothing ignored yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {clients.length === 0 && !fetching && !error && (
        <div style={{
          background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12,
          padding: '56px 32px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⊙</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
            Ready to sync from AxisCare
          </div>
          <div style={{ fontSize: 13, color: MUTED, maxWidth: 420, margin: '0 auto' }}>
            Fetch to see which AxisCare clients are new, which are already in Vita,
            and which you have chosen to ignore.
          </div>
        </div>
      )}
    </div>
  )
}
