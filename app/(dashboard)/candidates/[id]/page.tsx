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
    .select('id, first_name, last_name, email, status, invited_at, created_at, test_passed_at, application_submitted_at, axiscare_pushed_at, axiscare_applicant_id, converted_to_profile_id')
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

  return (
    <CandidateDetailClient
      candidate={cand}
      application={appRow || null}
      documents={docRows || []}
      attempt={attempt || null}
      docTypes={ONB_DOCUMENT_TYPES}
    />
  )
}
