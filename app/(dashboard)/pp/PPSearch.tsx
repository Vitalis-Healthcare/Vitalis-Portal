'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Policy {
  doc_id: string; title: string; domain: string; tier: number
  version: string; status: string; applicable_roles?: string[]; keywords?: string[]
}

interface SearchResult {
  doc_id: string; title: string; domain: string; version: string
  match_type: 'title' | 'keyword' | 'content'
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

function highlight(text: string, q: string): React.ReactNode {
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1 || !q) return text
  return (<>{text.slice(0, idx)}<mark style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 2, padding: '0 1px' }}>{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>)
}

export default function PPSearch({ policies }: { policies: Policy[] }) {
  const [query, setQuery]       = useState('')
  const [open, setOpen]         = useState(false)
  const [focused, setFocused]   = useState(false)
  const [results, setResults]   = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef    = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setQuery(''); setResults([]) } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/pp/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch { setResults([]) }
    setSearching(false)
  }, [])

  const handleChange = (val: string) => {
    setQuery(val)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const q = query.trim().toLowerCase()

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 12, fontSize: 14, opacity: 0.55, pointerEvents: 'none' }}>
          {searching ? '⏳' : '🔍'}
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { setOpen(true); setFocused(true) }}
          onBlur={() => setFocused(false)}
          placeholder="Search policies by title, ID, keyword, or content…"
          style={{
            width: '100%', padding: '10px 36px', borderRadius: 10,
            border: `1.5px solid ${focused ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)'}`,
            background: focused ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.14)',
            color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
            boxSizing: 'border-box', transition: 'border-color 0.15s, background 0.15s',
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus() }}
            style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
        )}
      </div>

      {open && q.length >= 2 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #E2E8F0', zIndex: 100, overflow: 'hidden', maxHeight: 440, overflowY: 'auto' }}>
          {searching && results.length === 0 ? (
            <div style={{ padding: '18px 16px', textAlign: 'center', color: '#8FA0B0', fontSize: 13 }}>Searching policy content…</div>
          ) : results.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#8FA0B0', fontSize: 13 }}>
              No policies found for <strong>"{query}"</strong>
              <div style={{ fontSize: 11, marginTop: 6, color: '#CBD5E0' }}>Searched titles, keywords, and full policy body</div>
            </div>
          ) : (
            <>
              <div style={{ padding: '8px 14px 6px', fontSize: 10, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between' }}>
                <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#CBD5E0' }}>titles · keywords · policy content</span>
              </div>
              {results.map((p, i) => {
                const dom = DOMAINS[p.domain]
                const matchLabel = p.match_type === 'content' ? 'found in body' : p.match_type === 'keyword' ? 'keyword' : ''
                return (
                  <Link key={p.doc_id} href={`/pp/${p.doc_id}`} style={{ textDecoration: 'none' }}
                    onClick={() => { setOpen(false); setQuery(''); setResults([]) }}>
                    <div
                      style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < results.length - 1 ? '1px solid #F8FAFB' : 'none', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: dom?.bg || '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                        {dom?.icon || '📄'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E44', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {highlight(p.title, q)}
                        </div>
                        <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2, display: 'flex', gap: 5, alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: dom?.text || '#888' }}>{p.doc_id}</span>
                          <span>·</span><span>{dom?.name || p.domain}</span>
                          {matchLabel && (<><span>·</span><span style={{ color: '#0B6B5C', fontWeight: 600 }}>{matchLabel}</span></>)}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#CBD5E0', flexShrink: 0 }}>→</span>
                    </div>
                  </Link>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
