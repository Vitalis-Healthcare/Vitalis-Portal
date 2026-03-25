'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle, Clock, AlertTriangle, X, FileText } from 'lucide-react'

interface CredType { id: string; name: string; validity_days: number }
interface Cred {
  id: string
  credential_type_id: string
  issue_date: string
  expiry_date?: string
  notes?: string
  submitted_notes?: string
  status: string
  review_status?: string
  credential_type?: { name: string; validity_days: number }
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box'
}
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5
}

export default function StaffCredentialsClient({
  credTypes, myCreds, userId, fullName
}: {
  credTypes: CredType[]
  myCreds: Cred[]
  userId: string
  fullName: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    credential_type_id: '', issue_date: '', expiry_date: '', submitted_notes: ''
  })

  const statusColor = (s: string) =>
    s === 'current' ? '#2A9D8F' : s === 'expiring' ? '#F4A261' : s === 'expired' ? '#E63946' : '#8FA0B0'
  const statusBg = (s: string) =>
    s === 'current' ? '#E6F6F4' : s === 'expiring' ? '#FEF3EA' : s === 'expired' ? '#FDE8E9' : '#EFF2F5'

  const handleSubmit = async () => {
    if (!form.credential_type_id || !form.issue_date) {
      alert('Please select a credential type and issue date.'); return
    }
    setSaving(true)

    const { error } = await supabase.from('staff_credentials').upsert({
      user_id: userId,
      credential_type_id: form.credential_type_id,
      issue_date: form.issue_date,
      expiry_date: form.expiry_date || null,
      submitted_notes: form.submitted_notes || null,
      review_status: 'pending',
    }, { onConflict: 'user_id,credential_type_id' })

    if (!error) {
      // Notify admin
      try {
        await fetch('/api/notify/credential-submitted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            fullName,
            credentialTypeId: form.credential_type_id,
            credentialName: credTypes.find(c => c.id === form.credential_type_id)?.name,
            issueDate: form.issue_date,
            expiryDate: form.expiry_date || null,
            notes: form.submitted_notes || null,
          })
        })
      } catch { /* non-critical */ }

      await supabase.from('audit_log').insert({
        user_id: userId,
        action: `Submitted credential for review: ${credTypes.find(c => c.id === form.credential_type_id)?.name}`,
        entity_type: 'credential'
      })

      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setShowForm(false)
        setForm({ credential_type_id: '', issue_date: '', expiry_date: '', submitted_notes: '' })
        router.refresh()
      }, 2000)
    } else {
      alert('Error submitting credential. Please try again.')
    }
    setSaving(false)
  }

  const approved = myCreds.filter(c => !c.review_status || c.review_status === 'approved')
  const pending = myCreds.filter(c => c.review_status === 'pending')
  const rejected = myCreds.filter(c => c.review_status === 'rejected')

  const currentCount = approved.filter(c => c.status === 'current').length
  const expiringCount = approved.filter(c => c.status === 'expiring').length
  const expiredCount = approved.filter(c => c.status === 'expired').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: 0 }}>My Credentials</h1>
          <p style={{ fontSize: 14, color: '#8FA0B0', marginTop: 4 }}>Your certifications, expiry dates, and compliance status</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={16} /> Submit Credential
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Current', value: currentCount, color: '#2A9D8F' },
          { label: 'Expiring Soon', value: expiringCount, color: '#F4A261' },
          { label: 'Expired', value: expiredCount, color: '#E63946' },
          { label: 'Pending Review', value: pending.length, color: '#457B9D' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', borderLeft: `4px solid ${s.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#1A2E44', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending/Rejected banners */}
      {pending.length > 0 && (
        <div style={{ background: '#EBF4FF', border: '1px solid #457B9D', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Clock size={18} color="#457B9D" />
          <span style={{ fontSize: 14, color: '#1A2E44' }}>
            <strong>{pending.length} credential{pending.length > 1 ? 's' : ''}</strong> pending review by your supervisor.
          </span>
        </div>
      )}
      {rejected.length > 0 && (
        <div style={{ background: '#FDE8E9', border: '1px solid #E63946', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} color="#E63946" />
          <span style={{ fontSize: 14, color: '#1A2E44' }}>
            <strong>{rejected.length} credential{rejected.length > 1 ? 's' : ''}</strong> rejected — please resubmit with correct information.
          </span>
        </div>
      )}

      {/* Credentials list */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A2E44', marginBottom: 20 }}>
          All Credentials ({myCreds.length})
        </h2>

        {myCreds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8FA0B0' }}>
            <FileText size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: 14, margin: 0 }}>No credentials on file yet.</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Click <strong>Submit Credential</strong> to add your certifications.</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', gap: 12, padding: '8px 12px', background: '#F8FAFB', borderRadius: 8, marginBottom: 4 }}>
              {['Credential', 'Issue Date', 'Expiry Date', 'Status', 'Review'].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</div>
              ))}
            </div>

            {myCreds.map(c => {
              const expDays = c.expiry_date
                ? Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / 86400000)
                : null
              const reviewStatus = c.review_status || 'approved'
              const reviewColor = reviewStatus === 'approved' ? '#2A9D8F' : reviewStatus === 'pending' ? '#457B9D' : '#E63946'
              const reviewBg = reviewStatus === 'approved' ? '#E6F6F4' : reviewStatus === 'pending' ? '#EBF4FF' : '#FDE8E9'
              const reviewLabel = reviewStatus === 'approved' ? '✓ Approved' : reviewStatus === 'pending' ? '⏳ Pending' : '✗ Rejected'

              return (
                <div key={c.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', gap: 12,
                  padding: '14px 12px', borderBottom: '1px solid #EFF2F5', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2E44' }}>
                      {c.credential_type?.name}
                    </div>
                    {c.submitted_notes && (
                      <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>{c.submitted_notes}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#4A6070' }}>
                    {c.issue_date ? new Date(c.issue_date).toLocaleDateString() : '—'}
                  </div>
                  <div style={{ fontSize: 13, color: expDays !== null && expDays < 30 ? '#E63946' : '#4A6070' }}>
                    {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : '—'}
                    {expDays !== null && expDays >= 0 && expDays <= 30 && (
                      <div style={{ fontSize: 11, color: '#E63946' }}>{expDays}d left</div>
                    )}
                  </div>
                  <div>
                    {reviewStatus === 'approved' ? (
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: statusColor(c.status), background: statusBg(c.status), textTransform: 'capitalize' }}>
                        {c.status || 'current'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#8FA0B0' }}>—</span>
                    )}
                  </div>
                  <div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: reviewColor, background: reviewBg }}>
                      {reviewLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Submit form modal */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Submit Credential for Review</h3>
                <p style={{ fontSize: 12, color: '#8FA0B0', margin: '2px 0 0' }}>Your supervisor will be notified to review and approve</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', marginBottom: 6 }}>Submitted for Review</h3>
                  <p style={{ color: '#8FA0B0', fontSize: 13 }}>Your supervisor has been notified and will review your credential.</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl}>Credential Type *</label>
                    <select value={form.credential_type_id} onChange={e => setForm(f => ({ ...f, credential_type_id: e.target.value }))} style={inp}>
                      <option value="">Select credential type…</option>
                      {credTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={lbl}>Issue Date *</label>
                      <input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Expiry Date</label>
                      <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} style={inp} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={lbl}>Notes (optional)</label>
                    <input
                      value={form.submitted_notes}
                      onChange={e => setForm(f => ({ ...f, submitted_notes: e.target.value }))}
                      placeholder="e.g. Card number, issuing body, renewal details…"
                      style={inp}
                    />
                  </div>
                  <div style={{ background: '#EBF4FF', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#457B9D' }}>
                    ℹ️ After submission, your supervisor will review and approve your credential. You will see the status update here.
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowForm(false)} style={{ padding: '9px 18px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#4A6070', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving || !form.credential_type_id || !form.issue_date} style={{
                      padding: '9px 22px', background: form.credential_type_id && form.issue_date ? '#0E7C7B' : '#CBD5E0',
                      color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      cursor: form.credential_type_id && form.issue_date ? 'pointer' : 'not-allowed'
                    }}>
                      {saving ? 'Submitting…' : 'Submit for Review'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
