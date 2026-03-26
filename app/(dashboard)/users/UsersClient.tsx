'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserPlus, Mail, Shield, User, CheckCircle, XCircle, Edit2, X, Send } from 'lucide-react'

interface Profile {
  id: string; email: string; full_name: string; role: string;
  status: string; hire_date?: string; department?: string; phone?: string; created_at: string;
}

const ROLES = ['admin', 'supervisor', 'caregiver']
const DEPARTMENTS = ['Home Care', 'Administrative', 'Clinical', 'Operations', 'Management']

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5,
}

function InvitePanel({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const supabase = createClient()
  const [step, setStep] = useState<'form' | 'sent'>('form')
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', role: 'caregiver', department: '' })

  const handleInvite = async () => {
    if (!form.full_name.trim() || !form.email.trim()) { alert('Name and email are required.'); return }
    setSending(true)
    // Send magic-link invite — user clicks link, auto-logs in, profile auto-created
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        shouldCreateUser: true,
        data: { full_name: form.full_name, role: form.role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { alert(error.message); setSending(false); return }

    // Pre-create profile row so admin can set role before first login
    await supabase.from('profiles').upsert({
      id: crypto.randomUUID(),
      email: form.email,
      full_name: form.full_name,
      role: form.role,
      department: form.department || null,
      status: 'active',
    }, { onConflict: 'email' })

    setStep('sent')
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
        <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          placeholder="e.g. Amara Nwosu" style={inp} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Email Address *</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="staff@vitalishealthcare.com" style={inp} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={lbl}>Role</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inp}>
            {ROLES.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
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
        📧 Staff will receive an email with a login link. They set their own password on first sign-in. If your organisation uses Google Workspace, they can also use <strong>Sign in with Google</strong>.
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

function EditPanel({ profile, onClose, onSuccess }: { profile: Profile; onClose: () => void; onSuccess: () => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile.full_name,
    role: profile.role,
    department: profile.department || '',
    phone: profile.phone || '',
    hire_date: profile.hire_date || '',
    status: profile.status,
  })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleSetPassword = async () => {
    if (newPassword.length < 8) { setPwMsg({ type: 'err', text: 'Password must be at least 8 characters.' }); return }
    if (newPassword !== confirmPassword) { setPwMsg({ type: 'err', text: 'Passwords do not match.' }); return }
    setPwSaving(true); setPwMsg(null)
    const res = await fetch('/api/admin/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.id, password: newPassword })
    })
    const json = await res.json()
    if (json.success) { setPwMsg({ type: 'ok', text: 'Password updated successfully.' }); setNewPassword(''); setConfirmPassword('') }
    else { setPwMsg({ type: 'err', text: json.error || 'Failed to update password.' }) }
    setPwSaving(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      role: form.role,
      department: form.department || null,
      phone: form.phone || null,
      hire_date: form.hire_date || null,
      status: form.status,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id)
    if (error) { alert('Error updating profile.'); setSaving(false); return }
    onSuccess()
    onClose()
    router.refresh()
    setSaving(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Full Name</label>
        <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={inp} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Email</label>
        <input value={profile.email} disabled style={{ ...inp, background: '#F8FAFB', color: '#8FA0B0' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={lbl}>Role</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inp}>
            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
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
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 14, marginTop: 0 }}>🔑 Set Password</h4>
        <p style={{ fontSize: 12, color: '#8FA0B0', marginBottom: 14, marginTop: 0 }}>Set a password so the staff member can log in without a magic link.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
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

export default function UsersClient({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [panel, setPanel] = useState<null | 'invite' | { type: 'edit'; profile: Profile }>(null)
  const [toast, setToast] = useState('')
  const router = useRouter()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const filtered = profiles.filter(p => {
    const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || p.role === roleFilter
    return matchSearch && matchRole
  })

  const active = profiles.filter(p => p.status === 'active').length
  const roleColor = (r: string) => r === 'admin' ? '#1A2E44' : r === 'supervisor' ? '#0E7C7B' : '#2A9D8F'
  const roleBg = (r: string) => r === 'admin' ? '#EFF2F5' : r === 'supervisor' ? '#E6F4F4' : '#E6F6F4'

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1A2E44', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          ✓ {toast}
        </div>
      )}

      {/* Slide-in panel */}
      {panel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1A2E44', margin: 0 }}>
                {panel === 'invite' ? '✉️ Invite Staff Member' : `✏️ Edit — ${(panel as any).profile.full_name}`}
              </h2>
              <button onClick={() => setPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            {panel === 'invite'
              ? <InvitePanel onClose={() => setPanel(null)} onSuccess={() => { showToast('Invite sent!'); router.refresh() }} />
              : <EditPanel profile={(panel as any).profile} onClose={() => setPanel(null)} onSuccess={() => showToast('Profile updated')} />
            }
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>User Management</h1>
          <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>{active} active staff · manage roles, invite, and deactivate</p>
        </div>
        <button onClick={() => setPanel('invite')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          <UserPlus size={16} /> Invite Staff
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Staff', value: profiles.length, color: '#1A2E44' },
          { label: 'Active', value: active, color: '#2A9D8F' },
          { label: 'Admins', value: profiles.filter(p => p.role === 'admin').length, color: '#0E7C7B' },
          { label: 'Caregivers', value: profiles.filter(p => p.role === 'caregiver').length, color: '#F4A261' },
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
          <strong>Google Workspace SSO is active.</strong> Staff with a <em>@vitalishealthcare.com</em> Google account can sign in instantly with one click — no password needed.
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by name or email…"
          style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', background: '#fff' }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' }}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 40 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#8FA0B0' }}>
            <UserPlus size={40} style={{ margin: '0 auto 14px', display: 'block', color: '#D1D9E0' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1A2E44', marginBottom: 6 }}>No staff yet</p>
            <p style={{ fontSize: 13 }}>Click "Invite Staff" to add your first team member.</p>
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
                <tr key={p.id} style={{ borderBottom: '1px solid #EFF2F5', opacity: p.status === 'inactive' ? 0.5 : 1 }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1A2E44', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${roleColor(p.role)}, #F4A261)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, color: '#fff',
                      }}>
                        {p.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.full_name} {p.id === currentUserId && <span style={{ fontSize: 10, color: '#0E7C7B', fontWeight: 700 }}>(you)</span>}</div>
                        <div style={{ fontSize: 11, color: '#8FA0B0' }}>{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: roleBg(p.role), color: roleColor(p.role), textTransform: 'capitalize' }}>
                      {p.role}
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
                    <button
                      onClick={() => setPanel({ type: 'edit', profile: p })}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#EFF2F5', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#4A6070' }}>
                      <Edit2 size={12} /> Edit
                    </button>
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