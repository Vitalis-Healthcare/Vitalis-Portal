// app/api/reports/compliance-pdf/route.ts
// Returns a self-contained, print-ready HTML document for the full compliance matrix.
// Admin/supervisor only. Landscape layout, BCHD-ready branding.
// Open in new tab and Ctrl+P / Cmd+P to print or Save as PDF.

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getComplianceData } from '@/lib/reports'
import type { CredStatus } from '@/lib/reports'

export async function GET() {
  // ── Auth + role gate ──────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const svc = createServiceClient()
  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(viewer?.role || '')) {
    return new Response('Forbidden', { status: 403 })
  }

  // ── Fetch data ────────────────────────────────────────────────────────────
  const { matrixRows, caregiverCredTypes, generatedAt, totalCaregivers, overallCompliancePct } =
    await getComplianceData()

  const printDate = new Date(generatedAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // ── Status rendering helpers ──────────────────────────────────────────────
  const STATUS_STYLES: Record<CredStatus, { cell: string; label: string }> = {
    current:      { cell: '#27AE60', label: '● Current' },
    expiring:     { cell: '#E67E22', label: '◐ Expiring' },
    expired:      { cell: '#E74C3C', label: '✕ Expired' },
    missing:      { cell: '#9B59B6', label: '◉ Missing' },
    na:           { cell: '#95A5A6', label: '— N/A' },
    not_required: { cell: '#E0E8EE', label: '' },
  }

  function cellHtml(status: CredStatus, expiryDate: string | null | undefined): string {
    const s = STATUS_STYLES[status]
    if (!s.label) return '<td style="background:#F5F7F8;text-align:center;">—</td>'
    const tooltip = expiryDate
      ? ` title="${s.label.replace(/\S+ /, '')} — ${new Date(expiryDate).toLocaleDateString('en-US')}"`
      : ''
    return `<td${tooltip} style="text-align:center;padding:6px 4px;background:#fff;">
      <span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${s.cell};font-size:10px;"></span>
    </td>`
  }

  // ── Build HTML rows ───────────────────────────────────────────────────────
  const dataRows = matrixRows.map((row, idx) => {
    const credCells = caregiverCredTypes.map((ct) => {
      const cell = row.credentials[ct.id] || { status: 'missing' as CredStatus }
      return cellHtml(cell.status, cell.expiry_date)
    }).join('')

    const pctColor = row.credential_compliance_pct >= 80 ? '#27AE60' : row.credential_compliance_pct >= 60 ? '#E67E22' : '#E74C3C'
    const trainingColor = row.training_pct >= 80 ? '#27AE60' : row.training_pct >= 50 ? '#E67E22' : '#E74C3C'
    const refsColor = row.refs_received === 3 ? '#27AE60' : row.refs_received >= 1 ? '#E67E22' : '#95A5A6'
    const appraisalText =
      row.latest_appraisal?.status === 'signed' ? `✓ Signed (${row.latest_appraisal.avg_score.toFixed(1)})` :
      row.latest_appraisal?.status === 'sent'   ? `Sent`  :
      row.latest_appraisal                       ? `Draft` : 'None'
    const appraisalColor =
      row.latest_appraisal?.status === 'signed' ? '#27AE60' :
      row.latest_appraisal?.status === 'sent'   ? '#E67E22' : '#95A5A6'

    const bg = idx % 2 === 0 ? '#fff' : '#F8FAFB'
    return `
      <tr style="background:${bg};">
        <td style="padding:7px 10px;font-weight:600;font-size:11px;color:#1A2E44;white-space:nowrap;border-right:1px solid #E8EDF0;">
          ${row.full_name}${row.position_name ? `<br><span style="font-weight:400;color:#8FA0B0;font-size:10px;">${row.position_name}</span>` : ''}
        </td>
        ${credCells}
        <td style="text-align:center;padding:6px;font-size:11px;font-weight:700;color:${trainingColor};">${row.training_pct}%</td>
        <td style="text-align:center;padding:6px;font-size:11px;font-weight:700;color:${refsColor};">${row.refs_received}/3</td>
        <td style="text-align:center;padding:6px;font-size:11px;font-weight:700;color:${row.policies_signed > 0 ? '#0E7C7B' : '#95A5A6'};">${row.policies_signed}</td>
        <td style="text-align:center;padding:6px;font-size:11px;font-weight:700;color:${appraisalColor};">${appraisalText}</td>
        <td style="text-align:center;padding:6px;">
          <span style="display:inline-block;background:${pctColor}18;color:${pctColor};font-weight:700;font-size:11px;border-radius:12px;padding:2px 8px;">${row.credential_compliance_pct}%</span>
        </td>
      </tr>`
  }).join('')

  // Summary footer row
  const footerCredCells = caregiverCredTypes.map((ct) => {
    const cells = matrixRows.map((r) => r.credentials[ct.id]?.status)
    const ok   = cells.filter((s) => s === 'current' || s === 'na').length
    const warn = cells.filter((s) => s === 'expiring').length
    const bad  = cells.filter((s) => s === 'expired'  || s === 'missing').length
    return `<td style="text-align:center;padding:6px 4px;font-size:10px;font-weight:700;">
      ${ok   > 0 ? `<span style="color:#27AE60;">✓${ok}</span> ` : ''}
      ${warn > 0 ? `<span style="color:#E67E22;">⚠${warn}</span> ` : ''}
      ${bad  > 0 ? `<span style="color:#E74C3C;">✕${bad}</span>` : ''}
    </td>`
  }).join('')

  const avgTraining = matrixRows.length > 0
    ? Math.round(matrixRows.reduce((s, r) => s + r.training_pct, 0) / matrixRows.length) : 0
  const totalRefs   = matrixRows.reduce((s, r) => s + r.refs_received, 0)
  const fleetPctColor = overallCompliancePct >= 80 ? '#27AE60' : overallCompliancePct >= 60 ? '#E67E22' : '#E74C3C'

  // Credential type column headers
  const credHeaders = caregiverCredTypes.map((ct) =>
    `<th style="text-align:center;padding:8px 4px;font-size:9px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.4px;width:52px;max-width:52px;word-break:break-word;line-height:1.3;">${ct.short_name}</th>`
  ).join('')

  // ── Final HTML ────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Vitalis Healthcare — Compliance Matrix — ${printDate}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1A2E44; background: #fff; }
  @media print {
    @page { size: landscape; margin: 12mm 10mm; }
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  table { border-collapse: collapse; width: 100%; }
  th, td { border-bottom: 1px solid #E8EDF0; vertical-align: middle; }
  .print-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: #0E7C7B; color: #fff; border: none; border-radius: 8px;
    padding: 10px 20px; font-size: 14px; font-weight: 700; cursor: pointer;
  }
</style>
</head>
<body>

<!-- Print button (hidden when printing) -->
<div class="no-print" style="background:#1A2E44;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;">
  <span style="color:#fff;font-size:14px;font-weight:700;">Compliance Matrix Report — Preview</span>
  <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
</div>

<div style="padding:20px 24px;">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #0E7C7B;">
    <div>
      <div style="font-size:22px;font-weight:800;color:#1A2E44;">Vitalis Healthcare Services</div>
      <div style="font-size:14px;color:#8FA0B0;margin-top:4px;">Staff Compliance Matrix Report</div>
      <div style="font-size:12px;color:#8FA0B0;margin-top:2px;">Generated: ${printDate}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:28px;font-weight:800;color:${fleetPctColor};">${overallCompliancePct}%</div>
      <div style="font-size:11px;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.8px;">Fleet Compliance</div>
      <div style="font-size:11px;color:#8FA0B0;margin-top:2px;">${totalCaregivers} Active Caregiver${totalCaregivers !== 1 ? 's' : ''}</div>
    </div>
  </div>

  <!-- Legend -->
  <div style="display:flex;gap:20px;margin-bottom:16px;flex-wrap:wrap;background:#F8FAFB;padding:10px 14px;border-radius:8px;">
    <span style="font-size:11px;font-weight:700;color:#1A2E44;">Legend:</span>
    <span style="font-size:11px;color:#27AE60;font-weight:600;">● Current</span>
    <span style="font-size:11px;color:#E67E22;font-weight:600;">◐ Expiring</span>
    <span style="font-size:11px;color:#E74C3C;font-weight:600;">✕ Expired</span>
    <span style="font-size:11px;color:#9B59B6;font-weight:600;">◉ Missing</span>
    <span style="font-size:11px;color:#95A5A6;font-weight:600;">— N/A</span>
    <span style="font-size:11px;color:#D1D9E0;">— Not Required</span>
  </div>

  <!-- Matrix table -->
  <div style="overflow-x:auto;">
    <table>
      <thead>
        <tr style="background:#F8FAFB;">
          <th style="text-align:left;padding:10px;font-size:11px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.8px;min-width:160px;border-right:1px solid #E8EDF0;">Caregiver</th>
          ${credHeaders}
          <th style="text-align:center;padding:8px;font-size:10px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.4px;width:58px;">Training</th>
          <th style="text-align:center;padding:8px;font-size:10px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.4px;width:48px;">Refs</th>
          <th style="text-align:center;padding:8px;font-size:10px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.4px;width:54px;">Policies</th>
          <th style="text-align:center;padding:8px;font-size:10px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.4px;width:80px;">Appraisal</th>
          <th style="text-align:center;padding:8px;font-size:10px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.4px;width:60px;">Cred %</th>
        </tr>
      </thead>
      <tbody>
        ${dataRows}
      </tbody>
      <tfoot>
        <tr style="background:#EFF8F8;border-top:2px solid #0E7C7B33;">
          <td style="padding:8px 10px;font-weight:700;font-size:11px;color:#0E7C7B;text-transform:uppercase;border-right:1px solid #E8EDF0;">
            Summary (${matrixRows.length})
          </td>
          ${footerCredCells}
          <td style="text-align:center;padding:6px;font-size:11px;font-weight:700;color:#0E7C7B;">${avgTraining}%</td>
          <td style="text-align:center;padding:6px;font-size:11px;font-weight:700;color:#0E7C7B;">${totalRefs}/${matrixRows.length * 3}</td>
          <td colspan="2" style="text-align:center;padding:6px;"></td>
          <td style="text-align:center;padding:6px;">
            <span style="display:inline-block;background:${fleetPctColor}18;color:${fleetPctColor};font-weight:800;font-size:12px;border-radius:12px;padding:3px 10px;">${overallCompliancePct}%</span>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Footer -->
  <div style="margin-top:20px;padding-top:12px;border-top:1px solid #E8EDF0;display:flex;justify-content:space-between;font-size:10px;color:#8FA0B0;">
    <span>Vitalis Healthcare Services · Staff Compliance Matrix · CONFIDENTIAL</span>
    <span>Document generated ${printDate} · For BCHD compliance use only</span>
  </div>

</div>
<script>
  // Auto-open print dialog when page loads (comment out if not desired)
  // window.addEventListener('load', () => window.print())
</script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
