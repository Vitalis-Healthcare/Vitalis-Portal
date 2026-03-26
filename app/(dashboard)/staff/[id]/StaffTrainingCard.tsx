'use client'
// app/(dashboard)/staff/[id]/StaffTrainingCard.tsx
// Shows training status and allows admin to enroll caregiver in programmes directly.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Plus, X, BookOpen } from 'lucide-react'

interface Enrollment {
  id: string
  completed_at?: string
  due_date?: string
  assigned_at?: string
  course?: { id: string; title: string; category?: string } | { id: string; title: string; category?: string }[]
}

interface Programme {
  id: string
  title: string
  slug: string
  est_hours?: number
  total_modules?: number
}

interface EnrollmentRequest {
  id: string
  programme_id?: string
  status: string
  created_at: string
}

interface Props {
  enrollments:       Enrollment[]
  programmes:        Programme[]
  enrolledProgIds:   string[]
  pendingRequests:   EnrollmentRequest[]
  caregiverId:       string
  viewerRole:        string
}

export default function StaffTrainingCard({ enrollments, programmes, enrolledProgIds, pendingRequests, caregiverId, viewerRole }: Props) {
  const router = useRouter()
  const [showEnroll, setShowEnroll]   = useState(false)
  const [enrolling, setEnrolling]     = useState<string | null>(null)

  const canEdit = ['admin', 'supervisor'].includes(viewerRole)

  const getTitle = (e: Enrollment) => {
    const c = e.course
    if (!c) return 'Untitled'
    return Array.isArray(c) ? c[0]?.title : c.title
  }

  const completedCourses = enrollments.filter(e => e.completed_at)
  const pendingCourses   = enrollments.filter(e => !e.completed_at)

  const unenrolledProgs = programmes.filter(p =>
    !enrolledProgIds.includes(p.id) &&
    !pendingRequests.some(r => r.programme_id === p.id)
  )

  const handleEnroll = async (programmeId: string) => {
    setEnrolling(programmeId)
    const res = await fetch('/api/enrollment-requests/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Use a direct enroll endpoint — we'll create a direct enroll for admin
        // For now use the review endpoint but we need a direct enroll
        requestId: null,
        approve: true,
      }),
    })
    // Actually call direct enroll
    const res2 = await fetch('/api/enrollments/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caregiverId, programmeId }),
    })
    if (res2.ok) { router.refresh(); setShowEnroll(false) }
    else { const d = await res2.json(); alert(d.error || 'Enrollment failed') }
    setEnrolling(null)
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>🎓 Training</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#8FA0B0', fontWeight: 400 }}>{enrollments.length} total</span>
            {canEdit && unenrolledProgs.length > 0 && (
              <button
                onClick={() => setShowEnroll(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                <Plus size={11}/> Enroll
              </button>
            )}
          </div>
        </div>

        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <div style={{ background: '#EBF4FF', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#457B9D' }}>
            ⏳ {pendingRequests.length} enrollment request{pendingRequests.length !== 1 ? 's' : ''} pending admin approval
          </div>
        )}

        {pendingCourses.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F4A261', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>In Progress</div>
            {pendingCourses.map((e: any) => (
              <div key={e.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E44' }}>{getTitle(e)}</div>
                {e.due_date && <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>Due {new Date(e.due_date).toLocaleDateString()}</div>}
              </div>
            ))}
            {completedCourses.length > 0 && <div style={{ borderTop: '1px solid #EFF2F5', margin: '10px 0' }} />}
          </>
        )}

        {completedCourses.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2A9D8F', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Completed</div>
            {completedCourses.map((e: any) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A6070', marginBottom: 8 }}>
                <CheckCircle size={13} color="#2A9D8F" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>{getTitle(e)}</div>
                <div style={{ fontSize: 11, color: '#8FA0B0' }}>
                  {new Date(e.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </>
        )}

        {enrollments.length === 0 && pendingRequests.length === 0 && (
          <p style={{ color: '#8FA0B0', fontSize: 13 }}>No training assigned yet.</p>
        )}
      </div>

      {/* Enroll modal */}
      {showEnroll && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowEnroll(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Enroll in Programme</h3>
                <p style={{ fontSize: 12, color: '#8FA0B0', margin: '2px 0 0' }}>Select a programme to enroll this caregiver directly</p>
              </div>
              <button onClick={() => setShowEnroll(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ padding: '16px 24px', maxHeight: 360, overflowY: 'auto' }}>
              {unenrolledProgs.length === 0 ? (
                <p style={{ color: '#8FA0B0', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>All programmes already assigned.</p>
              ) : unenrolledProgs.map(prog => (
                <div key={prog.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 8, border: '1px solid #EFF2F5', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2E44' }}>{prog.title}</div>
                    <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>
                      {prog.total_modules && `${prog.total_modules} modules`}
                      {prog.est_hours && ` · ${prog.est_hours}h`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEnroll(prog.id)}
                    disabled={enrolling === prog.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: enrolling === prog.id ? 0.6 : 1 }}
                  >
                    <BookOpen size={11}/> {enrolling === prog.id ? 'Enrolling…' : 'Enroll'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
