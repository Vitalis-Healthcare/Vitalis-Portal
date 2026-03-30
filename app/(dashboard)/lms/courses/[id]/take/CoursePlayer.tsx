'use client'
import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, CheckCircle, Trophy,
  ArrowLeft, Play, FileText, HelpCircle, BookOpen
} from 'lucide-react'
import Link from 'next/link'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_index: number
  order_index: number
}

interface Section {
  id: string
  title: string
  type: 'text' | 'video' | 'pdf' | 'quiz'
  content?: string
  video_url?: string
  pdf_url?: string
  order_index: number
  questions?: QuizQuestion[]
}

interface Enrollment {
  id: string
  progress_pct: number
  completed_at: string | null
  last_accessed_at?: string | null
}

interface SectionProgress {
  section_id: string
  completed_at: string
  score?: number
  quiz_answers?: Record<string, number>
}

interface CourseProps {
  course: {
    id: string
    title: string
    description?: string
    thumbnail_color?: string
    category: string
    estimated_minutes: number
    sections: Section[]
  }
  enrollment: Enrollment
  initialProgress: SectionProgress[]
}


// ── Video player that prevents skipping ahead ─────────────────────────────
function VideoPlayer({ src, onEnded }: { src: string; onEnded: () => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [maxWatched, setMaxWatched] = React.useState(0)
  const [blocked, setBlocked] = React.useState(false)

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    // Track furthest point reached
    if (v.currentTime > maxWatched) {
      setMaxWatched(v.currentTime)
    }
  }

  const handleSeeking = () => {
    const v = videoRef.current
    if (!v) return
    // If trying to seek past what they've watched, snap back
    if (v.currentTime > maxWatched + 1) {
      v.currentTime = maxWatched
      setBlocked(true)
      setTimeout(() => setBlocked(false), 2000)
    }
  }

  const handleEnded = () => {
    onEnded()
  }

  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
      <video
        ref={videoRef}
        src={src}
        controls
        controlsList="nodownload"
        style={{ width: '100%', display: 'block' }}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onEnded={handleEnded}
      />
      {blocked && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.82)', color: '#fff',
          padding: '12px 20px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, textAlign: 'center',
          pointerEvents: 'none', zIndex: 10,
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          ⏭ Please watch the video in full before moving ahead
        </div>
      )}
    </div>
  )
}

