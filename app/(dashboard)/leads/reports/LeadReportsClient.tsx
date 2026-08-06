'use client'
// ═════════════════════════════════════════════════════════════════════════
// Leads Reports (v0.6.52) — inline styles only, no Tailwind.
//
// Reading order is deliberate: outcomes first (did we win), then why we
// lost, then where the leads came from, then how fast we answered, then
// what is still in front of us, then the two hygiene numbers that turn
// into work. Every rate states its cohort ON the tile, because a rate
// without a denominator is a rumour.
// ═════════════════════════════════════════════════════════════════════════
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { RANGE_PRESETS, RESPONSE_TIME_FROM } from '@/lib/leads/reports'
import type { LeadReportFacts } from '@/lib/leads/reports'

const TEAL = '#0B6B5C'
const INK = '#1E3A4C'
const BODY = '#4A6070'
const MUTED = '#8FA0B0'
const LINE = '#E2E8F0'

function money(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

function rate(v: number | null) {
  return v === null ? '—' : `${v}%`
}

function hours(v: number | null) {
  if (v === null) return '—'
  if (v < 1) return `${Math.round(v * 60)} min`
  if (v < 48) return `${v} hr`
  return `${Math.round(v / 24)} days`
}

// ── Small building blocks ────────────────────────────────────────────────

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: BODY, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </div>
      {note && <div style={{ fontSize: 11, color: MUTED, marginTop: 4, lineHeight: 1.5 }}>{note}</div>}
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  )
}

