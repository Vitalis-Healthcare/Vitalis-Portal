'use client'
import { printWindow, downloadExcel } from '@/lib/printUtils'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, X, ChevronDown } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Contact { id: string; name: string; role: string | null; email: string | null }

interface Center {
  id: string
  name: string
  org_type: string
  street_address: string | null
  city: string | null
  state: string
  zip: string | null
  go_no_go: boolean
  heat_status: 'hot' | 'cold' | 'dead'
  visit_frequency: string
  assigned_day: string | null
  week_group: number
  visit_order: number | null
  notes: string | null
  contacts: Contact[]
}

interface Props {
  initialCenters: Center[]
  currentUserId: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ORG_TYPES = [
  'Rehab & Other Services', 'ALF (Assisted Living Facility)', 'ALF & Memory Care',
  'ALF & ILF with Memory Care', 'Age-Restricted Community', 'ASC (Active Senior Community)',
  'ASC with Independent Living', 'CCRC / Continuing Care', 'CCRC / Life Plan Community',
  'CCRC / Non-profit Senior Living', 'CCRC / Senior Living', 'Clinic', 'Concierge Medical',
  'Continuing Care Community', 'Home Health', 'Home Health & Memory Care', 'Hospice',
  'ILF (Independent Living Facility)', 'ILF with Memory Care', 'Memory Care / SNF / IL',
  'SNF (Skilled Nursing Facility)', 'Senior Center', 'Other',
]

const HEAT: Record<string, { label: string; color: string; bg: string }> = {
  hot:  { label: 'Hot',  color: '#0B6B5C', bg: '#D1FAE5' },
  cold: { label: 'Cold', color: '#457B9D', bg: '#EBF4FF' },
  dead: { label: 'Dead', color: '#DC2626', bg: '#FEE2E2' },
}

const DAYS = ['Tuesday', 'Wednesday', 'Thursday', 'Friday']
const FREQUENCIES = ['weekly', 'biweekly', 'monthly']

const BLANK: Omit<Center, 'id' | 'contacts'> = {
  name: '', org_type: 'Rehab & Other Services',
  street_address: '', city: '', state: 'MD', zip: '',
  go_no_go: true, heat_status: 'cold', visit_frequency: 'biweekly',
  assigned_day: null, week_group: 1, visit_order: null, notes: '',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InfluenceCentersClient({ initialCenters, currentUserId }: Props) {
  const router = useRouter()
  const [centers, setCenters] = useState<Center[]>(initialCenters)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [heatFilter, setHeatFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [weekFilter, setWeekFilter] = useState('')
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; center: Omit<Center, 'id' | 'contacts'> & { id?: string } }>({
    open: false, mode: 'add', center: { ...BLANK },
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  // ── Filtered list ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = centers
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q))
    }
    if (typeFilter) list = list.filter(c => c.org_type === typeFilter)
    if (heatFilter) list = list.filter(c => c.heat_status === heatFilter)
    if (dayFilter) list = list.filter(c => c.assigned_day === dayFilter)
    if (weekFilter) list = list.filter(c => String(c.week_group) === weekFilter)
    return list
  }, [centers, search, typeFilter, heatFilter, dayFilter, weekFilter])

  const hot  = centers.filter(c => c.heat_status === 'hot').length
  const cold = centers.filter(c => c.heat_status === 'cold').length
  const dead = centers.filter(c => c.heat_status === 'dead').length

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function openAdd() {
    setError('')
    setModal({ open: true, mode: 'add', center: { ...BLANK } })
  }

  function openEdit(c: Center) {
    setError('')
    setModal({
      open: true, mode: 'edit',
      center: {
        id: c.id, name: c.name, org_type: c.org_type,
        street_address: c.street_address || '', city: c.city || '',
        state: c.state, zip: c.zip || '', go_no_go: c.go_no_go,
        heat_status: c.heat_status, visit_frequency: c.visit_frequency,
        assigned_day: c.assigned_day, week_group: c.week_group,
        visit_order: c.visit_order, notes: c.notes || '',
      },
    })
  }

  function closeModal() {
    if (saving) return
    setModal(m => ({ ...m, open: false }))
  }

  function setField<K extends keyof typeof modal.center>(key: K, val: typeof modal.center[K]) {
    setModal(m => ({ ...m, center: { ...m.center, [key]: val } }))
  }

  async function handleSave() {
    if (!modal.center.name.trim()) { setError('Facility name is required.'); return }
    setSaving(true); setError('')
    try {
      const method = modal.mode === 'add' ? 'POST' : 'PUT'
      const res = await fetch('/api/marketing/influence-centers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modal.center),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      const saved: Center = { ...json.data, contacts: json.data.contacts || [] }
      if (modal.mode === 'add') {
        setCenters(prev => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)))
      } else {
        setCenters(prev => prev.map(c => c.id === saved.id ? { ...saved, contacts: c.contacts } : c))
      }
      setModal(m => ({ ...m, open: false }))
    } catch (e: any) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also delete all contacts at this facility.`)) return
    setDeleting(id)
    try {
      const res = await fetch('/api/marketing/influence-centers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Delete failed')
      setCenters(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      alert('Could not delete this facility. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  async function quickUpdate(id: string, patch: Partial<Center>) {
    try {
      const res = await fetch('/api/marketing/influence-centers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setCenters(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
    } catch {
      alert('Update failed. Please try again.')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  function handlePrint() {
    const HEAT: Record<string,string> = { hot:'badge-hot', cold:'badge-cold', dead:'badge-dead' }
    const hot = filtered.filter((c: any) => c.heat_status === 'hot').length
    const cold = filtered.filter((c: any) => c.heat_status === 'cold').length
    const dead = filtered.filter((c: any) => c.heat_status === 'dead').length
    const rows = filtered.map((c: any) => {
      const contacts = (c.contacts || []).map((ct: any) => ct.name).join(', ')
      return '<tr><td>'+c.name+'</td><td>'+(c.org_type||'—')+'</td><td><span class="badge '+(HEAT[c.heat_status]||'')+'">'+c.heat_status+'</span></td><td>'+(c.go_no_go ? '✓ Go' : 'No-go')+'</td><td>Wk'+c.week_group+' · '+(c.assigned_day||'—')+'</td><td>'+[c.street_address,c.city,c.state].filter(Boolean).join(', ')+'</td><td style="font-size:7.5pt">'+contacts+'</td></tr>'
    }).join('')
    printWindow('Influence Centers',
      '<div class="stat-row"><div class="stat-box"><div class="stat-num">'+filtered.length+'</div><div class="stat-lbl">Total</div></div><div class="stat-box"><div class="stat-num" style="color:#065F46">'+hot+'</div><div class="stat-lbl">Hot</div></div><div class="stat-box"><div class="stat-num" style="color:#1E40AF">'+cold+'</div><div class="stat-lbl">Cold</div></div><div class="stat-box"><div class="stat-num" style="color:#991B1B">'+dead+'</div><div class="stat-lbl">Dead</div></div></div>'
      +'<table><thead><tr><th>Facility</th><th>Type</th><th>Heat</th><th>Status</th><th>Route</th><th>Address</th><th>Contacts</th></tr></thead><tbody>'+rows+'</tbody></table>')
  }

  function handleExcel() {
    const headers = ['Name','Org Type','Heat Status','Go/No-go','Week','Day','Address','City','State','Zip','Contact Count','Notes']
    const rows = filtered.map((c: any) => [
      c.name, c.org_type, c.heat_status, c.go_no_go ? 'Go' : 'No-go',
      c.week_group, c.assigned_day, c.street_address, c.city, c.state, c.zip,
      (c.contacts || []).length, c.notes
    ])
    downloadExcel('Vitalis_InfluenceCenters_'+new Date().toISOString().slice(0,10)+'.csv', headers, rows)
  }


  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/marketing" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Marketing</Link>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111', margin: '4px 0 0' }}>
            Influence Centers
            <span style={{ fontSize: 14, fontWeight: 400, color: '#888', marginLeft: 8 }}>{centers.length} facilities</span>
          </h1>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          <Plus size={16} /> Add Facility
        </button>
        <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#0B6B5C', border: '1px solid #0B6B5C', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>🖨 Print</button>
        <button onClick={handleExcel} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>📥 Excel</button>
      </div>

      {/* Mini stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {([['hot', hot], ['cold', cold], ['dead', dead]] as [string, number][]).map(([status, count]) => (
          <button key={status} onClick={() => setHeatFilter(heatFilter === status ? '' : status)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${heatFilter === status ? HEAT[status].color : HEAT[status].color + '50'}`, background: heatFilter === status ? HEAT[status].bg : '#fff', color: HEAT[status].color, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: HEAT[status].color, display: 'inline-block' }} />
            {HEAT[status].label}: {count}
          </button>
        ))}
        <span style={{ color: '#CCC', padding: '5px 0' }}>|</span>
        <span style={{ fontSize: 13, color: '#888', padding: '5px 0' }}>Wk 1: {centers.filter(c => c.week_group === 1).length}</span>
        <span style={{ fontSize: 13, color: '#888', padding: '5px 0' }}>Wk 2: {centers.filter(c => c.week_group === 2).length}</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#AAA' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search facilities…"
            style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        <FilterSelect value={typeFilter} onChange={setTypeFilter} options={[{ value: '', label: 'All types' }, ...ORG_TYPES.map(t => ({ value: t, label: t }))]} />
        <FilterSelect value={dayFilter} onChange={setDayFilter} options={[{ value: '', label: 'All days' }, ...DAYS.map(d => ({ value: d, label: d }))]} />
        <FilterSelect value={weekFilter} onChange={setWeekFilter} options={[{ value: '', label: 'Both weeks' }, { value: '1', label: 'Week 1' }, { value: '2', label: 'Week 2' }]} />
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Facility', 'Type', 'City', 'Heat', 'Day', 'Wk', 'Go?', 'Contacts', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#AAA' }}>No facilities match your filters.</td></tr>
              )}
              {filtered.map((c, i) => {
                const hc = HEAT[c.heat_status] || HEAT.cold
                return (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0F0F0' : 'none', background: '#fff' }}>
                    {/* Name */}
                    <td style={{ padding: '11px 14px', fontWeight: 500, color: '#111', minWidth: 180 }}>
                      {c.name}
                      {!c.go_no_go && <span style={{ marginLeft: 6, fontSize: 10, color: '#DC2626', background: '#FEE2E2', padding: '1px 5px', borderRadius: 4 }}>NO-GO</span>}
                    </td>
                    {/* Type */}
                    <td style={{ padding: '11px 14px', color: '#666', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.org_type}
                    </td>
                    {/* City */}
                    <td style={{ padding: '11px 14px', color: '#666' }}>{c.city || '—'}</td>
                    {/* Heat */}
                    <td style={{ padding: '11px 14px' }}>
                      <select value={c.heat_status}
                        onChange={e => quickUpdate(c.id, { heat_status: e.target.value as 'hot' | 'cold' | 'dead' })}
                        style={{ padding: '3px 8px', borderRadius: 20, border: `1px solid ${hc.color}`, background: hc.bg, color: hc.color, fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                        <option value="hot">🟢 Hot</option>
                        <option value="cold">🔵 Cold</option>
                        <option value="dead">🔴 Dead</option>
                      </select>
                    </td>
                    {/* Day */}
                    <td style={{ padding: '11px 14px', color: '#666' }}>{c.assigned_day ? c.assigned_day.slice(0, 3) : '—'}</td>
                    {/* Week group */}
                    <td style={{ padding: '11px 14px', color: '#666', textAlign: 'center' }}>{c.week_group}</td>
                    {/* Go/No-Go toggle */}
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={() => quickUpdate(c.id, { go_no_go: !c.go_no_go })}
                        style={{ width: 36, height: 20, borderRadius: 10, border: 'none', background: c.go_no_go ? '#0B6B5C' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                        <span style={{ position: 'absolute', top: 2, left: c.go_no_go ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                      </button>
                    </td>
                    {/* Contact count */}
                    <td style={{ padding: '11px 14px', color: c.contacts.length > 0 ? '#0B6B5C' : '#AAA', fontWeight: c.contacts.length > 0 ? 600 : 400 }}>
                      {c.contacts.length > 0 ? `${c.contacts.length} contacts` : '—'}
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '2px 6px' }}><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(c.id, c.name)} disabled={deleting === c.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '2px 6px', opacity: deleting === c.id ? 0.5 : 1 }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F0F0F0' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#111', margin: 0 }}>
                {modal.mode === 'add' ? 'Add facility' : 'Edit facility'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={20} /></button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px' }}>
              {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

              <FieldGroup label="Facility name *">
                <input value={modal.center.name} onChange={e => setField('name', e.target.value)}
                  placeholder="e.g. Autumn Lake Healthcare at Arcola"
                  style={inputStyle} />
              </FieldGroup>

              <FieldGroup label="Organisation type">
                <select value={modal.center.org_type} onChange={e => setField('org_type', e.target.value)} style={inputStyle}>
                  {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FieldGroup>

              <FieldGroup label="Street address">
                <input value={modal.center.street_address || ''} onChange={e => setField('street_address', e.target.value)}
                  placeholder="e.g. 901 Arcola Ave" style={inputStyle} />
              </FieldGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input value={modal.center.city || ''} onChange={e => setField('city', e.target.value)} placeholder="Silver Spring" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input value={modal.center.state} onChange={e => setField('state', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Zip</label>
                  <input value={modal.center.zip || ''} onChange={e => setField('zip', e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Heat status */}
              <FieldGroup label="Heat status">
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['hot', 'cold', 'dead'] as const).map(h => {
                    const hc = HEAT[h]
                    const selected = modal.center.heat_status === h
                    return (
                      <button key={h} onClick={() => setField('heat_status', h)}
                        style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${selected ? hc.color : '#DDD'}`, background: selected ? hc.bg : '#fff', color: selected ? hc.color : '#888', fontWeight: selected ? 600 : 400, fontSize: 13, cursor: 'pointer' }}>
                        {hc.label}
                      </button>
                    )
                  })}
                </div>
              </FieldGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Assigned day</label>
                  <select value={modal.center.assigned_day || ''} onChange={e => setField('assigned_day', e.target.value || null)} style={inputStyle}>
                    <option value="">— Not assigned —</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Visit frequency</label>
                  <select value={modal.center.visit_frequency} onChange={e => setField('visit_frequency', e.target.value)} style={inputStyle}>
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {/* Week group */}
              <FieldGroup label="Route week">
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2].map(w => (
                    <button key={w} onClick={() => setField('week_group', w)}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${modal.center.week_group === w ? '#0B6B5C' : '#DDD'}`, background: modal.center.week_group === w ? '#D1FAE5' : '#fff', color: modal.center.week_group === w ? '#0B6B5C' : '#888', fontWeight: modal.center.week_group === w ? 600 : 400, fontSize: 13, cursor: 'pointer' }}>
                      Week {w}
                    </button>
                  ))}
                </div>
              </FieldGroup>

              {/* Go/No-Go */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '12px 0', borderTop: '1px solid #F0F0F0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>Include in route (Go)</div>
                  <div style={{ fontSize: 12, color: '#AAA' }}>Toggle off to mark as No-Go</div>
                </div>
                <button onClick={() => setField('go_no_go', !modal.center.go_no_go)}
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: modal.center.go_no_go ? '#0B6B5C' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: modal.center.go_no_go ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>

              <FieldGroup label="Notes">
                <textarea value={modal.center.notes || ''} onChange={e => setField('notes', e.target.value)}
                  placeholder="Any notes about this facility…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </FieldGroup>
            </div>

            {/* Modal footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #F0F0F0' }}>
              <button onClick={closeModal} disabled={saving}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #DDD', background: '#fff', color: '#555', fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0B6B5C', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : modal.mode === 'add' ? 'Add facility' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #DDD',
  fontSize: 13, boxSizing: 'border-box', color: '#111', background: '#fff',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 5,
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, color: '#555', background: '#fff', cursor: 'pointer' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
