'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Search, X } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Contact { id: string; name: string; role: string | null }
interface Center  { id: string; name: string; assigned_day: string | null; week_group: number; contacts: Contact[] }

interface Log {
  id: string
  visit_date: string
  activity_type: string
  notes: string | null
  created_at: string
  center: { id: string; name: string } | { id: string; name: string }[] | null
  contact: { id: string; name: string; role: string | null } | { id: string; name: string; role: string | null }[] | null
  logger: { id: string; full_name: string } | { id: string; full_name: string }[] | null
}

interface Staff { id: string; full_name: string }

interface Props {
  centers: Center[]
  initialLogs: Log[]
  staff: Staff[]
  currentUserId: string
  currentUserName: string
  isAdmin: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getName<T extends { name?: string; full_name?: string }>(
  val: T | T[] | null,
  field: 'name' | 'full_name' = 'name'
): string {
  if (!val) return '—'
  const item = Array.isArray(val) ? val[0] : val
  return (field === 'full_name' ? (item as any).full_name : (item as any).name) || '—'
}

const ACTIVITY = {
  F: { label: 'Face-to-face',  color: '#0B6B5C', bg: '#D1FAE5', emoji: '🤝' },
  D: { label: 'Drop-off',      color: '#7C3AED', bg: '#EDE9FE', emoji: '📦' },
  X: { label: 'Missed / No-contact', color: '#D97706', bg: '#FEF3C7', emoji: '❌' },
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ActivityLoggerClient({
  centers, initialLogs, staff, currentUserId, currentUserName, isAdmin,
}: Props) {
  const [logs, setLogs] = useState<Log[]>(initialLogs)
  const [tab, setTab] = useState<'log' | 'history'>('log')

  // ── Form state ───────────────────────────────────────────────────────────────
  const [centerId, setCenterId] = useState('')
  const [contactId, setContactId] = useState('')
  const [activityType, setActivityType] = useState<'F' | 'D' | 'X'>('F')
  const [visitDate, setVisitDate] = useState(today())
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  // ── History filters ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [personFilter, setPersonFilter] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const selectedCenter = centers.find(c => c.id === centerId)
  const contactOptions = selectedCenter?.contacts || []

  // ── Filtered logs ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = logs
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(l =>
        getName(l.center).toLowerCase().includes(q) ||
        getName(l.contact).toLowerCase().includes(q) ||
        getName(l.logger, 'full_name').toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q)
      )
    }
    if (typeFilter)   list = list.filter(l => l.activity_type === typeFilter)
    if (personFilter) {
      list = list.filter(l => {
        const logger = Array.isArray(l.logger) ? l.logger[0] : l.logger
        return logger?.id === personFilter
      })
    }
    return list
  }, [logs, search, typeFilter, personFilter])

  // ── Summary stats ────────────────────────────────────────────────────────────
  const fCount = logs.filter(l => l.activity_type === 'F').length
  const dCount = logs.filter(l => l.activity_type === 'D').length
  const xCount = logs.filter(l => l.activity_type === 'X').length
  const total  = logs.length
  const fdRatio = (fCount + dCount) > 0 ? Math.round((fCount / (fCount + dCount)) * 100) : 0

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!centerId) { setSaveError('Please select a facility.'); return }
    if (!visitDate) { setSaveError('Please select a date.'); return }
    setSaving(true); setSaveError(''); setSaveSuccess(false)
    try {
      const res = await fetch('/api/marketing/visit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          influence_center_id: centerId,
          contact_id: contactId || null,
          activity_type: activityType,
          visit_date: visitDate,
          notes: notes.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setLogs(prev => [json.data, ...prev])
      // Reset form (keep date + person)
      setCenterId(''); setContactId(''); setNotes(''); setActivityType('F')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      setTab('history')
    } catch (e: any) {
      setSaveError(e.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this log entry?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/marketing/visit-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setLogs(prev => prev.filter(l => l.id !== id))
    } catch {
      alert('Could not delete. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/marketing" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Marketing</Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111', margin: '4px 0 0' }}>Activity Logger</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Log field visits — F (face-to-face) · D (drop-off) · X (missed)</p>
      </div>

      {/* Summary stats */}
      {total > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {Object.entries(ACTIVITY).map(([key, ac]) => {
            const count = key === 'F' ? fCount : key === 'D' ? dCount : xCount
            return (
              <div key={key} style={{ background: ac.bg, border: `1px solid ${ac.color}30`, borderRadius: 10, padding: '12px 16px', minWidth: 90, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: ac.color }}>{count}</div>
                <div style={{ fontSize: 11, color: ac.color, fontWeight: 600, marginTop: 2 }}>{key} · {ac.label.split(' ')[0]}</div>
              </div>
            )
          })}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', minWidth: 90, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{fdRatio}%</div>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 2 }}>F-rate</div>
          </div>
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', minWidth: 90, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{total}</div>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 2 }}>Total visits</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        {(['log', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 20px', border: 'none', borderBottom: tab === t ? '2px solid #0B6B5C' : '2px solid transparent', background: 'none', fontWeight: tab === t ? 600 : 400, color: tab === t ? '#0B6B5C' : '#888', fontSize: 14, cursor: 'pointer', marginBottom: -1 }}>
            {t === 'log' ? '✏️ Log a visit' : `📋 History (${logs.length})`}
          </button>
        ))}
      </div>

      {/* ── LOG FORM ── */}
      {tab === 'log' && (
        <div style={{ maxWidth: 540 }}>

          {saveSuccess && (
            <div style={{ background: '#D1FAE5', color: '#065F46', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
              ✅ Visit logged successfully!
            </div>
          )}
          {saveError && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
              {saveError}
            </div>
          )}

          {/* Activity type — big tap targets */}
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Activity type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {(Object.entries(ACTIVITY) as [string, typeof ACTIVITY['F']][]).map(([key, ac]) => {
                const sel = activityType === key
                return (
                  <button key={key} onClick={() => setActivityType(key as 'F' | 'D' | 'X')}
                    style={{ padding: '16px 8px', borderRadius: 10, border: `2px solid ${sel ? ac.color : '#DDD'}`, background: sel ? ac.bg : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{ac.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sel ? ac.color : '#555' }}>{key}</div>
                    <div style={{ fontSize: 11, color: sel ? ac.color : '#AAA', lineHeight: 1.3, marginTop: 2 }}>{ac.label}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Visit date</label>
            <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} style={inp} />
          </div>

          {/* Facility */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Facility *</label>
            <select value={centerId} onChange={e => { setCenterId(e.target.value); setContactId('') }} style={inp}>
              <option value="">— Select facility —</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Contact — only shown once facility is selected */}
          {centerId && (
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Contact (optional)</label>
              <select value={contactId} onChange={e => setContactId(e.target.value)} style={inp}>
                <option value="">— No specific contact —</option>
                {contactOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.role ? ` · ${c.role.replace('Director - ', '').replace('Staff - ', '')}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 24 }}>
            <label style={lbl}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Met with Gina, discussed new client — she mentioned two pending discharges…"
              rows={3} style={{ ...inp, resize: 'vertical' as const }} />
          </div>

          <button onClick={handleSubmit} disabled={saving || !centerId}
            style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: centerId ? '#0B6B5C' : '#CCC', color: '#fff', fontSize: 15, fontWeight: 600, cursor: centerId ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : `Log ${ACTIVITY[activityType].emoji} ${activityType} Visit`}
          </button>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === 'history' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 180px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#AAA' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search facility, contact…"
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, boxSizing: 'border-box' as const }} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, color: '#555', background: '#fff', cursor: 'pointer' }}>
              <option value="">All types</option>
              <option value="F">F · Face-to-face</option>
              <option value="D">D · Drop-off</option>
              <option value="X">X · Missed</option>
            </select>
            {isAdmin && (
              <select value={personFilter} onChange={e => setPersonFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, color: '#555', background: '#fff', cursor: 'pointer' }}>
                <option value="">All marketers</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            )}
          </div>

          {/* Log table */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#AAA' }}>
                {logs.length === 0 ? 'No visits logged yet. Switch to "Log a visit" to get started.' : 'No results match your filters.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      {['Date', 'Type', 'Facility', 'Contact', 'Logged by', 'Notes', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log, i) => {
                      const ac = ACTIVITY[log.activity_type as keyof typeof ACTIVITY] || ACTIVITY.F
                      const loggerItem = Array.isArray(log.logger) ? log.logger[0] : log.logger
                      const canDelete = isAdmin || loggerItem?.id === currentUserId
                      return (
                        <tr key={log.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                          <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', color: '#555' }}>{fmtDate(log.visit_date)}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: ac.bg, color: ac.color }}>
                              {ac.emoji} {log.activity_type}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', fontWeight: 500, color: '#111', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {getName(log.center)}
                          </td>
                          <td style={{ padding: '11px 14px', color: '#666' }}>{getName(log.contact)}</td>
                          <td style={{ padding: '11px 14px', color: '#666' }}>{getName(log.logger, 'full_name')}</td>
                          <td style={{ padding: '11px 14px', color: '#888', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.notes || <span style={{ color: '#CCC' }}>—</span>}
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            {canDelete && (
                              <button onClick={() => handleDelete(log.id)} disabled={deleting === log.id}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '2px 6px', opacity: deleting === log.id ? 0.5 : 1 }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #DDD',
  fontSize: 14, boxSizing: 'border-box', color: '#111', background: '#fff',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px',
}
