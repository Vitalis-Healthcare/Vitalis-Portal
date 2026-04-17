'use client'
// app/(dashboard)/assessments/clients/import/page.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  status?: { active: boolean; label: string } | null
}

function getLocation(c: AxisCareClient): string {
  const addr = c.residentialAddress || c.mailingAddress || {}
  return [addr.city, addr.state || addr.region].filter(Boolean).join(', ') || '—'
}

function getPhone(c: AxisCareClient): string {
  return c.mobilePhone || c.homePhone || '—'
}

export default function ImportAxisCareClientsPage() {
  const router = useRouter()
  const [fetching, setFetching]     = useState(false)
  const [importing, setImporting]   = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [clients, setClients]       = useState<AxisCareClient[]>([])
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set())
  const [selected, setSelected]     = useState<Set<number>>(new Set())
  const [result, setResult]         = useState<{
    imported: number; skipped: number; failed: number; errors: string[]
  } | null>(null)

  const fetchClients = async () => {
    setFetching(true); setFetchError(null); setResult(null); setClients([]); setSelected(new Set())
    try {
      // Fetch AxisCare clients + existing assessment_clients axiscare_ids in parallel
      const [axisRes, existingRes] = await Promise.all([
        fetch('/api/axiscare/clients'),
        fetch('/api/assessments/clients'),
      ])

      const axisJson     = await axisRes.json()
      const existingJson = await existingRes.json()

      if (!axisRes.ok) throw new Error(axisJson.error || 'Failed to fetch from AxisCare')

      const list: AxisCareClient[] = axisJson.clients ?? []
      const knownIds = new Set<string>(
        (existingJson.data ?? [])
          .filter((r: any) => r.axiscare_id)
          .map((r: any) => String(r.axiscare_id))
      )

      setClients(list)
      setExistingIds(knownIds)
      // Auto-select clients not yet imported
      setSelected(new Set(list.filter(c => !knownIds.has(String(c.id))).map(c => c.id)))
    } catch (err: any) {
      setFetchError(err.message)
    } finally {
      setFetching(false)
    }
  }

  const toggle = (id: number) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }
  const selectAll  = () => setSelected(new Set(clients.filter(c => !existingIds.has(String(c.id))).map(c => c.id)))
  const selectNone = () => setSelected(new Set())

  const handleImport = async () => {
    const toImport = clients.filter(c => selected.has(c.id))
    if (!toImport.length) return
    setImporting(true); setFetchError(null)
    try {
      const res = await fetch('/api/assessments/clients/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clients: toImport }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Import failed')
      setResult(json)
      setSelected(new Set())
      // Refresh existing IDs so imported rows are now grayed out
      const existingRes  = await fetch('/api/assessments/clients')
      const existingJson = await existingRes.json()
      setExistingIds(new Set(
        (existingJson.data ?? [])
          .filter((r: any) => r.axiscare_id)
          .map((r: any) => String(r.axiscare_id))
      ))
    } catch (err: any) {
      setFetchError(err.message)
    } finally {
      setImporting(false)
    }
  }

  const newCount = clients.filter(c => !existingIds.has(String(c.id))).length

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/assessments/clients" style={{ color: '#0E7C7B', textDecoration: 'none', fontSize: 13 }}>
          ← Assessment Clients
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: '8px 0 4px' }}>
          Import from AxisCare
        </h1>
        <p style={{ fontSize: 14, color: '#4A6070', margin: 0 }}>
          Pull active clients from your AxisCare account into the assessment schedule.
        </p>
      </div>

      {/* Fetch card */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
        padding: '20px 24px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2E44', marginBottom: 3 }}>
            AxisCare — Agency {process.env.NEXT_PUBLIC_AXISCARE_SITE || ''}
          </div>
          <div style={{ fontSize: 12, color: '#4A6070' }}>
            Fetches all active clients. Already-imported clients are shown but excluded from selection.
          </div>
        </div>
        <button
          onClick={fetchClients}
          disabled={fetching}
          style={{
            padding: '10px 24px', background: fetching ? '#5BA8A8' : '#0E7C7B',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: fetching ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {fetching ? 'Fetching…' : 'Fetch Clients'}
        </button>
      </div>

      {/* Error */}
      {fetchError && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
          padding: '12px 16px', color: '#B91C1C', fontSize: 13, marginBottom: 20,
        }}>
          {fetchError}
        </div>
      )}

      {/* Result panel */}
      {result && (
        <div style={{
          background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12,
          padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46', marginBottom: 8 }}>
            ✓ Import complete
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            <span style={{ color: '#15803D' }}>✓ <strong>{result.imported}</strong> imported</span>
            <span style={{ color: '#4A6070' }}>— <strong>{result.skipped}</strong> already existed</span>
            {result.failed > 0 && <span style={{ color: '#B91C1C' }}>⚠ <strong>{result.failed}</strong> failed</span>}
          </div>
          {result.errors.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#B91C1C' }}>
              {result.errors.slice(0, 3).join(' · ')}
              {result.errors.length > 3 && ` +${result.errors.length - 3} more`}
            </div>
          )}
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <Link href="/assessments/clients" style={{
              display: 'inline-block', padding: '7px 16px', background: '#0E7C7B',
              color: '#fff', textDecoration: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
            }}>
              View All Clients →
            </Link>
            <button onClick={() => setResult(null)} style={{
              padding: '7px 14px', background: 'transparent', border: '1px solid #86EFAC',
              borderRadius: 7, fontSize: 13, color: '#15803D', cursor: 'pointer',
            }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Records table */}
      {clients.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table controls */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: '#1A2E44' }}>
                {clients.length} clients from AxisCare
              </span>
              <span style={{ color: '#15803D', fontWeight: 600 }}>
                ✓ {existingIds.size} already imported
              </span>
              <span style={{ color: '#4A6070' }}>
                {selected.size} selected
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={selectAll} style={{
                padding: '5px 12px', background: '#F8FAFC', border: '1px solid #D1D9E0',
                borderRadius: 6, fontSize: 12, color: '#4A6070', cursor: 'pointer',
              }}>
                Select new ({newCount})
              </button>
              <button onClick={selectNone} style={{
                padding: '5px 12px', background: '#F8FAFC', border: '1px solid #D1D9E0',
                borderRadius: 6, fontSize: 12, color: '#4A6070', cursor: 'pointer',
              }}>
                None
              </button>
              <button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                style={{
                  padding: '8px 20px',
                  background: importing || selected.size === 0 ? '#5BA8A8' : '#0E7C7B',
                  color: '#fff', border: 'none', borderRadius: 7,
                  fontSize: 13, fontWeight: 600,
                  cursor: importing || selected.size === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {importing ? 'Importing…' : `Import ${selected.size} selected`}
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ width: 44, padding: '10px 16px', borderBottom: '1px solid #E2E8F0' }} />
                  {['Name', 'AxisCare ID', 'Location', 'Phone', 'Payer'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      color: '#4A6070', textTransform: 'uppercase', letterSpacing: '0.6px',
                      borderBottom: '1px solid #E2E8F0',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, idx) => {
                  const alreadyIn = existingIds.has(String(c.id))
                  const isSelected = selected.has(c.id)
                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: idx < clients.length - 1 ? '1px solid #F1F5F9' : 'none',
                        opacity: alreadyIn ? 0.45 : isSelected ? 1 : 0.6,
                        background: alreadyIn ? '#F8FAFC' : undefined,
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={alreadyIn}
                          onChange={() => toggle(c.id)}
                          style={{ cursor: alreadyIn ? 'not-allowed' : 'pointer', width: 15, height: 15 }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1A2E44' }}>
                          {c.firstName} {c.lastName}
                        </div>
                        {c.goesBy && (
                          <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 1 }}>"{c.goesBy}"</div>
                        )}
                        {alreadyIn && (
                          <div style={{ fontSize: 10, color: '#15803D', fontWeight: 700, marginTop: 2 }}>
                            ✓ Already imported
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#8FA0B0' }}>
                        #{c.id}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4A6070' }}>{getLocation(c)}</td>
                      <td style={{ padding: '12px 16px', color: '#4A6070' }}>{getPhone(c)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {c.medicaidNumber ? (
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                            fontSize: 11, fontWeight: 600,
                            background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE',
                          }}>
                            Medicaid
                          </span>
                        ) : (
                          <span style={{ color: '#8FA0B0', fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {clients.length === 0 && !fetching && !fetchError && (
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '56px 32px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⊙</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2E44', marginBottom: 6 }}>
            Ready to pull from AxisCare
          </div>
          <div style={{ fontSize: 13, color: '#4A6070', maxWidth: 380, margin: '0 auto' }}>
            Click "Fetch Clients" to load your active AxisCare clients. Review before importing.
          </div>
        </div>
      )}
    </div>
  )
}
