// app/(dashboard)/candidates/[id]/contract/page.tsx
//
// Staff-only page to issue an agreement to a candidate and see its history.
//
// This is a NEW page rather than an edit to CandidateDetailClient: that file is
// 500+ lines and string-patching large TSX has failed here before. The
// credentialing track (next release) links to this page.

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import ContractSendClient from './ContractSendClient'

export const dynamic = 'force-dynamic'

export default async function CandidateContractPage(
  { params }: { params: Promise<{ id: string }> },
) {
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
    .select('id, first_name, last_name, email, status')
    .eq('id', id)
    .maybeSingle()
  if (!cand) notFound()

  const { data: contracts } = await svc
    .from('onb_contracts')
    .select('id, template_key, position_title, pay_rate, sent_at, token_expires_at, signed_at, signature_name')
    .eq('candidate_id', id)
    .order('sent_at', { ascending: false })

  return (
    <ContractSendClient
      candidate={cand}
      contracts={contracts || []}
    />
  )
}
