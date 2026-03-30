'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { FileText, Globe, RefreshCw, Printer, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface Props { userName: string }

interface Metrics {
  total_visits: number; f_rate: number; total_campaigns: number
  avg_openers: number; avg_open_rate: number | null
  total_referrals: number; hot_facilities: number; cold_facilities: number
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let tableBuffer: string[] = []

  const flushTable = (key: string) => {
    if (tableBuffer.length < 2) { tableBuffer = []; return }
    const headers = tableBuffer[0].split('|').filter(Boolean).map(h => h.trim())
    const rows = tableBuffer.slice(2).map(r => r.split('|').filter(Boolean).map(c => c.trim()))
    elements.push(
      <div key={key} style={{ overflowX: 'auto', margin: '16px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#0B6B5C', color: '#fff' }}>
              {headers.map((h, j) => (
                <th key={j} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: '8px 12px', color: '#333' }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableBuffer = []
  }

  while (i < lines.length) {
    const line = lines[i]

    // Table row
    if (line.startsWith('|')) {
      tableBuffer.push(line)
      i++
      continue
    } else if (tableBuffer.length > 0) {
      flushTable(`table-${i}`)
    }

    // H1
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} style={{ fontSize: 26, fontWeight: 800, color: '#0B6B5C', margin: '0 0 4px', lineHeight: 1.2 }}>
          {line.slice(2)}
        </h1>
      )
    }
    // H2
    else if (line.startsWith('## ')) {
      elements.push(
        <div key={i} style={{ fontSize: 14, color: '#888', fontWeight: 500, marginBottom: 28 }}>
          {line.slice(3)}
        </div>
      )
    }
    // H3 — section headers
    else if (line.startsWith('### ')) {
      elements.push(
        <div key={i} style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 12px', paddingBottom: 8, borderBottom: '2px solid #0B6B5C' }}>
            {line.slice(4)}
          </h3>
        </div>
      )
    }
    // H4
    else if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={i} style={{ fontSize: 14, fontWeight: 700, color: '#333', margin: '16px 0 6px' }}>
          {line.slice(5)}
        </h4>
      )
    }
    // Horizontal rule
    else if (line.startsWith('---')) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '24px 0' }} />)
    }
    // Bullet
    else if (line.match(/^[-*]\s/) || line.match(/^\d+\.\s/)) {
      const isNumbered = line.match(/^\d+\.\s/)
      const content = isNumbered ? line.replace(/^\d+\.\s/, '') : line.slice(2)
      const num = isNumbered ? line.match(/^(\d+)/)?.[1] : null
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 10, margin: '6px 0', alignItems: 'flex-start' }}>
          <span style={{
            flexShrink: 0, marginTop: 2,
            ...(num
              ? { width: 22, height: 22, borderRadius: '50%', background: '#0B6B5C', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }
              : { width: 6, height: 6, borderRadius: '50%', background: '#0B6B5C', marginTop: 7 })
          }}>
            {num}
          </span>
          <span style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
        </div>
      )
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />)
    }
    // Regular paragraph
    else if (line.trim()) {
      elements.push(
        <p key={i} style={{ fontSize: 14, color: '#444', lineHeight: 1.7, margin: '4px 0' }}
          dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      )
    }

    i++
  }

  if (tableBuffer.length > 0) flushTable('table-end')

  return elements
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#F3F4F6;padding:1px 5px;border-radius:3px;font-size:12px">$1</code>')
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReportClient({ userName }: Props) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [webSearches, setWebSearches] = useState(0)
  const [period, setPeriod] = useState<'monthly' | 'biweekly'>('monthly')
  const [error, setError] = useState('')
  const reportRef = useRef<HTMLDivElement>(null)

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setReport(null)
    try {
      const res = await fetch('/api/marketing/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setReport(data.report)
      setMetrics(data.metrics)
      setGeneratedAt(data.generated_at)
      setWebSearches(data.web_searches_used || 0)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .report-body { padding: 0 !important; max-width: 100% !important; }
          body { font-size: 12px; }
        }
      `}</style>

      <div style={{ padding: '24px 28px', maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div className="no-print" style={{ marginBottom: 28 }}>
          <Link href="/marketing" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Marketing</Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 6 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>
                Marketing Intelligence Report
              </h1>
              <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                AI-generated strategic brief combining your portal data with live market intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        {!report && (
          <div className="no-print" style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 32, textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
              Generate Your Marketing Report
            </h2>
            <p style={{ color: '#888', fontSize: 14, maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Combines your visit logs, email campaigns, referral data, and facility intelligence with live
              web research on the Maryland home health market — then synthesises it into a strategic brief
              your team can act on.
            </p>

            {/* What's included */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28, textAlign: 'left' }}>
              {[
                { icon: '🏥', label: 'Facility heat map & visit analysis' },
                { icon: '📧', label: 'Email engagement & top openers' },
                { icon: '🔗', label: 'Referral attribution & barriers' },
                { icon: '🌐', label: 'Live Maryland market intelligence' },
                { icon: '💡', label: 'Strategic recommendations' },
                { icon: '✅', label: 'Priority action list' },
              ].map(item => (
                <div key={item.label} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, color: '#555', fontWeight: 500, lineHeight: 1.4 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Period selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              {(['monthly', 'biweekly'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ padding: '8px 20px', borderRadius: 20, border: `2px solid ${period === p ? '#0B6B5C' : '#E5E7EB'}`, background: period === p ? '#D1FAE5' : '#fff', color: period === p ? '#065F46' : '#888', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {p === 'monthly' ? '📅 Monthly' : '📆 Bi-Weekly'}
                </button>
              ))}
            </div>

            <button onClick={handleGenerate} disabled={loading}
              style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: loading ? '#AAA' : '#0B6B5C', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {loading ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Researching & writing report… (60-90 seconds)
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Report
                </>
              )}
            </button>

            {loading && (
              <div style={{ marginTop: 20, color: '#888', fontSize: 13 }}>
                <div>Fetching your portal data → Searching Maryland home health market → Synthesising report…</div>
                <div style={{ marginTop: 8, height: 4, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden', maxWidth: 400, margin: '12px auto 0' }}>
                  <div style={{ height: '100%', background: '#0B6B5C', borderRadius: 2, animation: 'progress 90s linear forwards', width: '0%' }} />
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 16, background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: 8, fontSize: 13 }}>
                {error}
              </div>
            )}

            <style>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes progress { from { width: 0% } to { width: 95% } }
            `}</style>
          </div>
        )}

        {/* Report */}
        {report && (
          <>
            {/* Report toolbar */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '12px 16px', background: '#F0FDF4', border: '1px solid #6EE7B7', borderRadius: 10 }}>
              <div style={{ fontSize: 13, color: '#065F46' }}>
                <strong>Report generated</strong> — {generatedAt ? fmtDate(generatedAt) : ''}
                {webSearches > 0 && <span style={{ marginLeft: 12, fontSize: 12 }}>
                  <Globe size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {webSearches} web searches conducted
                </span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handlePrint}
                  style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #6EE7B7', background: '#fff', color: '#065F46', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button onClick={() => { setReport(null); setMetrics(null) }}
                  style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #6EE7B7', background: '#0B6B5C', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={14} /> New Report
                </button>
              </div>
            </div>

            {/* Metrics strip */}
            {metrics && (
              <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 24 }}>
                {[
                  { label: 'Total Visits', value: metrics.total_visits },
                  { label: 'F-Rate', value: `${metrics.f_rate}%`, color: metrics.f_rate >= 30 ? '#065F46' : metrics.f_rate >= 20 ? '#D97706' : '#DC2626' },
                  { label: 'Campaigns', value: metrics.total_campaigns },
                  { label: 'Avg Openers', value: metrics.avg_openers },
                  { label: 'Avg Open Rate', value: metrics.avg_open_rate != null ? `${metrics.avg_open_rate}%` : 'N/A' },
                  { label: 'Referrals', value: metrics.total_referrals },
                  { label: 'Hot Facilities', value: metrics.hot_facilities, color: '#065F46' },
                ].map(m => (
                  <div key={m.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: (m as any).color || '#111' }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* The report itself */}
            <div ref={reportRef} className="report-body" style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '40px 44px' }}>
              {/* Vitalis letterhead */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 20, borderBottom: '3px solid #0B6B5C' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0B6B5C', letterSpacing: '2px', marginBottom: 4 }}>VITALIS HEALTHCARE SERVICES</div>
                  <div style={{ fontSize: 11, color: '#888' }}>8757 Georgia Ave., Suite 440 · Silver Spring, MD 20910</div>
                  <div style={{ fontSize: 11, color: '#888' }}>RSA #3879R · BCHD Licensed Provider</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#888' }}>CONFIDENTIAL</div>
                  <div style={{ fontSize: 11, color: '#888' }}>For Internal Use Only</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#333', marginTop: 4 }}>
                    {generatedAt ? new Date(generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                  </div>
                </div>
              </div>

              {/* Rendered report */}
              {renderMarkdown(report)}

              {/* Footer */}
              <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#AAA' }}>
                <div>Generated by Vita AI · Vitalis Healthcare Portal</div>
                <div>Confidential — Internal Use Only</div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
