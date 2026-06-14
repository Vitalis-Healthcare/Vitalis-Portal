'use client'
// app/onboarding/test/TestRunner.tsx
// Candidate-facing competency test. Handles: intro → full 86-question test →
// pass screen, or → mastery review (correct answer + rationale) → practice the
// missed questions → loop until all correct → done. Answer key for the first
// attempt is never present on the client; it only appears in mastery review.
import { useRef, useState } from 'react'

type Opt = { key: string; text: string }
type Q = { id: string; domain?: string; prompt: string; options: Opt[] }
type ReviewQ = { id: string; prompt: string; options: Opt[]; correct_key: string; rationale: string; selected: string | null }

type Initial =
  | { mode: 'intro'; questions: Q[]; total: number }
  | { mode: 'mastery_review'; remaining: ReviewQ[]; firstScore: number; total: number }
  | { mode: 'completed'; score: number; total: number; firstPassed: boolean }

type Mode = 'intro' | 'test' | 'passed' | 'mastery_review' | 'mastery_quiz' | 'mastery_done' | 'completed' | 'error'

const C = {
  navy: '#1A2E44', teal: '#0A5C5B', tealBtn: '#0E7C7B', tealSoft: '#E6F4F4',
  gray: '#4A6070', faint: '#8FA0B0', border: '#D1D9E0', line: '#EFF2F5', bg: '#F8FAFC',
  green: '#1B7A43', greenBg: '#E6F6EC', greenBorder: '#BFE6CD',
  red: '#9B3B3B', redBg: '#FBEAEA', redBorder: '#E6C3C3', amber: '#B26A00',
}

function Shell({ children, maxWidth = 720 }: { children: React.ReactNode; maxWidth?: number }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '24px 16px 56px', fontFamily: "'Segoe UI',Arial,sans-serif" }}>
      <div style={{ width: '100%', maxWidth, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%)', padding: '22px 28px', borderRadius: '14px 14px 0 0', textAlign: 'center' }}>
          <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#0E7C7B,#F4A261)', borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 10 }}>V+</div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 800 }}>Vitalis Caregiver Competency Test</h1>
        </div>
        <div style={{ background: '#fff', padding: '28px', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 14px 14px' }}>
          {children}
        </div>
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: '#94A3B8', lineHeight: 1.8 }}>
          Vitalis Healthcare Services, LLC · Silver Spring, MD
        </div>
      </div>
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  padding: '13px 30px', background: 'linear-gradient(135deg,#0E7C7B,#1A9B87)', color: '#fff',
  border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
}

