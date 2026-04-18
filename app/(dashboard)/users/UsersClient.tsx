'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  UserPlus, Mail, Shield, User, CheckCircle, XCircle,
  Edit2, X, Send, Download, RefreshCw, AlertCircle,
} from 'lucide-react'

interface Profile {
  id: string; email: string; full_name: string; role: string;
  status: string; hire_date?: string; department?: string; phone?: string;
  created_at: string; axiscare_id?: string; can_be_assigned?: boolean;
}

interface AxCG {
  id: number
  firstName: string
  lastName: string
  personalEmail: string | null
  mobilePhone: string | null
  homePhone: string | null
  hireDate: string | null
  status: { active: boolean; label: string } | string | null
  classes: { code: string; label: string }[] | null
}

const ROLES       = ['admin', 'supervisor', 'nurse_monitor', 'staff', 'caregiver']
const DEPARTMENTS = ['Home Care', 'Administrative', 'Clinical', 'Operations', 'Management']

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5,
}

// ─── AxisCare Import Panel ────────────────────────────────────────────────────

function AxisCareImportPanel({
  existingEmails, onClose, onSuccess,
}: {
  existingEmails: Set<string>
  onClose: () => void
  onSuccess: (count: number) => void
}) {
  type Stage = 'loading' | 'selecting' | 'importing' | 'done' | 'error'

  const [stage,       setStage]       = useState<Stage>('loading')
  const [caregivers,  setCaregivers]  = useState<AxCG[]>([])
  const [selected,    setSelected]    = useState<Set<number>>(new Set())
  const [search,      setSearch]      = useState('')
  const [statusFlt,   setStatusFlt]   = useState<'all' | 'active' | 'inactive'>('active')
  const [errorMsg,    setErrorMsg]    = useState('')
  const [results,     setResults]     = useState<{
    imported: string[]; skipped: string[]; failed: string[]
  }>({ imported: [], skipped: [], failed: [] })

  useEffect(() => {
    fetch('/api/axiscare/caregivers')
      .then(r => r.json())
      .then(data => {
        if (!data.success) {
          const msg = data.error || 'Failed to connect to AxisCare'
          const debug = data.debug ? `\n\nDebug: ${JSON.stringify(data.debug)}` : ''
          setErrorMsg(msg + debug)
          setStage('error')
          return
        }
        setCaregivers(data.caregivers || [])
        setStage('selecting')
      })
      .catch(() => { setErrorMsg('Network error — could not reach AxisCare'); setStage('error') })
  }, [])

  const axisStatusLabel = (cg: AxCG): string => {
    if (!cg.status) return 'Unknown'
    if (typeof cg.status === 'object') return cg.status.label || 'Unknown'
    return String(cg.status)
  }
  const axisIsActive = (cg: AxCG): boolean => {
    if (!cg.status) return false
    if (typeof cg.status === 'object') return cg.status.active
    return String(cg.status).toLowerCase() === 'active'
  }
  const alreadyImported = (cg: AxCG) =>
    !!cg.personalEmail && existingEmails.has(cg.personalEmail.toLowerCase())
  const canImport = (cg: AxCG) =>
    !!cg.personalEmail && !existingEmails.has(cg.personalEmail.toLowerCase())

  const filtered = caregivers.filter(cg => {
    const name  = `${cg.firstName} ${cg.lastName}`.toLowerCase()
    const email = (cg.personalEmail || '').toLowerCase()
    const matchSearch = !search ||
      name.includes(search.toLowerCase()) || email.includes(search.toLowerCase())
    const matchStatus =
      statusFlt === 'all' ||
      (statusFlt === 'active' ? axisIsActive(cg) : !axisIsActive(cg))
    return matchSearch && matchStatus
  })

  const selectableFiltered = filtered.filter(canImport)
  const allSelected = selectableFiltered.length > 0 &&
    selectableFiltered.every(cg => selected.has(cg.id))

  const toggleSelect = (id: number, cg: AxCG) => {
    if (!canImport(cg)) return
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleAll = () => {
    if (allSelected) {
      setSelected(s => { const n = new Set(s); selectableFiltered.forEach(cg => n.delete(cg.id)); return n })
    } else {
      setSelected(s => { const n = new Set(s); selectableFiltered.forEach(cg => n.add(cg.id)); return n })
    }
  }

  const handleImport = async () => {
    const toImport = caregivers.filter(cg => selected.has(cg.id))
    if (!toImport.length) return
    setStage('importing')
    try {
      const res = await fetch('/api/axiscare/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caregivers: toImport }),
      })
      const data = await res.json()
      setResults(data.results || { imported: [], skipped: [], failed: [] })
      setStage('done')
      if ((data.results?.imported?.length || 0) > 0) {
        onSuccess(data.results.imported.length)
      }
    } catch {
      setErrorMsg('Import request failed. Please try again.')
      setStage('error')
    }
  }

  if (stage === 'error') return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ width: 52, height: 52, background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <AlertCircle size={24} color="#E63946" />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A2E44', marginBottom: 8 }}>Connection Failed</h3>
      <p style={{ fontSize: 13, color: '#8FA0B0', marginBottom: 20, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 20px' }}>{errorMsg}</p>
      <button onClick={onClose} style={{ padding: '9px 20px', background: '#EFF2F5', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#4A6070' }}>Close</button>
    </div>
  )

  if (stage === 'loading') return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ width: 48, height: 48, border: '3px solid #E6F4F4', borderTopColor: '#0E7C7B', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 14, color: '#8FA0B0' }}>Connecting to AxisCare…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (stage === 'importing') return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ width: 48, height: 48, border: '3px solid #E6F4F4', borderTopColor: '#0E7C7B', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 14, color: '#1A2E44', fontWeight: 600 }}>Importing {selected.size} caregiver{selected.size !== 1 ? 's' : ''}…</p>
      <p style={{ fontSize: 13, color: '#8FA0B0', marginTop: 6 }}>This may take a moment. Please don't close this window.</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (stage === 'done') return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Imported', value: results.imported.length, color: '#2A9D8F', bg: '#E6F6F4', icon: '✓' },
          { label: 'Skipped',  value: results.skipped.length,  color: '#F4A261', bg: '#FEF3EA', icon: '↷' },
          { label: 'Failed',   value: results.failed.length,   color: '#E63946', bg: '#FEE2E2', icon: '✕' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.icon} {s.value}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#FEF3EA', border: '1px solid #F4A26166', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
        <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
          <strong>All imported caregivers are set to Inactive.</strong> Complete their credentials on the portal, brief them about the app, then activate their account in User Management to enable Vita notifications.
        </div>
      </div>
      {results.imported.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2A9D8F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>✓ Imported ({results.imported.length})</div>
          <div style={{ background: '#F8FAFB', borderRadius: 8, padding: '8px 12px', maxHeight: 120, overflowY: 'auto' }}>
            {results.imported.map((n, i) => <div key={i} style={{ fontSize: 12, color: '#1A2E44', padding: '2px 0', borderBottom: i < results.imported.length - 1 ? '1px solid #EFF2F5' : 'none' }}>{n}</div>)}
          </div>
        </div>
      )}
      {results.skipped.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F4A261', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>↷ Already in Portal ({results.skipped.length})</div>
          <div style={{ background: '#F8FAFB', borderRadius: 8, padding: '8px 12px', maxHeight: 80, overflowY: 'auto' }}>
            {results.skipped.map((n, i) => <div key={i} style={{ fontSize: 12, color: '#8FA0B0', padding: '2px 0' }}>{n}</div>)}
          </div>
        </div>
      )}
      {results.failed.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#E63946', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>✕ Failed ({results.failed.length})</div>
          <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '8px 12px', maxHeight: 80, overflowY: 'auto' }}>
            {results.failed.map((n, i) => <div key={i} style={{ fontSize: 12, color: '#B91C1C', padding: '2px 0' }}>{n}</div>)}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={{ padding: '10px 24px', background: '#0E7C7B', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#fff' }}>Done</button>
      </div>
    </div>
  )

  const importable    = caregivers.filter(canImport).length
  const alreadyInPort = caregivers.filter(alreadyImported).length
  const noEmail       = caregivers.filter(cg => !cg.personalEmail).length

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Available to import', value: importable,    color: '#2A9D8F', bg: '#E6F6F4' },
          { label: 'Already in portal',   value: alreadyInPort, color: '#F4A261', bg: '#FEF3EA' },
          { label: 'No email (skipped)',   value: noEmail,       color: '#8FA0B0', bg: '#F8FAFB' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#E6F4F4', border: '1px solid #0E7C7B22', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#0A5C5B', lineHeight: 1.6 }}>
        🔒 <strong>Imported caregivers will be set to Inactive.</strong> No login email is sent. You'll activate each aide manually after completing their onboarding on the portal.
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search by name or email…"
          style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none' }} />
        <select value={statusFlt} onChange={e => setStatusFlt(e.target.value as any)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="active">Active in AxisCare</option>
          <option value="inactive">Inactive in AxisCare</option>
          <option value="all">All statuses</option>
        </select>
      </div>
      <div style={{ border: '1px solid #EFF2F5', borderRadius: 10, overflow: 'hidden', marginBottom: 14, maxHeight: 380, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#F8FAFB', position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={{ padding: '9px 12px', textAlign: 'left', width: 32 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={selectableFiltered.length === 0}
                  style={{ cursor: selectableFiltered.length > 0 ? 'pointer' : 'not-allowed' }} />
              </th>
              {['Name', 'Email', 'Phone', 'Hire Date', 'AxisCare Status', 'Portal'].map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.7px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#8FA0B0', fontSize: 13 }}>No caregivers match your filters</td></tr>
            ) : filtered.map(cg => {
              const isImportable  = canImport(cg)
              const alreadyHere   = alreadyImported(cg)
              const noEmailFlag   = !cg.personalEmail
              const isSelected    = selected.has(cg.id)
              return (
                <tr key={cg.id} onClick={() => isImportable && toggleSelect(cg.id, cg)}
                  style={{ borderBottom: '1px solid #EFF2F5', background: isSelected ? '#E6F6F4' : 'transparent', cursor: isImportable ? 'pointer' : 'default', opacity: !isImportable ? 0.6 : 1, transition: 'background 0.15s' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <input type="checkbox" checked={isSelected} disabled={!isImportable}
                      onChange={() => toggleSelect(cg.id, cg)}
                      style={{ cursor: isImportable ? 'pointer' : 'not-allowed' }}
                      onClick={e => e.stopPropagation()} />
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1A2E44', whiteSpace: 'nowrap' }}>{cg.firstName} {cg.lastName}</td>
                  <td style={{ padding: '10px 12px', color: '#4A6070', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cg.personalEmail || <span style={{ color: '#CBD5E0', fontStyle: 'italic' }}>none</span>}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#8FA0B0', whiteSpace: 'nowrap' }}>{cg.mobilePhone || cg.homePhone || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#8FA0B0', whiteSpace: 'nowrap' }}>
                    {cg.hireDate ? new Date(cg.hireDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: axisIsActive(cg) ? '#E6F6F4' : '#F8FAFB', color: axisIsActive(cg) ? '#2A9D8F' : '#8FA0B0' }}>
                      {axisStatusLabel(cg)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {alreadyHere && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: '#FEF3EA', color: '#B45309' }}><CheckCircle size={10} /> In Portal</span>}
                    {noEmailFlag && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: '#FEE2E2', color: '#B91C1C' }}><XCircle size={10} /> No Email</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 13, color: '#8FA0B0' }}>
          {selected.size > 0
            ? <span style={{ color: '#0E7C7B', fontWeight: 700 }}>{selected.size} caregiver{selected.size !== 1 ? 's' : ''} selected</span>
            : `${filtered.length} shown · tick rows to select`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: '#EFF2F5', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#4A6070' }}>Cancel</button>
          <button onClick={handleImport} disabled={selected.size === 0}
            style={{ padding: '9px 20px', background: selected.size > 0 ? '#0E7C7B' : '#CBD5E0', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: selected.size > 0 ? 'pointer' : 'not-allowed', color: '#fff', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Download size={14} />
            Import {selected.size > 0 ? `${selected.size} ` : ''}Caregiver{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Invite Panel ─────────────────────────────────────────────────────────────

function InvitePanel({ onClose, onSuccess, caregiverOnly = false }: {
  onClose: () => void; onSuccess: () => void; caregiverOnly?: boolean
}) {
  const [step,    setStep]    = useState<'form' | 'sent'>('form')
  const [sending, setSending] = useState(false)
  const [form,    setForm]    = useState({ full_name: '', email: '', role: 'caregiver', department: '' })

  const handleInvite = async () => {
    if (!form.full_name.trim() || !form.email.trim()) { alert('Name and email are required.'); return }
    setSending(true)
    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: form.full_name, email: form.email, role: form.role, department: form.department }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Failed to send invite.'); setSending(false); return }
      if (data.status === 'already_exists') { alert('An account with this email already exists.'); setSending(false); return }
      setStep('sent')
    } catch { alert('Network error. Please try again.') }
    setSending(false)
  }

  if (step === 'sent') return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ width: 52, height: 52, background: '#E6F6F4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <Send size={22} color="#2A9D8F" />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A2E44', marginBottom: 6 }}>Invite sent!</h3>
      <p style={{ color: '#8FA0B0', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
        An email was sent to <strong>{form.email}</strong>.<br />
        They click the link to set their password and access the portal.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={() => { setStep('form'); setForm({ full_name:'', email:'', role:'caregiver', department:'' }) }}
          style={{ padding: '9px 18px', background: '#EFF2F5', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#4A6070' }}>
          Invite Another
        </button>
        <button onClick={() => { onSuccess(); onClose() }}
          style={{ padding: '9px 18px', background: '#0E7C7B', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#fff' }}>
          Done
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Full Name *</label>
        <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Amara Nwosu" style={inp} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Email Address *</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="caregiver@email.com" style={inp} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={lbl}>Role</label>
          {caregiverOnly ? (
            <div style={{ ...inp, background: '#F8FAFB', color: '#2A9D8F', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>👤 Caregiver</div>
          ) : (
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inp}>
              {ROLES.map(r => <option key={r} value={r}>{r === 'nurse_monitor' ? 'Nurse Monitor' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          )}
        </div>
        <div>
          <label style={lbl}>Department</label>
          <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={inp}>
            <option value="">Select…</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div style={{ background: '#E6F4F4', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#0A5C5B', marginBottom: 20, lineHeight: 1.6 }}>
        📧 Staff will receive an email with a login link. They set their own password on first sign-in.
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '9px 20px', background: '#EFF2F5', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#4A6070' }}>Cancel</button>
        <button onClick={handleInvite} disabled={sending} style={{ padding: '9px 20px', background: '#0E7C7B', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#fff', opacity: sending ? 0.7 : 1 }}>
          {sending ? 'Sending…' : '✉️ Send Invite'}
        </button>
      </div>
    </div>
  )
}

// ─── Edit Panel ───────────────────────────────────────────────────────────────

function EditPanel({ profile, onClose, onSuccess }: {
  profile: Profile; onClose: () => void; onSuccess: () => void
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name:       profile.full_name,
    role:            profile.role,
    department:      profile.department || '',
    phone:           profile.phone || '',
    hire_date:       profile.hire_date || '',
    status:          profile.status,
    can_be_assigned: profile.can_be_assigned ?? false,
  })
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving,        setPwSaving]        = useState(false)
  const [pwMsg,           setPwMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleSetPassword = async () => {
    if (newPassword.length < 8) { setPwMsg({ type: 'err', text: 'Password must be at least 8 characters.' }); return }
    if (newPassword !== confirmPassword) { setPwMsg({ type: 'err', text: 'Passwords do not match.' }); return }
    setPwSaving(true); setPwMsg(null)
    const res = await fetch('/api/admin/set-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.id, password: newPassword }),
    })
    const json = await res.json()
    if (json.success) { setPwMsg({ type: 'ok', text: 'Password updated successfully.' }); setNewPassword(''); setConfirmPassword('') }
    else { setPwMsg({ type: 'err', text: json.error || 'Failed to update password.' }) }
    setPwSaving(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/update-profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: profile.id,
        updates: {
          full_name:       form.full_name,
          role:            form.role,
          department:      form.department || null,
          phone:           form.phone || null,
          hire_date:       form.hire_date || null,
          status:          form.status,
          can_be_assigned: form.can_be_assigned,
        },
      }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Error updating profile.'); setSaving(false); return }
    onSuccess(); onClose(); router.refresh(); setSaving(false)
  }

  // Only show can_be_assigned toggle for supervisor or nurse_monitor
  const showAssignToggle = form.role === 'supervisor' || form.role === 'nurse_monitor'

  return (
    <div>
      {profile.axiscare_id && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E6F4F4', border: '1px solid #0E7C7B33', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#0A5C5B', marginBottom: 16 }}>
          <RefreshCw size={11} /> Imported from AxisCare (ID: {profile.axiscare_id})
        </div>
      )}
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Full Name</label>
        <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={inp} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Email</label>
        <input value={profile.email} disabled style={{ ...inp, background: '#F8FAFB', color: '#8FA0B0' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={lbl}>Role</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inp}>
            {ROLES.map(r => <option key={r} value={r}>{r === 'nurse_monitor' ? 'Nurse Monitor' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* can_be_assigned toggle — only for supervisor / nurse_monitor */}
      {showAssignToggle && (
        <div style={{ marginBottom: 14, padding: '12px 14px', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 9 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.can_be_assigned}
              onChange={e => setForm(f => ({ ...f, can_be_assigned: e.target.checked }))}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: '#7C3AED', cursor: 'pointer', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#4C1D95' }}>Can be assigned to assessment clients</div>
              <div style={{ fontSize: 11, color: '#6D28D9', marginTop: 3, lineHeight: 1.5 }}>
                When enabled, this person appears in the nurse assignment dropdown on assessment client records.
              </div>
            </div>
          </label>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={lbl}>Department</label>
          <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={inp}>
            <option value="">Select…</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Hire Date</label>
          <input type="date" value={form.hire_date} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))} style={inp} />
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={lbl}>Phone</label>
        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (410) 555-0000" style={inp} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '9px 20px', background: '#EFF2F5', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#4A6070' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', background: '#0E7C7B', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#fff', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Password section */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #EFF2F5' }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 6, marginTop: 0 }}>🔑 Set Password</h4>
        <p style={{ fontSize: 12, color: '#8FA0B0', marginBottom: 14, marginTop: 0 }}>Set a password so the staff member can log in without a magic link.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={lbl}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" style={inp} />
          </div>
          <div>
            <label style={lbl}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" style={inp} />
          </div>
        </div>
        {pwMsg && (
          <div style={{ padding: '8px 12px', borderRadius: 7, marginBottom: 10, fontSize: 13, background: pwMsg.type === 'ok' ? '#E6F6F4' : '#FDE8E9', color: pwMsg.type === 'ok' ? '#2A9D8F' : '#E63946' }}>
            {pwMsg.type === 'ok' ? '✓ ' : '⚠ '}{pwMsg.text}
          </div>
        )}
        <button onClick={handleSetPassword} disabled={pwSaving || !newPassword}
          style={{ padding: '8px 18px', background: newPassword ? '#1A2E44' : '#CBD5E0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: newPassword ? 'pointer' : 'not-allowed' }}>
          {pwSaving ? 'Setting…' : 'Set Password'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type PanelState = null | 'invite' | 'axiscare' | { type: 'edit'; profile: Profile }

export default function UsersClient({
  profiles, currentUserId, currentUserRole = 'admin',
}: {
  profiles: Profile[]; currentUserId: string; currentUserRole?: string
}) {
  const [search,      setSearch]      = useState('')
  const [roleFilter,  setRoleFilter]  = useState('all')
  const [panel,       setPanel]       = useState<PanelState>(null)
  const [toast,       setToast]       = useState('')
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const router = useRouter()

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const existingEmails = new Set(profiles.map(p => (p.email || '').toLowerCase()).filter(Boolean))

  const handleDeleteUser = async (profileId: string, profileName: string) => {
    if (!confirm(`Permanently delete ${profileName}? This cannot be undone.`)) return
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profileId }),
    })
    if (res.ok) { showToast(`${profileName} deleted`); router.refresh() }
    else alert('Failed to delete user. Please try again.')
  }

  const handleApprove = async (profileId: string, profileName: string) => {
    setApprovingId(profileId)
    const res = await fetch('/api/auth/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profileId }),
    })
    if (res.ok) { showToast(`${profileName} approved — access granted`); router.refresh() }
    else alert('Failed to approve user. Please try again.')
    setApprovingId(null)
  }

  const handleReject = async (profileId: string, profileName: string) => {
    const reason = window.prompt(`Reason for rejecting ${profileName} (optional):`)
    if (reason === null) return
    const res = await fetch('/api/auth/reject', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profileId, reason }),
    })
    if (res.ok) { showToast(`${profileName} rejected`); router.refresh() }
    else alert('Failed to reject user. Please try again.')
  }

  const filtered = profiles.filter(p => {
    const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || p.role === roleFilter
    return matchSearch && matchRole
  })

  const active = profiles.filter(p => p.status === 'active').length

  const roleColor = (r: string) =>
    r === 'admin'         ? '#1A2E44' :
    r === 'supervisor'    ? '#0E7C7B' :
    r === 'staff'         ? '#1D4ED8' :
    r === 'nurse_monitor' ? '#7C3AED' :
    '#2A9D8F'

  const roleBg = (r: string) =>
    r === 'admin'         ? '#EFF2F5' :
    r === 'supervisor'    ? '#E6F4F4' :
    r === 'staff'         ? '#EFF6FF' :
    r === 'nurse_monitor' ? '#F5F3FF' :
    '#E6F6F4'

  const roleDisplayLabel = (r: string) =>
    r === 'nurse_monitor' ? 'Nurse Monitor' :
    r.charAt(0).toUpperCase() + r.slice(1)

  const panelMaxWidth = panel === 'axiscare' ? 820 : 480

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1A2E44', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          ✓ {toast}
        </div>
      )}

      {panel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: panelMaxWidth, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1A2E44', margin: 0 }}>
                {panel === 'invite'   ? '✉️ Invite Staff Member' :
                 panel === 'axiscare' ? '⬇️ Import from AxisCare' :
                 `✏️ Edit — ${(panel as any).profile.full_name}`}
              </h2>
              <button onClick={() => setPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            {panel === 'invite' && (
              <InvitePanel onClose={() => setPanel(null)} onSuccess={() => { showToast('Invite sent!'); router.refresh() }} caregiverOnly={currentUserRole !== 'admin'} />
            )}
            {panel === 'axiscare' && (
              <AxisCareImportPanel existingEmails={existingEmails} onClose={() => setPanel(null)}
                onSuccess={(count) => { showToast(`${count} caregiver${count !== 1 ? 's' : ''} imported — status: Inactive`); router.refresh() }} />
            )}
            {panel !== 'invite' && panel !== 'axiscare' && (
              <EditPanel profile={(panel as any).profile} onClose={() => setPanel(null)} onSuccess={() => showToast('Profile updated')} />
            )}
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>
            {currentUserRole === 'admin' ? 'User Management' : 'Caregiver Management'}
          </h1>
          <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>
            {currentUserRole === 'admin'
              ? `${active} active staff · manage roles, invite, and deactivate`
              : `${profiles.filter(p => p.status === 'active').length} active caregivers · invite and manage caregiver accounts`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setPanel('axiscare')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#1A2E44', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={15} /> Import from AxisCare
          </button>
          <button onClick={() => setPanel('invite')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <UserPlus size={15} /> {currentUserRole === 'admin' ? 'Invite Staff' : 'Add Caregiver'}
          </button>
        </div>
      </div>

      {/* Pending approvals */}
      {profiles.filter(p => p.status === 'pending').length > 0 && (
        <div style={{ background: '#FEF3EA', border: '1px solid #F4A261', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 18 }}>⏳</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1A2E44' }}>
                {profiles.filter(p => p.status === 'pending').length} Account{profiles.filter(p => p.status === 'pending').length !== 1 ? 's' : ''} Awaiting Approval
              </div>
              <div style={{ fontSize: 12, color: '#8FA0B0', marginTop: 1 }}>Review and approve before users can access the portal</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {profiles.filter(p => p.status === 'pending').map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #F4A26133' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #F4A261, #E07800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {p.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1A2E44' }}>{p.full_name}</div>
                  <div style={{ fontSize: 12, color: '#8FA0B0', marginTop: 1 }}>{p.email}</div>
                  <div style={{ fontSize: 11, color: '#F4A261', fontWeight: 600, marginTop: 2 }}>
                    Registered {p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleApprove(p.id, p.full_name)} disabled={approvingId === p.id}
                    style={{ padding: '8px 18px', background: '#2A9D8F', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: approvingId === p.id ? 0.7 : 1 }}>
                    {approvingId === p.id ? '…' : '✓ Approve'}
                  </button>
                  <button onClick={() => handleReject(p.id, p.full_name)}
                    style={{ padding: '8px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#B91C1C', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Staff',    value: profiles.length,                                                              color: '#1A2E44' },
          { label: 'Active',         value: active,                                                                       color: '#2A9D8F' },
          { label: 'Admins',         value: profiles.filter(p => p.role === 'admin').length,                             color: '#0E7C7B' },
          { label: 'Supervisors',    value: profiles.filter(p => p.role === 'staff' || p.role === 'supervisor').length,  color: '#1D4ED8' },
          { label: 'Nurse Monitors', value: profiles.filter(p => p.role === 'nurse_monitor').length,                     color: '#7C3AED' },
          { label: 'Caregivers',     value: profiles.filter(p => p.role === 'caregiver').length,                         color: '#F4A261' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', borderLeft: `4px solid ${s.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1A2E44', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Google SSO notice */}
      <div style={{ background: '#E6F4F4', border: '1px solid #0E7C7B33', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <svg width="20" height="20" viewBox="0 0 18 18" style={{ flexShrink: 0, marginTop: 1 }}>
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.82v2.07A8 8 0 0 0 8.98 17z"/>
          <path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.04.25-1.52V5.41H1.82a8 8 0 0 0 0 7.18l2.69-2.07z"/>
          <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.82 5.4L4.51 7.48C5.14 5.59 6.9 3.58 8.98 3.58z"/>
        </svg>
        <div style={{ fontSize: 13, color: '#0A5C5B', lineHeight: 1.6 }}>
          <strong>Google Workspace SSO is active.</strong> Staff with a <em>@vitalishealthcare.com</em> Google account can sign in with one click.
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search by name or email…"
          style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', background: '#fff' }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' }}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{roleDisplayLabel(r)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 40 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#8FA0B0' }}>
            <UserPlus size={40} style={{ margin: '0 auto 14px', display: 'block', color: '#D1D9E0' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1A2E44', marginBottom: 6 }}>No staff yet</p>
            <p style={{ fontSize: 13 }}>Use "Import from AxisCare" or "Invite Staff" to add team members.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFB', borderBottom: '1px solid #EFF2F5' }}>
                {['Name & Email', 'Role', 'Department', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #EFF2F5', opacity: p.status === 'inactive' ? 0.6 : 1 }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1A2E44', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${roleColor(p.role)}, #F4A261)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
                        {p.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {p.full_name}
                          {p.id === currentUserId && <span style={{ fontSize: 10, color: '#0E7C7B', fontWeight: 700 }}>(you)</span>}
                          {p.axiscare_id && <span style={{ fontSize: 9, background: '#E6F4F4', color: '#0A5C5B', fontWeight: 700, padding: '1px 6px', borderRadius: 8, letterSpacing: '0.5px' }}>AC</span>}
                          {p.can_be_assigned && (p.role === 'supervisor' || p.role === 'nurse_monitor') && (
                            <span style={{ fontSize: 9, background: '#F5F3FF', color: '#7C3AED', fontWeight: 700, padding: '1px 6px', borderRadius: 8, letterSpacing: '0.5px' }}>ASSIGNABLE</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#8FA0B0' }}>{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: roleBg(p.role), color: roleColor(p.role) }}>
                      {roleDisplayLabel(p.role)}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#8FA0B0' }}>{p.department || '—'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: p.status === 'active' ? '#2A9D8F' : '#8FA0B0' }}>
                      {p.status === 'active' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#8FA0B0', fontSize: 12 }}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {currentUserRole === 'admin' && (
                        <button onClick={() => setPanel({ type: 'edit', profile: p })}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#EFF2F5', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#4A6070' }}>
                          <Edit2 size={12} /> Edit
                        </button>
                      )}
                      {currentUserRole !== 'admin' && p.role === 'caregiver' && p.status !== 'pending' && (
                        <button
                          onClick={async () => {
                            const newStatus = p.status === 'active' ? 'inactive' : 'active'
                            const res = await fetch('/api/admin/update-profile', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: p.id, updates: { status: newStatus } }),
                            })
                            if (res.ok) { showToast(`${p.full_name} set to ${newStatus}`); router.refresh() }
                            else alert('Failed to update status.')
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', border: 'none',
                            background: p.status === 'active' ? '#FEF2F2' : '#E6F6F4',
                            color: p.status === 'active' ? '#B91C1C' : '#0A5C5B',
                          }}>
                          {p.status === 'active' ? '⏸ Deactivate' : '▶ Activate'}
                        </button>
                      )}
                      {currentUserRole !== 'admin' && p.role !== 'caregiver' && p.status !== 'pending' && (
                        <span style={{ fontSize: 11, color: '#B0BEC5', padding: '6px 0' }}>Manage in Directory</span>
                      )}
                      {currentUserRole === 'admin' && p.id !== currentUserId && (
                        <button onClick={() => handleDeleteUser(p.id, p.full_name)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#B91C1C' }}>
                          ✕ Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
