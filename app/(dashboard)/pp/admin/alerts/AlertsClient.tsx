'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Alert {
  id: string
  doc_id: string | null
  alert_type: string
  title: string
  description: string
  regulatory_ref: string
  severity: string
  status: string
  created_at: string
  pp_policies?: { title: string }
}

interface Policy { doc_id: string; title: string; domain: string }

const severityStyle = (s: string) => ({
  critical: { bg: '#FDE8E9', text: '#DC2626', border: '#FCA5A5' },
  high:     { bg: '#FEF3EA', text: '#F59E0B', border: '#FCD34D' },
  medium:   { bg: '#EFF6FF', text: '#2563EB', border: '#93C5FD' },
  low:      { bg: '#F8FAFB', text: '#64748B', border: '#CBD5E0' },
}[s] || { bg: '#F8FAFB', text: '#64748B', border: '#CBD5E0' })

const typeLabels: Record<string, string> = {
  regulation_change: '📜 Regulation Change',
  personnel_change: '👤 Personnel Change',
  review_due: '📅 Review Due',
  ai_flagged: '🤖 AI Flagged',
}

export default function AlertsClient({ alerts: initial, policies, userId }: {
  alerts: Alert[]; policies: Policy[]; userId: string
}) {
  const [alerts, setAlerts] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('open')

  // Create form state
  const [form, setForm] = useState({
    title: '', description: '', alert_type: 'regulation_change',
    severity: 'medium', regulatory_ref: '', doc_id: ''
  })
  const [saving, setSaving] = useState(false)

  const createAlert = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/pp/alerts/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok && data.alert) {
        setAlerts(prev => [{ ...data.alert, pp_policies: policies.find(p => p.doc_id === form.doc_id) ? { title: policies.find(p => p.doc_id === form.doc_id)!.title } : undefined }, ...prev])
        setForm({ title: '', description: '', alert_type: 'regulation_change', severity: 'medium', regulatory_ref: '', doc_id: '' })
        setShowCreate(false)
      }
    } catch {}
    setSaving(false)
  }

  const resolve = async (id: string) => {
    await fetch('/api/pp/alerts/resolve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId: id })
    })
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a))
  }

  const dismiss = async (id: string) => {
    await fetch('/api/pp/alerts/dismiss', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId: id })
    })
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'dismissed' } : a))
  }

  const filtered = alerts.filter(a => filter === 'all' || a.status === filter)
  const openCount = alerts.filter(a => a.status === 'open').length
  const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['open', `Open (${openCount})`], ['resolved', 'Resolved'], ['dismissed', 'Dismissed'], ['all', 'All']].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: '7px 14px', borderRadius: 7, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: filter === key ? '#1A2E44' : '#fff',
              color: filter === key ? '#fff' : '#4A6070',
              borderColor: filter === key ? '#1A2E44' : '#E2E8F0'
            }}>{label}</button>
          ))}
        </div>
        <button onClick={() => setShowCreate(s => !s)} style={{ padding: '8px 16px', background: '#0B6B5C', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + New Alert
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 22, border: '2px solid #0B6B5C', marginBottom: 20, boxShadow: '0 4px 16px rgba(11,107,92,0.1)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1A2E44', margin: '0 0 16px' }}>Create Regulatory Alert</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', display: 'block', marginBottom: 4 }}>Alert Type</label>
              <select value={form.alert_type} onChange={e => setForm(f => ({...f, alert_type: e.target.value}))} style={inp}>
                <option value="regulation_change">Regulation Change</option>
                <option value="personnel_change">Personnel Change</option>
                <option value="review_due">Review Due</option>
                <option value="ai_flagged">AI Flagged</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', display: 'block', marginBottom: 4 }}>Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({...f, severity: e.target.value}))} style={inp}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', display: 'block', marginBottom: 4 }}>Title</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. COMAR 10.07.05.08 amended — supervision requirements updated" style={inp} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="What changed and what policies need to be updated..." rows={3} style={{ ...inp, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', display: 'block', marginBottom: 4 }}>Regulatory Reference</label>
              <input value={form.regulatory_ref} onChange={e => setForm(f => ({...f, regulatory_ref: e.target.value}))} placeholder="e.g. COMAR 10.07.05.08" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', display: 'block', marginBottom: 4 }}>Affected Policy (optional)</label>
              <select value={form.doc_id} onChange={e => setForm(f => ({...f, doc_id: e.target.value}))} style={inp}>
                <option value="">Select policy...</option>
                {policies.map(p => <option key={p.doc_id} value={p.doc_id}>{p.doc_id}: {p.title}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createAlert} disabled={saving || !form.title} style={{ padding: '9px 20px', background: saving || !form.title ? '#E2E8F0' : '#0B6B5C', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Create Alert'}
            </button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '9px 16px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 8, color: '#4A6070', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '50px 24px', textAlign: 'center', color: '#8FA0B0', fontSize: 14, border: '1px solid #E2E8F0' }}>
          {filter === 'open' ? '✓ No open alerts. All clear.' : `No ${filter} alerts.`}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(alert => {
          const sc = severityStyle(alert.severity)
          return (
            <div key={alert.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${sc.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{alert.severity.toUpperCase()}</span>
                    <span style={{ fontSize: 11, color: '#8FA0B0' }}>{typeLabels[alert.alert_type] || alert.alert_type}</span>
                    <span style={{ fontSize: 11, color: '#CBD5E0' }}>{new Date(alert.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1A2E44', margin: '0 0 6px' }}>{alert.title}</h3>
                  {alert.description && <p style={{ fontSize: 13, color: '#4A6070', margin: '0 0 8px', lineHeight: 1.5 }}>{alert.description}</p>}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {alert.regulatory_ref && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: 6 }}>
                        📜 {alert.regulatory_ref}
                      </span>
                    )}
                    {alert.doc_id && (
                      <Link href={`/pp/${alert.doc_id}`} style={{ fontSize: 11, fontWeight: 600, color: '#0B6B5C', textDecoration: 'none' }}>
                        → {alert.doc_id}: {alert.pp_policies?.title}
                      </Link>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: alert.status === 'open' ? '#FEF3EA' : alert.status === 'resolved' ? '#E6F6F4' : '#F8FAFB', color: alert.status === 'open' ? '#F59E0B' : alert.status === 'resolved' ? '#0B6B5C' : '#8FA0B0', textAlign: 'center' }}>
                    {alert.status}
                  </span>
                  {alert.status === 'open' && (
                    <>
                      {alert.doc_id && (
                        <Link href={`/pp/${alert.doc_id}/edit`} style={{ textDecoration: 'none' }}>
                          <button style={{ width: '100%', padding: '6px 10px', background: '#0B6B5C', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            ✏️ Edit Policy
                          </button>
                        </Link>
                      )}
                      <button onClick={() => resolve(alert.id)} style={{ padding: '6px 10px', background: '#E6F6F4', border: '1px solid #0B6B5C', borderRadius: 6, color: '#0B6B5C', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        ✓ Resolve
                      </button>
                      <button onClick={() => dismiss(alert.id)} style={{ padding: '6px 10px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 6, color: '#8FA0B0', fontSize: 11, cursor: 'pointer' }}>
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
