'use client'
import { useState, useRef, useEffect } from 'react'
import { renderMarkdown } from '@/lib/renderMarkdown'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: { docId: string; title: string }[]
  modules?: { moduleId: string; title: string }[]
  actions?: { url: string; label: string }[]
  timestamp: string
}

interface VitaSnapshot {
  expiringCredCount: number
  expiringCredNames: string[]
  incompleteModuleCount: number
  incompleteModuleTitles: string[]
  lastAppraisalDate: string | null
  totalEnrolled: number
  totalCompleted: number
}

interface Props {
  userId: string
  userRole: string
  userName: string
  ppRole: string
  snapshot: VitaSnapshot
}

const VITA_GREEN = '#0B6B5C'
const VITA_LIGHT = '#1A9B87'

export default function VitaChat({ userId, userRole, userName, ppRole, snapshot }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Build personalised suggested questions from the snapshot
  const suggestions: { emoji: string; text: string; category: string }[] = []

  if (snapshot.expiringCredCount > 0) {
    suggestions.push({
      emoji: '⚠️',
      text: `My ${snapshot.expiringCredNames[0] || 'credential'} is ${snapshot.expiringCredCount > 1 ? 'one of ' + snapshot.expiringCredCount + ' credentials' : ''} expiring — what do I need to do?`,
      category: 'urgent'
    })
  }
  if (snapshot.incompleteModuleCount > 0) {
    suggestions.push({
      emoji: '📚',
      text: `I have ${snapshot.incompleteModuleCount} incomplete training module${snapshot.incompleteModuleCount > 1 ? 's' : ''} — where should I start?`,
      category: 'training'
    })
  }
  if (snapshot.lastAppraisalDate) {
    suggestions.push({
      emoji: '📊',
      text: `Based on my last appraisal, what areas should I focus on improving?`,
      category: 'growth'
    })
  }

  // Always include a few universal ones, padded to 5 total
  const universal = [
    { emoji: '🩺', text: 'What is the correct procedure if a client refuses their medication?', category: 'clinical' },
    { emoji: '📋', text: 'What should I document after every visit?', category: 'documentation' },
    { emoji: '🚨', text: 'What do I do if I suspect a client is being abused or neglected?', category: 'safety' },
    { emoji: '🦠', text: 'What are the infection control requirements for home visits?', category: 'safety' },
    { emoji: '📱', text: 'How do I correctly use AxisCare to clock in and out?', category: 'evv' },
  ]
  for (const u of universal) {
    if (suggestions.length >= 5) break
    suggestions.push(u)
  }

  const send = async (text?: string) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: q, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/vita/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
          userContext: { ppRole, userName, userRole },
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
          citations: data.citations || [],
          modules: data.modules || [],
          actions: data.actions || [],
          timestamp: new Date().toISOString()
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered a problem. Please try again.',
          timestamp: new Date().toISOString()
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Network error. Please check your connection and try again.',
        timestamp: new Date().toISOString()
      }])
    }
    setLoading(false)
  }

  const categoryColor = (cat: string) => {
    if (cat === 'urgent') return { bg: '#FDE8E9', border: '#E63946', text: '#C0392B' }
    if (cat === 'training') return { bg: '#EBF4FF', border: '#457B9D', text: '#1E3A5F' }
    if (cat === 'growth') return { bg: '#E6F6F4', border: '#0B6B5C', text: '#0B6B5C' }
    return { bg: '#F8FAFB', border: '#E2E8F0', text: '#1A2E44' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(11,107,92,0.10)', border: '1px solid #E2E8F0', height: 'clamp(560px, 75vh, 720px)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${VITA_GREEN}, ${VITA_LIGHT})`, padding: '18px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            ✨
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Vita</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Your Vitalis AI Companion</div>
          </div>
          {/* Live dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 10px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6EE7B7', boxShadow: '0 0 6px #6EE7B7' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Live</span>
          </div>
        </div>

        {/* Capability pills */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {['🏥 Policies', '📚 Training', '🎖️ Credentials', '📊 Appraisals', '⚖️ COMAR & CMS'].map(cap => (
            <span key={cap} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 20, letterSpacing: '0.3px' }}>
              {cap}
            </span>
          ))}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Welcome state */}
        {messages.length === 0 && (
          <>
            <div style={{ textAlign: 'center', padding: '12px 8px 4px' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>👋</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', margin: '0 0 4px' }}>
                Hi {userName.split(' ')[0]}!
              </p>
              <p style={{ fontSize: 12, color: '#8FA0B0', margin: 0, lineHeight: 1.6 }}>
                I know your training, credentials, appraisals, and all Vitalis policies. Ask me anything.
              </p>
            </div>

            {/* Urgent alerts banner if anything needs attention */}
            {(snapshot.expiringCredCount > 0) && (
              <div style={{ background: '#FDE8E9', borderRadius: 10, padding: '10px 14px', border: '1px solid #F4BFBF', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#C0392B', marginBottom: 2 }}>Action needed</div>
                  <div style={{ fontSize: 12, color: '#7B1E1E' }}>
                    You have {snapshot.expiringCredCount} credential{snapshot.expiringCredCount > 1 ? 's' : ''} expiring or expired{snapshot.expiringCredNames.length > 0 ? ` (${snapshot.expiringCredNames.join(', ')})` : ''}.
                  </div>
                </div>
              </div>
            )}

            {/* Stats bar */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 80, background: '#F8FAFB', borderRadius: 10, padding: '10px 12px', border: '1px solid #EFF2F5', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: VITA_GREEN }}>{snapshot.totalCompleted}</div>
                <div style={{ fontSize: 10, color: '#8FA0B0', fontWeight: 600, marginTop: 1 }}>Modules done</div>
              </div>
              <div style={{ flex: 1, minWidth: 80, background: '#F8FAFB', borderRadius: 10, padding: '10px 12px', border: '1px solid #EFF2F5', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: snapshot.incompleteModuleCount > 0 ? '#F4A261' : VITA_GREEN }}>{snapshot.incompleteModuleCount}</div>
                <div style={{ fontSize: 10, color: '#8FA0B0', fontWeight: 600, marginTop: 1 }}>To complete</div>
              </div>
              <div style={{ flex: 1, minWidth: 80, background: '#F8FAFB', borderRadius: 10, padding: '10px 12px', border: '1px solid #EFF2F5', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: snapshot.expiringCredCount > 0 ? '#E63946' : VITA_GREEN }}>{snapshot.expiringCredCount}</div>
                <div style={{ fontSize: 10, color: '#8FA0B0', fontWeight: 600, marginTop: 1 }}>Creds expiring</div>
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                Suggested for you
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestions.map((s, i) => {
                  const col = categoryColor(s.category)
                  return (
                    <button
                      key={i}
                      onClick={() => send(s.text)}
                      style={{
                        padding: '10px 12px',
                        background: col.bg,
                        border: `1px solid ${col.border}`,
                        borderRadius: 9, fontSize: 12, color: col.text,
                        cursor: 'pointer', textAlign: 'left',
                        fontWeight: 500, lineHeight: 1.4,
                        display: 'flex', alignItems: 'flex-start', gap: 8
                      }}
                    >
                      <span style={{ flexShrink: 0, fontSize: 14 }}>{s.emoji}</span>
                      <span>{s.text}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Message thread */}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
            <div style={{
              maxWidth: '90%',
              padding: '11px 14px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
              background: m.role === 'user'
                ? `linear-gradient(135deg, ${VITA_GREEN}, ${VITA_LIGHT})`
                : '#F8FAFB',
              color: m.role === 'user' ? '#fff' : '#1A2E44',
              fontSize: 13, lineHeight: 1.65,
              border: m.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
              boxShadow: m.role === 'user' ? '0 2px 8px rgba(11,107,92,0.25)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ color: m.role === 'user' ? '#fff' : '#1A2E44' }}>{m.role === 'user' ? m.content : renderMarkdown(m.content, '#0B6B5C')}</div>

              {/* Policy citations */}
              {m.citations && m.citations.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>
                    📋 Policies referenced
                  </div>
                  {m.citations.map((c, j) => (
                    <Link key={j} href={`/pp/${c.docId}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: VITA_GREEN, fontWeight: 600, textDecoration: 'none', marginBottom: 3 }}>
                      <span>→</span> {c.docId}: {c.title}
                    </Link>
                  ))}
                </div>
              )}

              {/* Module recommendations */}
              {m.modules && m.modules.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>
                    📚 Training modules
                  </div>
                  {m.modules.map((mod, j) => (
                    <Link key={j} href="/lms" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#457B9D', fontWeight: 600, textDecoration: 'none', marginBottom: 3 }}>
                      <span>→</span> {mod.moduleId}: {mod.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Action chips */}
            {m.role === 'assistant' && m.actions && m.actions.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: '90%' }}>
                {m.actions.map((a, j) => (
                  <Link key={j} href={a.url} style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${VITA_GREEN}`,
                      background: '#fff', color: VITA_GREEN, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap'
                    }}>
                      {a.label} →
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F8FAFB', borderRadius: '4px 16px 16px 16px', border: '1px solid #E2E8F0', width: 'fit-content' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: VITA_GREEN, animation: `vitaBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
            <span style={{ fontSize: 11, color: '#8FA0B0', marginLeft: 4 }}>Vita is thinking…</span>
            <style>{`@keyframes vitaBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #EFF2F5', background: '#FAFBFC', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={`Ask Vita anything — training, credentials, policies, regulations…`}
            rows={2}
            style={{
              flex: 1, padding: '10px 13px',
              border: '1.5px solid #E2E8F0', borderRadius: 12,
              fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit',
              background: '#fff', color: '#1A2E44', lineHeight: 1.5,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = VITA_GREEN }}
            onBlur={e => { e.target.style.borderColor = '#E2E8F0' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: 42, height: 42, borderRadius: 12, border: 'none', flexShrink: 0,
              background: input.trim() && !loading ? `linear-gradient(135deg, ${VITA_GREEN}, ${VITA_LIGHT})` : '#E2E8F0',
              color: '#fff', fontSize: 18, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: input.trim() && !loading ? '0 2px 8px rgba(11,107,92,0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#CBD5E0', marginTop: 6, textAlign: 'center' }}>
          Vita · Powered by Vitalis knowledge + Anthropic AI · Maryland COMAR & CMS aware
        </div>
      </div>
    </div>
  )
}