export default function TestRunner({ token, firstName, initial }: { token: string; firstName: string; initial: Initial }) {
  const [mode, setMode] = useState<Mode>(
    initial.mode === 'intro' ? 'intro' : initial.mode === 'mastery_review' ? 'mastery_review' : 'completed'
  )
  const initialQuestions = initial.mode === 'intro' ? initial.questions : []
  const [testQuestions, setTestQuestions] = useState<Q[]>([])
  const [reviewSet, setReviewSet] = useState<ReviewQ[]>(initial.mode === 'mastery_review' ? initial.remaining : [])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ score: number; total: number }>(
    initial.mode === 'completed' ? { score: initial.score, total: initial.total }
      : initial.mode === 'mastery_review' ? { score: initial.firstScore, total: initial.total }
      : { score: 0, total: initial.mode === 'intro' ? initial.total : 0 }
  )
  const firstPassed = initial.mode === 'completed' ? initial.firstPassed : false
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const answeredCount = testQuestions.filter((q) => answers[q.id]).length
  const allAnswered = testQuestions.length > 0 && answeredCount === testQuestions.length

  function pick(qid: string, key: string) {
    setAnswers((a) => ({ ...a, [qid]: key }))
    setNotice('')
  }

  function startTest() {
    setTestQuestions(initialQuestions)
    setAnswers({})
    setMode('test')
  }

  function tryFinish() {
    if (!allAnswered) {
      const firstUnanswered = testQuestions.find((q) => !answers[q.id])
      if (firstUnanswered) {
        cardRefs.current[firstUnanswered.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setNotice(`Please answer all questions — ${testQuestions.length - answeredCount} still to go.`)
      }
      return
    }
    setShowConfirm(true)
  }

  async function submitFirst() {
    setShowConfirm(false); setSubmitting(true); setNotice('')
    try {
      const res = await fetch('/api/onboarding/test/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers }),
      })
      const data = await res.json()
      if (!res.ok) { setMode('error'); return }
      setResult({ score: data.score, total: data.total })
      if (data.passed) { setMode('passed') }
      else { setReviewSet(data.missed || []); window.scrollTo({ top: 0 }); setMode('mastery_review') }
    } catch {
      setMode('error')
    } finally {
      setSubmitting(false)
    }
  }

  function startMasteryQuiz() {
    setTestQuestions(reviewSet.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options })))
    setAnswers({})
    window.scrollTo({ top: 0 })
    setMode('mastery_quiz')
  }

  async function submitMastery() {
    if (!allAnswered) {
      const firstUnanswered = testQuestions.find((q) => !answers[q.id])
      if (firstUnanswered) {
        cardRefs.current[firstUnanswered.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setNotice(`Please answer all questions — ${testQuestions.length - answeredCount} still to go.`)
      }
      return
    }
    setSubmitting(true); setNotice('')
    try {
      const res = await fetch('/api/onboarding/test/mastery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers }),
      })
      const data = await res.json()
      if (!res.ok) { setMode('error'); return }
      if (data.done) { window.scrollTo({ top: 0 }); setMode('mastery_done') }
      else { setReviewSet(data.remaining || []); window.scrollTo({ top: 0 }); setMode('mastery_review') }
    } catch {
      setMode('error')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- option row ----------
  function OptionRow({ q, opt }: { q: Q; opt: Opt }) {
    const selected = answers[q.id] === opt.key
    return (
      <button
        onClick={() => pick(q.id, opt.key)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%', textAlign: 'left',
          padding: '11px 14px', marginBottom: 8, borderRadius: 9, cursor: 'pointer',
          background: selected ? C.tealSoft : '#fff',
          border: `1.5px solid ${selected ? C.tealBtn : C.border}`,
          color: C.navy, fontSize: 14.5, lineHeight: 1.5,
        }}>
        <span style={{
          flexShrink: 0, width: 22, height: 22, borderRadius: '50%', marginTop: 1,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
          background: selected ? C.tealBtn : '#F0F3F5', color: selected ? '#fff' : C.faint,
        }}>{opt.key}</span>
        <span>{opt.text}</span>
      </button>
    )
  }

  // ---------- quiz view (first attempt or mastery practice) ----------
  function QuizView({ heading, sub, onFinish, finishLabel }: { heading: string; sub: string; onFinish: () => void; finishLabel: string }) {
    return (
      <Shell>
        <div style={{ position: 'sticky', top: 8, zIndex: 5, background: '#fff', paddingBottom: 12, marginBottom: 4, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>{heading}</div>
          <div style={{ fontSize: 13, color: C.faint, margin: '4px 0 10px' }}>{sub}</div>
          <div style={{ height: 8, background: '#EEF2F4', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${testQuestions.length ? (answeredCount / testQuestions.length) * 100 : 0}%`, background: 'linear-gradient(90deg,#0E7C7B,#1A9B87)', transition: 'width .2s' }} />
          </div>
          <div style={{ fontSize: 12, color: C.gray, marginTop: 6, fontWeight: 600 }}>{answeredCount} of {testQuestions.length} answered</div>
        </div>

        {testQuestions.map((q, idx) => (
          <div key={q.id} ref={(el) => { cardRefs.current[q.id] = el }} style={{ padding: '18px 0', borderBottom: `1px solid ${C.line}` }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: C.tealBtn }}>{idx + 1}.</span>
              <span style={{ fontSize: 15.5, fontWeight: 600, color: C.navy, lineHeight: 1.5 }}>{q.prompt}</span>
            </div>
            <div style={{ paddingLeft: 22 }}>
              {q.options.map((opt) => <OptionRow key={opt.key} q={q} opt={opt} />)}
            </div>
          </div>
        ))}

        {notice && <div style={{ marginTop: 16, padding: '11px 15px', background: '#FEF3E2', color: C.amber, borderRadius: 9, fontSize: 13.5, fontWeight: 600 }}>{notice}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onFinish} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Submitting…' : finishLabel}
          </button>
        </div>
      </Shell>
    )
  }

  // ---------- renders by mode ----------
  if (mode === 'intro') {
    return (
      <Shell maxWidth={560}>
        <h2 style={{ fontSize: 20, color: C.navy, margin: '0 0 10px' }}>Welcome, {firstName}! 👋</h2>
        <p style={{ color: C.gray, fontSize: 14.5, lineHeight: 1.7, margin: '0 0 18px' }}>
          This is your Vitalis caregiver competency test. Read each question and choose the single best answer.
        </p>
        <div style={{ background: C.bg, borderRadius: 10, padding: '16px 18px', marginBottom: 22 }}>
          <ul style={{ margin: 0, paddingLeft: 18, color: C.gray, fontSize: 14, lineHeight: 1.9 }}>
            <li><strong>{result.total} questions</strong>, multiple choice.</li>
            <li>No time limit — take it at your own pace.</li>
            <li>You need <strong>90%</strong> to pass. If you fall short, we will review the ones you missed and let you practice them until you have them all.</li>
            <li>Answers can be changed until you submit.</li>
          </ul>
        </div>
        <button onClick={startTest} style={btnPrimary}>Start the test</button>
      </Shell>
    )
  }

  if (mode === 'test') {
    return (
      <>
        <QuizView
          heading="Competency Test"
          sub="Choose the single best answer for each question."
          onFinish={tryFinish}
          finishLabel="Submit test"
        />
        {showConfirm && (
          <div onClick={() => setShowConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(16,30,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 60 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, maxWidth: 420, padding: '24px 26px', boxShadow: '0 20px 50px rgba(16,30,48,0.25)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, color: C.navy }}>Submit your test?</h3>
              <p style={{ margin: '0 0 20px', color: C.gray, fontSize: 14, lineHeight: 1.6 }}>
                You have answered all {testQuestions.length} questions. Once you submit, your answers cannot be changed.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setShowConfirm(false)} style={{ padding: '10px 18px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 9, color: C.gray, fontWeight: 600, cursor: 'pointer' }}>Keep reviewing</button>
                <button onClick={submitFirst} style={btnPrimary}>Submit</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (mode === 'mastery_quiz') {
    return (
      <QuizView
        heading="Practice the questions you missed"
        sub="Answer these again. Get them all right to finish."
        onFinish={submitMastery}
        finishLabel="Check my answers"
      />
    )
  }

  if (mode === 'mastery_review') {
    const pct = result.total ? Math.round((result.score / result.total) * 100) : 0
    return (
      <Shell>
        <h2 style={{ fontSize: 20, color: C.navy, margin: '0 0 6px' }}>Let’s review what to work on</h2>
        <p style={{ color: C.gray, fontSize: 14.5, lineHeight: 1.7, margin: '0 0 4px' }}>
          You scored <strong>{result.score} / {result.total}</strong> ({pct}%) on your first attempt — that score stays on your record.
          Below are the <strong>{reviewSet.length}</strong> question{reviewSet.length === 1 ? '' : 's'} to go over. Read the correct answer and why, then practice {reviewSet.length === 1 ? 'it' : 'them'}.
        </p>

        <div style={{ marginTop: 18 }}>
          {reviewSet.map((q, idx) => (
            <div key={q.id} style={{ padding: '18px 0', borderTop: `1px solid ${C.line}` }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: C.tealBtn }}>{idx + 1}.</span>
                <span style={{ fontSize: 15.5, fontWeight: 600, color: C.navy, lineHeight: 1.5 }}>{q.prompt}</span>
              </div>
              <div style={{ paddingLeft: 22 }}>
                {q.options.map((opt) => {
                  const isCorrect = opt.key === q.correct_key
                  const isWrongPick = q.selected === opt.key && !isCorrect
                  const bg = isCorrect ? C.greenBg : isWrongPick ? C.redBg : '#fff'
                  const bd = isCorrect ? C.greenBorder : isWrongPick ? C.redBorder : C.border
                  const fg = isCorrect ? C.green : isWrongPick ? C.red : C.navy
                  return (
                    <div key={opt.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '10px 14px', marginBottom: 8, borderRadius: 9, background: bg, border: `1.5px solid ${bd}`, color: fg, fontSize: 14.5, lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', marginTop: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: isCorrect ? C.green : isWrongPick ? C.red : '#F0F3F5', color: isCorrect || isWrongPick ? '#fff' : C.faint }}>{opt.key}</span>
                      <span>{opt.text}</span>
                      {isCorrect && <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 13 }}>✓ Correct</span>}
                      {isWrongPick && <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 13 }}>✗ Your answer</span>}
                    </div>
                  )
                })}
                {q.rationale && (
                  <div style={{ marginTop: 6, padding: '10px 14px', background: C.bg, borderLeft: `3px solid ${C.tealBtn}`, borderRadius: '0 8px 8px 0', fontSize: 13.5, color: C.gray, lineHeight: 1.6 }}>
                    <strong style={{ color: C.teal }}>Why:</strong> {q.rationale}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={startMasteryQuiz} style={btnPrimary}>
            Practice {reviewSet.length === 1 ? 'this question' : `these ${reviewSet.length} questions`}
          </button>
        </div>
      </Shell>
    )
  }

  if (mode === 'passed' || mode === 'mastery_done' || (mode === 'completed' && (firstPassed || result.score))) {
    const pct = result.total ? Math.round((result.score / result.total) * 100) : 0
    const masteredPath = mode === 'mastery_done' || (mode === 'completed' && !firstPassed)
    return (
      <Shell maxWidth={520}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: C.greenBg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 30 }}>🎉</div>
          <h2 style={{ fontSize: 22, color: C.navy, margin: '0 0 10px' }}>
            {mode === 'completed' ? `You’ve completed the test, ${firstName}.` : `Well done, ${firstName}!`}
          </h2>
          <p style={{ color: C.gray, fontSize: 15, lineHeight: 1.7, margin: '0 0 6px' }}>
            {masteredPath
              ? <>You worked through every question and mastered the material. Your first-attempt score was <strong>{result.score} / {result.total}</strong> ({pct}%).</>
              : <>You passed the Vitalis caregiver competency test with <strong>{result.score} / {result.total}</strong> ({pct}%).</>}
          </p>
          <div style={{ marginTop: 22 }}>
            <a href={`/onboarding/application?token=${token}`} style={{ display: 'inline-block', padding: '13px 34px', background: 'linear-gradient(135deg,#0E7C7B,#1A9B87)', color: '#fff', textDecoration: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700 }}>
              Continue to your application
            </a>
          </div>
          <p style={{ color: C.gray, fontSize: 13.5, lineHeight: 1.7, margin: '14px 0 0' }}>
            The next step is a short application. You can also{' '}
            <a href={`/onboarding/certificate?token=${token}`} style={{ color: C.green, fontWeight: 700, textDecoration: 'underline' }}>view your certificate</a>{' '}
            first — your link stays active either way.
          </p>
        </div>
      </Shell>
    )
  }

  if (mode === 'completed') {
    // Reached only if an attempt exists but produced no usable score — be gracious.
    return (
      <Shell maxWidth={520}>
        <h2 style={{ fontSize: 20, color: C.navy, margin: '0 0 10px' }}>You’ve completed this test</h2>
        <p style={{ color: C.gray, fontSize: 14.5, lineHeight: 1.7, margin: 0 }}>
          Thanks, {firstName}. The Vitalis team will follow up with your next steps.
        </p>
      </Shell>
    )
  }

  // error
  return (
    <Shell maxWidth={520}>
      <h2 style={{ fontSize: 19, color: C.navy, margin: '0 0 10px' }}>Something went wrong</h2>
      <p style={{ color: C.gray, fontSize: 14.5, lineHeight: 1.7, margin: '0 0 18px' }}>
        We could not save your answers just now. Please check your connection and try again. If it keeps happening,
        contact the Vitalis office.
      </p>
      <button onClick={() => window.location.reload()} style={btnPrimary}>Reload</button>
    </Shell>
  )
}
