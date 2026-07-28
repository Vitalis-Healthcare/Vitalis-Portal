// app/(dashboard)/candidates/[id]/credentials/page.tsx
//
// Where the care coordinator does their half of credentialing: obtain the CJIS
// background check and the MBON license verification, upload them, or waive the
// license for an unlicensed aide.
//
// Dynamic route -> params must be awaited (pitfalls #5).

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import { loadGateInput } from '@/lib/onboarding/gate-data'
import { evaluateContractGate } from '@/lib/onboarding/gates'
import CredentialGateClient from './CredentialGateClient'

export const dynamic = 'force-dynamic'

export default async function CandidateCredentialsPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) redirect('/dashboard')

  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, email, status, license_waived_at, license_waiver_reason')
    .eq('id', id)
    .maybeSingle()
  if (!cand) notFound()

  const gateInput = await loadGateInput(id)
  const gate = gateInput
    ? evaluateContractGate(gateInput)
    : { ok: false, blockers: [] }

  return (
    <CredentialGateClient
      candidate={{
        id: cand.id,
        first_name: cand.first_name,
        last_name: cand.last_name,
        status: cand.status,
        license_waived_at: cand.license_waived_at ?? null,
        license_waiver_reason: cand.license_waiver_reason ?? null,
      }}
      credentialType={gateInput?.credentialType ?? null}
      blockers={gate.blockers}
      gateOk={gate.ok}
    />
  )
}
