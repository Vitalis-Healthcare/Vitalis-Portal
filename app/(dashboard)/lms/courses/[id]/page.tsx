import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Clock, BookOpen, CheckCircle } from 'lucide-react'
import CourseActions from './CourseActions'
import CourseAssignModal from './CourseAssignModal'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: course } = await svc
    .from('courses')
    .select('*, sections:course_sections(*, questions:quiz_questions(*))')
    .eq('id', id)
    .order('order_index', { referencedTable: 'course_sections' })
    .single()

  if (!course) notFound()

  const { data: enrollments } = await svc
    .from('course_enrollments')
    .select('*, profile:profiles(full_name, role)')
    .eq('course_id', id)
    .order('assigned_at', { ascending: false })

  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles').select('role').eq('id', user?.id || '').single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  const { data: myEnrollment } = await svc
    .from('course_enrollments')
    .select('id, progress_pct, completed_at')
    .eq('course_id', id)
    .eq('user_id', user?.id || '')
    .maybeSingle()

  const { data: enrolledRows } = await svc
    .from('course_enrollments').select('user_id').eq('course_id', id)

  const enrolledIds = new Set((enrolledRows || []).map((e: any) => e.user_id))

  const { data: allStaff } = isAdmin
    ? await svc.from('profiles').select('id, full_name, role').order('full_name')
    : { data: [] }

  const unassignedStaff = (allStaff || []).filter((s: any) => !enrolledIds.has(s.id))

  const completions = enrollments?.filter(e => e.completed_at).length || 0
  const totalEnrolled = enrollments?.length || 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/lms" style={{ color: '#8FA0B0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
          <ArrowLeft size={14}/> Courses
        </Link>
      </div>

      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ background: course.thumbnail_color||'#0E7C7B', padding: '28px 32px', color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{course.category}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{course.title}</h1>
          {course.description && <p style={{ opacity: 0.85, marginTop: 8, fontSize: 14 }}>{course.description}</p>}
          <div style={{ display: 'flex', gap: 24, marginTop: 16, fontSize: 13, opacity: 0.9 }}>
            <span><Clock size={14} style={{ verticalAlign: 'middle' }}/> {course.estimated_minutes} min</span>
            <span><BookOpen size={14} style={{ verticalAlign: 'middle' }}/> {course.sections?.length||0} sections</span>
            <span><Users size={14} style={{ verticalAlign: 'middle' }}/> {totalEnrolled} enrolled</span>
            <span><CheckCircle size={14} style={{ verticalAlign: 'middle' }}/> {completions} completed</span>
          </div>
        </div>
        <div style={{ background: '#fff', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #EFF2F5' }}>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: course.status==='published' ? '#E6F6F4' : '#EFF2F5',
            color: course.status==='published' ? '#2A9D8F' : '#8FA0B0'
          }}>{course.status}</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {myEnrollment && course.status === 'published' && (
              <Link href={`/lms/courses/${course.id}/take`}>
                <button style={{
                  padding: '8px 20px', background: '#0E7C7B', color: '#fff',
                  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer'
                }}>
                  {myEnrollment.completed_at
                    ? '✓ Review Course'
                    : myEnrollment.progress_pct > 0
                      ? `▶ Continue — ${myEnrollment.progress_pct}%`
                      : '▶ Start Course'}
                </button>
              </Link>
            )}
            {isAdmin && (
              <>
                <CourseAssignModal
                  courseId={course.id}
                  courseName={course.title}
                  unassignedStaff={unassignedStaff}
                />
                <CourseActions courseId={course.id} currentStatus={course.status} courseTitle={course.title} />
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A2E44', marginBottom: 16 }}>Course Content</h2>
          {(course.sections||[]).length === 0 ? (
            <p style={{ color: '#8FA0B0', fontSize: 14 }}>No content sections yet.</p>
          ) : (
            (course.sections||[]).map((s: any, i: number) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #EFF2F5' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFF2F5', fontSize: 13 }}>
                  {s.type==='text'?'📄':s.type==='video'?'🎬':s.type==='pdf'?'📎':'❓'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2E44' }}>{s.title||`Section ${i+1}`}</div>
                  <div style={{ fontSize: 12, color: '#8FA0B0', textTransform: 'capitalize' }}>{s.type}{s.type==='quiz'?` · ${s.questions?.length||0} questions`:''}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A2E44', marginBottom: 16 }}>Enrollments ({totalEnrolled})</h2>
          {totalEnrolled === 0 ? (
            <p style={{ color: '#8FA0B0', fontSize: 14 }}>
              No one enrolled yet.{isAdmin ? ' Use "Assign Staff" above.' : ' Ask your supervisor to assign this course.'}
            </p>
          ) : (
            (enrollments||[]).map((e: any) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #EFF2F5' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2E44' }}>{e.profile?.full_name}</div>
                  <div style={{ fontSize: 12, color: '#8FA0B0' }}>{e.due_date ? `Due ${new Date(e.due_date).toLocaleDateString()}` : 'No due date'}</div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: e.completed_at ? '#E6F6F4' : e.progress_pct > 0 ? '#FEF3EA' : '#EFF2F5',
                  color: e.completed_at ? '#2A9D8F' : e.progress_pct > 0 ? '#F4A261' : '#8FA0B0'
                }}>
                  {e.completed_at ? '✓ Done' : e.progress_pct > 0 ? `${e.progress_pct}%` : 'Not Started'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