function Stat({ value, label, sub, tone }: { value: string; label: string; sub?: string; tone?: string }) {
  return (
    <div style={{ minWidth: 140, flex: '1 1 140px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: tone || INK, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: BODY, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', fontSize: 11, fontWeight: 700, color: BODY,
  textTransform: 'uppercase', letterSpacing: '0.04em',
  padding: '8px 10px', borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  fontSize: 13, color: INK, padding: '9px 10px', borderBottom: `1px solid #F1F5F9`,
}

function Bar({ share }: { share: number | null }) {
  const w = Math.max(0, Math.min(100, share || 0))
  return (
    <div style={{ height: 6, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
      <div style={{ width: `${w}%`, height: '100%', background: TEAL }} />
    </div>
  )
}

function CsvButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
      borderRadius: 8, border: `1px solid ${LINE}`, background: '#fff',
      color: BODY, fontSize: 12, fontWeight: 600, textDecoration: 'none',
    }}>
      <Download size={13} /> {label}
    </a>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function LeadReportsClient({ facts }: { facts: LeadReportFacts }) {
  const router = useRouter()
  const [customFrom, setCustomFrom] = useState(facts.range.from)
  const [customTo, setCustomTo] = useState(facts.range.to)

  const go = (key: string) => router.push(`/leads/reports?range=${key}`)
  const goCustom = () => router.push(`/leads/reports?range=custom&from=${customFrom}&to=${customTo}`)

  const q = facts.range.key === 'custom'
    ? `range=custom&from=${facts.range.from}&to=${facts.range.to}`
    : `range=${facts.range.key}`
  const csv = (section: string) => `/api/leads/reports-csv?section=${section}&${q}`

  const o = facts.outcomes
  const p = facts.pipeline
  const r = facts.response
  const a = facts.agreements
  const h = facts.hygiene

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1180, margin: '0 auto' }}>

      {/* Header */}
      <Link href="/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: BODY, textDecoration: 'none', marginBottom: 10 }}>
        <ArrowLeft size={14} /> Back to the pipeline
      </Link>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: INK, margin: '0 0 4px' }}>Reports &amp; Insights</h1>
      <p style={{ fontSize: 13, color: BODY, margin: '0 0 18px', lineHeight: 1.6, maxWidth: 720 }}>
        The Thursday Brief reports what moved this week. This page answers the slower
        questions — why we lose, which sources pay, how fast we answer — over whatever
        window you choose. Nothing here needs to be generated; it is computed live.
      </p>

      {/* Range picker */}
      <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {RANGE_PRESETS.map(preset => {
            const active = facts.range.key === preset.key
            return (
              <button key={preset.key} type="button" onClick={() => go(preset.key)} style={{
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                border: `1.5px solid ${active ? TEAL : LINE}`,
                background: active ? '#EFF6F4' : '#fff',
                color: active ? TEAL : BODY, fontSize: 12, fontWeight: 600,
              }}>{preset.label}</button>
            )
          })}
          <span style={{ width: 1, height: 22, background: LINE, margin: '0 4px' }} />
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            style={{ padding: '5px 8px', border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 12, color: INK }} />
          <span style={{ fontSize: 12, color: MUTED }}>to</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            style={{ padding: '5px 8px', border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 12, color: INK }} />
          <button type="button" onClick={goCustom} style={{
            padding: '6px 14px', borderRadius: 8, cursor: 'pointer', border: 'none',
            background: TEAL, color: '#fff', fontSize: 12, fontWeight: 600,
          }}>Apply</button>
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 10 }}>
          Showing <strong style={{ color: BODY }}>{facts.range.label}</strong> — {facts.range.from} to {facts.range.to}.
          Pipeline figures are a snapshot of right now, not of the window.
        </div>
      </div>

      {/* Outcomes */}
      <Card
        title="Outcomes — leads that closed in this window"
        note={
          facts.range.key === 'all'
            ? 'Every won or lost lead on the books. All time has no boundary to fail, so closures with no recorded date are included here — they are excluded from every other window. Cancelled leads are not counted as an outcome; they have no date and are administrative.'
            : 'The cohort is leads whose recorded outcome date — won_date or lost_date — falls inside the window. Those dates are written when a lead is moved through the status buttons, so leads closed by the July migration have none and sit outside every window. Cancelled leads are not counted as an outcome.'
        }
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Stat value={rate(o.winRate)} label="Win rate" sub={`${o.won} won of ${o.closed} closed`} tone={TEAL} />
          <Stat value={String(o.won)} label="Won" />
          <Stat value={String(o.lost)} label="Lost" />
          <Stat value={money(o.weeklyRevenueWon)} label="Weekly revenue won" sub="Sum of hours × rate on won leads" />
          <Stat
            value={o.medianDaysToWin === null ? '—' : `${o.medianDaysToWin} days`}
            label="Median time to win"
            sub={o.timedWins > 0 ? `From ${o.timedWins} dated win${o.timedWins === 1 ? '' : 's'}` : 'No dated wins in this window'}
          />
          <Stat value={String(facts.created.total)} label="New leads created" sub="In this window" />
        </div>
      </Card>

      {/* Undated closures — visible, never silently dropped */}
      {(o.undatedExcluded > 0 || (o.undatedIncluded && h.wonTotal > 0)) && (
        <Card
          title="Closures with no recorded outcome date"
          note="These leads were marked won or lost by the July migration, which set the status directly in the database. The columns that record WHEN a lead closed are only written when a lead is moved through the status buttons, so these carry no date at all. They are counted here rather than dated by guesswork."
        >
          {o.undatedIncluded ? (
            <div style={{ fontSize: 13, color: BODY, lineHeight: 1.6 }}>
              You are viewing <strong>All time</strong>, so these closures are
              <strong> included</strong> in the figures above. Switch to any bounded
              window and they drop out, because a 30-day window cannot honestly claim
              a lead it cannot date.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <Stat
                value={String(o.undatedExcluded)}
                label="Excluded from this window"
                sub="Included only in the All time view"
                tone="#D97706"
              />
              <div style={{ flex: '1 1 260px', minWidth: 200 }}>
                <CsvButton href={csv('undated')} label="Export the undated closures" />
              </div>
            </div>
          )}
          {o.cancelledAllTime > 0 && (
            <div style={{ fontSize: 11, color: MUTED, marginTop: 12 }}>
              Separately, {o.cancelledAllTime} lead{o.cancelledAllTime === 1 ? ' is' : 's are'} cancelled.
              Cancelled is an administrative close with no date column, so it never enters the win rate.
            </div>
          )}
        </Card>
      )}

      {/* Losses */}
      <Card title="Why we lost" note="Leads lost in this window, grouped by the recorded reason code. Losses carried over from the July migration have neither a date nor a reason, so they appear only in the All time view and under No reason recorded.">
        {facts.losses.length === 0 ? (
          <div style={{ fontSize: 13, color: MUTED }}>No dated losses in this window.</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Reason</th>
                  <th style={{ ...thStyle, width: 70 }}>Count</th>
                  <th style={{ ...thStyle, width: 70 }}>Share</th>
                  <th style={{ ...thStyle, width: 160 }} />
                </tr>
              </thead>
              <tbody>
                {facts.losses.map(row => (
                  <tr key={row.code}>
                    <td style={tdStyle}>{row.label}</td>
                    <td style={tdStyle}>{row.count}</td>
                    <td style={tdStyle}>{rate(row.share)}</td>
                    <td style={tdStyle}><Bar share={row.share} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12 }}><CsvButton href={csv('losses')} label="Export losses" /></div>
          </>
        )}
      </Card>

      {/* Sources */}
      <Card
        title="Source performance"
        note="Created counts leads that arrived in this window. Closed, won and win rate count leads that REACHED an outcome in it — so a source can show wins without new arrivals, and vice versa."
      >
        {facts.sources.length === 0 ? (
          <div style={{ fontSize: 13, color: MUTED }}>No leads created or closed in this window.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Source</th>
                    <th style={thStyle}>Created</th>
                    <th style={thStyle}>Closed</th>
                    <th style={thStyle}>Won</th>
                    <th style={thStyle}>Lost</th>
                    <th style={thStyle}>Win rate</th>
                    <th style={thStyle}>Weekly revenue won</th>
                  </tr>
                </thead>
                <tbody>
                  {facts.sources.map(row => (
                    <tr key={row.key}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{row.label}</td>
                      <td style={tdStyle}>{row.created}</td>
                      <td style={tdStyle}>{row.closed}</td>
                      <td style={{ ...tdStyle, color: row.won > 0 ? TEAL : INK, fontWeight: row.won > 0 ? 700 : 400 }}>{row.won}</td>
                      <td style={tdStyle}>{row.lost}</td>
                      <td style={tdStyle}>{rate(row.winRate)}</td>
                      <td style={tdStyle}>{row.weeklyRevenueWon > 0 ? money(row.weeklyRevenueWon) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12 }}><CsvButton href={csv('sources')} label="Export sources" /></div>
          </>
        )}
      </Card>

      {/* Response time */}
      <Card
        title="How fast we answer"
        note={`Time from a lead being created to the first call, text, meeting or email logged against it. A note is not contact, so notes do not count. Leads created before ${RESPONSE_TIME_FROM} are excluded — their timestamps record when the row was imported, not when the family called.`}
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 14 }}>
          <Stat value={hours(r.medianHours)} label="Median first response" sub={`${r.measured} leads measured`} tone={TEAL} />
          <Stat value={rate(r.withinOneDay)} label="Answered within 24 hours" />
          <Stat value={String(r.awaiting)} label="Still awaiting a first touch" sub="Created in window, nothing logged yet" tone={r.awaiting > 0 ? '#DC2626' : undefined} />
          <Stat value={String(r.excludedLegacy)} label="Excluded as migrated" sub="Import timestamps, not inquiry times" />
        </div>
        {r.slowest.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: BODY, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Slowest to answer
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Lead</th>
                  <th style={thStyle}>Owner</th>
                  <th style={thStyle}>First response</th>
                </tr>
              </thead>
              <tbody>
                {r.slowest.map(row => (
                  <tr key={row.id}>
                    <td style={tdStyle}>
                      <Link href={`/leads/${row.id}`} style={{ color: TEAL, textDecoration: 'none', fontWeight: 600 }}>{row.name}</Link>
                    </td>
                    <td style={tdStyle}>{row.owner}</td>
                    <td style={tdStyle}>{hours(row.hours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12 }}><CsvButton href={csv('response')} label="Export response times" /></div>
          </>
        )}
      </Card>

      {/* Pipeline now */}
      <Card
        title="What is in front of us — right now"
        note="Open leads only (ongoing and standby, not archived). This is a snapshot of the present, so it does not move when you change the window above. Weighted revenue applies each lead's close probability; unrated leads count at even odds."
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Stat value={String(p.open)} label="Open leads" sub={`${p.ongoing} ongoing · ${p.standby} standby`} tone={TEAL} />
          <Stat value={`${p.weeklyHours} hr`} label="Weekly hours in pipeline" />
          <Stat value={money(p.weeklyRevenue)} label="Weekly revenue if all won" />
          <Stat value={money(p.weightedMonthlyRevenue)} label="Weighted monthly revenue" sub="Probability-adjusted" />
          <Stat
            value={`${p.belowMin} (${rate(p.belowMinShare)})`}
            label="Below minimum engagement"
            sub="Under 12 h/week and under $390/week"
            tone={p.belowMin > 0 ? '#D97706' : undefined}
          />
          <Stat value={String(p.noHoursOrRate)} label="Missing hours or rate" sub="Cannot be valued at all" tone={p.noHoursOrRate > 0 ? '#D97706' : undefined} />
        </div>
      </Card>

      {/* Agreements */}
      <Card
        title="Service Agreements"
        note="Agreements prepared in this window and what became of them. A voided agreement is one replaced by a newer link, not a refusal."
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Stat value={rate(a.signRate)} label="Signed" sub={`${a.signed} of ${a.prepared} prepared`} tone={TEAL} />
          <Stat value={String(a.live)} label="Still awaiting signature" tone={a.live > 0 ? '#D97706' : undefined} />
          <Stat value={String(a.voided)} label="Voided and replaced" />
          <Stat value={hours(a.medianHoursToSign)} label="Median time to sign" sub="Sent to signed" />
        </div>
      </Card>

      {/* Hygiene */}
      <Card
        title="Record hygiene — all time, not this window"
        note="A won lead should carry a linked client record. These two numbers are work, not performance: use Link client record on each lead, one at a time."
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Stat value={String(h.wonTotal)} label="Won leads, all time" />
          <Stat value={String(h.withClientRecord)} label="With a client record" tone={TEAL} />
          <Stat
            value={String(h.missingClientRecord)}
            label="Missing a client record"
            sub={h.missingClientRecord > 0 ? 'Link each one individually — never in bulk' : 'All linked'}
            tone={h.missingClientRecord > 0 ? '#DC2626' : TEAL}
          />
        </div>
      </Card>

      {/* Full export */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 30 }}>
        <CsvButton href={csv('leads')} label="Export every lead in this window" />
        <span style={{ fontSize: 11, color: MUTED }}>
          One row per lead created or closed in the window, with its outcome, source, value and first-response time.
        </span>
      </div>
    </div>
  )
}
