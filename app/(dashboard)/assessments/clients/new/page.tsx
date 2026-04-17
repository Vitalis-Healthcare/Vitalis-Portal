'use client'
// app/(dashboard)/assessments/clients/new/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PAYER_TYPES = [
  'Private Pay', 'Medicaid', 'Medicare', 'Medicaid Waiver',
  'CareFirst', 'Wellpoint', 'United Healthcare', 'Aetna', 'BCHD', 'Other',
]

const CADENCE_OPTIONS = [
  { value: 120, label: '120 days (standard)' },
  { value: 90,  label: '90 days' },
  { value: 60,  label: '60 days' },
  { value: 30,  label: '30 days' },
]

type NurseOption = { id: string; full_name: string; role: string }

export default function NewAssessmentClientPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nurses, setNurses] = useState<NurseOption[]>([])

  // Client fields
  const [fullName, setFullName]     = useState('')
  const [dob, setDob]               = useState('')
  const [phone, setPhone]           = useState('')
  const [address, setAddress]       = useState('')
  const [city, setCity]             = useState('')
  const [state, setState]           = useState('MD')
  const [zip, setZip]               = useState('')
  const [payerType, setPayerType]   = useState('')
  const [axisCareId, setAxisCareId] = useState('')
  const [notes, setNotes]           = useState('')

  // Schedule fields
  const [nurseId, setNurseId]           = useState('')
  const [cadenceDays, setCadenceDays]   = useState(120)
  const [firstDueDate, setFirstDueDate] = useState('')

  useEffect(() => {
    fetch('/api/assessments/nurses')
      .then(r => r.json())
      .then(d => setNurses(d.data ?? []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { setError('Client name is required.'); return }
    if (!firstDueDate)    { setError('First assessment due date is required.'); return }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/assessments/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name:    fullName.trim(),
          date_of_birth: dob || null,
          phone:        phone || null,
          address:      address || null,
          city:         city || null,
          state:        state || 'MD',
          zip:          zip || null,
          payer_type:   payerType || null,
          axiscare_id:  axisCareId || null,
          notes:        notes || null,
          schedule: nurseId ? {
            nurse_id:       nurseId,
            cadence_days:   cadenceDays,
            first_due_date: firstDueDate,
          } : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create client.'); return }
      router.push('/assessments/clients')
    } catch (err) {
      setError('Unexpected error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid #D1D9E0', borderRadius: 7,
    fontSize: 13, color: '#1A2E44', background: '#fff', boxSizing: 'border-box' as const,
    outline: 'none',
  }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#4A6070', marginBottom: 5 }
  const fieldStyle = { marginBottom: 16 }

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 780, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/assessments/clients" style={{ color: '#0E7C7B', textDecoration: 'none', fontSize: 13 }}>
          ← Back to Clients
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E44', margin: '8px 0 4px' }}>
          Add Assessment Client
        </h1>
        <p style={{ fontSize: 14, color: '#4A6070', margin: 0 }}>
          Add a client to the assessment schedule and assign a nurse monitor.
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Client Information ─────────────────────────────────────── */}
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '24px', marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A2E44', margin: '0 0 20px' }}>
            Client Information
          </h2>

          <div style={fieldStyle}>
            <label style={labelStyle}>Full Name <span style={{ color: '#B91C1C' }}>*</span></label>
            <input
              style={inputStyle} value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" style={inputStyle} value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(301) 555-0100" />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main Street" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Silver Spring" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>State</label>
              <input style={inputStyle} value={state} onChange={e => setState(e.target.value)} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>ZIP</label>
              <input style={inputStyle} value={zip} onChange={e => setZip(e.target.value)} placeholder="20901" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Payer Type</label>
              <select style={inputStyle} value={payerType} onChange={e => setPayerType(e.target.value)}>
                <option value="">— Select —</option>
                {PAYER_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>AxisCare Client ID</label>
              <input style={inputStyle} value={axisCareId} onChange={e => setAxisCareId(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any relevant clinical or administrative notes…"
            />
          </div>
        </div>

        {/* ── Assessment Schedule ────────────────────────────────────── */}
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '24px', marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A2E44', margin: '0 0 4px' }}>
            Assessment Schedule
          </h2>
          <p style={{ fontSize: 13, color: '#4A6070', margin: '0 0 20px' }}>
            Assign a nurse monitor and set how often this client needs a nursing assessment.
          </p>

          <div style={fieldStyle}>
            <label style={labelStyle}>Assigned Nurse Monitor</label>
            <select style={inputStyle} value={nurseId} onChange={e => setNurseId(e.target.value)}>
              <option value="">— Assign later —</option>
              {nurses.map(n => (
                <option key={n.id} value={n.id}>
                  {n.full_name} ({n.role})
                </option>
              ))}
            </select>
            {!nurseId && (
              <div style={{ fontSize: 11, color: '#D97706', marginTop: 4 }}>
                You can assign a nurse from the client detail page later.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Assessment Cadence</label>
              <select style={inputStyle} value={cadenceDays} onChange={e => setCadenceDays(Number(e.target.value))}>
                {CADENCE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>
                First Assessment Due <span style={{ color: '#B91C1C' }}>*</span>
              </label>
              <input
                type="date" style={inputStyle} value={firstDueDate}
                onChange={e => setFirstDueDate(e.target.value)}
              />
              <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 4 }}>
                Usually the next scheduled assessment date.
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
            padding: '12px 16px', color: '#B91C1C', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Link href="/assessments/clients" style={{
            display: 'inline-block', padding: '10px 20px',
            background: '#F8FAFC', border: '1px solid #D1D9E0',
            color: '#4A6070', textDecoration: 'none', borderRadius: 8, fontSize: 14,
          }}>
            Cancel
          </Link>
          <button type="submit" disabled={saving} style={{
            padding: '10px 28px', background: saving ? '#5BA8A8' : '#0E7C7B',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
            fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving…' : 'Add Client'}
          </button>
        </div>

      </form>
    </div>
  )
}
