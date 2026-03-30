'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Policy {
  doc_id: string
  title: string
  domain: string
  tier: string
  version: string
  status: string
  applicable_roles?: string[]
}

const DOMAINS: Record<string, { name: string; bg: string; text: string; icon: string }> = {
  D1: { name: 'Governance & Compliance', bg: '#ede9fe', text: '#4c1d95', icon: '⚖️' },
  D2: { name: 'Human Resources',         bg: '#d1fae5', text: '#064e3b', icon: '👥' },
  D3: { name: 'Client Services',         bg: '#dbeafe', text: '#1e3a5f', icon: '🏠' },
  D4: { name: 'Clinical Operations',     bg: '#ffedd5', text: '#7c2d12', icon: '🩺' },
  D5: { name: 'Business Operations',     bg: '#fef3c7', text: '#78350f', icon: '📊' },
  D6: { name: 'Client Rights & Safety',  bg: '#fce7f3', text: '#831843', icon: '🛡️' },
  D7: { name: 'Emergency & Continuity',  bg: '#f1f5f9', text: '#334155', icon: '🚨' },
}

export default function PPSearch({ policies }: { policies: Policy[] }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const q = query.trim().toLowerCase()
  const results = q.length < 2 ? [] : policies.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.doc_id.toLowerCase().includes(q) ||
    (DOMAINS[p.domain]?.name || '').toLowerCase().includes(q) ||
    (p.applicable_roles || []).some(r => r.toLowerCase().includes(q))
  ).slice(0, 12)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
      {/* Search input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 12, fontSize: 15, opacity: 0.5, pointerEvents: 'none' }}>🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); setFocused(true) }}
          onBlur={() => setFocused(false)}
          placeholder="Search policies by title, ID, or domain…"
          style={{
            width: '100%', padding: '9px 36px 9px 36px',
            borderRadius: 10,
            border: `1.5px solid ${focused ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'}`,
            background: focused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
            boxSizing: 'border-box', backdropFilter: 'blur(4px)',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }}
            style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}
          >×</button>
        )}
      </div>

      {/* Dropdown results */}
      {open && q.length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid #E2E8F0', zIndex: 100, overflow: 'hidden', maxHeight: 420, overflowY: 'auto',
        }}>
          {results.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#8FA0B0', fontSize: 13 }}>
              No policies found for <strong>"{query}"</strong>
            </div>
          ) : (
            <>
              <div style={{ padding: '8px 14px 6px', fontSize: 10, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #F0F0F0' }}>
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((p, i) => {
                const dom = DOMAINS[p.domain]
                return (
                  <Link key={p.doc_id} href={`/pp/${p.doc_id}`} style={{ textDecoration: 'none' }}
                    onClick={() => { setOpen(false); setQuery('') }}>
                    <div style={{
                      padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12,
                      borderBottom: i < results.length - 1 ? '1px solid #F8FAFB' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: dom?.bg || '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                        {dom?.icon || '📄'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E44', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {highlight(p.title, q)}
                        </div>
                        <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>
                          <span style={{ fontWeight: 700, color: dom?.text || '#666' }}>{p.doc_id}</span>
                          {' · '}{dom?.name || p.domain}
                          {' · '}v{p.version}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color: '#8FA0B0', flexShrink: 0 }}>→</span>
                    </div>
                  </Link>
                )
              })}
              {results.length === 12 && (
                <div style={{ padding: '8px 14px', fontSize: 11, color: '#8FA0B0', textAlign: 'center', borderTop: '1px solid #F0F0F0' }}>
                  Showing top 12 — refine your search for more specific results
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Highlight matching text
function highlight(text: string, q: string): React.ReactNode {
  const idx = text.toLowerCase().indexOf(q)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}
