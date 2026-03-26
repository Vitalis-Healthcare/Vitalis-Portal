'use client'
// app/(dashboard)/lms/EnrollmentRequestQueue.tsx
// Shows pending enrollment requests for admin/supervisor review.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface EnrollmentRequest {
  id: string
  user_id: string
  programme_id?: string
  course_id?: string
  status: string
  request_message?: string
  created_at: string
  caregiver?: { full_name: string } | { full_name: string }[]
}

export default function EnrollmentRequestQueue({ requests }: { requests: EnrollmentRequest[] }) {
  const router = useRouter()
  const [expanded, setExpanded]   = useState(true)
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [notes, setNotes]         = useState<Record<string, string>>({})

  const getName = (r: EnrollmentRequest) => {
    if (!r.caregiver) return 'Unknown'
    return Array.isArray(r.caregiver) ? r.caregiver[0]?.full_name : r.caregiver.full_name
  }

  const handleReview = async (requestId: string, approve: boolean) => {
    setReviewing(requestId)
    await fetch('/api/enrollment-requests/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, approve, review_notes: notes[requestId] || null }),
    })
    setReviewing(null)
    router.refresh()
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 24, overflow: 'hidden', border: '1px solid #EFF2F5' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: expanded ? '1px solid #EFF2F5' : 'none', cursor: 'pointer', background: '#FAFBFC' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44' }}>📋 Enrollment Requests</span>
          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#EBF4FF', color: '#457B9D' }}>
            {requests.length} pending
          </span>
        </div>
        {expanded ? <ChevronUp size={16} color="#8FA0B0" /> : <ChevronDown size={16} color="#8FA0B0" />}
      </div>

      {expanded && (
        <div style={{ padding: '4px 0' }}>
          {requests.map(req => (
            <div key={req.id} style={{ padding: '14px 20px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44' }}>{getName(req)}</div>
                <div style={{ fontSize: 12, color: '#8FA0B0', marginTop: 2 }}>
                  {req.programme_id ? `Programme request` : 'Course request'} ·{' '}
                  {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {req.request_message && (
                  <div style={{ fontSize: 12, color: '#4A6070', marginTop: 6, background: '#F8FAFB', padding: '6px 10px', borderRadius: 6, border: '1px solid #EFF2F5' }}>
                    "{req.request_message}"
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <input
                    value={notes[req.id] || ''}
                    onChange={e => setNotes(n => ({ ...n, [req.id]: e.target.value }))}
                    placeholder="Optional note to caregiver…"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D9E0', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 2 }}>
                <button
                  onClick={() => handleReview(req.id, true)}
                  disabled={reviewing === req.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: '#E6F6F4', border: 'none', borderRadius: 8, color: '#2A9D8F', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: reviewing === req.id ? 0.6 : 1 }}
                >
                  <CheckCircle size={13} /> Approve
                </button>
                <button
                  onClick={() => handleReview(req.id, false)}
                  disabled={reviewing === req.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: '#FDE8E9', border: 'none', borderRadius: 8, color: '#E63946', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: reviewing === req.id ? 0.6 : 1 }}
                >
                  <XCircle size={13} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
