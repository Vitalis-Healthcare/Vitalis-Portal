'use client'
// ═════════════════════════════════════════════════════════════════════════
// Leads Reports & Insights (v0.6.55) — inline styles only, no Tailwind.
//
// Visual language: the portal's navy and teal carry the chrome; GREEN means
// won and RED means lost, consistently, everywhere on the page — so a colour
// never has to be looked up. Charts are hand-rolled SVG: no charting library,
// no new dependency, nothing that can break a build.
//
// Every rate still states its cohort. A prettier report that is vaguer about
// what it counted would be a step backwards.
// ═════════════════════════════════════════════════════════════════════════
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { RANGE_PRESETS, RESPONSE_TIME_FROM } from '@/lib/leads/reports'
import type { LeadReportFacts } from '@/lib/leads/reports'

const NAVY = '#1A2E44'
const TEAL = '#0E7C7B'
const WON = '#2D7D46'
const WON_SOFT = '#E7F4EC'
const LOST = '#C2413C'
const LOST_SOFT = '#FBECEB'
const AMBER = '#B7791F'
const BODY = '#4A6070'
const MUTED = '#8FA0B0'
const LINE = '#E4EAEF'

function money(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}
function rate(v: number | null) { return v === null ? '—' : `${v}%` }
function hours(v: number | null) {
  if (v === null) return '—'
  if (v < 1) return `${Math.round(v * 60)} min`
  if (v < 48) return `${v} hr`
  return `${Math.round(v / 24)} days`
}

// ── Building blocks ──────────────────────────────────────────────────────

