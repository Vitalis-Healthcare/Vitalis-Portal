'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { Upload, Trash2, Mail, ChevronDown, ChevronUp } from 'lucide-react'

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

export default function EmailAnalyticsClient({ initialCampaigns, optInCount }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [tab, setTab] = useState<'upload' | 'history'>('history')

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

  // ── Stats — only count campaigns with real open rates ────────────────────
  const campaignsWithRate = campaigns.filter(c => c.open_rate != null && c.total_sent > 0)
  const avgOpenRate = campaignsWithRate.length > 0
    ? Math.round(campaignsWithRate.reduce((a, c) => a + (c.open_rate || 0), 0) / campaignsWithRate.length * 10) / 10
    : null

  // For campaigns without total_sent, compute avg openers instead
  const avgOpeners = campaigns.length > 0
    ? Math.round(campaigns.reduce((a, c) => a + c.total_opened, 0) / campaigns.length)
    : 0

  const totalOpens = campaigns.reduce((a, c) => a + c.total_opened, 0)
  const topOpener = (() => {
    const freq: Record<string, number> = {}
    campaigns.forEach(c => c.opens.forEach(o => {
      const key = o.email_address
      freq[key] = (freq[key] || 0) + 1
    }))
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
    return sorted[0] ? { email: sorted[0][0], count: sorted[0][1] } : null
  })()

  // ── CSV Parser ─────────────────────────────────────────────────────────────
  function parseCSV(text: string): ParsedRow[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) throw new Error('CSV appears empty.')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
    const nameIdx  = headers.findIndex(h => h.includes('name'))
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'))
    if (emailIdx === -1) throw new Error('Could not find an email column.')
    const rows: ParsedRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || lines[i].split(',')
      const email = cols[emailIdx]?.replace(/"/g, '').trim()
      const name  = nameIdx >= 0 ? cols[nameIdx]?.replace(/"/g, '').trim() : ''
      if (email && email.includes('@')) rows.push({ email_address: email.toLowerCase(), name_in_csv: name || '' })
    }
    if (rows.length === 0) throw new Error('No valid email addresses found.')
    return rows
  }

  function handleFile(f: File) {
    setFile(f); setParsed([]); setParseError(''); setSaveResult(null)
    const match = f.name.match(/([A-Za-z]+)_(\d+)_+(\d{4})/)
    if (match) {
      const mo: Record<string,string> = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'}
      const m = mo[match[1].toLowerCase().slice(0,3)]
      if (m) setCampaignDate(`${match[3]}-${m}-${match[2].padStart(2,'0')}`)
    }
    const reader = new FileReader()
    reader.onload = e => {
      try { setParsed(parseCSV(e.target?.result as string)) }
      catch (err: any) { setParseError(err.message) }
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
        body: JSON.stringify({ campaign_date: campaignDate, subject: subject.trim() || null, total_sent: parseInt(totalSent) || 0, openers: parsed }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setCampaigns(prev => [json.data, ...prev])
      setSaveResult({ matched: json.matched, unmatched: json.unmatched })
      setFile(null); setParsed([]); setSubject(''); setTotalSent('')
      setTab('history')
    } catch (e: any) {
      setSaveError(e.message || 'Something went wrong.')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign record and all its opener data?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/marketing/email-analytics', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (!res.ok) throw new Error()
      setCampaigns(prev => prev.filter(c => c.id !== id))
    } catch { alert('Could not delete.') }
    finally { setDeleting(null) }
  }

  function fmtDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 28px', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/marketing" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Marketing</Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111', margin: '4px 0 0' }}>Email Analytics</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Weekly open reports from 52 Weeks Marketing</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatBox label="Campaigns" value={String(campaigns.length)} color="#111" />
        <StatBox
          label="Avg open rate"
          value={avgOpenRate != null ? `${avgOpenRate}%` : '—'}
          sub={avgOpenRate == null ? 'Total sent unknown' : undefined}
          color="#0B6B5C"
        />
        <StatBox label="Avg openers / blast" value={String(avgOpeners)} color="#0B6B5C" />
        <StatBox label="Total openers" value={String(totalOpens)} color="#6D28D9" />
        <StatBox label="Opt-in contacts" value={String(optInCount)} color="#1D4ED8" />
      </div>

      {/* Top opener callout */}
      {topOpener && (
        <div style={{ background: '#F0FDF4', border: '1px solid #6EE7B7', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#065F46' }}>
          🏆 <strong>Most engaged contact:</strong> {topOpener.email} — opened <strong>{topOpener.count}</strong> of {campaigns.length} campaigns
        </div>
      )}

      {/* Open rate note when no total_sent */}
      {avgOpenRate == null && campaigns.length > 0 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
          ℹ️ Open rate can't be calculated because <strong>total sent</strong> count isn't included in the CSV exports from 52 Weeks Marketing.
          To get true open rates, ask Dylan for the total list size for each campaign, then enter it when uploading future CSVs.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        {(['history','upload'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 20px', border: 'none', borderBottom: tab === t ? '2px solid #0B6B5C' : '2px solid transparent', background: 'none', fontWeight: tab === t ? 600 : 400, color: tab === t ? '#0B6B5C' : '#888', fontSize: 14, cursor: 'pointer', marginBottom: -1 }}>
            {t === 'history' ? `📊 Campaigns (${campaigns.length})` : '📤 Upload CSV'}
          </button>
        ))}
      </div>

      {/* ── HISTORY ── */}
      {tab === 'history' && (
        <div>
          {campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#AAA' }}>
              <Mail size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>No campaigns yet</div>
              <button onClick={() => setTab('upload')} style={{ background: 'none', border: 'none', color: '#0B6B5C', cursor: 'pointer', fontSize: 14 }}>Upload your first CSV →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {campaigns.map(c => {
                const matchedCount = c.opens.filter(o => o.contact_id).length
                const isOpen = expanded === c.id
                const hasRate = c.open_rate != null && c.total_sent > 0

                return (
                  <div key={c.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    {/* Campaign row — fully clickable to expand */}
                    <div
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}
                    >
                      {/* Date + subject */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>
                          {fmtDate(c.campaign_date)}
                          {c.subject && <span style={{ fontWeight: 400, color: '#888', marginLeft: 8, fontSize: 13 }}>· {c.subject}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#AAA', marginTop: 3 }}>
                          {c.total_opened} openers
                          {hasRate ? ` · ${c.open_rate}% open rate` : ''}
                          {` · ${matchedCount} matched to CRM`}
                          {c.total_opened - matchedCount > 0 ? ` · ${c.total_opened - matchedCount} new` : ''}
                        </div>
                      </div>

                      {/* Open rate / opener count badge */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#0B6B5C' }}>
                          {hasRate ? `${c.open_rate}%` : `${c.total_opened}`}
                        </div>
                        <div style={{ fontSize: 10, color: '#AAA', fontWeight: 500 }}>
                          {hasRate ? 'OPEN RATE' : 'OPENERS'}
                        </div>
                      </div>

                      {/* Match rate bar */}
                      <div style={{ width: 60, flexShrink: 0 }}>
                        <div style={{ height: 4, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${c.total_opened > 0 ? Math.round(matchedCount/c.total_opened*100) : 0}%`, background: '#0B6B5C', borderRadius: 2 }} />
                        </div>
                        <div style={{ fontSize: 10, color: '#AAA', marginTop: 3, textAlign: 'center' }}>
                          {c.total_opened > 0 ? Math.round(matchedCount/c.total_opened*100) : 0}% matched
                        </div>
                      </div>

                      {/* Delete */}
                      <button onClick={e => { e.stopPropagation(); handleDelete(c.id) }}
                        disabled={deleting === c.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '4px 6px', flexShrink: 0, opacity: deleting === c.id ? 0.5 : 1 }}>
                        <Trash2 size={14} />
                      </button>

                      {/* Expand chevron */}
                      <span style={{ color: '#CCC', flexShrink: 0 }}>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>

                    {/* Expanded opener list */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #F0F0F0', maxHeight: 320, overflowY: 'auto' }}>
                        <div style={{ padding: '8px 18px', fontSize: 11, fontWeight: 700, color: '#AAA', letterSpacing: '0.8px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between' }}>
                          <span>OPENERS ({c.opens.length})</span>
                          <span>{matchedCount} matched · {c.opens.length - matchedCount} unmatched</span>
                        </div>
                        {c.opens.map((o, i) => (
                          <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderBottom: i < c.opens.length - 1 ? '1px solid #F8F8F8' : 'none', fontSize: 13 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: o.contact_id ? '#0B6B5C' : '#D1D5DB', flexShrink: 0 }} />
                            <span style={{ flex: 1, color: '#333' }}>{o.name_in_csv || '—'}</span>
                            <span style={{ color: '#888', fontSize: 12 }}>{o.email_address}</span>
                            {o.contact_id
                              ? <span style={{ fontSize: 10, color: '#065F46', background: '#D1FAE5', padding: '1px 6px', borderRadius: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>in CRM</span>
                              : <span style={{ fontSize: 10, color: '#6B7280', background: '#F3F4F6', padding: '1px 6px', borderRadius: 10, whiteSpace: 'nowrap' }}>new contact</span>
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

      {/* ── UPLOAD ── */}
      {tab === 'upload' && (
        <div style={{ maxWidth: 580 }}>
          {saveResult && (
            <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ fontWeight: 600, color: '#065F46', fontSize: 14, marginBottom: 4 }}>✅ Campaign saved</div>
              <div style={{ fontSize: 13, color: '#065F46' }}>
                {saveResult.matched} opener{saveResult.matched !== 1 ? 's' : ''} matched to CRM contacts · {saveResult.unmatched} new/unmatched
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${file ? '#0B6B5C' : '#D1D5DB'}`, borderRadius: 12, padding: '32px', textAlign: 'center', cursor: 'pointer', background: file ? '#F0FDF4' : '#FAFAFA', marginBottom: 20 }}
          >
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            <Upload size={28} style={{ color: file ? '#0B6B5C' : '#9CA3AF', marginBottom: 10 }} />
            {file ? (
              <div>
                <div style={{ fontWeight: 600, color: '#0B6B5C', fontSize: 14 }}>{file.name}</div>
                {parsed.length > 0 && <div style={{ color: '#065F46', fontSize: 13, marginTop: 4 }}>✅ {parsed.length} openers ready</div>}
                {parseError && <div style={{ color: '#DC2626', fontSize: 13, marginTop: 4 }}>{parseError}</div>}
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 500, color: '#555', fontSize: 14, marginBottom: 4 }}>Drop CSV here or click to browse</div>
                <div style={{ color: '#AAA', fontSize: 12 }}>Export the weekly open report from 52 Weeks Marketing</div>
              </div>
            )}
          </div>

          {parsed.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Campaign date *</label>
                  <input type="date" value={campaignDate} onChange={e => setCampaignDate(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Total sent (optional)</label>
                  <input type="number" value={totalSent} onChange={e => setTotalSent(e.target.value)} placeholder="e.g. 109" style={inp} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Email subject (optional)</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Home Care Tips for March" style={inp} />
              </div>

              {/* Preview */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#333', marginBottom: 10 }}>Preview — first 5</div>
                {parsed.slice(0, 5).map((row, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: i < 4 ? '1px solid #EEE' : 'none', fontSize: 13 }}>
                    <span style={{ color: '#555', minWidth: 160 }}>{row.name_in_csv || '(no name)'}</span>
                    <span style={{ color: '#888' }}>{row.email_address}</span>
                  </div>
                ))}
                {parsed.length > 5 && <div style={{ fontSize: 12, color: '#AAA', marginTop: 8 }}>… and {parsed.length - 5} more</div>}
              </div>

              {saveError && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{saveError}</div>}

              <button onClick={handleSave} disabled={saving || !campaignDate}
                style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: campaignDate ? '#0B6B5C' : '#CCC', color: '#fff', fontSize: 14, fontWeight: 600, cursor: campaignDate ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : `Save campaign · ${parsed.length} openers`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#CCC', marginTop: 2 }}>{sub}</div>}
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
