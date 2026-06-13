'use client'
// app/(dashboard)/candidates/CandidatesClient.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Mail, RefreshCw, X, CheckCircle2, AlertTriangle } from 'lucide-react'

type Candidate = {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
  invited_at: string
  created_at: string
  test_passed_at: string | null
  application_submitted_at: string | null
  axiscare_pushed_at: string | null
}

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  invited:               { label: 'Invited',            bg: '#FEF3E2', fg: '#B26A00' },
  testing:               { label: 'Testing',            bg: '#E7F0FF', fg: '#1A56B0' },
  test_passed:           { label: 'Test passed',        bg: '#E6F6EC', fg: '#1B7A43' },
  applying:              { label: 'Applying',           bg: '#E6F4F4', fg: '#0A5C5B' },
  application_submitted: { label: 'Application in',      bg: '#E6F4F4', fg: '#0A5C5B' },
  in_review:             { label: 'In review',          bg: '#F0E9FB', fg: '#6B3FA0' },
  axiscare_created:      { label: 'In AxisCare',         bg: '#E6F6EC', fg: '#1B7A43' },
  converted:             { label: 'Converted',          bg: '#EDF0F2', fg: '#4A6070' },
  withdrawn:             { label: 'Withdrawn',          bg: '#F4EBEB', fg: '#9B3B3B' },
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || { label: status, bg: '#EDF0F2', fg: '#4A6070' }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      background: m.bg, color: m.fg, fontSize: 12, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>{m.label}</span>
  )
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CandidatesClient({ candidates }: { candidates: Candidate[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)

  const resetForm = () => { setFirst(''); setLast(''); setEmail(''); setError('') }

  async function submit() {
    setError('')
    if (!first.trim() || !last.trim()) { setError('First and last name are required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/onboarding/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', first_name: first.trim(), last_name: last.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not add candidate.'); setSaving(false); return }
      setShowForm(false); resetForm()
      setBanner(data.emailed
        ? { kind: 'ok', text: `Invite sent to ${data.email}.` }
        : { kind: 'warn', text: `Candidate added, but the invite email did not send. Use "Resend".` })
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function resend(id: string) {
    setBanner(null); setResendingId(id)
    try {
      const res = await fetch('/api/onboarding/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', id }),
      })
      const data = await res.json()
      setBanner(res.ok && data.emailed
        ? { kind: 'ok', text: `Invite re-sent to ${data.email}.` }
        : { kind: 'warn', text: data.error || 'Could not resend the invite.' })
      router.refresh()
    } catch {
      setBanner({ kind: 'warn', text: 'Network error — please try again.' })
    } finally {
      setResendingId(null)
    }
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#4A6070', marginBottom: 6 }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D9E0', fontSize: 14, boxSizing: 'border-box' }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Candidates</h1>
          <p style={{ color: '#8FA0B0', fontSize: 14, margin: '6px 0 0' }}>
            Invite applicants to the Vitalis caregiver competency test and track their onboarding.
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setBanner(null) }} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
          background: 'linear-gradient(135deg,#0E7C7B,#1A9B87)', color: '#fff', border: 'none',
          borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          <UserPlus size={16} /> New candidate
        </button>
      </div>

      {banner && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 0',
          padding: '12px 16px', borderRadius: 10, fontSize: 14,
          background: banner.kind === 'ok' ? '#E6F6EC' : '#FEF3E2',
          color: banner.kind === 'ok' ? '#1B7A43' : '#B26A00',
          border: `1px solid ${banner.kind === 'ok' ? '#BFE6CD' : '#F4D9A8'}`,
        }}>
          {banner.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{banner.text}</span>
        </div>
      )}

      <div style={{ marginTop: 22, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
        {candidates.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: '#E6F4F4',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}><UserPlus size={24} color="#0A5C5B" /></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2E44', marginBottom: 6 }}>No candidates yet</div>
            <div style={{ fontSize: 14, color: '#8FA0B0' }}>Add a candidate to send them the competency test invite.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#F8FAFB', textAlign: 'left', color: '#8FA0B0', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Name</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Email</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Invited</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} style={{ borderTop: '1px solid #EFF2F5' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#1A2E44' }}>{c.first_name} {c.last_name}</td>
                  <td style={{ padding: '14px 18px', color: '#4A6070' }}>{c.email}</td>
                  <td style={{ padding: '14px 18px' }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: '14px 18px', color: '#8FA0B0' }}>{fmtDate(c.invited_at)}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => resend(c.id)}
                      disabled={resendingId === c.id}
                      title="Resend the test invite"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                        background: '#fff', border: '1px solid #D1D9E0', borderRadius: 8,
                        color: '#0A5C5B', fontSize: 13, fontWeight: 600,
                        cursor: resendingId === c.id ? 'default' : 'pointer', opacity: resendingId === c.id ? 0.6 : 1,
                      }}>
                      <RefreshCw size={13} /> {resendingId === c.id ? 'Sending…' : 'Resend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div
          onClick={() => !saving && setShowForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(16,30,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 20px 50px rgba(16,30,48,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A2E44', margin: 0 }}>New candidate</h2>
              <button onClick={() => !saving && setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>First name</label>
                  <input value={first} onChange={(e) => setFirst(e.target.value)} style={inputStyle} placeholder="Jane" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Last name</label>
                  <input value={last} onChange={(e) => setLast(e.target.value)} style={inputStyle} placeholder="Doe" />
                </div>
              </div>
              <div style={{ marginBottom: 4 }}>
                <label style={labelStyle}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={inputStyle} placeholder="jane@example.com" />
              </div>
              <p style={{ fontSize: 12, color: '#8FA0B0', margin: '10px 0 0', lineHeight: 1.6 }}>
                <Mail size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} />
                We will email a secure link inviting them to take the competency test. No password needed.
              </p>
              {error && <div style={{ marginTop: 14, padding: '10px 14px', background: '#F4EBEB', color: '#9B3B3B', borderRadius: 8, fontSize: 13 }}>{error}</div>}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #EFF2F5', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => !saving && setShowForm(false)} style={{ padding: '10px 18px', background: '#fff', border: '1px solid #D1D9E0', borderRadius: 9, color: '#4A6070', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submit} disabled={saving} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#0E7C7B,#1A9B87)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Sending…' : 'Add & send invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
