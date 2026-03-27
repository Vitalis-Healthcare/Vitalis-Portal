'use client'
import { useState } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }

export default function PolicyAISidebar({ docId, docTitle, userRole }: {
  docId: string; docTitle: string; userRole: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const suggestions = [
    `Summarise the key requirements of this policy`,
    `What does this policy mean for a ${userRole}?`,
    `What are the consequences of non-compliance?`,
  ]

  const send = async (text?: string) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res = await fetch('/api/pp/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Regarding policy ${docId} (${docTitle}): ${q}`,
          history: messages,
          userRole,
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || 'No response' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div className="pp-ai-sidebar" style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

      {/* Header bar — always visible */}
      <div style={{ background: 'linear-gradient(135deg, #0B6B5C, #1A9B87)', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px' }}>
        <span style={{ fontSize: 16 }}>🤖</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Ask About This Policy</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>AI assistant scoped to {docId}</div>
        </div>

        {open ? (
          /* CLOSE button — bold circle X, always in the header when panel is open */
          <button
            onClick={() => setOpen(false)}
            title="Close AI assistant"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              border: '2px solid rgba(255,255,255,0.6)',
              color: '#fff', fontSize: 16, fontWeight: 900,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, lineHeight: 1
            }}
          >
            ✕
          </button>
        ) : (
          /* OPEN button */
          <button
            onClick={() => setOpen(true)}
            style={{
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.5)',
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0
            }}
          >
            Open ▼
          </button>
        )}
      </div>

      {/* Expandable chat panel */}
      {open && (
        <div>
          <div className="pp-ai-messages" style={{ padding: '12px 14px', maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, color: '#8FA0B0', fontWeight: 600, marginBottom: 2 }}>Quick questions:</div>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => send(s)} style={{ padding: '8px 10px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 11, color: '#1A2E44', cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '90%', padding: '8px 11px', borderRadius: 9, fontSize: 12, lineHeight: 1.5,
                  background: m.role === 'user' ? 'linear-gradient(135deg,#0B6B5C,#1A9B87)' : '#F8FAFB',
                  color: m.role === 'user' ? '#fff' : '#1A2E44',
                  border: m.role === 'assistant' ? '1px solid #E2E8F0' : 'none'
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 11px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 9, width: 'fit-content' }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0B6B5C', animation: `ppb 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                <style>{`@keyframes ppb{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
              </div>
            )}
          </div>
          <div className="pp-ai-input" style={{ padding: '10px 12px', borderTop: '1px solid #EFF2F5', background: '#FAFBFC' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
                placeholder="Ask about this policy…"
                style={{ flex: 1, padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: input.trim() && !loading ? '#0B6B5C' : '#E2E8F0', color: '#fff', cursor: 'pointer', fontSize: 14 }}>↑</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