export default function CoursePlayer({ course, enrollment: initialEnrollment, initialProgress }: CourseProps) {
  const supabase = createClient()
  const router = useRouter()

  const sections = course.sections.sort((a, b) => a.order_index - b.order_index)

  // Start at first incomplete section
  const firstIncomplete = sections.findIndex(s => !initialProgress.find(p => p.section_id === s.id))
  const [currentIdx, setCurrentIdx] = useState(firstIncomplete >= 0 ? firstIncomplete : 0)
  const [progress, setProgress] = useState<Record<string, SectionProgress>>(
    Object.fromEntries(initialProgress.map(p => [p.section_id, p]))
  )
  const [enrollment, setEnrollment] = useState(initialEnrollment)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [courseCompleted, setCourseCompleted] = useState(!!initialEnrollment.completed_at)

  const currentSection = sections[currentIdx]
  const completedCount = sections.filter(s => progress[s.id]).length
  const progressPct = sections.length > 0 ? Math.round((completedCount / sections.length) * 100) : 0

  useEffect(() => {
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizScore(null)
  }, [currentIdx])

  const markSectionComplete = useCallback(async (
    sectionId: string,
    score?: number,
    answers?: Record<string, number>
  ) => {
    if (progress[sectionId]) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('section_progress').upsert({
      enrollment_id: enrollment.id,
      section_id: sectionId,
      completed_at: new Date().toISOString(),
      score: score ?? null,
      quiz_answers: answers ?? null
    }, { onConflict: 'enrollment_id,section_id' })

    const newProgress = {
      ...progress,
      [sectionId]: {
        section_id: sectionId,
        completed_at: new Date().toISOString(),
        score,
        quiz_answers: answers
      }
    }
    setProgress(newProgress)

    const newCompletedCount = Object.keys(newProgress).length
    const newPct = Math.round((newCompletedCount / sections.length) * 100)
    const allDone = newCompletedCount === sections.length

    await supabase.from('course_enrollments').update({
      progress_pct: newPct,
      last_accessed_at: new Date().toISOString(),
      ...(allDone ? { completed_at: new Date().toISOString() } : {})
    }).eq('id', enrollment.id)

    setEnrollment(prev => ({
      ...prev,
      progress_pct: newPct,
      ...(allDone ? { completed_at: new Date().toISOString() } : {})
    }))

    if (allDone) {
      await supabase.from('audit_log').insert({
        user_id: user?.id,
        action: `Completed course: ${course.title}`,
        entity_type: 'course',
        entity_id: course.id
      })
      setCourseCompleted(true)
    }

    setSaving(false)
  }, [progress, enrollment.id, sections.length, course.title, course.id, supabase])

  const handleSubmitQuiz = async () => {
    const questions = currentSection.questions || []
    if (questions.length === 0) return

    let correct = 0
    for (const q of questions) {
      if (quizAnswers[q.id] === q.correct_index) correct++
    }
    const score = Math.round((correct / questions.length) * 100)
    setQuizScore(score)
    setQuizSubmitted(true)
    await markSectionComplete(currentSection.id, score, quizAnswers)
  }

  const handleNext = async () => {
    if (currentSection.type !== 'quiz' && !progress[currentSection.id]) {
      await markSectionComplete(currentSection.id)
    }
    if (currentIdx < sections.length - 1) {
      setCurrentIdx(currentIdx + 1)
    }
  }

  const handleFinish = async () => {
    if (currentSection.type !== 'quiz' && !progress[currentSection.id]) {
      await markSectionComplete(currentSection.id)
    }
    router.push(`/lms/courses/${course.id}`)
  }

  const sectionIconEl = (type: string) => {
    if (type === 'text') return <FileText size={16} />
    if (type === 'video') return <Play size={16} />
    if (type === 'pdf') return <BookOpen size={16} />
    return <HelpCircle size={16} />
  }

  const canProceed =
    currentSection.type !== 'quiz' ||
    quizSubmitted ||
    !!progress[currentSection.id]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Back */}
      <div style={{ marginBottom: 16 }}>
        <Link
          href={`/lms/courses/${course.id}`}
          style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14 }}
        >
          <ArrowLeft size={14} /> Back to course
        </Link>
      </div>

      {/* Header with progress bar */}
      <div className="course-player-header" style={{
        background: course.thumbnail_color || '#0E7C7B',
        borderRadius: '12px 12px 0 0',
        padding: '20px 28px',
        color: '#fff'
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          {course.category}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{course.title}</h1>
          {courseCompleted && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              <Trophy size={14} /> Completed
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.25)', borderRadius: 20, height: 7, overflow: 'hidden' }}>
            <div style={{
              width: `${progressPct}%`,
              background: '#fff',
              borderRadius: 20,
              height: 7,
              transition: 'width 0.5s ease'
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 36 }}>{progressPct}%</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{completedCount} / {sections.length}</span>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="course-player-body" style={{
        display: 'grid',
        gridTemplateColumns: '230px 1fr',
        background: '#fff',
        borderRadius: '0 0 12px 12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        minHeight: 520,
        overflow: 'hidden'
      }}>
        {/* Section nav sidebar */}
        <div className="course-section-nav" style={{ borderRight: '1px solid #EFF2F5', paddingTop: 12, paddingBottom: 12, overflowY: 'auto' }}>
          {sections.map((s, i) => {
            const isDone = !!progress[s.id]
            const isActive = i === currentIdx
            return (
              <button
                key={s.id}
                className="course-section-btn"
                onClick={() => setCurrentIdx(i)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  background: isActive ? '#EFF2F5' : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${isActive ? '#0E7C7B' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: isDone ? '#2A9D8F' : isActive ? '#0E7C7B' : '#8FA0B0' }}>
                    {isDone ? <CheckCircle size={15} /> : sectionIconEl(s.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#1A2E44' : '#4A6070',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {s.title || `Section ${i + 1}`}
                    </div>
                    <div style={{ fontSize: 10, color: '#8FA0B0', textTransform: 'capitalize', marginTop: 1 }}>
                      {s.type}
                      {s.type === 'quiz' && progress[s.id]?.score !== undefined && ` · ${progress[s.id].score}%`}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Main content area */}
        <div className="course-player-content" style={{ padding: 'clamp(16px,3vw,28px) clamp(14px,3vw,36px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  Section {currentIdx + 1} of {sections.length} · {currentSection.type}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E44', margin: 0 }}>
                  {currentSection.title || `Section ${currentIdx + 1}`}
                </h2>
              </div>
              {progress[currentSection.id] && currentSection.type !== 'quiz' && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: '#E6F6F4', color: '#2A9D8F', flexShrink: 0
                }}>
                  <CheckCircle size={13} /> Complete
                </span>
              )}
            </div>

            {/* TEXT */}
            {currentSection.type === 'text' && (
              <div className="prose-scroll-wrapper" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as const }}>
                <div
                  className="prose-content"
                  style={{ fontSize: 14, lineHeight: 1.8, color: '#2A3A4A', minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  dangerouslySetInnerHTML={{
                    __html: currentSection.content ||
                      '<p style="color:#8FA0B0">No content added to this section yet.</p>'
                  }}
                />
              </div>
            )}

            {/* VIDEO */}
            {currentSection.type === 'video' && (
              <div>
                {currentSection.video_url ? (
                  <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000' }}>
                    {/youtube|youtu\.be/.test(currentSection.video_url) ? (
                      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYouTubeId(currentSection.video_url)}`}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    ) : /synthesia\.io/.test(currentSection.video_url) ? (
                      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                          src={currentSection.video_url.includes('/embeds/') ? currentSection.video_url : currentSection.video_url.replace('share.synthesia.io/', 'share.synthesia.io/embeds/videos/')}
                          loading="lazy"
                          title="Training video"
                          allowFullScreen
                          allow="encrypted-media; fullscreen; microphone; screen-wake-lock"
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        />
                      </div>
                    ) : (
                      <VideoPlayer
                        src={currentSection.video_url}
                        onEnded={() => markComplete(currentSection.id)}
                      />
                    )}
                  </div>
                ) : (
                  <EmptyState emoji="🎬" message="No video URL has been set for this section yet." />
                )}
              </div>
            )}

            {/* PDF */}
            {currentSection.type === 'pdf' && (
              <div>
                {currentSection.pdf_url ? (
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', background: '#F8FAFC', borderRadius: 8,
                      border: '1px solid #EFF2F5', marginBottom: 12
                    }}>
                      <span style={{ fontSize: 22 }}>📎</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E44' }}>PDF Document</div>
                        <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>
                          {decodeURIComponent(currentSection.pdf_url.split('/').pop() || 'document.pdf')}
                        </div>
                      </div>
                      <a
                        href={currentSection.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '7px 16px', background: '#0E7C7B', color: '#fff',
                          borderRadius: 7, textDecoration: 'none', fontSize: 13, fontWeight: 600
                        }}
                      >
                        Open ↗
                      </a>
                    </div>
                    <iframe
                      src={currentSection.pdf_url}
                      style={{ width: '100%', height: 'clamp(280px,50vw,420px)', border: '1px solid #EFF2F5', borderRadius: 8 }}
                    />
                  </div>
                ) : (
                  <EmptyState emoji="📎" message="No PDF has been attached to this section yet." />
                )}
              </div>
            )}

            {/* QUIZ */}
            {currentSection.type === 'quiz' && (
              <QuizSection
                questions={currentSection.questions || []}
                answers={quizAnswers}
                setAnswers={setQuizAnswers}
                submitted={quizSubmitted}
                score={quizScore}
                onSubmit={handleSubmitQuiz}
                alreadyCompleted={!!progress[currentSection.id]}
                previousScore={progress[currentSection.id]?.score}
                saving={saving}
              />
            )}
          </div>

          {/* Navigation footer */}
          <div className="course-player-footer" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 32, paddingTop: 20, borderTop: '1px solid #EFF2F5'
          }}>
            <button
              onClick={() => setCurrentIdx(i => i - 1)}
              disabled={currentIdx === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', border: '1px solid #E2E8F0',
                borderRadius: 8, background: '#fff',
                color: currentIdx === 0 ? '#CBD5E0' : '#4A6070',
                fontSize: 14, fontWeight: 600,
                cursor: currentIdx === 0 ? 'default' : 'pointer'
              }}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8FA0B0', fontSize: 13 }}>
              {sections.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                    background: i === currentIdx ? '#0E7C7B' : progress[sections[i].id] ? '#2A9D8F' : '#E2E8F0',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>

            {currentIdx < sections.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={saving || !canProceed}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 20px', background: canProceed ? '#0E7C7B' : '#CBD5E0',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                  cursor: saving || !canProceed ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {saving ? 'Saving…' : 'Next'} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving || !canProceed}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 20px',
                  background: courseCompleted ? '#2A9D8F' : canProceed ? '#0E7C7B' : '#CBD5E0',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                  cursor: saving || !canProceed ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving…' : courseCompleted ? '🎉 Complete!' : 'Finish'} <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function extractYouTubeId(url: string): string {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/)
  return m ? m[1] : ''
}

function EmptyState({ emoji, message }: { emoji: string; message: string }) {
  return (
    <div style={{
      background: '#F8FAFC', borderRadius: 10, padding: '48px 24px',
      textAlign: 'center', border: '2px dashed #E2E8F0'
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
      <p style={{ color: '#8FA0B0', fontSize: 14, margin: 0 }}>{message}</p>
    </div>
  )
}

function QuizSection({
  questions, answers, setAnswers, submitted, score, onSubmit,
  alreadyCompleted, previousScore, saving
}: {
  questions: QuizQuestion[]
  answers: Record<string, number>
  setAnswers: (a: Record<string, number>) => void
  submitted: boolean
  score: number | null
  onSubmit: () => void
  alreadyCompleted: boolean
  previousScore?: number
  saving: boolean
}) {
  if (questions.length === 0) {
    return <EmptyState emoji="❓" message="No questions have been added to this quiz yet." />
  }

  if (alreadyCompleted && !submitted) {
    const prevPct = previousScore ?? 0
    const passed = prevPct >= 70
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>{passed ? '✅' : '📚'}</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A2E44', marginBottom: 6 }}>Quiz Completed</h3>
        <div style={{ fontSize: 28, fontWeight: 800, color: passed ? '#2A9D8F' : '#F4A261', marginBottom: 8 }}>
          {prevPct}%
        </div>
        <p style={{ color: '#8FA0B0', fontSize: 13 }}>
          {passed ? 'You passed this quiz.' : 'You did not reach the 70% pass mark.'} Continue to the next section.
        </p>
      </div>
    )
  }

  if (submitted && score !== null) {
    const passed = score >= 70
    const correctCount = Math.round((score / 100) * questions.length)
    return (
      <div style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>{passed ? '🏆' : '📚'}</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E44', marginBottom: 8 }}>
          {passed ? 'Great work!' : 'Keep practising!'}
        </h3>
        <div style={{ fontSize: 40, fontWeight: 900, color: passed ? '#2A9D8F' : '#F4A261', marginBottom: 6 }}>
          {score}%
        </div>
        <div style={{ fontSize: 14, color: '#8FA0B0', marginBottom: 16 }}>
          {correctCount} of {questions.length} correct
        </div>
        {passed ? (
          <div style={{ display: 'inline-block', padding: '8px 20px', background: '#E6F6F4', borderRadius: 8, color: '#2A9D8F', fontSize: 13, fontWeight: 600 }}>
            ✓ Section marked complete — click Next to continue
          </div>
        ) : (
          <div style={{ background: '#FEF3EA', borderRadius: 8, padding: '12px 16px', display: 'inline-block', textAlign: 'left', maxWidth: 340 }}>
            <div style={{ fontSize: 13, color: '#C67B2A', fontWeight: 600, marginBottom: 4 }}>Score recorded</div>
            <div style={{ fontSize: 12, color: '#8B5E1F' }}>Pass mark is 70%. Your score has been recorded. You can still proceed — ask your supervisor to review your performance.</div>
          </div>
        )}
      </div>
    )
  }

  const answered = Object.keys(answers).length
  const allAnswered = answered === questions.length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: '#8FA0B0', margin: 0 }}>
          Answer all {questions.length} question{questions.length !== 1 ? 's' : ''} to submit.
        </p>
        <span style={{
          padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: allAnswered ? '#E6F6F4' : '#EFF2F5',
          color: allAnswered ? '#2A9D8F' : '#8FA0B0'
        }}>
          {answered}/{questions.length} answered
        </span>
      </div>

      {[...questions].sort((a, b) => a.order_index - b.order_index).map((q, qi) => (
        <div key={q.id} style={{ marginBottom: 20, padding: '16px 18px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #EFF2F5' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 12 }}>
            {qi + 1}. {q.question}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(q.options || []).map((opt, oi) => {
              const selected = answers[q.id] === oi
              return (
                <label
                  key={oi}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 8,
                    border: `2px solid ${selected ? '#0E7C7B' : '#E2E8F0'}`,
                    background: selected ? '#E6F6F4' : '#fff',
                    cursor: 'pointer', fontSize: 13, color: '#2A3A4A',
                    transition: 'all 0.15s'
                  }}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={oi}
                    checked={selected}
                    onChange={() => setAnswers({ ...answers, [q.id]: oi })}
                    style={{ accentColor: '#0E7C7B', width: 15, height: 15 }}
                  />
                  {opt}
                </label>
              )
            })}
          </div>
        </div>
      ))}

      <button
        onClick={onSubmit}
        disabled={!allAnswered || saving}
        style={{
          padding: '11px 28px',
          background: allAnswered ? '#0E7C7B' : '#CBD5E0',
          color: '#fff', border: 'none', borderRadius: 8,
          fontWeight: 700, fontSize: 14,
          cursor: allAnswered ? 'pointer' : 'not-allowed',
          transition: 'background 0.2s'
        }}
      >
        {saving ? 'Scoring…' : 'Submit Quiz'}
      </button>
    </div>
  )
}
