'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react'

interface Stage { id: string; key: string; label: string; color: string; bg_color: string; order_index: number; is_active: boolean; is_system: boolean }
interface ServiceType { id: string; label: string; order_index: number; is_active: boolean }

const PRESET_COLORS = [
  { color: '#8FA0B0', bg: '#EFF2F5', label: 'Grey' },
  { color: '#457B9D', bg: '#EBF4FF', label: 'Blue' },
  { color: '#7C3AED', bg: '#EDE9FE', label: 'Purple' },
  { color: '#D97706', bg: '#FEF3C7', label: 'Amber' },
  { color: '#0891B2', bg: '#E0F2FE', label: 'Cyan' },
  { color: '#059669', bg: '#D1FAE5', label: 'Emerald' },
  { color: '#0B6B5C', bg: '#A7F3D0', label: 'Teal' },
  { color: '#DC2626', bg: '#FEE2E2', label: 'Red' },
  { color: '#92400E', bg: '#FDE68A', label: 'Brown' },
  { color: '#6B7280', bg: '#F3F4F6', label: 'Dark Grey' },
]

export default function LeadsSettingsClient({ stages: initStages, serviceTypes: initServiceTypes }: { stages: Stage[]; serviceTypes: ServiceType[] }) {
  const router = useRouter()
  const [stages, setStages] = useState(initStages)
  const [serviceTypes, setServiceTypes] = useState(initServiceTypes)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'stages' | 'services'>('stages')

  // Stage form
  const [newStageLabel, setNewStageLabel] = useState('')
  const [newStageColor, setNewStageColor] = useState(PRESET_COLORS[0])

  // Service type form
  const [newServiceLabel, setNewServiceLabel] = useState('')

  const toKey = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

  const addStage = async () => {
    if (!newStageLabel.trim()) return
    setSaving(true)
    const res = await fetch('/api/leads/stages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newStageLabel.trim(), key: toKey(newStageLabel), color: newStageColor.color, bg_color: newStageColor.bg }),
    })
    if (res.ok) {
      const { stage } = await res.json()
      setStages(s => [...s, stage])
      setNewStageLabel('')
    } else { const d = await res.json(); alert(d.error) }
    setSaving(false)
  }

  const deleteStage = async (id: string) => {
    if (!confirm('Delete this stage?')) return
    setSaving(true)
    const res = await fetch('/api/leads/stages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    if (res.ok) setStages(s => s.filter(x => x.id !== id))
    else { const d = await res.json(); alert(d.error) }
    setSaving(false)
  }

  const addServiceType = async () => {
    if (!newServiceLabel.trim()) return
    setSaving(true)
    const res = await fetch('/api/leads/service-types', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newServiceLabel.trim() }),
    })
    if (res.ok) {
      const { serviceType } = await res.json()
      setServiceTypes(s => [...s, serviceType])
      setNewServiceLabel('')
    } else { const d = await res.json(); alert(d.error) }
    setSaving(false)
  }

  const toggleServiceType = async (id: string) => {
    setSaving(true)
    const res = await fetch('/api/leads/service-types', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id }),
    })
    if (res.ok) setServiceTypes(s => s.map(x => x.id === id ? { ...x, is_active: !x.is_active } : x))
    setSaving(false)
  }

  const deleteServiceType = async (id: string) => {
    if (!confirm('Delete this service type?')) return
    setSaving(true)
    await fetch('/api/leads/service-types', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    setServiceTypes(s => s.filter(x => x.id !== id))
    setSaving(false)
  }

  const inp: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/leads" style={{ color: '#8FA0B0', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={13}/> Leads & Pipeline
        </Link>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E44', margin: '0 0 20px' }}>⚙️ Pipeline Settings</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#F8FAFB', borderRadius: 10, padding: 4, border: '1px solid #E2E8F0', marginBottom: 24, width: 'fit-content' }}>
        {(['stages', 'services'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 20px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: activeTab === t ? '#fff' : 'transparent', color: activeTab === t ? '#0B6B5C' : '#8FA0B0', boxShadow: activeTab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {t === 'stages' ? '⬛ Pipeline Stages' : '🏷️ Service Types'}
          </button>
        ))}
      </div>

      {/* ── Stages tab ── */}
      {activeTab === 'stages' && (
        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 20 }}>
            {stages.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < stages.length - 1 ? '1px solid #EFF2F5' : 'none' }}>
                <GripVertical size={14} color="#CBD5E0"/>
                <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg_color, color: s.color, minWidth: 120, textAlign: 'center' }}>{s.label}</span>
                <span style={{ fontSize: 11, color: '#CBD5E0', fontFamily: 'monospace' }}>{s.key}</span>
                <span style={{ fontSize: 11, color: '#CBD5E0', marginLeft: 'auto' }}>order: {s.order_index}</span>
                {s.is_system
                  ? <span style={{ fontSize: 11, color: '#CBD5E0', padding: '2px 8px', border: '1px solid #E2E8F0', borderRadius: 6 }}>system</span>
                  : <button onClick={() => deleteStage(s.id)} disabled={saving} style={{ padding: '5px 8px', background: '#FEE2E2', border: 'none', borderRadius: 7, color: '#DC2626', cursor: 'pointer' }}><Trash2 size={13}/></button>
                }
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px 20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', margin: '0 0 14px' }}>Add New Stage</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Stage Label</div>
                <input value={newStageLabel} onChange={e => setNewStageLabel(e.target.value)} placeholder="e.g. Contract Sent" style={{ ...inp, width: '100%', boxSizing: 'border-box' }}
                  onKeyDown={e => e.key === 'Enter' && addStage()}/>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Colour</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c.color} type="button" onClick={() => setNewStageColor(c)}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: c.color, border: newStageColor.color === c.color ? '3px solid #1A2E44' : '2px solid transparent', cursor: 'pointer' }} title={c.label}/>
                  ))}
                </div>
              </div>
              <button onClick={addStage} disabled={saving || !newStageLabel.trim()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', background: newStageLabel.trim() ? '#0B6B5C' : '#E2E8F0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: newStageLabel.trim() ? 'pointer' : 'not-allowed' }}>
                <Plus size={13}/> Add Stage
              </button>
            </div>
            {newStageLabel && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#8FA0B0' }}>Preview:</span>
                <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: newStageColor.bg, color: newStageColor.color }}>{newStageLabel}</span>
                <span style={{ fontSize: 11, color: '#CBD5E0', fontFamily: 'monospace' }}>key: {toKey(newStageLabel)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Service types tab ── */}
      {activeTab === 'services' && (
        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 20 }}>
            {serviceTypes.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < serviceTypes.length - 1 ? '1px solid #EFF2F5' : 'none', opacity: s.is_active ? 1 : 0.5 }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1A2E44' }}>{s.label}</span>
                <button onClick={() => toggleServiceType(s.id)} disabled={saving} title={s.is_active ? 'Hide' : 'Show'}
                  style={{ padding: '5px 8px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 7, color: '#8FA0B0', cursor: 'pointer' }}>
                  {s.is_active ? <Eye size={13}/> : <EyeOff size={13}/>}
                </button>
                <button onClick={() => deleteServiceType(s.id)} disabled={saving}
                  style={{ padding: '5px 8px', background: '#FEE2E2', border: 'none', borderRadius: 7, color: '#DC2626', cursor: 'pointer' }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px 20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', margin: '0 0 14px' }}>Add New Service Type</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={newServiceLabel} onChange={e => setNewServiceLabel(e.target.value)} placeholder="e.g. VA Benefits" style={{ ...inp, flex: 1 }}
                onKeyDown={e => e.key === 'Enter' && addServiceType()}/>
              <button onClick={addServiceType} disabled={saving || !newServiceLabel.trim()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', background: newServiceLabel.trim() ? '#0B6B5C' : '#E2E8F0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: newServiceLabel.trim() ? 'pointer' : 'not-allowed' }}>
                <Plus size={13}/> Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
