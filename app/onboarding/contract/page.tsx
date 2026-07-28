// app/onboarding/contract/page.tsx
//
// PUBLIC page — candidates have no Supabase account, so this route sits outside
// the (dashboard) group and gates itself on the hashed token (pitfalls #4/#15).
//
// The document itself is rendered by /api/onboarding/contract/document inside a
// frame, so the agreement is always the one true rendering rather than a
// re-implementation of it in JSX that could drift from the signed snapshot.

import { findContractByRawToken, isExpired, documentDate } from '@/lib/onboarding/contract'
import { CONTRACT_TEMPLATES, type ContractTemplateKey } from '@/lib/onboarding/contract-templates'
import ContractSignClient from './ContractSignClient'

export const dynamic = 'force-dynamic'

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#EEF1EC', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '32px 20px',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    }}>
      <div style={{
        background: '#fff', border: '1px solid #D8DFD3', borderRadius: 12,
        padding: '40px 36px', maxWidth: 460, textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22,
          fontWeight: 700, color: '#2D5A1B', marginBottom: 14,
        }}>
          Vitalis Healthcare Services
        </div>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#1C2A18', margin: '0 0 10px' }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#5A6656', lineHeight: 1.65, margin: 0 }}>{body}</p>
        <p style={{ fontSize: 13, color: '#7A8875', lineHeight: 1.7, margin: '20px 0 0' }}>
          Office 240.716.6874
        </p>
      </div>
    </div>
  )
}

export default async function ContractPage(
  { searchParams }: { searchParams: Promise<{ token?: string }> },
) {
  const { token } = await searchParams
  const raw = (token || '').trim()

  if (!raw) {
    return <Notice title="Signing link required" body="Open the link from the email we sent you." />
  }

  const contract = await findContractByRawToken(raw)
  if (!contract) {
    return (
      <Notice
        title="This link is not valid"
        body="It may have been superseded by a newer agreement. Contact the office and we will send you a fresh link."
      />
    )
  }

  if (!contract.signed_at && isExpired(contract)) {
    return (
      <Notice
        title="This link has expired"
        body="Signing links are valid for 21 days. Contact the office and we will send you a new one."
      />
    )
  }

  const template = CONTRACT_TEMPLATES[contract.template_key as ContractTemplateKey]
  if (!template) {
    return (
      <Notice
        title="This agreement could not be prepared"
        body="Please contact the office so we can put it right."
      />
    )
  }

  return (
    <ContractSignClient
      token={raw}
      docTitle={template.docTitle}
      positionTitle={template.positionTitle}
      payRate={contract.pay_rate}
      acknowledgment={template.acknowledgment.replace(/&amp;/g, '&')}
      alreadySigned={!!contract.signed_at}
      signatureName={contract.signature_name}
      signedOn={contract.signed_at ? documentDate(contract.signed_at) : null}
    />
  )
}
