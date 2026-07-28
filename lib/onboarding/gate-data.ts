// lib/onboarding/gate-data.ts
//
// Loads everything the gate evaluator needs for one candidate, in one place.
// Both the enforcing routes and the explaining pages call this, so neither can
// drift from the other by reading a different set of facts.

import { createServiceClient } from '@/lib/supabase/service'
import type { GateInput } from '@/lib/onboarding/gates'

export async function loadGateInput(candidateId: string): Promise<GateInput | null> {
  const svc = createServiceClient()

  let candidateStatus: string | null = null
  let licenseWaivedAt: string | null = null
  let licenseWaiverReason: string | null = null
  let documentsAcceptedAt: string | null = null

  try {
    const { data, error } = await svc
      .from('onb_candidates')
      .select('id, status, license_waived_at, license_waiver_reason, documents_accepted_at')
      .eq('id', candidateId)
      .maybeSingle()
    if (error || !data) return null
    candidateStatus = data.status ?? null
    licenseWaivedAt = data.license_waived_at ?? null
    licenseWaiverReason = data.license_waiver_reason ?? null
    documentsAcceptedAt = data.documents_accepted_at ?? null
  } catch {
    return null
  }

  let credentialType: string | null = null
  try {
    const { data } = await svc
      .from('onb_applications')
      .select('credential_type')
      .eq('candidate_id', candidateId)
      .maybeSingle()
    credentialType = data?.credential_type ?? null
  } catch {
    credentialType = null
  }

  const docTypes: string[] = []
  try {
    const { data } = await svc
      .from('onb_documents')
      .select('doc_type')
      .eq('candidate_id', candidateId)
    for (const d of data ?? []) if (d.doc_type) docTypes.push(String(d.doc_type))
  } catch {
    // An empty list is the safe failure here: the gate stays closed.
  }

  let contractSignedAt: string | null = null
  try {
    const { data } = await svc
      .from('onb_contracts')
      .select('signed_at')
      .eq('candidate_id', candidateId)
      .not('signed_at', 'is', null)
      .order('signed_at', { ascending: false })
      .limit(1)
    if (Array.isArray(data) && data.length > 0) contractSignedAt = data[0].signed_at ?? null
  } catch {
    contractSignedAt = null
  }

  return {
    candidateId,
    candidateStatus,
    credentialType,
    licenseWaivedAt,
    licenseWaiverReason,
    documentsAcceptedAt,
    docTypes,
    contractSignedAt,
  }
}
