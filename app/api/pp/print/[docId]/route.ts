// app/api/pp/print/[docId]/route.ts
// Returns a self-contained, print-ready HTML document for a single policy.
// Opens in a new tab — user hits Ctrl+P / Cmd+P or clicks the print button.
// Admin/supervisor/staff/caregiver — any authenticated user can print.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params

  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const svc = createServiceClient()

  // ── Fetch policy + profile ──────────────────────────────────────────────────
  const { data: policy } = await svc
    .from('pp_policies')
    .select('*')
    .eq('doc_id', docId.toUpperCase())
    .single()

  if (!policy) return new NextResponse('Not found', { status: 404 })

  const { data: profile } = await svc
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // ── Acknowledgment state ───────────────────────────────────────────────────
  const { data: ack } = await svc
    .from('pp_acknowledgments')
    .select('acknowledged_at, doc_version')
    .eq('doc_id', policy.doc_id)
    .eq('user_id', user.id)
    .eq('doc_version', policy.version)
    .maybeSingle()

  const ppRole = profile?.role === 'admin'      ? 'Administrator'
    : profile?.role === 'supervisor' ? 'Director of Nursing'
    : profile?.role === 'caregiver'  ? 'CNA'
    : 'All Staff'

  const printedAt = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const effectiveDate = new Date(policy.effective_date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
  const reviewDate = new Date(policy.review_date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  const domainNames: Record<string, string> = {
    D1: 'Governance & Compliance',
    D2: 'Human Resources & Workforce',
    D3: 'Client Services & Care Delivery',
    D4: 'Clinical Operations',
    D5: 'Business Operations',
    D6: 'Client Rights & Safety',
    D7: 'Emergency & Business Continuity',
  }
  const tierLabels: Record<number, string> = {
    1: 'Tier 1 — Policy',
    2: 'Tier 2 — Procedure',
    3: 'Tier 3 — Work Instruction',
  }

  const ackBlock = ack
    ? `<div class="ack-block ack-done">
        <span class="ack-icon">✓</span>
        <div>
          <strong>Acknowledged by ${profile?.full_name || 'User'}</strong> (${ppRole})<br>
          <span class="ack-meta">Acknowledged on ${new Date(ack.acknowledged_at).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'long', timeStyle: 'short' })} ET · Document version v${ack.doc_version}</span>
        </div>
      </div>`
    : `<div class="ack-block ack-pending">
        <span class="ack-icon">○</span>
        <div>
          <strong>Acknowledgment pending</strong><br>
          <span class="ack-meta">This document requires acknowledgment by ${profile?.full_name || 'this user'} (${ppRole})</span>
        </div>
      </div>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${policy.doc_id} — ${policy.title} — Vitalis Healthcare</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap" rel="stylesheet"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', -apple-system, sans-serif;
    font-size: 13px;
    color: #1A2E44;
    background: #fff;
    padding: 0;
  }

  @media print {
    @page { size: A4 portrait; margin: 18mm 16mm 18mm 16mm; }
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-break { page-break-before: always; }
  }

  /* Print toolbar */
  .toolbar {
    background: #1A2E44;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .toolbar-title { color: #fff; font-size: 14px; font-weight: 700; }
  .print-btn {
    display: inline-flex; align-items: center; gap: 7px;
    background: #0E7C7B; color: #fff; border: none; border-radius: 8px;
    padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer;
  }

  /* Document wrapper */
  .doc-wrapper {
    max-width: 800px;
    margin: 32px auto;
    padding: 0 24px 48px;
  }

  /* Vitalis header */
  .vitalis-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 16px;
    border-bottom: 3px solid #0E7C7B;
    margin-bottom: 24px;
  }
  .vitalis-logo {
    font-size: 18px;
    font-weight: 800;
    color: #1A2E44;
  }
  .vitalis-sub {
    font-size: 11px;
    color: #8FA0B0;
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .doc-meta-right {
    text-align: right;
    font-size: 11px;
    color: #8FA0B0;
    line-height: 1.7;
  }

  /* Metadata pills row */
  .meta-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }
  .pill {
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .pill-domain { background: #ede9fe; color: #4c1d95; }
  .pill-tier   { background: #EFF2F5; color: #4A6070; }
  .pill-docid  { background: #F8FAFB; color: #8FA0B0; font-family: monospace; }
  .pill-ver    { background: #E6F4F4; color: #0E7C7B; }

  /* Title block */
  .doc-title {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 26px;
    font-weight: 400;
    color: #1A2E44;
    margin-bottom: 10px;
    line-height: 1.3;
  }

  /* 3-column metadata grid */
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    background: #F8FAFB;
    border: 1px solid #E8EDF0;
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 20px;
    font-size: 12px;
  }
  .meta-item-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #8FA0B0;
    margin-bottom: 3px;
  }
  .meta-item-value {
    font-size: 12px;
    font-weight: 600;
    color: #1A2E44;
  }

  /* Acknowledgment block */
  .ack-block {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 24px;
    font-size: 13px;
    line-height: 1.5;
  }
  .ack-done    { background: #E8F8F5; border: 1px solid #2A9D8F44; color: #1A2E44; }
  .ack-pending { background: #FEF3EA; border: 1px solid #F4A26144; color: #1A2E44; }
  .ack-icon    { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .ack-meta    { font-size: 11px; color: #8FA0B0; }

  /* Policy content area — preserve all existing styles from html_content */
  .policy-content-wrapper {
    border: 1px solid #E8EDF0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 24px;
  }

  /* Footer */
  .print-footer {
    border-top: 1px solid #E8EDF0;
    padding-top: 14px;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #8FA0B0;
  }
</style>
</head>
<body>

<!-- Toolbar (hidden when printing) -->
<div class="toolbar no-print">
  <span class="toolbar-title">📄 ${policy.doc_id} — ${policy.title}</span>
  <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
</div>

<div class="doc-wrapper">

  <!-- Vitalis header -->
  <div class="vitalis-header">
    <div>
      <div class="vitalis-logo">Vitalis Healthcare Services</div>
      <div class="vitalis-sub">Staff & Compliance Portal · Policy Document</div>
    </div>
    <div class="doc-meta-right">
      <div style="font-weight:700;color:#1A2E44;">${policy.doc_id} · v${policy.version}</div>
      <div>${domainNames[policy.domain] || policy.domain}</div>
      <div>${tierLabels[policy.tier] || `Tier ${policy.tier}`}</div>
    </div>
  </div>

  <!-- Pills -->
  <div class="meta-pills">
    <span class="pill pill-domain">${policy.domain}</span>
    <span class="pill pill-tier">${tierLabels[policy.tier] || `Tier ${policy.tier}`}</span>
    <span class="pill pill-docid">${policy.doc_id}</span>
    <span class="pill pill-ver">v${policy.version}</span>
  </div>

  <!-- Title -->
  <h1 class="doc-title">${policy.title}</h1>

  <!-- Metadata grid -->
  <div class="meta-grid">
    <div>
      <div class="meta-item-label">Effective Date</div>
      <div class="meta-item-value">${effectiveDate}</div>
    </div>
    <div>
      <div class="meta-item-label">Next Review</div>
      <div class="meta-item-value">${reviewDate}</div>
    </div>
    <div>
      <div class="meta-item-label">Document Owner</div>
      <div class="meta-item-value">${policy.owner_role}</div>
    </div>
    ${policy.comar_refs?.length > 0 ? `
    <div>
      <div class="meta-item-label">COMAR Reference</div>
      <div class="meta-item-value">${policy.comar_refs.join(', ')}</div>
    </div>` : ''}
    <div>
      <div class="meta-item-label">Applicable Roles</div>
      <div class="meta-item-value">${(policy.applicable_roles || []).join(', ') || 'All Staff'}</div>
    </div>
    <div>
      <div class="meta-item-label">Status</div>
      <div class="meta-item-value" style="text-transform:capitalize;">${policy.status}</div>
    </div>
  </div>

  <!-- Acknowledgment block -->
  ${ackBlock}

  <!-- Policy HTML content -->
  <div class="policy-content-wrapper">
    ${policy.html_content || '<div style="padding:24px;color:#8FA0B0;text-align:center;">No content available.</div>'}
  </div>

  <!-- Print footer -->
  <div class="print-footer">
    <span>Vitalis Healthcare Services · ${policy.doc_id} · v${policy.version} · CONFIDENTIAL</span>
    <span>Printed ${printedAt} ET by ${profile?.full_name || 'Staff'} (${ppRole})</span>
  </div>

</div>

</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
