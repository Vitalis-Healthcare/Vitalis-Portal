// app/(dashboard)/candidates/[id]/edit/page.tsx
// Staff-only "edit this candidate's application" screen. Server component: gates
// on staff role, loads the candidate + their saved application, and renders the
// shared ApplicationForm in staff mode (saves to the staff edit route; no status
// change, no candidate email).
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import { applicationRowToData, type ApplicationData } from '@/lib/onboarding/application'
import { ONB_DOCUMENT_TYPES } from '@/lib/onboarding/documents'
import ApplicationForm from '@/app/onboarding/application/ApplicationForm'

export const dynamic = 'force-dynamic'

export default async function CandidateEditPage({ params }: { params: Promise<{ id: string }> }) {
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
    .select('id, first_name, last_name, email')
    .eq('id', id)
    .maybeSingle()
  if (!cand) notFound()

  const { data: appRow } = await svc
    .from('onb_applications')
    .select('*')
    .eq('candidate_id', cand.id)
    .maybeSingle()

  const initial: ApplicationData = applicationRowToData(appRow, {
    first_name: cand.first_name, last_name: cand.last_name, email: cand.email,
  })

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" />
      <ApplicationForm
        token=""
        firstName={cand.first_name}
        initial={initial}
        documents={[]}
        docTypes={ONB_DOCUMENT_TYPES}
        readOnly={false}
        submitted={false}
        mode="staff"
        candidateId={cand.id}
        backHref={`/candidates/${cand.id}`}
      />
    </>
  )
}
