'use client'
// app/(dashboard)/lms/programmes/[slug]/RequestEnrollmentButton.tsx
// Shown to caregivers on the programme detail page.
// Submits an enrollment request for admin approval.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, X } from 'lucide-react'

interface Props {
  programmeId:  string
  programmeName: string
  hasPending:   boolean
  isEnrolled:   boolean
}

export default function RequestEnrollmentButton({ programmeId, programmeName, hasPending, isEnrolled }: Props) {
  const router  = useRouter()
  const [open, setOpen]       = useState(false)
  const [msg, setMsg]         = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone]       = useState(false)

  if (isEnrolled) return null

  const handleSubmit = async () => {
    setSending(true)
    const res = await fetch('/api/enrollment-requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programme_id: programmeId, request_message: msg || null }),
    })
    const data = await res.json()
    if (res.ok) {
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); router.refresh() }, 2000)
    } else {
      alert(data.error || 'Request failed')
      setSending(false)
    }
  }

  return (
    <>
      {hasPending ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#FEF3EA', border: '1px solid #F4A261', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#C96B15' }}>
          ⏳ Enrollment Pending Approval
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <BookOpen size={14}/> Request Enrollment
        </button>
      )}

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 440, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Request Enrollment</h3>
                <p style={{ fontSize: 12, color: '#8FA0B0', margin: '2px 0 0' }}>{programmeName}</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {done ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', marginBottom: 6 }}>Request Submitted</h3>
                  <p style={{ color: '#8FA0B0', fontSize: 13 }}>Your supervisor will review and approve your enrollment.</p>
                </div>
              ) : (
                <>
                  <p style={{ color: '#4A6070', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                    Your request will be sent to your supervisor for approval. You will be notified once approved.
                  </p>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }}>Message to supervisor (optional)</label>
                    <textarea
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      placeholder="e.g. I would like to take this training to improve my skills in…"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={() => setOpen(false)} style={{ padding: '9px 18px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#4A6070', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={sending} style={{ padding: '9px 22px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
                      {sending ? 'Sending…' : 'Submit Request'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
