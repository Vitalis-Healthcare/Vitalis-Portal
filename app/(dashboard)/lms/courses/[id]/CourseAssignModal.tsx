'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserPlus, X, Send } from 'lucide-react'

interface StaffMember {
  id: string
  full_name: string
  role: string
}

export default function CourseAssignModal({
  courseId,
  courseName,
  unassignedStaff
}: {
  courseId: string
  courseName: string
  unassignedStaff: StaffMember[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dueDate, setDueDate] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const toggleStaff = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const handleAssign = async () => {
    if (selected.size === 0) return
    setSaving(true)

    try {
      const res = await fetch('/api/lms/course/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseName,
          userIds: Array.from(selected),
          dueDate: dueDate || null,
          sendEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Error assigning staff. Please try again.')
        setSaving(false)
        return
      }

      setDone(true)
      setTimeout(() => {
        setOpen(false)
        setSelected(new Set())
        setDueDate('')
        setDone(false)
        router.refresh()
      }, 1200)
    } catch {
      alert('Network error. Please check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', background: '#1A2E44', color: '#fff',
          border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer'
        }}
      >
        <UserPlus size={14} /> Assign Staff
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 16
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{
            background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden'
          }}>
            {/* Modal header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Assign Staff to Course</h3>
                <p style={{ fontSize: 12, color: '#8FA0B0', margin: '2px 0 0' }}>{courseName}</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Staff list */}
            <div style={{ padding: '16px 24px', maxHeight: 280, overflowY: 'auto' }}>
              {unassignedStaff.length === 0 ? (
                <p style={{ color: '#8FA0B0', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                  All staff are already enrolled in this course.
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#8FA0B0' }}>{unassignedStaff.length} staff available</span>
                    <button
                      onClick={() => setSelected(new Set(unassignedStaff.map(s => s.id)))}
                      style={{ fontSize: 12, color: '#0E7C7B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Select All
                    </button>
                  </div>
                  {unassignedStaff.map(s => (
                    <label
                      key={s.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 8, marginBottom: 4,
                        border: `2px solid ${selected.has(s.id) ? '#0E7C7B' : '#E2E8F0'}`,
                        background: selected.has(s.id) ? '#E6F6F4' : '#F8FAFC',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleStaff(s.id)}
                        style={{ accentColor: '#0E7C7B', width: 15, height: 15 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E44' }}>{s.full_name}</div>
                        <div style={{ fontSize: 11, color: '#8FA0B0', textTransform: 'capitalize' }}>{s.role}</div>
                      </div>
                    </label>
                  ))}
                </>
              )}
            </div>

            {/* Options */}
            {unassignedStaff.length > 0 && (
              <div style={{ padding: '12px 24px', borderTop: '1px solid #EFF2F5' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: 13, color: '#4A6070', fontWeight: 600 }}>Due date (optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{ padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, color: '#1A2E44' }}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={e => setSendEmail(e.target.checked)}
                    style={{ accentColor: '#0E7C7B', width: 14, height: 14 }}
                  />
                  <span style={{ fontSize: 12, color: '#4A6070' }}>Send email notification to assigned staff</span>
                </label>
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #EFF2F5', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setOpen(false)}
                style={{ padding: '8px 18px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#4A6070', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selected.size === 0 || saving || done}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 20px',
                  background: done ? '#2A9D8F' : selected.size === 0 ? '#CBD5E0' : '#0E7C7B',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, cursor: selected.size === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {done ? '✓ Assigned!' : saving ? 'Assigning…' : (
                  <><Send size={13} /> Assign {selected.size > 0 ? `${selected.size} ` : ''}Staff</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
