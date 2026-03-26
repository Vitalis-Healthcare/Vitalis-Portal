'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: { docId: string; title: string }[]
  timestamp: string
}

const SUGGESTED = [
  'What does our policy say about EVV documentation?',
  'Which policies apply to CNAs?',
  'What is our procedure when a client refuses service?',
  'Summarise our abuse reporting obligations',
  'Which policies are due for review soon?',
]

export default function PPAIChat({ userId, userRole, userName }: {
  userId: string
  userRole: string
  userName: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggested, setShowSuggested] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setShowSuggested(false)

    const userMsg: Message = { role: 'user', content: q, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/pp/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          userRole,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
          citations: data.citations || [],
          timestamp: new Date().toISOString()
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
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

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(11,107,92,0.12)', border: '1px solid #E2E8F0',
      display: 'flex', flexDirection: 'column', height: 580
    }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0B6B5C, #1A9B87)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Policy Assistant</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Ask anything about Vitalis P&P</div>
          </div>
          <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#6EE7B7', boxShadow: '0 0 6px #6EE7B7' }} />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Welcome */}
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A2E44', margin: '0 0 4px' }}>Hello, {userName.split(' ')[0]}</p>
            <p style={{ fontSize: 12, color: '#8FA0B0', margin: 0, lineHeight: 1.6 }}>
              I know all of Vitalis's policies and procedures. Ask me anything — I'll find the answer and point you to the exact document.
            </p>
          </div>
        )}

        {/* Suggested questions */}
        {showSuggested && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>Try asking:</div>
            {SUGGESTED.map((s, i) => (
              <button key={i} onClick={() => send(s)} style={{
                padding: '9px 12px', background: '#F8FAFB', border: '1px solid #E2E8F0',
                borderRadius: 8, fontSize: 12, color: '#1A2E44', cursor: 'pointer',
                textAlign: 'left', fontWeight: 500, lineHeight: 1.4
              }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Message thread */}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '88%',
              padding: '10px 14px',
              borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: m.role === 'user' ? 'linear-gradient(135deg, #0B6B5C, #1A9B87)' : '#F8FAFB',
              color: m.role === 'user' ? '#fff' : '#1A2E44',
              fontSize: 13, lineHeight: 1.6,
              border: m.role === 'assistant' ? '1px solid #E2E8F0' : 'none'
            }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              {m.citations && m.citations.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Sources</div>
                  {m.citations.map((c, j) => (
                    <a key={j} href={`/pp/${c.docId}`} style={{ display: 'block', fontSize: 11, color: '#0B6B5C', fontWeight: 600, textDecoration: 'none', marginBottom: 2 }}>
                      → {c.docId}: {c.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#F8FAFB', borderRadius: 12, border: '1px solid #E2E8F0', width: 'fit-content' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#0B6B5C', animation: `ppBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
            ))}
            <style>{`@keyframes ppBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #EFF2F5', background: '#FAFBFC' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask about any Vitalis policy…"
            rows={2}
            style={{
              flex: 1, padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 10,
              fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit',
              background: '#fff', color: '#1A2E44', lineHeight: 1.5
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: 38, height: 38, borderRadius: 10, border: 'none', flexShrink: 0,
              background: input.trim() && !loading ? '#0B6B5C' : '#E2E8F0',
              color: '#fff', fontSize: 16, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#CBD5E0', marginTop: 6, textAlign: 'center' }}>
          AI-powered · answers based on Vitalis policy documents
        </div>
      </div>
    </div>
  )
}
