'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { Upload, Trash2, Mail, TrendingUp } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Open {
  id: string
  email_address: string
  name_in_csv: string | null
  contact_id: string | null
}

interface Campaign {
  id: string
  campaign_date: string
  subject: string | null
  total_sent: number
  total_opened: number
  open_rate: number | null
  opens: Open[]
}

interface Props {
  initialCampaigns: Campaign[]
  optInCount: number
}

interface ParsedRow { email_address: string; name_in_csv: string }

// ── Component ──────────────────────────────────────────────────────────────────

export default function EmailAnalyticsClient({ initialCampaigns, optInCount }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [tab, setTab] = useState<'upload' | 'history'>('upload')

  // Upload state
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState('')
  const [campaignDate, setCampaignDate] = useState('')
  const [subject, setSubject] = useState('')
  const [totalSent, setTotalSent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ matched: number; unmatched: number } | null>(null)
  const [saveError, setSaveError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // History state
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // ── CSV Parser ────────────────────────────────────────────────────────────────

  function parseCSV(text: string): ParsedRow[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) throw new Error('CSV appears empty or has no data rows.')

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
    
    // Find name and email column indices (flexible header matching)
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('first') || h.includes('contact'))
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'))

    if (emailIdx === -1) throw new Error('Could not find an email column. Make sure your CSV has an "Email" header.')

    const rows: ParsedRow[] = []
    for (let i = 1; i < lines.length; i++) {
      // Handle quoted fields
      const cols = lines[i].match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || lines[i].split(',')
      const email = cols[emailIdx]?.replace(/"/g, '').trim()
      const name  = nameIdx >= 0 ? cols[nameIdx]?.replace(/"/g, '').trim() : ''
      if (email && email.includes('@')) {
        rows.push({ email_address: email.toLowerCase(), name_in_csv: name || '' })
      }
    }
    if (rows.length === 0) throw new Error('No valid email addresses found in the CSV.')
    return rows
  }

  function handleFile(f: File) {
    setFile(f)
    setParsed([])
    setParseError('')
    setSaveResult(null)

    // Try to extract date from filename (e.g. Mar_11__2026)
    const match = f.name.match(/([A-Za-z]+)_(\d+)_+(\d{4})/)
    if (match) {
      const monthMap: Record<string, string> = {
        jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
        jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
      }
      const mo = monthMap[match[1].toLowerCase().slice(0, 3)]
      if (mo) setCampaignDate(`${match[3]}-${mo}-${match[2].padStart(2, '0')}`)
    }

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const text = e.target?.result as string
        const rows = parseCSV(text)
        setParsed(rows)
      } catch (err: any) {
        setParseError(err.message || 'Could not parse CSV.')
      }
    }
    reader.readAsText(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) handleFile(f)
    else setParseError('Please upload a .csv file.')
  }

  async function handleSave() {
    if (!parsed.length) return
    if (!campaignDate) { setSaveError('Please enter the campaign date.'); return }
    setSaving(true); setSaveError(''); setSaveResult(null)
    try {
      const res = await fetch('/api/marketing/email-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_date: campaignDate,
          subject: subject.trim() || null,
          total_sent: parseInt(totalSent) || 0,
          openers: parsed,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setCampaigns(prev => [json.data, ...prev])
      setSaveResult({ matched: json.matched, unmatched: json.unmatched })
      setFile(null); setParsed([]); setSubject(''); setTotalSent('')
    } catch (e: any) {
      setSaveError(e.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign record?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/marketing/email-analytics', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setCampaigns(prev => prev.filter(c => c.id !== id))
    } catch {
      alert('Could not delete. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  function fmtDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  // Summary across all campaigns
  const avgOpenRate = campaigns.length > 0
    ? Math.round(campaigns.reduce((a, c) => a + (c.open_rate || 0), 0) / campaigns.length * 10) / 10
    : 0
  const totalOpens = campaigns.reduce((a, c) => a + c.total_opened, 0)

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/marketing" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Marketing</Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111', margin: '4px 0 0' }}>Email Analytics</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Upload your weekly open report CSVs from 52 Weeks Marketing</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatBox label="Campaigns" value={campaigns.length} color="#111" />
        <StatBox label="Avg open rate" value={`${avgOpenRate}%`} color="#0B6B5C" />
        <StatBox label="Total openers" value={totalOpens} color="#7C3AED" />
        <StatBox label="Opt-in contacts" value={optInCount} color="#457B9D" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        {(['upload', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 20px', border: 'none', borderBottom: tab === t ? '2px solid #0B6B5C' : '2px solid transparent', background: 'none', fontWeight: tab === t ? 600 : 400, color: tab === t ? '#0B6B5C' : '#888', fontSize: 14, cursor: 'pointer', marginBottom: -1 }}>
            {t === 'upload' ? '📤 Upload CSV' : `📊 Campaigns (${campaigns.length})`}
          </button>
        ))}
      </div>

      {/* ── UPLOAD ── */}
      {tab === 'upload' && (
        <div style={{ maxWidth: 580 }}>

          {saveResult && (
            <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ fontWeight: 600, color: '#065F46', fontSize: 14, marginBottom: 4 }}>✅ Campaign saved</div>
              <div style={{ fontSize: 13, color: '#065F46' }}>
                {saveResult.matched} opener{saveResult.matched !== 1 ? 's' : ''} matched to contacts in your CRM ·{' '}
                {saveResult.unmatched} unmatched
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${file ? '#0B6B5C' : '#D1D5DB'}`, borderRadius: 12, padding: '32px',
              textAlign: 'center', cursor: 'pointer', background: file ? '#F0FDF4' : '#FAFAFA', marginBottom: 20, transition: 'all 0.2s',
            }}
          >
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            <Upload size={28} style={{ color: file ? '#0B6B5C' : '#9CA3AF', marginBottom: 10 }} />
            {file ? (
              <div>
                <div style={{ fontWeight: 600, color: '#0B6B5C', fontSize: 14 }}>{file.name}</div>
                {parsed.length > 0 && (
                  <div style={{ color: '#065F46', fontSize: 13, marginTop: 4 }}>✅ {parsed.length} openers parsed</div>
                )}
                {parseError && <div style={{ color: '#DC2626', fontSize: 13, marginTop: 4 }}>{parseError}</div>}
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 500, color: '#555', fontSize: 14, marginBottom: 4 }}>Drop your CSV here or click to browse</div>
                <div style={{ color: '#AAA', fontSize: 12 }}>Export the weekly open report from 52 Weeks Marketing and drop it here</div>
              </div>
            )}
          </div>

          {/* Campaign details */}
          {parsed.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Campaign date *</label>
                  <input type="date" value={campaignDate} onChange={e => setCampaignDate(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Total sent (optional)</label>
                  <input type="number" value={totalSent} onChange={e => setTotalSent(e.target.value)}
                    placeholder={`e.g. ${optInCount}`} style={inp} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Email subject (optional)</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Home Care Tips for March — Vitalis Healthcare" style={inp} />
              </div>

              {/* Preview */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#333', marginBottom: 10 }}>Preview — first 5 openers</div>
                {parsed.slice(0, 5).map((row, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: i < 4 ? '1px solid #EEE' : 'none', fontSize: 13 }}>
                    <span style={{ color: '#555', minWidth: 160 }}>{row.name_in_csv || '(no name)'}</span>
                    <span style={{ color: '#888' }}>{row.email_address}</span>
                  </div>
                ))}
                {parsed.length > 5 && (
                  <div style={{ fontSize: 12, color: '#AAA', marginTop: 8 }}>… and {parsed.length - 5} more</div>
                )}
              </div>

              {saveError && (
                <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{saveError}</div>
              )}

              <button onClick={handleSave} disabled={saving || !campaignDate}
                style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: campaignDate ? '#0B6B5C' : '#CCC', color: '#fff', fontSize: 14, fontWeight: 600, cursor: campaignDate ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : `Save campaign · ${parsed.length} openers`}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === 'history' && (
        <div>
          {campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#AAA' }}>
              <Mail size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>No campaigns yet</div>
              <div style={{ fontSize: 13 }}>Upload your first CSV to get started.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {campaigns.map(c => {
                const matchedCount = c.opens.filter(o => o.contact_id).length
                const isOpen = expanded === c.id
                return (
                  <div key={c.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    {/* Campaign row */}
                    <div
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>
                          {fmtDate(c.campaign_date)}
                          {c.subject && <span style={{ fontWeight: 400, color: '#888', marginLeft: 8, fontSize: 13 }}>· {c.subject}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#AAA', marginTop: 3 }}>
                          {c.total_opened} openers
                          {c.total_sent > 0 && ` · ${c.open_rate}% open rate`}
                          {` · ${matchedCount} matched to CRM`}
                        </div>
                      </div>
                      {c.open_rate != null && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#0B6B5C' }}>{c.open_rate}%</div>
                          <div style={{ fontSize: 10, color: '#AAA', fontWeight: 500 }}>OPEN RATE</div>
                        </div>
                      )}
                      <button onClick={e => { e.stopPropagation(); handleDelete(c.id) }}
                        disabled={deleting === c.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '4px 8px', flexShrink: 0, opacity: deleting === c.id ? 0.5 : 1 }}>
                        <Trash2 size={15} />
                      </button>
                      <span style={{ color: '#CCC', fontSize: 16 }}>{isOpen ? '▲' : '▼'}</span>
                    </div>

                    {/* Expanded openers list */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #F0F0F0', maxHeight: 300, overflowY: 'auto' }}>
                        <div style={{ padding: '8px 18px', fontSize: 11, fontWeight: 700, color: '#AAA', letterSpacing: '0.8px', background: '#F9FAFB' }}>
                          OPENERS ({c.opens.length})
                        </div>
                        {c.opens.map((o, i) => (
                          <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderBottom: i < c.opens.length - 1 ? '1px solid #F8F8F8' : 'none', fontSize: 13 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: o.contact_id ? '#0B6B5C' : '#D1D5DB', flexShrink: 0 }} />
                            <span style={{ flex: 1, color: '#333' }}>{o.name_in_csv || '—'}</span>
                            <span style={{ color: '#888', fontSize: 12 }}>{o.email_address}</span>
                            {o.contact_id
                              ? <span style={{ fontSize: 10, color: '#0B6B5C', background: '#D1FAE5', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>matched</span>
                              : <span style={{ fontSize: 10, color: '#AAA', background: '#F3F4F6', padding: '1px 6px', borderRadius: 10 }}>new</span>
                            }
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #DDD',
  fontSize: 13, boxSizing: 'border-box', color: '#111', background: '#fff',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6,
}
