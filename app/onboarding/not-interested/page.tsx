// app/onboarding/not-interested/page.tsx
//
// Public and token-gated, like every other candidate-facing page — applicants
// have no Supabase account. Outside the (dashboard) route group, so no auth
// layout applies.
//
// This page NEVER withdraws anyone by loading. Mail scanners, link-preview
// bots and "safe links" rewriters fetch every URL in an email before a human
// sees it; a GET that retired a candidate would quietly kill live applicants.
// The withdrawal happens only on an explicit button press, which POSTs.
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import NotInterestedClient from './NotInterestedClient'

export const dynamic = 'force-dynamic'

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

const SHELL: React.CSSProperties = {
  minHeight: '100vh', background: '#F8FAFC', display: 'flex',
  alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px',
  fontFamily: "'DM Sans','Segoe UI',Arial,sans-serif",
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div style={SHELL}>
      <div style={{ width: '100%', maxWidth: 520, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '32px 30px' }}>
        <h1 style={{ fontSize: 19, color: '#1A2E44', margin: '0 0 10px' }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#4A6070', lineHeight: 1.7, margin: 0 }}>{body}</p>
        <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.8, margin: '24px 0 0' }}>
          Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910
        </p>
      </div>
    </div>
  )
}

export default async function NotInterestedPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const raw = (token || '').trim()

  if (!raw) {
    return <Message title="This link is incomplete" body="Please open the link directly from the email we sent you. If you are stuck, reply to that email and we will help." />
  }

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, status, optout_expires_at, withdrawal_reason')
    .eq('optout_token', hashToken(raw))
    .maybeSingle()

  // A missing token and an expired one give the SAME answer, so this page can
  // never be used to discover which tokens exist.
  if (!cand || (cand.optout_expires_at && Date.parse(cand.optout_expires_at) < Date.now())) {
    return <Message title="This link has expired" body="For your security these links do not last forever. If you would like to tell us where you stand, reply to any email from us and we will take care of it." />
  }

  if (cand.status === 'converted') {
    return <Message title="You are already part of the team" body="Our records show you have already joined Vitalis, so there is nothing to withdraw here. If something has changed, please contact the Vitalis office directly." />
  }

  if (cand.status === 'withdrawn') {
    return <Message title="You are all set" body="We have already taken you off our list and you will not receive further emails about this application. If you change your mind, you are welcome to get in touch any time." />
  }

  return <NotInterestedClient token={raw} firstName={cand.first_name || ''} />
}
