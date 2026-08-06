// app/(dashboard)/candidates/[id]/page.tsx
// Staff-only candidate detail + application review. Server component: gates on
// staff role, loads the candidate, their application, uploaded documents, and
// their competency-test result, then renders the review client.
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import { ONB_DOCUMENT_TYPES } from '@/lib/onboarding/documents'
import CandidateDetailClient from './CandidateDetailClient'

export const dynamic = 'force-dynamic'

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  const isStaff = role === 'admin' || role === 'supervisor' || role === 'staff'
  if (!isStaff) redirect('/dashboard')

  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, email, status, track, invited_at, created_at, test_passed_at, application_submitted_at, axiscare_pushed_at, axiscare_applicant_id, axiscare_login_sent_at, converted_to_profile_id, documents_accepted_at, documents_accepted_by, documents_accepted_note, paper_application_at, paper_application_by, paper_application_note')
    .eq('id', id)
    .maybeSingle()
  if (!cand) notFound()

  const { data: appRow } = await svc
    .from('onb_applications')
    .select('*')
    .eq('candidate_id', cand.id)
    .maybeSingle()

  const { data: docRows } = await svc
    .from('onb_documents')
    .select('id, doc_type, file_name, storage_path, mime_type, size_bytes, uploaded_at')
    .eq('candidate_id', cand.id)
    .order('uploaded_at', { ascending: false })

  const { data: attempt } = await svc
    .from('onb_attempts')
    .select('first_score, first_total, first_passed, mastery_reached, completed_at')
    .eq('candidate_id', cand.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // The pending request, if any, plus the most recent decision — so a returned
  // candidate can show WHY they came back without the coordinator hunting.
  const { data: reqRows } = await svc
    .from('onb_conversion_requests')
    .select('id, status, requested_by, requested_at, requested_note, decided_by, decided_at, decision_note')
    .eq('candidate_id', cand.id)
    .order('requested_at', { ascending: false })
    .limit(5)

  // Application reminders already sent. A coordinator about to chase someone
  // needs to see how hard we have chased them already.
  const { data: reminderRows } = await svc
    .from('onb_application_reminders')
    .select('id, reminder_number, kind, sent_at')
    .eq('candidate_id', cand.id)
    .order('sent_at', { ascending: false })
    .limit(10)

  const requests = Array.isArray(reqRows) ? reqRows : []
  const pendingRequest = requests.find((r) => r.status === 'pending') || null
  const lastReturned = requests.find((r) => r.status === 'returned') || null

  // Resolve the names behind the ids in one query rather than one per row.
  const actorIds = Array.from(new Set(
    [pendingRequest?.requested_by, lastReturned?.decided_by, cand.documents_accepted_by, cand.paper_application_by]
      .filter((v): v is string => typeof v === 'string' && v.length > 0),
  ))
  const actorNames: Record<string, string> = {}
  if (actorIds.length > 0) {
    const { data: actors } = await svc.from('profiles').select('id, full_name').in('id', actorIds)
    for (const a of Array.isArray(actors) ? actors : []) {
      if (a?.id) actorNames[a.id] = a.full_name || ''
    }
  }

  return (
    <CandidateDetailClient
      candidate={cand}
      viewerRole={role || 'staff'}
      pendingRequest={pendingRequest}
      lastReturned={lastReturned}
      actorNames={actorNames}
      application={appRow || null}
      documents={docRows || []}
      attempt={attempt || null}
      reminders={Array.isArray(reminderRows) ? reminderRows : []}
      docTypes={ONB_DOCUMENT_TYPES}
    />
  )
}