function Card({ title, note, right, children }: {
  title: string; note?: string; right?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <section style={{
      background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14,
      padding: '20px 22px', marginBottom: 18,
      boxShadow: '0 1px 2px rgba(26,46,68,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: '1 1 auto' }}>
          <h2 style={{
            margin: 0, fontSize: 15, fontWeight: 700, color: NAVY, letterSpacing: '-0.01em',
          }}>{title}</h2>
          {note && <p style={{ margin: '6px 0 0', fontSize: 11.5, color: MUTED, lineHeight: 1.6, maxWidth: 860 }}>{note}</p>}
        </div>
        {right}
      </div>
      <div style={{ marginTop: 18 }}>{children}</div>
    </section>
  )
}

function Stat({ value, label, sub, tone }: { value: string; label: string; sub?: string; tone?: string }) {
  return (
    <div style={{ minWidth: 132, flex: '1 1 132px' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: tone || NAVY, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: BODY, marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: BODY,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  padding: '9px 10px', borderBottom: `1.5px solid ${LINE}`, whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  fontSize: 13, color: NAVY, padding: '10px', borderBottom: '1px solid #F2F6F8',
}

/** Horizontal bar, drawn as a div so it reflows with the table. */
function Bar({ share, color }: { share: number | null; color?: string }) {
  const w = Math.max(0, Math.min(100, share || 0))
  return (
    <div style={{ height: 7, background: '#F1F5F8', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
      <div style={{ width: `${w}%`, height: '100%', background: color || TEAL, borderRadius: 4 }} />
    </div>
  )
}

/** Won/lost columns by month — hand-rolled SVG, no library. */
function MonthChart({ months }: { months: LeadReportFacts['months'] }) {
  if (months.length === 0) return null
  const W = 660, H = 190, PAD_L = 34, PAD_B = 34, PAD_T = 12
  const max = Math.max(1, ...months.map(m => Math.max(m.won, m.lost)))
  const slot = (W - PAD_L - 10) / months.length
  const barW = Math.min(20, slot / 3)
  const plotH = H - PAD_B - PAD_T
  const y = (v: number) => PAD_T + plotH - (v / max) * plotH

  const ticks = [0, Math.ceil(max / 2), max].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 420, height: 'auto', display: 'block' }}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={PAD_L} x2={W - 6} y1={y(t)} y2={y(t)} stroke={LINE} strokeWidth={1} />
            <text x={PAD_L - 8} y={y(t) + 4} textAnchor="end" fontSize={10} fill={MUTED}>{t}</text>
          </g>
        ))}
        {months.map((m, i) => {
          const cx = PAD_L + slot * i + slot / 2
          return (
            <g key={m.key}>
              <rect x={cx - barW - 2} y={y(m.won)} width={barW} height={Math.max(0, y(0) - y(m.won))} fill={WON} rx={2}>
                <title>{`${m.label}: ${m.won} won`}</title>
              </rect>
              <rect x={cx + 2} y={y(m.lost)} width={barW} height={Math.max(0, y(0) - y(m.lost))} fill={LOST} rx={2}>
                <title>{`${m.label}: ${m.lost} lost`}</title>
              </rect>
              <text x={cx} y={H - 12} textAnchor="middle" fontSize={10} fill={BODY}>{m.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
      {items.map(i => (
        <span key={i.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: BODY }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: i.color, display: 'inline-block' }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

function CsvButton({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <a href={href} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px',
      borderRadius: 8, border: `1px solid ${LINE}`, background: '#fff',
      color: BODY, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
    }}>
      {icon || <Download size={13} />} {label}
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
    <div style={{ padding: '24px 28px 40px', maxWidth: 1180, margin: '0 auto' }}>

      <Link href="/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: BODY, textDecoration: 'none', marginBottom: 12 }}>
        <ArrowLeft size={14} /> Back to the pipeline
      </Link>

      {/* ── Headline band ──────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 135%)`,
        borderRadius: 16, padding: '26px 28px', color: '#fff', marginBottom: 18,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px' }}>
            <h1 style={{ margin: 0, fontSize: 27, fontWeight: 700, letterSpacing: '-0.02em' }}>Reports &amp; Insights</h1>
            <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.82)', maxWidth: 560 }}>
              The Thursday Brief reports what moved this week. This page answers the slower
              questions — why we lose, which sources pay, how fast we answer — over whatever
              window you choose.
            </p>
          </div>
          <a href={`/api/leads/reports-print?${q}`} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px',
            borderRadius: 9, background: '#fff', color: NAVY,
            fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            <Printer size={15} /> Print / Save as PDF
          </a>
        </div>

        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginTop: 22 }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{rate(o.winRate)}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
              Win rate · {o.won} won of {o.closed} closed
            </div>
          </div>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, color: '#9BE8B4' }}>{money(o.weeklyRevenueWon)}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>Weekly revenue won</div>
          </div>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, color: '#FFB3AE' }}>{money(o.weeklyRevenueLost)}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>Weekly revenue lost</div>
          </div>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{money(p.weightedMonthlyRevenue)}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>Weighted monthly pipeline</div>
          </div>
        </div>
      </div>

      {/* ── Range picker ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 15, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {RANGE_PRESETS.map(preset => {
            const active = facts.range.key === preset.key
            return (
              <button key={preset.key} type="button" onClick={() => go(preset.key)} style={{
                padding: '7px 15px', borderRadius: 20, cursor: 'pointer',
                border: `1.5px solid ${active ? TEAL : LINE}`,
                background: active ? '#E6F4F4' : '#fff',
                color: active ? TEAL : BODY, fontSize: 12.5, fontWeight: 600,
              }}>{preset.label}</button>
            )
          })}
          <span style={{ width: 1, height: 22, background: LINE, margin: '0 4px' }} />
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            style={{ padding: '6px 9px', border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 12, color: NAVY }} />
          <span style={{ fontSize: 12, color: MUTED }}>to</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            style={{ padding: '6px 9px', border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 12, color: NAVY }} />
          <button type="button" onClick={goCustom} style={{
            padding: '7px 15px', borderRadius: 8, cursor: 'pointer', border: 'none',
            background: TEAL, color: '#fff', fontSize: 12.5, fontWeight: 600,
          }}>Apply</button>
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 11 }}>
          Showing <strong style={{ color: BODY }}>{facts.range.label}</strong> — {facts.range.from} to {facts.range.to}.
          Pipeline figures are a snapshot of right now, not of the window.
        </div>
      </div>

      {/* ── Outcomes ───────────────────────────────────────────────────── */}
      <Card
        title="Outcomes"
        note={
          facts.range.key === 'all'
            ? 'Every won or lost lead on the books. All time has no boundary to fail, so closures with no recorded date are included here — they are excluded from every other window. Cancelled leads are administrative and are not counted as an outcome.'
            : 'Leads whose recorded outcome date — won_date or lost_date — falls inside the window. Those dates are written when a lead is moved through the status buttons. Cancelled leads are not counted as an outcome.'
        }
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 4 }}>
          <Stat value={String(o.won)} label="Won" tone={WON} />
          <Stat value={String(o.lost)} label="Lost" tone={LOST} />
          <Stat value={money(o.weeklyRevenueWon)} label="Weekly revenue won" sub="Hours \u00D7 rate on won leads" tone={WON} />
          <Stat value={money(o.weeklyRevenueLost)} label="Weekly revenue lost" sub="Hours \u00D7 rate on lost leads" tone={LOST} />
          <Stat
            value={o.medianDaysToWin === null ? '—' : `${o.medianDaysToWin} days`}
            label="Median time to win"
            sub={o.timedWins > 0 ? `From ${o.timedWins} dated win${o.timedWins === 1 ? '' : 's'}` : 'No dated wins here'}
          />
          <Stat value={String(facts.created.total)} label="New leads created" sub="In this window" />
        </div>

        {facts.months.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${LINE}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BODY, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Closures by month
            </div>
            <MonthChart months={facts.months} />
            <Legend items={[{ color: WON, label: 'Won' }, { color: LOST, label: 'Lost' }]} />
          </div>
        )}
      </Card>

      {/* ── Undated closures ───────────────────────────────────────────── */}
      {o.undatedExcluded > 0 && (
        <Card
          title="Closures with no recorded outcome date"
          note="These leads were marked won or lost without a status transition being logged, so nothing records when they closed. They are counted here rather than dated by guesswork, and they appear in the All time view only."
          right={<CsvButton href={csv('undated')} label="Export" />}
        >
          <Stat value={String(o.undatedExcluded)} label="Excluded from this window" tone={AMBER} />
        </Card>
      )}

      {/* ── Losses ─────────────────────────────────────────────────────── */}
      <Card
        title="Why we lost"
        note="Leads lost in this window, grouped by the recorded reason code. A loss with no reason is a loss we cannot learn from."
        right={facts.losses.length > 0 ? <CsvButton href={csv('losses')} label="Export losses" /> : undefined}
      >
        {facts.losses.length === 0 ? (
          <div style={{ fontSize: 13, color: MUTED }}>No dated losses in this window.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Reason</th>
                <th style={{ ...thStyle, width: 70 }}>Count</th>
                <th style={{ ...thStyle, width: 70 }}>Share</th>
                <th style={{ ...thStyle, width: 190 }} />
              </tr>
            </thead>
            <tbody>
              {facts.losses.map(row => (
                <tr key={row.code}>
                  <td style={{ ...tdStyle, fontWeight: row.code === 'unspecified' ? 700 : 400, color: row.code === 'unspecified' ? AMBER : NAVY }}>
                    {row.label}
                  </td>
                  <td style={tdStyle}>{row.count}</td>
                  <td style={tdStyle}>{rate(row.share)}</td>
                  <td style={tdStyle}><Bar share={row.share} color={row.code === 'unspecified' ? AMBER : LOST} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Sources ────────────────────────────────────────────────────── */}
      <Card
        title="Source performance"
        note="Created counts leads that arrived in this window. Closed, won and lost count leads that REACHED an outcome in it — so a source can show wins without new arrivals, and vice versa. Revenue is weekly, at the hours and rate on the lead."
        right={facts.sources.length > 0 ? <CsvButton href={csv('sources')} label="Export sources" /> : undefined}
      >
        {facts.sources.length === 0 ? (
          <div style={{ fontSize: 13, color: MUTED }}>No leads created or closed in this window.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Closed</th>
                  <th style={thStyle}>Won</th>
                  <th style={thStyle}>Lost</th>
                  <th style={thStyle}>Win rate</th>
                  <th style={thStyle}>Revenue won</th>
                  <th style={thStyle}>Revenue lost</th>
                </tr>
              </thead>
              <tbody>
                {facts.sources.map(row => (
                  <tr key={row.key}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{row.label}</td>
                    <td style={tdStyle}>{row.created}</td>
                    <td style={tdStyle}>{row.closed}</td>
                    <td style={{ ...tdStyle, color: row.won > 0 ? WON : NAVY, fontWeight: row.won > 0 ? 700 : 400 }}>{row.won}</td>
                    <td style={{ ...tdStyle, color: row.lost > 0 ? LOST : NAVY }}>{row.lost}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ minWidth: 42 }}>{rate(row.winRate)}</span>
                        <div style={{ flex: '1 1 auto', maxWidth: 90 }}><Bar share={row.winRate} color={WON} /></div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, background: row.weeklyRevenueWon > 0 ? WON_SOFT : undefined }}>
                      {row.weeklyRevenueWon > 0 ? money(row.weeklyRevenueWon) : '—'}
                    </td>
                    <td style={{ ...tdStyle, background: row.weeklyRevenueLost > 0 ? LOST_SOFT : undefined }}>
                      {row.weeklyRevenueLost > 0 ? money(row.weeklyRevenueLost) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Response ───────────────────────────────────────────────────── */}
      <Card
        title="How fast we answer"
        note={`Time from a lead being created to the first call, text, meeting or email logged against it. A note is not contact, so notes do not count. Leads created before ${RESPONSE_TIME_FROM} are excluded — their timestamps record when the row was imported, not when the family called.`}
        right={r.slowest.length > 0 ? <CsvButton href={csv('response')} label="Export" /> : undefined}
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 18 }}>
          <Stat value={hours(r.medianHours)} label="Median first response" sub={`${r.measured} leads measured`} tone={TEAL} />
          <Stat value={rate(r.withinOneDay)} label="Answered within 24 hours" />
          <Stat value={String(r.awaiting)} label="Awaiting a first touch" sub="Nothing logged yet" tone={r.awaiting > 0 ? LOST : undefined} />
          <Stat value={String(r.excludedLegacy)} label="Excluded as migrated" />
        </div>

        {r.measured > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
            {facts.responseBuckets.map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: BODY, width: 110, flex: '0 0 110px' }}>{b.label}</span>
                <div style={{ flex: '1 1 auto' }}><Bar share={b.share} color={TEAL} /></div>
                <span style={{ fontSize: 12, color: MUTED, width: 68, textAlign: 'right' }}>
                  {b.count} · {rate(b.share)}
                </span>
              </div>
            ))}
          </div>
        )}

        {r.slowest.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: BODY, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
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
                    <td style={{ ...tdStyle, color: row.hours > 72 ? LOST : NAVY }}>{hours(row.hours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

      {/* ── Pipeline ───────────────────────────────────────────────────── */}
      <Card
        title="What is in front of us — right now"
        note="Open leads only (ongoing and standby, not archived). A snapshot of the present, so it does not move when you change the window above. Weighted revenue applies each lead's close probability; unrated leads count at even odds."
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Stat value={String(p.open)} label="Open leads" sub={`${p.ongoing} ongoing · ${p.standby} standby`} tone={TEAL} />
          <Stat value={`${p.weeklyHours} hr`} label="Weekly hours in pipeline" />
          <Stat value={money(p.weeklyRevenue)} label="Weekly revenue if all won" />
          <Stat value={money(p.weightedMonthlyRevenue)} label="Weighted monthly revenue" sub="Probability-adjusted" />
          <Stat value={`${p.belowMin} (${rate(p.belowMinShare)})`} label="Below minimum" sub="Under 12 h/week and under $390/week" tone={p.belowMin > 0 ? AMBER : undefined} />
          <Stat value={String(p.noHoursOrRate)} label="Missing hours or rate" sub="Cannot be valued at all" tone={p.noHoursOrRate > 0 ? AMBER : undefined} />
        </div>
      </Card>

      {/* ── Agreements ─────────────────────────────────────────────────── */}
      <Card
        title="Service Agreements"
        note="Agreements prepared in this window and what became of them. A voided agreement is one replaced by a newer link, not a refusal."
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Stat value={rate(a.signRate)} label="Signed" sub={`${a.signed} of ${a.prepared} prepared`} tone={WON} />
          <Stat value={String(a.live)} label="Awaiting signature" tone={a.live > 0 ? AMBER : undefined} />
          <Stat value={String(a.voided)} label="Voided and replaced" />
          <Stat value={hours(a.medianHoursToSign)} label="Median time to sign" sub="Sent to signed" />
        </div>
      </Card>

      {/* ── Hygiene ────────────────────────────────────────────────────── */}
      <Card
        title="Record hygiene — all time, not this window"
        note="A won lead should carry a linked client record. These are work, not performance: use Link client record on each lead, one at a time."
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Stat value={String(h.wonTotal)} label="Won leads, all time" />
          <Stat value={String(h.withClientRecord)} label="With a client record" tone={WON} />
          <Stat
            value={String(h.missingClientRecord)}
            label="Missing a client record"
            sub={h.missingClientRecord > 0 ? 'Link each one individually — never in bulk' : 'All linked'}
            tone={h.missingClientRecord > 0 ? LOST : WON}
          />
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <CsvButton href={csv('leads')} label="Export every lead in this window" />
        <span style={{ fontSize: 11, color: MUTED }}>
          One row per lead created or closed in the window, with its outcome, source, value and first-response time.
        </span>
      </div>
    </div>
  )
}
