import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import CoursePlayer from './CoursePlayer'

export default async function TakeCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase
    .from('courses')
    .select(`
      id, title, description, thumbnail_color, category, estimated_minutes, status,
      sections:course_sections(
        id, title, type, content, video_url, pdf_url, order_index,
        questions:quiz_questions(id, question, options, correct_index, order_index)
      )
    `)
    .eq('id', id)
    .single()

  if (!course || course.status !== 'published') notFound()

  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select('id, progress_pct, completed_at, last_accessed_at')
    .eq('course_id', id)
    .eq('user_id', user.id)
    .single()

  if (!enrollment) {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '48px 40px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎓</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E44', marginBottom: 8 }}>
            Not Enrolled in This Course
          </h2>
          <p style={{ color: '#8FA0B0', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            You have not been assigned this course yet. Ask your supervisor or administrator to assign it to you.
          </p>
          <Link
            href="/lms"
            style={{
              display: 'inline-block', padding: '10px 24px',
              background: '#0E7C7B', color: '#fff', borderRadius: 8,
              textDecoration: 'none', fontWeight: 600, fontSize: 14
            }}
          >
            Back to Training
          </Link>
        </div>
      </div>
    )
  }

  const { data: sectionProgress } = await supabase
    .from('section_progress')
    .select('section_id, completed_at, score, quiz_answers')
    .eq('enrollment_id', enrollment.id)

  return (
    <CoursePlayer
      course={course}
      enrollment={enrollment}
      initialProgress={sectionProgress || []}
    />
  )
}
