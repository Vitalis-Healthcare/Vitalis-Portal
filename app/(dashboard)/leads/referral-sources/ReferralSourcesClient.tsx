'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit3, Trash2, Phone, Mail, X, Save } from 'lucide-react'

const SOURCE_TYPES = [
  { key: 'social_worker',      label: 'Social Worker' },
  { key: 'case_manager',       label: 'Case Manager' },
  { key: 'hospital',           label: 'Hospital / Facility' },
  { key: 'doctor_office',      label: 'Doctor Office' },
  { key: 'discharge_planner',  label: 'Discharge Planner' },
  { key: 'community_org',      label: 'Community Org' },
  { key: 'insurance',          label: 'Insurance' },
  { key: 'other',              label: 'Other' },
]

interface Source { id: string; name: string; type: string; organization?: string; phone?: string; email?: string; notes?: string; is_active: boolean }
interface Lead { id: string; status: string; referral_source_id?: string; estimated_hours_week?: number; hourly_rate?: number; won_date?: string }

function fmtMoney(n: number) { return '$' + Math.round(n).toLocaleString() }

export default function ReferralSourcesClient({ sources: initSources, leads }: { sources: Source[]; leads: Lead[] }) {
  const router = useRouter()
  const [sources, setSources] = useState(initSources)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const BLANK = { name: '', type: 'social_worker', organization: '', phone: '', email: '', notes: '' }
  const [form, setForm] = useState(BLANK)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openAdd = () => { setForm(BLANK); setEditingId(null); setShowForm(true) }
  const openEdit = (s: Source) => { setForm({ name: s.name, type: s.type, organization: s.organization || '', phone: s.phone || '', email: s.email || '', notes: s.notes || '' }); setEditingId(s.id); setShowForm(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const payload = editingId ? { id: editingId, ...form } : form
    const res = await fetch('/api/leads/referral-sources', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const { source } = await res.json()
      if (editingId) setSources(s => s.map(x => x.id === editingId ? source : x))
      else setSources(s => [...s, source])
      setShowForm(false)
    } else { const d = await res.json(); alert(d.error) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this referral source? Leads assigned to them will be unaffected.')) return
    setSaving(true)
    await fetch('/api/leads/referral-sources', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    setSources(s => s.filter(x => x.id !== id))
    setSaving(false)
  }

  // Build stats per source
  const stats = sources.map(s => {
    const sLeads = leads.filter(l => l.referral_source_id === s.id)
    const wonLeads = sLeads.filter(l => l.status === 'won')
    const wonRevenue = wonLeads.reduce((sum, l) => sum + ((l.estimated_hours_week || 0) * (l.hourly_rate || 0) * 4.33), 0)
    const conversion = sLeads.length > 0 ? Math.round((wonLeads.length / sLeads.length) * 100) : 0
    return { sourceId: s.id, total: sLeads.length, won: wonLeads.length, wonRevenue, conversion }
  })
  const statsMap = Object.fromEntries(stats.map(s => [s.sourceId, s]))

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: 4 }

  const totalLeadsFromSources = stats.reduce((s, x) => s + x.total, 0)
  const totalWonFromSources = stats.reduce((s, x) => s + x.won, 0)
  const totalRevenueFromSources = stats.reduce((s, x) => s + x.wonRevenue, 0)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/leads" style={{ color: '#8FA0B0', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={13}/> Leads & Pipeline
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E44', margin: '0 0 4px' }}>🤝 Referral Sources</h1>
          <p style={{ fontSize: 13, color: '#8FA0B0', margin: 0 }}>{sources.length} sources · {totalLeadsFromSources} leads · {fmtMoney(totalRevenueFromSources)}/mo won revenue</p>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14}/> Add Source
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Leads from Sources', value: totalLeadsFromSources, color: '#1A2E44' },
          { label: 'Won from Sources', value: totalWonFromSources, color: '#0B6B5C' },
          { label: 'Won Monthly Revenue', value: fmtMoney(totalRevenueFromSources), color: '#0B6B5C' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Sources table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFB', borderBottom: '1px solid #EFF2F5' }}>
              {['Name / Organisation', 'Type', 'Contact', 'Leads', 'Won', 'Conv.', 'Revenue/mo', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#8FA0B0' }}>No referral sources added yet. Add your first source above.</td></tr>
            ) : sources.map((s, i) => {
              const st = statsMap[s.id] || { total: 0, won: 0, wonRevenue: 0, conversion: 0 }
              const typeLabel = SOURCE_TYPES.find(t => t.key === s.type)?.label || s.type
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #EFF2F5', background: i % 2 === 0 ? '#fff' : '#FAFBFC', opacity: s.is_active ? 1 : 0.5 }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#1A2E44' }}>{s.name}</div>
                    {s.organization && <div style={{ fontSize: 11, color: '#8FA0B0' }}>{s.organization}</div>}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#4A6070' }}>{typeLabel}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {s.phone && <a href={`tel:${s.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#457B9D', textDecoration: 'none' }}><Phone size={11}/> {s.phone}</a>}
                      {s.email && <a href={`mailto:${s.email}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#457B9D', textDecoration: 'none' }}><Mail size={11}/> {s.email}</a>}
                      {!s.phone && !s.email && <span style={{ color: '#CBD5E0', fontSize: 12 }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1A2E44', textAlign: 'center' }}>{st.total}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0B6B5C', textAlign: 'center' }}>{st.won}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: st.conversion >= 50 ? '#0B6B5C' : st.conversion >= 25 ? '#D97706' : '#8FA0B0' }}>
                      {st.total > 0 ? `${st.conversion}%` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: st.wonRevenue > 0 ? '#0B6B5C' : '#CBD5E0' }}>
                    {st.wonRevenue > 0 ? fmtMoney(st.wonRevenue) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(s)} style={{ padding: '5px 8px', background: '#EFF2F5', border: 'none', borderRadius: 7, color: '#4A6070', cursor: 'pointer' }}><Edit3 size={13}/></button>
                      <button onClick={() => handleDelete(s.id)} disabled={saving} style={{ padding: '5px 8px', background: '#FEE2E2', border: 'none', borderRadius: 7, color: '#DC2626', cursor: 'pointer' }}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>{editingId ? 'Edit' : 'Add'} Referral Source</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}><X size={18}/></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Name <span style={{ color: '#E63946' }}>*</span></label><input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Jane Smith" style={inp}/></div>
              <div>
                <label style={lbl}>Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)} style={inp}>
                  {SOURCE_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Organisation</label><input value={form.organization} onChange={e => set('organization', e.target.value)} placeholder="Hospital, agency, or company name" style={inp}/></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(xxx) xxx-xxxx" style={inp}/></div>
                <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" style={inp}/></div>
              </div>
              <div><label style={lbl}>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Any notes about this source…" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}/></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '11px', background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  <Save size={13} style={{ marginRight: 6, verticalAlign: 'middle' }}/>{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Source'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '11px 18px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#4A6070' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
