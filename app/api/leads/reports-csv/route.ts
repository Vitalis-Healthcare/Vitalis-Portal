// app/api/leads/reports-csv/route.ts
// CSV exports behind /leads/reports (v0.6.52). Admin/supervisor only —
// the same gate as the page and as the rest of the leads module.
//
// The route fetches the same rows the page fetches and calls the same
// functions in lib/leads/reports.ts. It does not compute anything of its
// own; if it did, an exported number could disagree with a displayed one.
//
// ?section=leads (default) | sources | losses | response
// ?range=30|90|180|ytd|all|custom  (+ &from=&to= when custom)

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildLeadReport, buildLeadRows, buildUndatedClosures, resolveRange } from '@/lib/leads/reports'
import type { ReportInput } from '@/lib/leads/reports'

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(',')]
  for (const r of rows) lines.push(r.map(csvCell).join(','))
  return lines.join('\r\n')
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
  const section = url.searchParams.get('section') || 'leads'
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

  let csv = ''
  let name = 'leads'

  if (section === 'sources') {
    const facts = buildLeadReport(input)
    name = 'source-performance'
    csv = toCsv(
      ['Source', 'Created in window', 'Closed in window', 'Won', 'Lost', 'Win rate %', 'Weekly revenue won', 'Weekly revenue lost'],
      facts.sources.map(s => [s.label, s.created, s.closed, s.won, s.lost, s.winRate ?? '',
        Math.round(s.weeklyRevenueWon), Math.round(s.weeklyRevenueLost)]),
    )
  } else if (section === 'losses') {
    const facts = buildLeadReport(input)
    name = 'loss-reasons'
    csv = toCsv(
      ['Reason', 'Reason code', 'Count', 'Share of losses %'],
      facts.losses.map(l => [l.label, l.code, l.count, l.share ?? '']),
    )
  } else if (section === 'undated') {
    name = 'undated-closures'
    const rows = buildUndatedClosures((leads || []) as any)
    csv = toCsv(
      ['Lead', 'Status', 'Source', 'Owner', 'Created', 'Weekly revenue', 'Client record linked'],
      rows.map(r => [r.name, r.status, r.source, r.owner, r.created_day, Math.round(r.weekly_revenue), r.client_record_linked]),
    )
  } else if (section === 'response') {
    name = 'response-times'
    const rows = buildLeadRows(input)
      .filter(r => r.first_response_hours !== null)
      .sort((a, b) => (b.first_response_hours || 0) - (a.first_response_hours || 0))
    csv = toCsv(
      ['Lead', 'Owner', 'Source', 'Created', 'First response (hours)', 'Status'],
      rows.map(r => [r.name, r.owner, r.source, r.created_day, r.first_response_hours, r.status]),
    )
  } else {
    name = 'leads'
    const rows = buildLeadRows(input)
    csv = toCsv(
      [
        'Lead', 'Care recipient', 'Source', 'Status', 'Stage', 'Owner',
        'Created', 'Outcome date', 'Lost reason code', 'Lost reason note',
        'Hours per week', 'Hourly rate', 'Weekly revenue', 'Below minimum',
        'Close probability %', 'Consent status', 'Client record linked',
        'First response (hours)', 'Counted as', 'Outcome date recorded',
      ],
      rows.map(r => [
        r.name, r.care_recipient, r.source, r.status, r.stage, r.owner,
        r.created_day, r.outcome_day, r.lost_reason_code, r.lost_reason,
        r.hours_week ?? '', r.hourly_rate ?? '', Math.round(r.weekly_revenue), r.below_minimum,
        r.close_probability ?? '', r.consent_status, r.client_record_linked,
        r.first_response_hours ?? '', r.counted_as, r.outcome_date_recorded,
      ]),
    )
  }

  const filename = `vitalis-${name}-${range.from}-to-${range.to}.csv`

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
