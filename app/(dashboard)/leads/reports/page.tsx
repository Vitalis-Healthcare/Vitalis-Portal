// /leads/reports — the leads KPI page (v0.6.52).
//
// Admin/supervisor only, the same gate the rest of the leads module carries.
// The page FETCHES; lib/leads/reports.ts COMPUTES. The CSV route repeats the
// same two steps with the same functions, so an exported number and a
// displayed number cannot drift apart.
//
// Deliberately NOT here: anything the Thursday Brief already answers weekly
// (what moved, what stalled, who has no owner). This page answers the
// questions the Brief cannot — why we lose, which sources pay, how fast we
// answer the phone — over a range the reader chooses.

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { buildLeadReport, resolveRange } from '@/lib/leads/reports'
import LeadReportsClient from './LeadReportsClient'

export const dynamic = 'force-dynamic'

export default async function LeadReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  const { range: rangeKey, from, to } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const range = resolveRange(rangeKey, from, to)

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

  const facts = buildLeadReport({
    leads: (leads || []) as any,
    activities: (activities || []) as any,
    emails: (emails || []) as any,
    consents: (consents || []) as any,
    range,
  })

  return <LeadReportsClient facts={facts} />
}
