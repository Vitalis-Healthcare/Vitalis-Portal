'use client'
import { printWindow, downloadExcel } from '@/lib/printUtils'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, X, Mail } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Center {
  id: string
  name: string
  assigned_day: string | null
  week_group: number
}

interface Contact {
  id: string
  influence_center_id: string | null
  name: string
  role: string | null
  direct_line: string | null
  mobile: string | null
  email: string | null
  email_blast_opt_in: boolean
  notes: string | null
  center: Center | Center[] | null
}

interface Props {
  initialContacts: Contact[]
  centers: Center[]
  currentUserId: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCenterName(c: Contact): string {
  if (!c.center) return '—'
  return Array.isArray(c.center) ? c.center[0]?.name || '—' : c.center.name
}

function getCenterId(c: Contact): string | null {
  if (!c.center) return null
  return Array.isArray(c.center) ? c.center[0]?.id || null : c.center.id
}

const ROLE_OPTIONS = [
  'Director - Social Services / Social Work',
  'Director - Nursing (DoN, Manager)',
  'Director - Admissions Dept.',
  'Director - Discharge / ED',
  'Director - Support Services',
  'Sales / Marketing - Representative',
  'Staff - Social Worker',
  'Staff - Office Manager / Support',
  'Staff - Activities / Wellness',
  'Administrator',
  'Other',
]

const BLANK = {
  influence_center_id: '',
  name: '',
  role: 'Staff - Social Worker',
  direct_line: '',
  mobile: '',
  email: '',
  email_blast_opt_in: true,
  notes: '',
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ContactsClient({ initialContacts, centers, currentUserId }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [search, setSearch] = useState('')
  const [centerFilter, setCenterFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [modal, setModal] = useState<{
    open: boolean
    mode: 'add' | 'edit'
    contact: typeof BLANK & { id?: string }
  }>({ open: false, mode: 'add', contact: { ...BLANK } })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = contacts
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        getCenterName(c).toLowerCase().includes(q)
      )
    }
    if (centerFilter) list = list.filter(c => c.influence_center_id === centerFilter)
    if (roleFilter)   list = list.filter(c => c.role === roleFilter)
    if (emailFilter === 'yes') list = list.filter(c => c.email)
    if (emailFilter === 'no')  list = list.filter(c => !c.email)
    if (emailFilter === 'opt_in') list = list.filter(c => c.email_blast_opt_in && c.email)
    return list
  }, [contacts, search, centerFilter, roleFilter, emailFilter])

  const withEmail = contacts.filter(c => c.email).length
  const optedIn   = contacts.filter(c => c.email_blast_opt_in && c.email).length

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openAdd() {
    setError('')
    setModal({ open: true, mode: 'add', contact: { ...BLANK } })
  }

  function openEdit(c: Contact) {
    setError('')
    setModal({
      open: true,
      mode: 'edit',
      contact: {
        id: c.id,
        influence_center_id: c.influence_center_id || '',
        name: c.name,
        role: c.role || 'Staff - Social Worker',
        direct_line: c.direct_line || '',
        mobile: c.mobile || '',
        email: c.email || '',
        email_blast_opt_in: c.email_blast_opt_in,
        notes: c.notes || '',
      },
    })
  }

  function closeModal() {
    if (saving) return
    setModal(m => ({ ...m, open: false }))
  }

  function setField<K extends keyof typeof BLANK>(key: K, val: (typeof BLANK)[K]) {
    setModal(m => ({ ...m, contact: { ...m.contact, [key]: val } }))
  }

  async function handleSave() {
    if (!modal.contact.name.trim()) { setError('Contact name is required.'); return }
    setSaving(true); setError('')
    try {
      const method = modal.mode === 'add' ? 'POST' : 'PUT'
      const payload = {
        ...modal.contact,
        influence_center_id: modal.contact.influence_center_id || null,
        direct_line: modal.contact.direct_line || null,
        mobile: modal.contact.mobile || null,
        email: modal.contact.email || null,
        notes: modal.contact.notes || null,
      }
      const res = await fetch('/api/marketing/contacts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      const saved: Contact = json.data
      if (modal.mode === 'add') {
        setContacts(prev => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)))
      } else {
        setContacts(prev => prev.map(c => c.id === saved.id ? saved : c))
      }
      setModal(m => ({ ...m, open: false }))
    } catch (e: any) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete contact "${name}"?`)) return
    setDeleting(id)
    try {
      const res = await fetch('/api/marketing/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Delete failed')
      setContacts(prev => prev.filter(c => c.id !== id))
    } catch {
      alert('Could not delete this contact. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  async function toggleOptIn(contact: Contact) {
    const next = !contact.email_blast_opt_in
    try {
      const res = await fetch('/api/marketing/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contact.id, email_blast_opt_in: next }),
      })
      if (!res.ok) throw new Error()
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, email_blast_opt_in: next } : c))
    } catch {
      alert('Update failed.')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link href="/marketing" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Marketing</Link>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111', margin: '4px 0 0' }}>
            Contacts & Referrers
            <span style={{ fontSize: 14, fontWeight: 400, color: '#888', marginLeft: 8 }}>{contacts.length} contacts</span>
          </h1>
        </div>
        <button onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0B6B5C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          <Plus size={16} /> Add Contact
        </button>
        <button onClick={handlePrint}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#0B6B5C', border: '1px solid #0B6B5C', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          🖨 Print
        </button>
        <button onClick={handleExcel}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          📥 Excel
        </button>
      </div>

      {/* Email stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setEmailFilter(emailFilter === 'opt_in' ? '' : 'opt_in')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${emailFilter === 'opt_in' ? '#7C3AED' : '#7C3AED50'}`, background: emailFilter === 'opt_in' ? '#EDE9FE' : '#fff', color: '#7C3AED', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
          <Mail size={13} /> Email blast opt-in: {optedIn}
        </button>
        <span style={{ fontSize: 13, color: '#AAA', padding: '5px 0' }}>Have email: {withEmail} / {contacts.length}</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#AAA' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts, email, facility…"
            style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, boxSizing: 'border-box' as const }} />
        </div>
        <select value={centerFilter} onChange={e => setCenterFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, color: '#555', background: '#fff', cursor: 'pointer', maxWidth: 220 }}>
          <option value="">All facilities</option>
          {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, color: '#555', background: '#fff', cursor: 'pointer' }}>
          <option value="">All roles</option>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={emailFilter} onChange={e => setEmailFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, color: '#555', background: '#fff', cursor: 'pointer' }}>
          <option value="">Email: all</option>
          <option value="yes">Has email</option>
          <option value="no">No email</option>
          <option value="opt_in">Opt-in only</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Contact', 'Role', 'Facility', 'Email', 'Blast?', 'Phone', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#AAA' }}>No contacts match your filters.</td></tr>
              )}
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0F0F0' : 'none', background: '#fff' }}>
                  {/* Name */}
                  <td style={{ padding: '11px 14px', fontWeight: 500, color: '#111', whiteSpace: 'nowrap' }}>{c.name}</td>
                  {/* Role */}
                  <td style={{ padding: '11px 14px', color: '#666', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.role || '—'}
                  </td>
                  {/* Facility */}
                  <td style={{ padding: '11px 14px', color: '#555', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getCenterName(c)}
                  </td>
                  {/* Email */}
                  <td style={{ padding: '11px 14px' }}>
                    {c.email ? (
                      <a href={`mailto:${c.email}`} style={{ color: '#457B9D', textDecoration: 'none', fontSize: 12 }}>{c.email}</a>
                    ) : (
                      <span style={{ color: '#CCC' }}>—</span>
                    )}
                  </td>
                  {/* Blast opt-in toggle */}
                  <td style={{ padding: '11px 14px' }}>
                    {c.email ? (
                      <button onClick={() => toggleOptIn(c)}
                        style={{ width: 36, height: 20, borderRadius: 10, border: 'none', background: c.email_blast_opt_in ? '#7C3AED' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                        <span style={{ position: 'absolute', top: 2, left: c.email_blast_opt_in ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                      </button>
                    ) : <span style={{ color: '#CCC', fontSize: 12 }}>—</span>}
                  </td>
                  {/* Phone */}
                  <td style={{ padding: '11px 14px', color: '#666', whiteSpace: 'nowrap' }}>
                    {c.direct_line || c.mobile || <span style={{ color: '#CCC' }}>—</span>}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(c)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '2px 6px' }}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(c.id, c.name)} disabled={deleting === c.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '2px 6px', opacity: deleting === c.id ? 0.5 : 1 }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F0F0F0' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#111', margin: 0 }}>
                {modal.mode === 'add' ? 'Add contact' : 'Edit contact'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={20} /></button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px' }}>
              {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

              <F label="Full name *">
                <input value={modal.contact.name} onChange={e => setField('name', e.target.value)}
                  placeholder="e.g. Gina Liberto" style={inp} />
              </F>

              <F label="Facility">
                <select value={modal.contact.influence_center_id} onChange={e => setField('influence_center_id', e.target.value)} style={inp}>
                  <option value="">— None —</option>
                  {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </F>

              <F label="Role / Title">
                <select value={modal.contact.role || ''} onChange={e => setField('role', e.target.value)} style={inp}>
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </F>

              <F label="Email address">
                <input value={modal.contact.email} onChange={e => setField('email', e.target.value)}
                  type="email" placeholder="e.g. gliberto@lorienhealth.com" style={inp} />
              </F>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={lbl}>Direct line</label>
                  <input value={modal.contact.direct_line} onChange={e => setField('direct_line', e.target.value)}
                    placeholder="301 555 0100" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Mobile</label>
                  <input value={modal.contact.mobile} onChange={e => setField('mobile', e.target.value)}
                    placeholder="301 555 0101" style={inp} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '12px 0', borderTop: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>Email blast opt-in</div>
                  <div style={{ fontSize: 12, color: '#AAA' }}>Include in weekly email campaigns</div>
                </div>
                <button onClick={() => setField('email_blast_opt_in', !modal.contact.email_blast_opt_in)}
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: modal.contact.email_blast_opt_in ? '#7C3AED' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: modal.contact.email_blast_opt_in ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>

              <F label="Notes">
                <textarea value={modal.contact.notes} onChange={e => setField('notes', e.target.value)}
                  placeholder="Any notes about this contact…" rows={3} style={{ ...inp, resize: 'vertical' as const }} />
              </F>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #F0F0F0' }}>
              <button onClick={closeModal} disabled={saving}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #DDD', background: '#fff', color: '#555', fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0B6B5C', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : modal.mode === 'add' ? 'Add contact' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Micro-helpers ──────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #DDD',
  fontSize: 13, boxSizing: 'border-box', color: '#111', background: '#fff',
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 5,
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  function handlePrint() {
    const rows = filtered.map((ct: any) => {
      const center = Array.isArray(ct.center) ? ct.center[0] : ct.center
      return `<tr>
        <td>${ct.name || ''}</td>
        <td>${ct.role || '—'}</td>
        <td>${center?.name || '—'}</td>
        <td>${ct.email || '—'}</td>
        <td>${ct.mobile || ct.direct_line || '—'}</td>
        <td>${ct.email_blast_opt_in ? '✓ Yes' : 'No'}</td>
        <td>${ct.notes || '—'}</td>
      </tr>`
    }).join('')
    printWindow('Contacts & Referrers',
      `<p style="margin-bottom:12px;color:#555;font-size:9pt">${filtered.length} contacts${search ? ' · filtered by: "'+search+'"' : ''}</p>
       <table>
         <thead><tr>
           <th>Name</th><th>Role</th><th>Facility</th>
           <th>Email</th><th>Phone</th><th>Email Blast</th><th>Notes</th>
         </tr></thead>
         <tbody>${rows}</tbody>
       </table>`)
  }

  function handleExcel() {
    const headers = ['Name','Role','Facility','Email','Mobile','Direct Line','Email Blast Opt-in','Notes']
    const rows = filtered.map((ct: any) => {
      const center = Array.isArray(ct.center) ? ct.center[0] : ct.center
      return [ct.name, ct.role, center?.name, ct.email, ct.mobile, ct.direct_line,
              ct.email_blast_opt_in ? 'Yes' : 'No', ct.notes]
    })
    downloadExcel(`Vitalis_Contacts_${new Date().toISOString().slice(0,10)}.csv`, headers, rows)
  }


  return (
    <div style={{ marginBottom: 16 }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  )
}
