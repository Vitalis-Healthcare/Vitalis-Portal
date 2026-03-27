// app/api/lms/course/save/route.ts
// Saves or updates a course with all sections and quiz questions.
// Called by CourseBuilderForm — replaces all direct client-side Supabase writes.
// Admin / supervisor only.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  // ── Auth + role gate ──────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles').select('role').eq('id', user.id).single()

  if (!['admin', 'supervisor'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const {
    courseId,       // present when editing, absent when creating
    title,
    description,
    category,
    estimated_minutes,
    thumbnail_color,
    pass_score,
    publish,
    sections,
  } = await req.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Course title is required.' }, { status: 400 })
  }

  const status = publish ? 'published' : 'draft'

  // ── Upsert course ─────────────────────────────────────────────────────────
  let savedCourseId = courseId

  if (courseId) {
    // Update existing
    const { error } = await svc.from('courses').update({
      title, description, category,
      estimated_minutes, thumbnail_color, pass_score,
      status, updated_at: new Date().toISOString(),
    }).eq('id', courseId)

    if (error) {
      console.error('[course/save] update error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    // Insert new
    const { data: newCourse, error } = await svc.from('courses').insert({
      title, description, category,
      estimated_minutes, thumbnail_color, pass_score,
      status, created_by: user.id,
    }).select('id').single()

    if (error || !newCourse) {
      console.error('[course/save] insert error:', error?.message)
      return NextResponse.json({ error: error?.message || 'Failed to create course.' }, { status: 500 })
    }
    savedCourseId = newCourse.id
  }

  // ── Replace sections ──────────────────────────────────────────────────────
  // Delete all existing sections + their quiz questions first
  const { data: existingSections } = await svc
    .from('course_sections').select('id').eq('course_id', savedCourseId)

  if (existingSections?.length) {
    for (const sec of existingSections) {
      await svc.from('quiz_questions').delete().eq('section_id', sec.id)
    }
    await svc.from('course_sections').delete().eq('course_id', savedCourseId)
  }

  // Insert new sections
  for (let i = 0; i < (sections || []).length; i++) {
    const s = sections[i]
    const { data: sec, error: secError } = await svc.from('course_sections').insert({
      course_id: savedCourseId,
      title: s.title || `Section ${i + 1}`,
      type: s.type,
      content: s.content || '',
      video_url: s.video_url || null,
      pdf_url: s.pdf_url || null,
      order_index: i,
    }).select('id').single()

    if (secError || !sec) {
      console.error('[course/save] section insert error:', secError?.message)
      continue
    }

    if (s.type === 'quiz' && s.questions?.length) {
      for (let j = 0; j < s.questions.length; j++) {
        const q = s.questions[j]
        if (!q.question?.trim()) continue
        await svc.from('quiz_questions').insert({
          section_id: sec.id,
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          order_index: j,
        })
      }
    }
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  await svc.from('audit_log').insert({
    user_id: user.id,
    action: courseId
      ? `Course "${title}" ${publish ? 'published' : 'saved as draft'}`
      : `Course "${title}" created`,
    entity_type: 'course',
    entity_id: savedCourseId,
  }).catch(() => {}) // non-fatal

  return NextResponse.json({ success: true, courseId: savedCourseId })
}
