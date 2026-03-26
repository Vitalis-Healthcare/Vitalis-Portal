'use client'
// app/ref/[token]/page.tsx
// Public page — no authentication required.
// Referee clicks link from email and fills out either the professional
// employment reference form or the character reference verification form.

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const RATING_OPTIONS = [
  { value: 'very_good',     label: 'Very Good' },
  { value: 'satisfactory',  label: 'Satisfactory' },
  { value: 'fair',          label: 'Fair' },
  { value: 'poor',          label: 'Poor' },
]

const YES_NO_DK = [
  { value: 'yes',        label: 'Yes' },
  { value: 'no',         label: 'No' },
  { value: 'dont_know',  label: "Don't know" },
]

const RECOMMENDATION_OPTIONS = [
  { value: 'highly_recommended', label: 'Highly Recommended' },
  { value: 'recommended',        label: 'Recommended' },
  { value: 'reservations',       label: 'Recommended, but with reservations' },
  { value: 'not_recommended',    label: 'Not Recommended' },
]

type ReferenceInfo = {
  reference_type: 'professional' | 'character'
  referee_name:   string | null
  caregiver_name: string
  status:         string
}

export default function PublicReferenceForm() {
  const params = useParams()
  const token  = params?.token as string

  const [info, setInfo]         = useState<ReferenceInfo | null>(null)
  const [loading, setLoading]   = useState(true)
  const [submitting, setSub]    = useState(false)
  const [submitted, setDone]    = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Professional form state
  const [pro, setPro] = useState({
    referee_name: '', referee_title: '', employer_name: '', employer_address: '',
    supervisor_name: '', supervisor_phone: '', supervisor_email: '',
    position_held: '', area_worked: '', employment_from: '', employment_to: '',
    resigned_or_terminated: '', eligible_for_rehire: '', reason_for_leaving: '',
    travel_assignment: '', referee_date: new Date().toISOString().split('T')[0],
    rating_quality: '', rating_flexibility: '', rating_attitude: '',
    rating_stability: '', rating_pressure: '', rating_dependability: '',
    rating_cooperation: '', comments: '',
  })

  // Character form state
  const [char, setChar] = useState({
    referee_name: '', referee_title: '', referee_date: new Date().toISOString().split('T')[0],
    related_to_applicant: '', relation_explanation: '', years_known: '',
    context_known: '', questioned_honesty: '', questioned_trustworthy: '',
    questioned_diligence: '', questioned_reliability: '', questioned_character: '',
    questioned_maturity: '', overall_recommendation: '', comments: '',
  })

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`/api/references/info?token=${token}`)
      .then(r => r.json())
      .then(d => { setInfo(d); setLoading(false) })
      .catch(() => { setError('Unable to load this form.'); setLoading(false) })
  }, [token])

  const handleSubmit = async () => {
    setSub(true)
    const isPro = info?.reference_type === 'professional'
    const formData = isPro
      ? { ...pro, travel_assignment: pro.travel_assignment === 'yes' }
      : { ...char, related_to_applicant: char.related_to_applicant === 'yes', years_known: char.years_known ? parseInt(char.years_known) : null }

    const res = await fetch('/api/references/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...formData }),
    })

    const data = await res.json()
    if (res.ok) { setDone(true) }
    else { setError(data.error || 'Submission failed. Please try again.'); setSub(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1.5px solid #D1D9E0', fontSize: 14, outline: 'none',
    fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }
  const field = (label: string, children: React.ReactNode, required = false) => (
    <div style={{ marginBottom: 16 }}>
      <label style={lbl}>{label}{required && <span style={{ color: '#E63946' }}> *</span>}</label>
      {children}
    </div>
  )

  const ratingRow = (label: string, key: string) => (
    <tr key={key} style={{ borderBottom: '1px solid #EFF2F5' }}>
      <td style={{ padding: '10px 12px', fontSize: 13, color: '#1A2E44', fontWeight: 500 }}>{label}</td>
      {RATING_OPTIONS.map(opt => (
        <td key={opt.value} style={{ textAlign: 'center', padding: '10px 8px' }}>
          <input type="radio" name={key} value={opt.value}
            checked={(pro as any)[key] === opt.value}
            onChange={() => setPro(p => ({ ...p, [key]: opt.value }))}
            style={{ accentColor: '#0E7C7B', width: 16, height: 16 }} />
        </td>
      ))}
    </tr>
  )

  const yndk = (label: string, key: string) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, color: '#1A2E44', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 20 }}>
        {YES_NO_DK.map(opt => (
          <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4A6070', cursor: 'pointer' }}>
            <input type="radio" name={key} value={opt.value}
              checked={(char as any)[key] === opt.value}
              onChange={() => setChar(c => ({ ...c, [key]: opt.value }))}
              style={{ accentColor: '#0E7C7B', width: 14, height: 14 }} />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#8FA0B0', fontSize: 14 }}>Loading form…</div>
    </div>
  )

  if (error && !info) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, maxWidth: 480, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ fontSize: 18, color: '#1A2E44', marginBottom: 8 }}>Link Not Found</h2>
        <p style={{ color: '#8FA0B0', fontSize: 14 }}>{error}</p>
      </div>
    </div>
  )

  if (info?.status === 'received' || submitted) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, maxWidth: 480, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E44', marginBottom: 8 }}>
          {submitted ? 'Thank You!' : 'Already Submitted'}
        </h2>
        <p style={{ color: '#4A6070', fontSize: 14, lineHeight: 1.6 }}>
          {submitted
            ? `Your reference for ${info?.caregiver_name} has been received by Vitalis Healthcare Services. We appreciate your time and cooperation.`
            : 'This reference form has already been completed. Thank you for your cooperation.'}
        </p>
        <div style={{ marginTop: 24, padding: '12px 16px', background: '#F8FAFB', borderRadius: 8, fontSize: 12, color: '#8FA0B0' }}>
          Vitalis Healthcare Services, LLC<br/>
          8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br/>
          Tel: 267.474.8578
        </div>
      </div>
    </div>
  )

  const isPro = info?.reference_type === 'professional'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%)', padding: '24px 32px', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0E7C7B,#F4A261)', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 10 }}>V+</div>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 20, fontWeight: 800 }}>Vitalis Healthcare Services</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '4px 0 0', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          {isPro ? 'Employment Reference Form' : 'Character Reference Verification'}
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>
        {/* Intro */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <p style={{ color: '#4A6070', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            <strong>{info?.caregiver_name}</strong> has applied to Vitalis Healthcare Services, LLC and submitted your name as a reference. Please complete this form at your earliest convenience. All responses will be kept in strict confidence.
          </p>
        </div>

        {error && (
          <div style={{ background: '#FDE8E9', border: '1px solid #E63946', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#E63946' }}>
            {error}
          </div>
        )}

        {isPro ? (
          /* ── PROFESSIONAL REFERENCE FORM ── */
          <div style={{ background: '#fff', borderRadius: 12, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #EFF2F5' }}>
              Employment Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {field('Your Name', <input value={pro.referee_name} onChange={e => setPro(p => ({ ...p, referee_name: e.target.value }))} style={inp} placeholder="Full name" />, true)}
              {field('Your Title', <input value={pro.referee_title} onChange={e => setPro(p => ({ ...p, referee_title: e.target.value }))} style={inp} placeholder="Job title" />)}
            </div>

            {field('Name of Organisation / Employer', <input value={pro.employer_name} onChange={e => setPro(p => ({ ...p, employer_name: e.target.value }))} style={inp} placeholder="Organisation name" />, true)}
            {field('Address', <input value={pro.employer_address} onChange={e => setPro(p => ({ ...p, employer_address: e.target.value }))} style={inp} placeholder="Full address" />)}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {field('Supervisor Name', <input value={pro.supervisor_name} onChange={e => setPro(p => ({ ...p, supervisor_name: e.target.value }))} style={inp} />)}
              {field('Phone', <input value={pro.supervisor_phone} onChange={e => setPro(p => ({ ...p, supervisor_phone: e.target.value }))} style={inp} />)}
              {field('Email', <input value={pro.supervisor_email} onChange={e => setPro(p => ({ ...p, supervisor_email: e.target.value }))} style={inp} type="email" />)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {field('Position Held', <input value={pro.position_held} onChange={e => setPro(p => ({ ...p, position_held: e.target.value }))} style={inp} />)}
              {field('Area Worked', <input value={pro.area_worked} onChange={e => setPro(p => ({ ...p, area_worked: e.target.value }))} style={inp} />)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {field('Employment From', <input type="date" value={pro.employment_from} onChange={e => setPro(p => ({ ...p, employment_from: e.target.value }))} style={inp} />)}
              {field('Employment To', <input type="date" value={pro.employment_to} onChange={e => setPro(p => ({ ...p, employment_to: e.target.value }))} style={inp} />)}
            </div>

            {field('Did applicant resign or was terminated?', <input value={pro.resigned_or_terminated} onChange={e => setPro(p => ({ ...p, resigned_or_terminated: e.target.value }))} style={inp} />)}
            {field('Reason for Leaving', <input value={pro.reason_for_leaving} onChange={e => setPro(p => ({ ...p, reason_for_leaving: e.target.value }))} style={inp} />)}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Eligible for Rehire?</label>
                <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                  {[{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }].map(o => (
                    <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" name="eligible_for_rehire" value={o.v}
                        checked={pro.eligible_for_rehire === o.v}
                        onChange={() => setPro(p => ({ ...p, eligible_for_rehire: o.v }))}
                        style={{ accentColor: '#0E7C7B' }} />
                      {o.l}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Was this a travel assignment?</label>
                <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                  {[{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }].map(o => (
                    <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" name="travel_assignment" value={o.v}
                        checked={pro.travel_assignment === o.v}
                        onChange={() => setPro(p => ({ ...p, travel_assignment: o.v }))}
                        style={{ accentColor: '#0E7C7B' }} />
                      {o.l}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', margin: '24px 0 16px', paddingTop: 12, borderTop: '1px solid #EFF2F5' }}>
              Personal Evaluation
            </h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #EFF2F5', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
              <thead>
                <tr style={{ background: '#F8FAFB' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}> </th>
                  {RATING_OPTIONS.map(o => (
                    <th key={o.value} style={{ textAlign: 'center', padding: '10px 8px', fontSize: 12, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: 80 }}>{o.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ratingRow('Quality of Work', 'rating_quality')}
                {ratingRow('Flexibility', 'rating_flexibility')}
                {ratingRow('Attitude', 'rating_attitude')}
                {ratingRow('Emotional Stability', 'rating_stability')}
                {ratingRow('Adaptability to Work Under Pressure', 'rating_pressure')}
                {ratingRow('Dependability / Attendance / Punctuality', 'rating_dependability')}
                {ratingRow('Cooperation / Ability to Get Along with Others', 'rating_cooperation')}
              </tbody>
            </table>

            {field('Comments', <textarea value={pro.comments} onChange={e => setPro(p => ({ ...p, comments: e.target.value }))} style={{ ...inp, height: 80, resize: 'vertical' }} placeholder="Any additional comments…" />)}
            {field('Date', <input type="date" value={pro.referee_date} onChange={e => setPro(p => ({ ...p, referee_date: e.target.value }))} style={{ ...inp, maxWidth: 200 }} />)}
          </div>

        ) : (
          /* ── CHARACTER REFERENCE FORM ── */
          <div style={{ background: '#fff', borderRadius: 12, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #EFF2F5' }}>
              About You
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {field('Your Name', <input value={char.referee_name} onChange={e => setChar(c => ({ ...c, referee_name: e.target.value }))} style={inp} placeholder="Full name" />, true)}
              {field('Your Title / Role', <input value={char.referee_title} onChange={e => setChar(c => ({ ...c, referee_title: e.target.value }))} style={inp} />)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {field('How many years have you known the applicant?',
                <input type="number" value={char.years_known} onChange={e => setChar(c => ({ ...c, years_known: e.target.value }))} style={inp} min="0" />
              )}
              {field('In what context have you known the applicant?',
                <input value={char.context_known} onChange={e => setChar(c => ({ ...c, context_known: e.target.value }))} style={inp} placeholder="e.g. supervisor, colleague, friend" />
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Are you related to the applicant?</label>
              <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                {[{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }].map(o => (
                  <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="radio" name="related" value={o.v}
                      checked={char.related_to_applicant === o.v}
                      onChange={() => setChar(c => ({ ...c, related_to_applicant: o.v }))}
                      style={{ accentColor: '#0E7C7B' }} />
                    {o.l}
                  </label>
                ))}
              </div>
              {char.related_to_applicant === 'yes' && (
                <input value={char.relation_explanation} onChange={e => setChar(c => ({ ...c, relation_explanation: e.target.value }))}
                  placeholder="Please explain…" style={{ ...inp, marginTop: 8 }} />
              )}
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', margin: '24px 0 16px', paddingTop: 12, borderTop: '1px solid #EFF2F5' }}>
              Character Assessment
            </h2>
            <p style={{ color: '#4A6070', fontSize: 13, marginBottom: 16 }}>Have you ever had to question the applicant's reputation for:</p>

            {yndk('Honesty', 'questioned_honesty')}
            {yndk('Trustworthiness', 'questioned_trustworthy')}
            {yndk('Diligence', 'questioned_diligence')}
            {yndk('Reliability', 'questioned_reliability')}
            {yndk('Good Character', 'questioned_character')}
            {yndk('Maturity', 'questioned_maturity')}

            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', margin: '24px 0 16px', paddingTop: 12, borderTop: '1px solid #EFF2F5' }}>
              Overall Recommendation
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {RECOMMENDATION_OPTIONS.map(opt => (
                <label key={opt.value} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                  borderRadius: 8, border: `1.5px solid ${char.overall_recommendation === opt.value ? '#0E7C7B' : '#E2E8F0'}`,
                  background: char.overall_recommendation === opt.value ? '#E6F4F4' : '#fff',
                  cursor: 'pointer', fontSize: 13, fontWeight: char.overall_recommendation === opt.value ? 700 : 400, color: '#1A2E44',
                }}>
                  <input type="radio" name="overall_recommendation" value={opt.value}
                    checked={char.overall_recommendation === opt.value}
                    onChange={() => setChar(c => ({ ...c, overall_recommendation: opt.value }))}
                    style={{ accentColor: '#0E7C7B' }} />
                  {opt.label}
                </label>
              ))}
            </div>

            {field('Comments', <textarea value={char.comments} onChange={e => setChar(c => ({ ...c, comments: e.target.value }))} style={{ ...inp, height: 80, resize: 'vertical' }} placeholder="Any additional comments…" />)}
            {field('Date', <input type="date" value={char.referee_date} onChange={e => setChar(c => ({ ...c, referee_date: e.target.value }))} style={{ ...inp, maxWidth: 200 }} />)}
          </div>
        )}

        {/* Submit button */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: '13px 36px', background: submitting ? '#CBD5E0' : '#0E7C7B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Submitting…' : 'Submit Reference →'}
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 11, color: '#B0BEC5' }}>
          Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br/>
          Tel: 267.474.8578 · Fax: 240.266.0650
        </div>
      </div>
    </div>
  )
}
