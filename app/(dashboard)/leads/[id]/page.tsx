import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import LeadDetailClient from './LeadDetailClient'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) redirect('/dashboard')

  const { data: lead } = await svc
    .from('leads')
    .select(`*, assignee:assigned_to(full_name), secondary:secondary_assigned_to(full_name), creator:created_by(full_name)`)
    .eq('id', id)
    .single()

  if (!lead) notFound()

  const { data: activities } = await svc
    .from('lead_activities')
    .select(`*, author:created_by(full_name)`)
    .eq('lead_id', id)
    .order('created_at', { ascending: false })

  // ── v0.6.45: outbound emails for this lead (timeline badges) ─────────
  const { data: leadEmails } = await svc
    .from('lead_emails')
    .select('id, activity_id, to_email, subject, template_key, status, failure_reason, delivered_at, bounced_at, opened_at, created_at')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })

  const { data: staff } = await svc
    .from('profiles').select('id, full_name')
    .in('role', ['admin', 'supervisor']).eq('status', 'active').order('full_name')

  // ── v0.6.38: the detail page finally reads lead_stages from the DB.
  // Before the split it carried its own hardcoded stage list, so custom
  // stages added in Settings were invisible here.
  const { data: stages } = await svc
    .from('lead_stages')
    .select('key, label, color, bg_color, order_index')
    .eq('is_active', true)
    .order('order_index')

  // ── v0.6.44: the edit form gets the same vocabulary as Add New Lead ──
  // Live service types (the ten chips) and referral sources for linking.
  // Before this ship the edit form carried its own stale six-item list
  // and had no source/referral/relationship fields at all.
  const { data: serviceTypes } = await svc
    .from('lead_service_types')
    .select('label')
    .eq('is_active', true)
    .order('order_index')

  const { data: referralSources } = await svc
    .from('referral_sources')
    .select('id, name, organization')
    .eq('is_active', true)
    .order('name')

  // ── v0.6.42: assessment context for the Intake Milestones panel ──────
  // If the lead is linked to a client record, surface the most relevant
  // assessment: the earliest OPEN one (scheduled/overdue) wins; otherwise
  // the latest completed one. Supabase joined relations return T | T[],
  // so the nurse name is guarded with Array.isArray.
  const pickNurseName = (v: unknown): string | null => {
    if (Array.isArray(v)) return (v[0] as { full_name?: string } | undefined)?.full_name ?? null
    return (v as { full_name?: string } | null)?.full_name ?? null
  }

  let assessmentClient: { id: string; full_name: string; status: string } | null = null
  let assessment: {
    id: string; status: string; scheduled_date: string | null
    completed_date: string | null; is_initial: boolean; nurse_name: string | null
  } | null = null

  if (lead.assessment_client_id) {
    const { data: ac } = await svc
      .from('assessment_clients').select('id, full_name, status')
      .eq('id', lead.assessment_client_id).maybeSingle()
    if (ac) {
      assessmentClient = ac
      const assessmentSelect = 'id, status, scheduled_date, completed_date, is_initial, nurse:nurse_id(full_name)'
      const { data: openRows } = await svc
        .from('assessments').select(assessmentSelect)
        .eq('client_id', ac.id).in('status', ['scheduled', 'overdue'])
        .order('scheduled_date', { ascending: true }).limit(1)
      let row = openRows?.[0]
      if (!row) {
        const { data: doneRows } = await svc
          .from('assessments').select(assessmentSelect)
          .eq('client_id', ac.id).eq('status', 'completed')
          .order('completed_date', { ascending: false, nullsFirst: false }).limit(1)
        row = doneRows?.[0]
      }
      if (row) {
        assessment = {
          id: row.id, status: row.status, scheduled_date: row.scheduled_date,
          completed_date: row.completed_date, is_initial: row.is_initial,
          nurse_name: pickNurseName(row.nurse),
        }
      }
    }
  }

  // Nurse dropdown — the assessments module's sole criterion, verbatim.
  const { data: nurses } = await svc
    .from('profiles').select('id, full_name')
    .eq('can_be_assigned', true).eq('status', 'active').order('full_name')

  // Link-existing picker — only unlinked, non-discharged client records,
  // and only needed while the lead has no linked record yet.
  let linkableClients: { id: string; full_name: string }[] = []
  if (!lead.assessment_client_id) {
    const { data: lc } = await svc
      .from('assessment_clients').select('id, full_name')
      .eq('status', 'active').is('lead_id', null).order('full_name')
    linkableClients = lc || []
  }

  return (
    <LeadDetailClient
      lead={lead}
      activities={activities || []}
      staff={staff || []}
      stages={stages || []}
      serviceTypes={serviceTypes || []}
      referralSources={referralSources || []}
      currentUserId={user.id}
      currentUserName={profile?.full_name || ''}
      currentUserEmail={user.email || ''}
      leadEmails={leadEmails || []}
      isAdmin={profile?.role === 'admin'}
      assessmentClient={assessmentClient}
      assessment={assessment}
      nurses={nurses || []}
      linkableClients={linkableClients}
    />
  )
}
