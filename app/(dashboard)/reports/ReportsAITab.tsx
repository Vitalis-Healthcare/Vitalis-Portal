'use client'
// app/(dashboard)/reports/ReportsAITab.tsx
// AI Compliance Analyst — chat UI for the Reports module.
// Calls /api/reports/ai-chat with the current message + history.
// Admin / supervisor only (enforced at API level).

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, RefreshCw, Sparkles, User, Bot } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ─── Pre-seeded prompts ───────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { icon: '⚠️', label: 'Risk in 30 days',      prompt: 'Which caregivers are at risk in the next 30 days? Consider expiring credentials, overdue training, and outstanding references.' },
  { icon: '🏆', label: 'Top performers',         prompt: 'Who are my top performing caregivers overall, considering credentials, training, appraisal scores, and references?' },
  { icon: '📋', label: 'BCHD Q1 summary',        prompt: 'Generate a formal BCHD compliance summary for this quarter with key metrics across all compliance dimensions.' },
  { icon: '📄', label: 'Credential gaps',         prompt: 'Which credentials need the most attention across the team? Give me a breakdown by credential type.' },
  { icon: '⭐', label: 'Appraisal insights',      prompt: 'Summarise the team appraisal performance. Who has the highest and lowest scores, and which competency areas need attention?' },
  { icon: '📬', label: 'Reference pipeline',      prompt: 'What is the current state of our references pipeline? Who has the most outstanding reference requests?' },
]

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  primary: '#1A2E44', teal: '#0E7C7B', tealLight: '#E6F4F4', tealBg: '#F0FAF9',
  green: '#2A9D8F', purple: '#9B59B6', purpleLight: '#F3EBF9', purpleMid: '#7D3C98',
  grey: '#8FA0B0', greyLight: '#F8FAFB', border: '#D1D9E0', white: '#ffffff',
  text: '#1A2E44', muted: '#8FA0B0',
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
// Handles bold, bullet lists, numbered lists, and headings from Claude's responses.

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank line
    if (line.trim() === '') { nodes.push(<br key={i} />); i++; continue }

    // Heading ## or ###
    if (line.startsWith('### ')) {
      nodes.push(<div key={i} style={{ fontSize: 13, fontWeight: 800, color: C.primary, marginTop: 14, marginBottom: 4 }}>{line.slice(4)}</div>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      nodes.push(<div key={i} style={{ fontSize: 14, fontWeight: 800, color: C.primary, marginTop: 16, marginBottom: 6 }}>{line.slice(3)}</div>)
      i++; continue
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/)
    if (numMatch) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      nodes.push(
        <ol key={i} style={{ margin: '8px 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((item, j) => <li key={j} style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{renderInline(item)}</li>)}
        </ol>
      )
      continue
    }

    // Bullet list
    if (line.match(/^[-*]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i++
      }
      nodes.push(
        <ul key={i} style={{ margin: '8px 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((item, j) => <li key={j} style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{renderInline(item)}</li>)}
        </ul>
      )
      continue
    }

    // Normal paragraph
    nodes.push(<p key={i} style={{ margin: '4px 0', fontSize: 13, lineHeight: 1.7, color: C.text }}>{renderInline(line)}</p>)
    i++
  }

  return nodes
}

function renderInline(text: string): React.ReactNode {
  // Bold **text** or __text__
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 700, color: C.primary }}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('__') && part.endsWith('__')) {
          return <strong key={i} style={{ fontWeight: 700, color: C.primary }}>{part.slice(2, -2)}</strong>
        }
        return part
      })}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportsAITab() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setError(null)
    const userMsg: Message = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/reports/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-8),
        }),
      })
      const data = await res.json()
      const answer = data.answer || 'No response received. Please try again.'
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }])
    } catch {
      setError('Connection error. Please check your network and try again.')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [messages, loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = () => { setMessages([]); setError(null); inputRef.current?.focus() }

  const hasMessages = messages.length > 0

  return (
    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Header banner ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.purpleMid} 100%)`,
        borderRadius: '12px 12px 0 0', padding: '18px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>AI Compliance Analyst</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>
              Powered by Claude · Live workforce data · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
        {hasMessages && (
          <button onClick={clearChat} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={12} /> New chat
          </button>
        )}
      </div>

      {/* ── Chat body ── */}
      <div style={{
        border: `1px solid ${C.border}`, borderTop: 'none', background: C.white,
        minHeight: 420, maxHeight: 560, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', padding: hasMessages ? '16px' : '0',
      }}>

        {/* Empty state with suggested prompts */}
        {!hasMessages && (
          <div style={{ padding: '24px 22px' }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, textAlign: 'center' }}>
              Ask me anything about your team's compliance, or try a suggested prompt:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.prompt)}
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.greyLight,
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.tealBg; (e.currentTarget as HTMLButtonElement).style.borderColor = C.teal + '66' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.greyLight; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border }}
                >
                  <div style={{ fontSize: 16 }}>{p.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{p.prompt.slice(0, 70)}…</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>

                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? C.teal : `linear-gradient(135deg, ${C.primary}, ${C.purpleMid})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {msg.role === 'user'
                    ? <User size={14} color="#fff" />
                    : <Sparkles size={14} color="#fff" />
                  }
                </div>

                {/* Bubble */}
                <div style={{
                  maxWidth: '78%', padding: '12px 14px', borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  background: msg.role === 'user' ? C.teal : C.greyLight,
                  border: msg.role === 'assistant' ? `1px solid ${C.border}` : 'none',
                }}>
                  {msg.role === 'user' ? (
                    <p style={{ margin: 0, fontSize: 13, color: '#fff', lineHeight: 1.6 }}>{msg.content}</p>
                  ) : (
                    <div style={{ color: C.text }}>{renderMarkdown(msg.content)}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary}, ${C.purpleMid})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={14} color="#fff" />
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '4px 12px 12px 12px', background: C.greyLight, border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: C.purple,
                        animation: 'bounce 1.2s infinite',
                        animationDelay: `${i * 0.2}s`,
                        opacity: 0.7,
                      }} />
                    ))}
                  </div>
                  <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5} 40%{transform:scale(1.2);opacity:1} }`}</style>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Error bar ── */}
      {error && (
        <div style={{ background: '#FDECEA', border: `1px solid #E6394644`, borderTop: 'none', padding: '10px 16px', fontSize: 13, color: '#E63946' }}>
          ✕ {error}
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={{
        border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 12px 12px',
        background: C.white, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Ask about your team's compliance… (Enter to send, Shift+Enter for new line)"
          rows={2}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10, resize: 'none',
            border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
            background: C.greyLight, outline: 'none', fontFamily: 'inherit',
            lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: 10, border: 'none', flexShrink: 0,
            background: loading || !input.trim() ? C.border : C.teal,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading
            ? <RefreshCw size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
            : <Send size={16} color="#fff" />
          }
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </button>
      </div>

      {/* ── Suggested follow-ups (shown after first response) ── */}
      {messages.length >= 2 && !loading && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, alignSelf: 'center' }}>Try:</span>
          {SUGGESTED_PROMPTS.filter((p) => !messages.some((m) => m.content.startsWith(p.prompt.slice(0, 40)))).slice(0, 3).map((p) => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.prompt)}
              style={{
                padding: '5px 12px', borderRadius: 20, border: `1px solid ${C.border}`,
                background: C.greyLight, fontSize: 12, fontWeight: 600, color: C.text,
                cursor: 'pointer',
              }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: 11, color: C.muted, marginTop: 10, textAlign: 'center' }}>
        AI Analyst reads live compliance data at time of query. Responses are for operational guidance only — always verify critical decisions against source records.
      </p>
    </div>
  )
}
