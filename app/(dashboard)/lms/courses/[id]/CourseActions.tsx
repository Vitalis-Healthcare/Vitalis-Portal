'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, X } from 'lucide-react'

export default function CourseActions({
  courseId,
  currentStatus,
  courseTitle
}: {
  courseId: string
  currentStatus: string
  courseTitle: string
}) {
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const toggleStatus = async () => {
    setLoading(true)
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    await supabase.from('courses')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', courseId)
    router.refresh()
    setLoading(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Delete in order: questions → sections → enrollments → section_progress → course
    const { data: sections } = await supabase
      .from('course_sections').select('id').eq('course_id', courseId)

    if (sections) {
      for (const s of sections) {
        await supabase.from('quiz_questions').delete().eq('section_id', s.id)
        await supabase.from('section_progress').delete().eq('section_id', s.id)
      }
      await supabase.from('course_sections').delete().eq('course_id', courseId)
    }

    await supabase.from('course_enrollments').delete().eq('course_id', courseId)
    await supabase.from('courses').delete().eq('id', courseId)

    await supabase.from('audit_log').insert({
      user_id: user?.id,
      action: `Course "${courseTitle}" deleted`,
      entity_type: 'course'
    })

    router.push('/lms')
    router.refresh()
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Edit */}
        <Link href={`/lms/courses/${courseId}/edit`}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', border: '1px solid #D1D9E0',
            borderRadius: 8, background: '#fff', color: '#4A6070',
            fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            <Pencil size={13} /> Edit
          </button>
        </Link>

        {/* Publish toggle */}
        <button onClick={toggleStatus} disabled={loading} style={{
          padding: '7px 14px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          background: currentStatus === 'published' ? '#EFF2F5' : '#0E7C7B',
          color: currentStatus === 'published' ? '#4A6070' : '#fff'
        }}>
          {loading ? '…' : currentStatus === 'published' ? 'Unpublish' : 'Publish'}
        </button>

        {/* Delete */}
        <button onClick={() => setShowDeleteModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', border: '1px solid #FDE8E9',
          borderRadius: 8, background: '#FDE8E9', color: '#E63946',
          fontSize: 13, fontWeight: 600, cursor: 'pointer'
        }}>
          <Trash2 size={13} /> Delete
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 16
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}
        >
          <div style={{
            background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Delete Course</h3>
              <button onClick={() => setShowDeleteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: '#FDE8E9', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: '#C0392B', margin: 0, fontWeight: 600 }}>
                  ⚠️ This cannot be undone
                </p>
              </div>
              <p style={{ fontSize: 14, color: '#4A6070', margin: '0 0 6px' }}>
                You are about to permanently delete:
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', margin: '0 0 16px' }}>
                &ldquo;{courseTitle}&rdquo;
              </p>
              <p style={{ fontSize: 13, color: '#8FA0B0', margin: 0 }}>
                All sections, quiz questions, and staff enrollment records for this course will also be deleted.
              </p>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #EFF2F5', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{
                padding: '8px 18px', border: '1px solid #E2E8F0', borderRadius: 8,
                background: '#fff', color: '#4A6070', fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 20px', background: deleting ? '#CBD5E0' : '#E63946',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer'
              }}>
                <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Yes, Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
