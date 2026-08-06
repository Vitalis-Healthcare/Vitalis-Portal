// app/consent/[token]/page.tsx
// ═════════════════════════════════════════════════════════════════════════
// Ship 5b (v0.6.46) — the PUBLIC signing page for the Service Agreement.
//
// Public + token-gated (the established Vita pattern: candidate test,
// certificate, documents pages). No Supabase account involved — the
// 48-hex token IS the auth. Lives outside (dashboard) so the layout
// auth gate never sees it.
//
// First view of a live link: status 'sent' → 'viewed', viewed_at
// stamped, and a "Consent form viewed" line on the lead timeline —
// this is the RELIABLE viewed signal (our own server, not a pixel).
// Signed links render the immutable snapshot; void links get a calm
// explanation and the office number.
// ═════════════════════════════════════════════════════════════════════════
import { createServiceClient } from '@/lib/supabase/service'
import ConsentSignClient from './ConsentSignClient'
import type { ConsentPrefill } from '@/lib/leads/consent-content'

export const dynamic = 'force-dynamic'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F4F3EC', fontFamily: "'DM Sans', Arial, sans-serif", padding: '24px 12px 60px' }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;700&family=Great+Vibes&display=swap" rel="stylesheet" />
      {children}
    </div>
  )
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div style={{ maxWidth: 560, margin: '60px auto', background: '#FFF', borderRadius: 10, padding: '36px 32px', textAlign: 'center', boxShadow: '0 3px 20px rgba(45,90,27,0.12)' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: '#2D5A1B', marginBottom: 12 }}>Vitalis HealthCare</div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#2A2A26', margin: '0 0 10px' }}>{title}</h1>
        <p style={{ fontSize: 14.5, color: '#55554E', lineHeight: 1.65, margin: 0 }}>{body}</p>
        <p style={{ fontSize: 13, color: '#8A8A80', marginTop: 18 }}>Questions? Call us at (240) 716-6874.</p>
      </div>
    </Shell>
  )
}

export default async function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!token || !/^[a-f0-9]{48}$/.test(token)) {
    return <Notice title="This link isn't valid" body="The signing link appears incomplete. Please open the link from your email again, or call us and we'll resend it." />
  }

  const svc = createServiceClient()
  const { data: consent } = await svc
    .from('lead_consents')
    .select('id, lead_id, status, agreement_version, prefill, rep_name, rep_signed_at, signed_html, viewed_at')
    .eq('token', token)
    .maybeSingle()

  if (!consent) {
    return <Notice title="This link isn't active" body="This signing link is no longer active. If you were expecting to sign your Vitalis Service Agreement, call us and we'll send you a fresh link right away." />
  }

  if (consent.status === 'void') {
    return <Notice title="A newer version of your agreement was sent" body="This link was replaced by a newer one — please open the most recent email from us, or call us and we'll resend it." />
  }

  if (consent.status === 'signed' && consent.signed_html) {
    // Revisits see the signed agreement exactly as it was executed.
    return (
      <Shell>
        <div style={{ maxWidth: 760, margin: '0 auto 16px', background: '#F0F6E9', border: '1px solid #C9DDB8', borderRadius: 8, padding: '12px 18px', fontSize: 13.5, color: '#2D5A1B', fontWeight: 600, textAlign: 'center' }}>
          This agreement has been signed. A copy was emailed to you for your records.
        </div>
        <div style={{ maxWidth: 760, margin: '0 auto', borderRadius: 10, overflow: 'hidden', boxShadow: '0 3px 20px rgba(45,90,27,0.12)' }}
          dangerouslySetInnerHTML={{ __html: consent.signed_html }} />
      </Shell>
    )
  }

  // ── Live link: log the first view (the reliable viewed signal) ────────
  if (consent.status === 'sent') {
    const nowIso = new Date().toISOString()
    await svc.from('lead_consents').update({ status: 'viewed', viewed_at: nowIso }).eq('id', consent.id).eq('status', 'sent')
    try {
      await svc.from('lead_activities').insert({
        lead_id: consent.lead_id, created_by: null,
        activity_type: 'status_change',
        content: 'Consent form viewed by the recipient',
      })
    } catch (err) { console.error('[consent/view] timeline insert failed:', err) }
  }

  return (
    <Shell>
      <ConsentSignClient
        token={token}
        prefill={consent.prefill as ConsentPrefill}
        repName={consent.rep_name}
        repSignedAt={consent.rep_signed_at}
        agreementVersion={consent.agreement_version}
      />
    </Shell>
  )
}
