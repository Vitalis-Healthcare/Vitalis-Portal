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
    : { ok: false, blockers: [], warnings: [] }

  // The full attestation chain, newest first. A coordinator about to extend
  // needs to see how many times this has already been extended, and why.
  const { data: attRows } = await svc
    .from('onb_fingerprint_attestations')
    .select('id, sent_at, expected_by, note, extension_reason, created_at, created_by, cleared_at, superseded_at')
    .eq('candidate_id', id)
    .order('created_at', { ascending: false })
    .limit(20)
  const attestations = Array.isArray(attRows) ? attRows : []
  const live = attestations.find((a) => !a.cleared_at && !a.superseded_at) || null

  // Resolve who recorded each one, in a single query.
  const actorIds = Array.from(new Set(
    attestations.map((a) => a.created_by).filter((v): v is string => typeof v === 'string' && v.length > 0),
  ))
  const actorNames: Record<string, string> = {}
  if (actorIds.length > 0) {
    const { data: actors } = await svc.from('profiles').select('id, full_name').in('id', actorIds)
    for (const a of Array.isArray(actors) ? actors : []) {
      if (a?.id) actorNames[a.id] = a.full_name || ''
    }
  }

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
      warnings={gate.warnings || []}
      attestations={attestations}
      liveAttestation={live}
      actorNames={actorNames}
      gateOk={gate.ok}
    />
  )
}
