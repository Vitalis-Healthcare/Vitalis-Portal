// app/onboarding/application/page.tsx
// Public, token-gated candidate application (no Supabase session). Server
// component: validates the magic-link token, decides which state the candidate
// is in, loads any saved draft + uploaded documents, and serves the form
// (editable) or a status notice (already submitted / not yet eligible).
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import {
  APPLICATION_EDITABLE_STATUSES,
  APPLICATION_SUBMITTED_STATUSES,
  applicationRowToData,
  type ApplicationData,
} from '@/lib/onboarding/application'
import { ONB_DOCUMENT_TYPES, type StoredDocument } from '@/lib/onboarding/documents'
import ApplicationForm from './ApplicationForm'

export const dynamic = 'force-dynamic'

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function Notice({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Segoe UI',Arial,sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ background: 'linear-gradient(135deg,#1A2E44 0%,#0E4A4A 100%)', padding: '22px 28px', borderRadius: '14px 14px 0 0', textAlign: 'center' }}>
          <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#0E7C7B,#F4A261)', borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 10 }}>V+</div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 800 }}>Vitalis Caregiver Application</h1>
        </div>
        <div style={{ background: '#fff', padding: '32px', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 14px 14px' }}>
          <h2 style={{ fontSize: 18, color: '#1A2E44', margin: '0 0 10px' }}>{title}</h2>
          <p style={{ color: '#4A6070', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{body}</p>
          {cta && (
            <div style={{ marginTop: 22 }}>
              <a href={cta.href} style={{ display: 'inline-block', padding: '13px 30px', background: 'linear-gradient(135deg,#0E7C7B,#1A9B87)', color: '#fff', textDecoration: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700 }}>
                {cta.label}
              </a>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: '#94A3B8', lineHeight: 1.8 }}>
          Vitalis Healthcare Services, LLC · Silver Spring, MD
        </div>
      </div>
    </div>
  )
}

export default async function ApplicationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  if (!token) return <Notice title="This link is not valid" body="Please use the application link from your email, or contact the Vitalis office." />

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, email, status, token_expires_at')
    .eq('access_token', hashToken(token))
    .single()

  if (!cand) return <Notice title="This link is not valid" body="Your link may have expired or been replaced by a newer one. Please contact the Vitalis office and we will send you a fresh link." />
  if (cand.token_expires_at && new Date(cand.token_expires_at) < new Date()) {
    return <Notice title="This link has expired" body="Please contact the Vitalis office and we will send you a fresh link." />
  }

  const status: string = cand.status || ''

  // Not yet eligible — they still need to pass the competency test first.
  if (status === 'invited' || status === 'testing') {
    return (
      <Notice
        title="Please complete your competency test first"
        body="Your application opens once you have completed the Vitalis caregiver competency test. Use the button below to continue your test."
        cta={{ href: `/onboarding/test?token=${token}`, label: 'Go to your competency test' }}
      />
    )
  }

  // Withdrawn or otherwise past the application stage.
  if (status === 'withdrawn') {
    return <Notice title="This application is closed" body="If you believe this is a mistake, please contact the Vitalis office." />
  }

  const editable = (APPLICATION_EDITABLE_STATUSES as readonly string[]).includes(status)
  const submitted = (APPLICATION_SUBMITTED_STATUSES as readonly string[]).includes(status)
  // axiscare_created / converted: already advanced — treat as submitted/read-only.
  const readOnly = !editable

  // Load existing draft (if any) and uploaded documents.
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

  // Build the initial form values from the saved row (or sensible defaults).
  const initial: ApplicationData = applicationRowToData(appRow, {
    first_name: cand.first_name, last_name: cand.last_name, email: cand.email,
  })

  const documents: StoredDocument[] = (docRows || []) as StoredDocument[]

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" />
      <ApplicationForm
        token={token}
        firstName={cand.first_name}
        initial={initial}
        documents={documents}
        docTypes={ONB_DOCUMENT_TYPES}
        readOnly={readOnly}
        submitted={submitted}
      />
    </>
  )
}
