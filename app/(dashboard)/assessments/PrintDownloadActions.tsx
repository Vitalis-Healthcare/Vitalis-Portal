'use client'
// app/(dashboard)/assessments/PrintDownloadActions.tsx

type ReportRow = {
  clientName: string
  address: string
  nurse: string
  dueDate: string
  daysLabel: string
  type: string
  status: string
}

function typeStyle(type: string): string {
  if (type === 'EP Annual' || type === 'EP Emergency') return 'color:#0E7C7B;font-weight:700'
  if (type === 'Initial')   return 'color:#92400E;font-weight:700'
  if (type === 'Emergency') return 'color:#B91C1C;font-weight:700'
  return 'color:#4A6070'
}

function statusPill(status: string): string {
  if (status === 'overdue')   return '<span style="background:#FEF2F2;color:#B91C1C;font-weight:700;padding:2px 10px;border-radius:10px;font-size:9pt;white-space:nowrap">Overdue</span>'
  if (status === 'completed') return '<span style="background:#F0FDF4;color:#15803D;font-weight:700;padding:2px 10px;border-radius:10px;font-size:9pt;white-space:nowrap">Completed</span>'
  return '<span style="background:#EFF6FF;color:#1D4ED8;font-weight:600;padding:2px 10px;border-radius:10px;font-size:9pt;white-space:nowrap">Scheduled</span>'
}

function buildHtml(rows: ReportRow[], periodLabel: string, nurseLabel: string): string {
  const generated = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const rowsHtml = rows.map((r, i) => `
    <tr style="${i % 2 === 1 ? 'background:#F8FAFC' : ''}">
      <td style="padding:8px 12px;font-weight:600;color:#1A2E44;border-bottom:1px solid #E2E8F0">${r.clientName}</td>
      <td style="padding:8px 12px;color:#4A6070;font-size:9.5pt;border-bottom:1px solid #E2E8F0">${r.address}</td>
      <td style="padding:8px 12px;color:#1A2E44;border-bottom:1px solid #E2E8F0;white-space:nowrap">${r.nurse}</td>
      <td style="padding:8px 12px;color:#1A2E44;border-bottom:1px solid #E2E8F0;white-space:nowrap">${r.dueDate}</td>
      <td style="padding:8px 12px;font-weight:700;border-bottom:1px solid #E2E8F0;white-space:nowrap;color:${r.daysLabel.includes('overdue') ? '#B91C1C' : r.daysLabel === 'Today' ? '#D97706' : '#4A6070'}">${r.daysLabel}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;white-space:nowrap;${typeStyle(r.type)}">${r.type}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0">${statusPill(r.status)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Vitalis — Assessment Schedule</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background: #F8FAFC; color: #1A2E44; }
    .page { max-width: 1100px; margin: 0 auto; padding: 0; }
    .header { background: linear-gradient(135deg, #1A2E44 0%, #0E4A4A 100%); padding: 24px 32px 20px; border-radius: 0; }
    .header-logo { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; background: linear-gradient(135deg, #0E7C7B, #F4A261); border-radius: 10px; font-size: 18px; font-weight: 900; color: #fff; margin-bottom: 10px; }
    .header h1 { color: #fff; font-size: 20pt; font-weight: 800; margin-bottom: 4px; }
    .header-sub { color: rgba(255,255,255,0.55); font-size: 10pt; letter-spacing: 0.8px; text-transform: uppercase; }
    .meta { background: #E6F4F4; border: 1px solid #B2E0DF; border-top: none; padding: 12px 32px; font-size: 10pt; color: #0A5C5B; display: flex; gap: 24px; flex-wrap: wrap; }
    .meta strong { color: #1A2E44; }
    .content { padding: 24px 32px 40px; background: #fff; border: 1px solid #E2E8F0; border-top: none; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    thead tr { background: #0E7C7B; }
    th { padding: 10px 12px; text-align: left; font-size: 9pt; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    .empty { text-align: center; color: #8FA0B0; padding: 32px; font-size: 11pt; }
    .footer { text-align: center; padding: 16px 32px; font-size: 9pt; color: #94A3B8; border-top: 1px solid #E2E8F0; }
    @media print {
      body { background: white; }
      .page { max-width: 100%; }
      .header { border-radius: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead tr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-logo">V+</div>
    <h1>Vitalis Healthcare — Assessment Schedule</h1>
    <div class="header-sub">Staff &amp; Compliance Hub</div>
  </div>
  <div class="meta">
    <span>Period: <strong>${periodLabel}</strong></span>
    <span>Nurse: <strong>${nurseLabel}</strong></span>
    <span>Generated: <strong>${generated}</strong></span>
    <span><strong>${rows.length}</strong> assessment${rows.length !== 1 ? 's' : ''}</span>
  </div>
  <div class="content">
    <table>
      <thead>
        <tr>
          <th>Client</th>
          <th>Address</th>
          <th>Assigned Nurse</th>
          <th>Due Date</th>
          <th>Days</th>
          <th>Type</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" class="empty">No assessments in this period.</td></tr>'}
      </tbody>
    </table>
  </div>
  <div class="footer">
    Vitalis Healthcare Services, LLC &nbsp;&middot;&nbsp; 8757 Georgia Avenue, Suite 440 &middot; Silver Spring, MD 20910
  </div>
</div>
</body>
</html>`
}

export default function PrintDownloadActions({
  rows,
  periodLabel,
  nurseLabel,
}: {
  rows: ReportRow[]
  periodLabel: string
  nurseLabel: string
}) {
  const handlePrint = () => {
    const html = buildHtml(rows, periodLabel, nurseLabel)
    const win = window.open('', '_blank', 'width=1100,height=800')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.onload = () => win.print()
  }

  const handleDownload = () => {
    const html = buildHtml(rows, periodLabel, nurseLabel)
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `assessment-schedule-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div data-no-print="true" style={{ display: 'flex', gap: 8 }}>
      <button onClick={handlePrint} style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, color: '#4A6070', cursor: 'pointer', fontWeight: 500 }}>
        🖨 Print
      </button>
      <button onClick={handleDownload} style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, color: '#0E7C7B', cursor: 'pointer', fontWeight: 600 }}>
        ⬇ Download HTML
      </button>
    </div>
  )
}
