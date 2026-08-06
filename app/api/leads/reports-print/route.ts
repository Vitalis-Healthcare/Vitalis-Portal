// app/api/leads/reports-print/route.ts
// A self-contained, print-ready HTML report for the leads pipeline (v0.6.55).
// Admin/supervisor only. Open in a new tab and Cmd+P / Ctrl+P to print or
// Save as PDF — the same mechanism the compliance matrix, certificates and
// appraisals already use, rather than a second PDF mechanism to maintain.
//
// It fetches the same rows and calls the same builders as the screen, so the
// paper and the page cannot disagree. The public Vitalis brand is used here
// (Cormorant Garamond headings, green letterhead) because this document
// leaves the building; the on-screen page keeps the portal's navy and teal.
//
// ?range=30|90|180|ytd|all|custom (+ &from=&to= when custom)

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildLeadReport, resolveRange } from '@/lib/leads/reports'
import type { ReportInput, LeadReportFacts } from '@/lib/leads/reports'

const GREEN_DARK = '#2D5A1B'
const GREEN_BRIGHT = '#7AB52A'
const INK = '#1A2E44'
const BODY = '#4A6070'
const MUTED = '#8A9AA8'
const LINE = '#DDE5EA'
const WON = '#2D7D46'
const LOST = '#C2413C'

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function money(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

function rate(v: number | null): string { return v === null ? '—' : `${v}%` }

function hours(v: number | null): string {
  if (v === null) return '—'
  if (v < 1) return `${Math.round(v * 60)} min`
  if (v < 48) return `${v} hr`
  return `${Math.round(v / 24)} days`
}

function statBlock(value: string, label: string, sub?: string, color?: string): string {
  return `<div class="stat">
    <div class="stat-v" style="color:${color || INK}">${esc(value)}</div>
    <div class="stat-l">${esc(label)}</div>
    ${sub ? `<div class="stat-s">${esc(sub)}</div>` : ''}
  </div>`
}

function barCell(share: number | null, color: string): string {
  const w = Math.max(0, Math.min(100, share || 0))
  return `<div class="bar"><span style="width:${w}%;background:${color}"></span></div>`
}

function buildHtml(f: LeadReportFacts, agencyDate: string): string {
  const o = f.outcomes
  const p = f.pipeline
  const r = f.response
  const a = f.agreements
  const h = f.hygiene

  const cohortNote = f.range.key === 'all'
    ? 'Every won or lost lead on the books, including closures with no recorded date. Cancelled leads are administrative and are not counted as an outcome.'
    : 'Leads whose recorded outcome date falls inside the window. Cancelled leads are not counted as an outcome.'

  const monthRows = f.months.map(m => {
    const total = Math.max(1, ...f.months.map(x => x.won + x.lost))
    const wonW = (m.won / total) * 100
    const lostW = (m.lost / total) * 100
    return `<tr>
      <td>${esc(m.label)}</td>
      <td class="num">${m.won}</td>
      <td class="num">${m.lost}</td>
      <td class="num">${m.revenueWon > 0 ? money(m.revenueWon) : '—'}</td>
      <td class="num">${m.revenueLost > 0 ? money(m.revenueLost) : '—'}</td>
      <td style="width:180px">
        <div class="bar stacked">
          <span style="width:${wonW}%;background:${WON}"></span><span style="width:${lostW}%;background:${LOST}"></span>
        </div>
      </td>
    </tr>`
  }).join('')

  const lossRows = f.losses.length === 0
    ? `<tr><td colspan="4" class="empty">No dated losses in this window.</td></tr>`
    : f.losses.map(l => `<tr>
        <td${l.code === 'unspecified' ? ' class="flag"' : ''}>${esc(l.label)}</td>
        <td class="num">${l.count}</td>
        <td class="num">${rate(l.share)}</td>
        <td style="width:200px">${barCell(l.share, l.code === 'unspecified' ? '#B7791F' : LOST)}</td>
      </tr>`).join('')

  const sourceRows = f.sources.length === 0
    ? `<tr><td colspan="8" class="empty">No leads created or closed in this window.</td></tr>`
    : f.sources.map(s => `<tr>
        <td><strong>${esc(s.label)}</strong></td>
        <td class="num">${s.created}</td>
        <td class="num">${s.closed}</td>
        <td class="num won">${s.won}</td>
        <td class="num lost">${s.lost}</td>
        <td class="num">${rate(s.winRate)}</td>
        <td class="num">${s.weeklyRevenueWon > 0 ? money(s.weeklyRevenueWon) : '—'}</td>
        <td class="num">${s.weeklyRevenueLost > 0 ? money(s.weeklyRevenueLost) : '—'}</td>
      </tr>`).join('')

  const bucketRows = r.measured === 0
    ? `<tr><td colspan="3" class="empty">No first responses measured in this window.</td></tr>`
    : f.responseBuckets.map(b => `<tr>
        <td>${esc(b.label)}</td>
        <td class="num">${b.count}</td>
        <td style="width:240px">${barCell(b.share, GREEN_BRIGHT)}</td>
      </tr>`).join('')

  const slowRows = r.slowest.map(s => `<tr>
      <td>${esc(s.name)}</td><td>${esc(s.owner)}</td><td class="num">${hours(s.hours)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>Vitalis — Leads Report — ${esc(f.range.from)} to ${esc(f.range.to)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:28px; font-family:'DM Sans',system-ui,sans-serif; color:${INK}; background:#F4F6F7; }
  .sheet { max-width: 1000px; margin:0 auto; background:#fff; padding:34px 38px 44px; }
  header { border-bottom:3px solid ${GREEN_DARK}; padding-bottom:16px; margin-bottom:22px; }
  .brand { font-family:'Cormorant Garamond',Georgia,serif; font-size:30px; font-weight:700; color:${GREEN_DARK}; line-height:1; }
  .brand span { color:${GREEN_BRIGHT}; }
  .sub { font-size:11.5px; color:${MUTED}; margin-top:5px; letter-spacing:.04em; text-transform:uppercase; }
  h1 { font-family:'Cormorant Garamond',Georgia,serif; font-size:27px; margin:16px 0 4px; color:${INK}; }
  .range { font-size:12.5px; color:${BODY}; }
  h2 { font-family:'Cormorant Garamond',Georgia,serif; font-size:19px; margin:26px 0 3px; color:${GREEN_DARK};
       border-bottom:1px solid ${LINE}; padding-bottom:5px; }
  .note { font-size:10.5px; color:${MUTED}; line-height:1.55; margin:6px 0 12px; }
  .stats { display:flex; flex-wrap:wrap; gap:22px; margin:14px 0 4px; }
  .stat { min-width:118px; }
  .stat-v { font-size:22px; font-weight:700; line-height:1.1; }
  .stat-l { font-size:11px; font-weight:600; color:${BODY}; margin-top:4px; }
  .stat-s { font-size:10px; color:${MUTED}; margin-top:2px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  th { text-align:left; font-size:9.5px; text-transform:uppercase; letter-spacing:.06em; color:${BODY};
       padding:7px 8px; border-bottom:1.5px solid ${LINE}; }
  td { font-size:12px; padding:7px 8px; border-bottom:1px solid #F0F4F6; }
  td.num { text-align:right; white-space:nowrap; }
  td.won { color:${WON}; font-weight:600; }
  td.lost { color:${LOST}; }
  td.flag { color:#B7791F; font-weight:700; }
  td.empty { color:${MUTED}; font-style:italic; }
  .bar { height:7px; background:#EEF2F4; border-radius:4px; overflow:hidden; display:flex; }
  .bar span { display:block; height:100%; }
  .bar.stacked span:first-child { border-radius:4px 0 0 4px; }
  .banner { background:#FBF6EC; border-left:3px solid #B7791F; padding:10px 14px; font-size:11.5px;
            color:#7A5A15; margin:12px 0; line-height:1.55; }
  footer { margin-top:30px; padding-top:12px; border-top:1px solid ${LINE}; font-size:10px; color:${MUTED}; line-height:1.6; }
  .noprint { text-align:center; margin-bottom:18px; }
  .noprint button { font-family:inherit; font-size:13px; font-weight:700; padding:10px 22px; border:none;
                    border-radius:8px; background:${GREEN_DARK}; color:#fff; cursor:pointer; }
  @page { size: portrait; margin: 12mm; }
  @media print {
    body { background:#fff; padding:0; }
    .sheet { max-width:none; padding:0; }
    .noprint { display:none !important; }
    h2 { break-after:avoid; }
    table, tr { break-inside:avoid; }
  }
</style>
</head><body>
<div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="sheet">
  <header>
    <div class="brand">Vitalis<span>+</span> Healthcare Services</div>
    <div class="sub">Leads &amp; Pipeline — Performance Report</div>
    <h1>${esc(f.range.label)}</h1>
    <div class="range">${esc(f.range.from)} to ${esc(f.range.to)} · prepared ${esc(agencyDate)}</div>
  </header>

  <h2>Outcomes</h2>
  <p class="note">${esc(cohortNote)}</p>
  <div class="stats">
    ${statBlock(rate(o.winRate), 'Win rate', `${o.won} won of ${o.closed} closed`, GREEN_DARK)}
    ${statBlock(String(o.won), 'Won', undefined, WON)}
    ${statBlock(String(o.lost), 'Lost', undefined, LOST)}
    ${statBlock(money(o.weeklyRevenueWon), 'Weekly revenue won', 'Hours \u00D7 rate on won leads', WON)}
    ${statBlock(money(o.weeklyRevenueLost), 'Weekly revenue lost', 'Hours \u00D7 rate on lost leads', LOST)}
    ${statBlock(o.medianDaysToWin === null ? '—' : `${o.medianDaysToWin} days`, 'Median time to win',
      o.timedWins > 0 ? `From ${o.timedWins} dated win${o.timedWins === 1 ? '' : 's'}` : 'No dated wins')}
    ${statBlock(String(f.created.total), 'New leads created', 'In this window')}
  </div>
  ${o.undatedExcluded > 0 ? `<div class="banner"><strong>${o.undatedExcluded} closures carry no recorded outcome date</strong> and are excluded from this window. They were marked won or lost without a logged status transition, so nothing records when they closed. They appear in the All time view only.</div>` : ''}
  ${f.months.length > 0 ? `<table>
    <thead><tr><th>Month</th><th style="text-align:right">Won</th><th style="text-align:right">Lost</th>
    <th style="text-align:right">Revenue won</th><th style="text-align:right">Revenue lost</th><th></th></tr></thead>
    <tbody>${monthRows}</tbody></table>` : ''}

  <h2>Why we lost</h2>
  <p class="note">Leads lost in this window, grouped by the recorded reason code. A loss with no reason is a loss we cannot learn from.</p>
  <table><thead><tr><th>Reason</th><th style="text-align:right">Count</th><th style="text-align:right">Share</th><th></th></tr></thead>
  <tbody>${lossRows}</tbody></table>

  <h2>Source performance</h2>
  <p class="note">Created counts leads that arrived in this window. Closed, won and lost count leads that reached an outcome in it. Revenue is weekly, at the hours and rate recorded on the lead.</p>
  <table><thead><tr><th>Source</th><th style="text-align:right">Created</th><th style="text-align:right">Closed</th>
  <th style="text-align:right">Won</th><th style="text-align:right">Lost</th><th style="text-align:right">Win rate</th>
  <th style="text-align:right">Revenue won</th><th style="text-align:right">Revenue lost</th></tr></thead>
  <tbody>${sourceRows}</tbody></table>

  <h2>How fast we answer</h2>
  <p class="note">Time from a lead being created to the first call, text, meeting or email logged against it. Notes do not count as contact. Migrated leads are excluded — their timestamps record the import, not the inquiry.</p>
  <div class="stats">
    ${statBlock(hours(r.medianHours), 'Median first response', `${r.measured} leads measured`, GREEN_DARK)}
    ${statBlock(rate(r.withinOneDay), 'Within 24 hours')}
    ${statBlock(String(r.awaiting), 'Awaiting a first touch', 'Nothing logged yet', r.awaiting > 0 ? LOST : undefined)}
    ${statBlock(String(r.excludedLegacy), 'Excluded as migrated')}
  </div>
  <table><thead><tr><th>Response time</th><th style="text-align:right">Leads</th><th></th></tr></thead>
  <tbody>${bucketRows}</tbody></table>
  ${slowRows ? `<table><thead><tr><th>Slowest to answer</th><th>Owner</th><th style="text-align:right">First response</th></tr></thead><tbody>${slowRows}</tbody></table>` : ''}

  <h2>What is in front of us — right now</h2>
  <p class="note">Open leads only. A snapshot of the present, so it does not move with the window above. Weighted revenue applies each lead's close probability; unrated leads count at even odds.</p>
  <div class="stats">
    ${statBlock(String(p.open), 'Open leads', `${p.ongoing} ongoing · ${p.standby} standby`, GREEN_DARK)}
    ${statBlock(`${p.weeklyHours} hr`, 'Weekly hours')}
    ${statBlock(money(p.weeklyRevenue), 'Weekly revenue if all won')}
    ${statBlock(money(p.weightedMonthlyRevenue), 'Weighted monthly revenue')}
    ${statBlock(`${p.belowMin} (${rate(p.belowMinShare)})`, 'Below minimum', 'Under 12 h/wk and under $390/wk')}
    ${statBlock(String(p.noHoursOrRate), 'Missing hours or rate', 'Cannot be valued')}
  </div>

  <h2>Service Agreements &amp; record hygiene</h2>
  <div class="stats">
    ${statBlock(rate(a.signRate), 'Signed', `${a.signed} of ${a.prepared} prepared`, GREEN_DARK)}
    ${statBlock(String(a.live), 'Awaiting signature')}
    ${statBlock(hours(a.medianHoursToSign), 'Median time to sign')}
    ${statBlock(String(h.wonTotal), 'Won leads, all time')}
    ${statBlock(String(h.withClientRecord), 'With a client record', undefined, WON)}
    ${statBlock(String(h.missingClientRecord), 'Missing a client record', 'Link individually', h.missingClientRecord > 0 ? LOST : WON)}
  </div>

  <footer>
    Vitalis HealthCare Services LLC · 8757 Georgia Avenue, Suite 440, Silver Spring, MD 20910 ·
    Maryland OHCQ RSA Level 3, License #3879R<br />
    Generated from the Vitalis Portal leads pipeline on ${esc(agencyDate)}. Figures are computed live at the moment
    of printing; a report printed on a later date will differ as records change. Internal management document.
  </footer>
</div>
</body></html>`
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const svc = createServiceClient()
  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(viewer?.role || '')) {
    return new Response('Forbidden', { status: 403 })
  }

  const url = new URL(request.url)
  const range = resolveRange(
    url.searchParams.get('range'),
    url.searchParams.get('from'),
    url.searchParams.get('to'),
  )

  const [{ data: leads }, { data: activities }, { data: emails }, { data: consents }] =
    await Promise.all([
      svc.from('leads').select(`
        id, full_name, client_name, source, status, stage,
        created_at, updated_at, won_date, lost_date,
        lost_reason_code, lost_reason, archived_at,
        estimated_hours_week, hourly_rate, close_probability,
        assessment_client_id, consent_status,
        assignee:assigned_to(full_name)
      `),
      svc.from('lead_activities')
        .select('lead_id, activity_type, created_at')
        .in('activity_type', ['call', 'email', 'meeting', 'text']),
      svc.from('lead_emails').select('lead_id, created_at'),
      svc.from('lead_consents').select('lead_id, status, created_at, signed_at'),
    ])

  const input: ReportInput = {
    leads: (leads || []) as any,
    activities: (activities || []) as any,
    emails: (emails || []) as any,
    consents: (consents || []) as any,
    range,
  }

  const facts = buildLeadReport(input)
  const agencyDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York',
  })

  return new Response(buildHtml(facts, agencyDate), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
