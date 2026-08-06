// app/api/leads/consent/[id]/document/route.ts
// Opens the SIGNED Service Agreement as a print-ready page (v0.6.56).
// Admin/supervisor only. Cmd+P / Ctrl+P to print or save as PDF — the same
// mechanism the certificates, compliance matrix and appraisals already use.
//
// No migration was needed for this. Since v0.6.46 the sign route has stored
// a complete `signed_html` snapshot on lead_consents, frozen at the moment of
// signature. What prints here is EXACTLY what the client agreed to, under the
// agreement version they agreed to it under — never a re-render from today's
// template. If the template changes tomorrow, this page does not.

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const svc = createServiceClient()
  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(viewer?.role || '')) {
    return new Response('Forbidden', { status: 403 })
  }

  const { data: consent } = await svc
    .from('lead_consents')
    .select('id, status, signed_html, signed_at, signer_name, agreement_version, prefill')
    .eq('id', id)
    .single()

  if (!consent) return new Response('Agreement not found', { status: 404 })

  if (consent.status !== 'signed' || !consent.signed_html) {
    return new Response(
      'This agreement has not been signed yet, so there is no signed copy to print.',
      { status: 409, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    )
  }

  const prefill: any = consent.prefill || {}
  const clientName = String(prefill.client_name || consent.signer_name || 'Client')
  const signedOn = consent.signed_at
    ? new Date(consent.signed_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York',
      })
    : ''

  const safeName = clientName.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-') || 'client'
  const title = `Vitalis Service Agreement — ${safeName}`

  // The snapshot is a complete document body. It is wrapped, never edited:
  // a print toolbar that hides itself, and a print stylesheet. Nothing in
  // the agreement text is touched.
  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body { margin:0; background:#F4F6F7; }
  .toolbar { position:sticky; top:0; z-index:50; background:#1A2E44; color:#fff;
             padding:12px 20px; display:flex; align-items:center; gap:16px; flex-wrap:wrap;
             font-family:'DM Sans',system-ui,sans-serif; }
  .toolbar .meta { font-size:12.5px; color:rgba(255,255,255,0.8); flex:1 1 auto; }
  .toolbar button { font-family:inherit; font-size:13px; font-weight:700; padding:9px 20px;
                    border:none; border-radius:8px; background:#7AB52A; color:#14290A; cursor:pointer; }
  .doc { max-width:900px; margin:0 auto; background:#fff; }
  @page { size:portrait; margin:14mm; }
  @media print {
    body { background:#fff; }
    .toolbar { display:none !important; }
    .doc { max-width:none; margin:0; }
  }
</style>
</head><body>
<div class="toolbar">
  <button onclick="window.print()">Print / Save as PDF</button>
  <span class="meta">Signed copy${signedOn ? ` &middot; signed ${signedOn}` : ''}${consent.agreement_version ? ` &middot; agreement version ${consent.agreement_version}` : ''}. This is the document exactly as the client signed it.</span>
</div>
<div class="doc">${consent.signed_html}</div>
</body></html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
