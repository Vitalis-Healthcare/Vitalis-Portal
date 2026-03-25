import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import CourseBuilderForm from '@/components/lms/CourseBuilderForm'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Auth + admin check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') {
    redirect(`/lms/courses/${id}`)
  }

  const { data: course } = await supabase
    .from('courses')
    .select(`
      id, title, description, category, estimated_minutes,
      thumbnail_color, pass_score, status,
      sections:course_sections(
        id, title, type, content, video_url, pdf_url, order_index,
        questions:quiz_questions(id, question, options, correct_index, order_index)
      )
    `)
    .eq('id', id)
    .single()

  if (!course) notFound()

  // Shape sections into the format CourseBuilderForm expects
  const sections = (course.sections || [])
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((s: any) => ({
      id: crypto.randomUUID(), // local react key
      dbId: s.id,
      type: s.type,
      title: s.title || '',
      content: s.content || '',
      video_url: s.video_url || '',
      pdf_url: s.pdf_url || '',
      questions: (s.questions || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((q: any) => ({
          question: q.question,
          options: q.options,
          correct_index: q.correct_index
        }))
    }))

  return (
    <CourseBuilderForm
      initial={{
        id: course.id,
        title: course.title,
        description: course.description || '',
        category: course.category,
        estimated_minutes: course.estimated_minutes,
        thumbnail_color: course.thumbnail_color,
        pass_score: course.pass_score || 80,
        sections
      }}
    />
  )
}
