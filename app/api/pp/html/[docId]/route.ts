import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const svc = createServiceClient()

  const { data: policy } = await svc
    .from('pp_policies')
    .select('doc_id, html_content, version, applicable_roles, status')
    .eq('doc_id', docId.toUpperCase())
    .single()

  if (!policy) return new NextResponse('Not found', { status: 404 })

  const { data: profile } = await svc
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const ppRole = profile?.role === 'admin' ? 'Administrator'
    : profile?.role === 'supervisor' ? 'Director of Nursing'
    : profile?.role === 'caregiver' ? 'CNA'
    : 'All Staff'

  const roles = policy.applicable_roles || []
  const appliesToUser = roles.includes('All Staff') || roles.includes(ppRole)

  // Check existing ack
  const { data: ack } = await svc
    .from('pp_acknowledgments')
    .select('acknowledged_at')
    .eq('doc_id', policy.doc_id)
    .eq('user_id', user.id)
    .eq('doc_version', policy.version)
    .maybeSingle()

  const isAcked = !!ack

  // Inject auth context and wire up the acknowledge button
  const injectedScript = `
<script>
window.__VITALIS_USER__ = ${JSON.stringify({ id: user.id, name: profile?.full_name || '', role: ppRole })};
window.__VITALIS_ACK_STATUS__ = ${isAcked};

(function() {
  var btn = document.getElementById('ack-btn');
  if (!btn) return;

  var docId = '${policy.doc_id}';
  var version = '${policy.version}';
  var applies = ${appliesToUser};

  if (!applies) { btn.style.display = 'none'; return; }

  if (${isAcked}) {
    btn.textContent = '✓ Acknowledged';
    btn.style.background = '#1A9B87';
    btn.style.borderColor = '#1A9B87';
    btn.style.color = 'white';
    btn.disabled = true;
    return;
  }

  btn.addEventListener('click', async function() {
    this.textContent = 'Submitting…';
    this.disabled = true;
    try {
      var res = await fetch('/api/pp/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: docId, docVersion: version, timestamp: new Date().toISOString() })
      });
      if (res.ok) {
        this.textContent = '✓ Acknowledged';
        this.style.background = '#1A9B87';
        this.style.borderColor = '#1A9B87';
        this.style.color = 'white';
        // Notify parent frame
        window.parent.postMessage({ type: 'VITALIS_ACK_COMPLETE', docId: docId }, '*');
      } else {
        this.textContent = 'Error — try again';
        this.disabled = false;
      }
    } catch(e) {
      this.textContent = 'Error — try again';
      this.disabled = false;
    }
  });
})();
</script>
`

  // The html_content already contains <style> + <main> — wrap in a full page
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; background: #fff; }
  /* Hide the document's own breadcrumb/nav since portal provides it */
  .breadcrumb { display: none !important; }
</style>
</head>
<body>
${policy.html_content}
${injectedScript}
</body>
</html>`

  return new NextResponse(fullHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}
