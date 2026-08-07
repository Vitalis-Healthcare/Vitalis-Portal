'use client'
// app/onboarding/not-interested/NotInterestedClient.tsx
// The confirmation. Withdrawing is an affirmative act by a person, never
// something inferred from a page load (pitfalls #48 — never infer an
// affirmative act from anything other than the act).
import { useState } from 'react'

const C = { navy: '#1A2E44', gray: '#4A6070', faint: '#8FA0B0', border: '#D1D9E0', teal: '#0E7C7B' }

export default function NotInterestedClient({ token, firstName }: { token: string; firstName: string }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/onboarding/not-interested', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong. Please reply to our email instead.'); return }
      setDone(true)
    } catch {
      setError('Network error. Please try again, or reply to our email instead.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px', fontFamily: "'DM Sans','Segoe UI',Arial,sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ background: 'linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%)', padding: '26px 30px', borderRadius: '14px 14px 0 0', textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, background: 'linear-gradient(135deg,#0E7C7B,#F4A261)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 900, color: '#fff', marginBottom: 10 }}>V+</div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 19, fontWeight: 800 }}>
            {done ? 'Thank you for telling us' : 'Are you no longer interested?'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '4px 0 0', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Vitalis HealthCare</p>
        </div>

        <div style={{ background: '#fff', padding: '28px 30px', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 14px 14px' }}>
          {done ? (
            <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              We have taken you off our list and you will not receive further emails about this
              application. Thank you for the time you gave us — it was not wasted, and you are
              genuinely welcome to come back to us later if your situation changes.
            </p>
          ) : (
            <>
              <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.7, margin: '0 0 18px' }}>
                {firstName ? `${firstName}, ` : ''}before we do anything, we want to be sure this is what you meant.
                Confirming below tells us you no longer want to be considered for a position
                at Vitalis, and we will stop emailing you about it.
              </p>
              <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.7, margin: '0 0 22px' }}>
                Nothing is deleted and nothing is held against you. If you change your mind next week
                or next year, get in touch and we will pick up where we left off.
              </p>

              {error && (
                <div style={{ padding: '11px 14px', borderRadius: 9, fontSize: 13.5, marginBottom: 16, lineHeight: 1.6, background: '#FEF3E2', color: '#B26A00', border: '1px solid #F4D9A8' }}>
                  {error}
                </div>
              )}

              <button onClick={confirm} disabled={busy}
                style={{ width: '100%', boxSizing: 'border-box', padding: '13px 26px', background: busy ? '#E2E8F0' : '#9B3B3B', border: 'none', borderRadius: 9, color: busy ? '#94A3B8' : '#fff', fontSize: 15, fontWeight: 700, cursor: busy ? 'default' : 'pointer', marginBottom: 14 }}>
                {busy ? 'Working…' : 'Yes, I am no longer interested'}
              </button>

              <p style={{ color: C.faint, fontSize: 12.5, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
                Opened this by mistake? Simply close this page — nothing has changed.
              </p>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '18px 0', fontSize: 11, color: '#94A3B8', lineHeight: 1.8 }}>
          Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910
        </div>
      </div>
    </div>
  )
}
