// app/(dashboard)/candidates/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import CandidatesClient from './CandidatesClient'

export default async function CandidatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  const isStaff = role === 'admin' || role === 'supervisor' || role === 'staff'
  if (!isStaff) redirect('/dashboard')

  // Explicit column list. The previous version selected every column, which
  // shipped access_token - the sha256 of the magic-link token - to the
  // browser, where nothing used it. Do not reintroduce a wildcard here.
  const { data: rows } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, email, status, track, source, access_token, invited_at, created_at, test_passed_at, application_submitted_at, axiscare_pushed_at')
    .order('created_at', { ascending: false })

  // A candidate pushed in from CareMatch360 has never been sent anything, so
  // the action reads "Invite" rather than "Resend". Only whether a token
  // exists reaches the client, never the token itself.
  const candidates = (rows || []).map((c) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    status: c.status,
    track: c.track || 'full',
    source: c.source ?? null,
    invited_at: c.invited_at,
    created_at: c.created_at,
    test_passed_at: c.test_passed_at,
    application_submitted_at: c.application_submitted_at,
    axiscare_pushed_at: c.axiscare_pushed_at,
    invited: !!c.access_token,
  }))

  return <CandidatesClient candidates={candidates} />
}
