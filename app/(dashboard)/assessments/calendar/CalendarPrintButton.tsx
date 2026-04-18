'use client'
// app/(dashboard)/assessments/calendar/CalendarPrintButton.tsx

export type CalendarPrintRow = {
  clientName: string
  address:    string
  nurse:      string
  date:       string
  type:       string
  status:     string
}

function statusPill(status: string): string {
  if (status === 'overdue')   return '<span style="background:#FEF2F2;color:#B91C1C;font-weight:700;padding:2px 8px;border-radius:8px;font-size:9pt">Overdue</span>'
  if (status === 'completed') return '<span style="background:#F0FDF4;color:#15803D;font-weight:700;padding:2px 8px;border-radius:8px;font-size:9pt">Completed</span>'
  return '<span style="background:#EFF6FF;color:#1D4ED8;font-weight:600;padding:2px 8px;border-radius:8px;font-size:9pt">Scheduled</span>'
}

export default function CalendarPrintButton({
  rows,
  periodLabel,
  nurseLabel,
}: {
  rows:        CalendarPrintRow[]
  periodLabel: string
  nurseLabel:  string
}) {
  const handlePrint = () => {
    const generated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    const rowsHtml = rows.map((r, i) => `
      <tr style="${i % 2 === 1 ? 'background:#F8FAFC' : ''}">
        <td style="padding:8px 12px;font-weight:600;color:#1A2E44;border-bottom:1px solid #E2E8F0">${r.clientName}</td>
        <td style="padding:8px 12px;color:#4A6070;font-size:9.5pt;border-bottom:1px solid #E2E8F0">${r.address}</td>
        <td style="padding:8px 12px;color:#1A2E44;border-bottom:1px solid #E2E8F0;white-space:nowrap">${r.nurse}</td>
        <td style="padding:8px 12px;color:#1A2E44;font-weight:600;border-bottom:1px solid #E2E8F0;white-space:nowrap">${r.date}</td>
        <td style="padding:8px 12px;color:#4A6070;text-transform:capitalize;border-bottom:1px solid #E2E8F0">${r.type}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0">${statusPill(r.status)}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Vitalis — Assessment Calendar — ${periodLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background: #F8FAFC; color: #1A2E44; }
    .page { max-width: 1000px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #1A2E44 0%, #0E4A4A 100%); padding: 24px 32px 20px; }
    .header-logo { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; background: linear-gradient(135deg, #0E7C7B, #F4A261); border-radius: 10px; font-size: 18px; font-weight: 900; color: #fff; margin-bottom: 10px; }
    .header h1 { color: #fff; font-size: 18pt; font-weight: 800; margin-bottom: 4px; }
    .header-sub { color: rgba(255,255,255,0.55); font-size: 10pt; letter-spacing: 0.6px; text-transform: uppercase; }
    .meta { background: #E6F4F4; border: 1px solid #B2E0DF; border-top: none; padding: 12px 32px; font-size: 10pt; color: #0A5C5B; display: flex; gap: 20px; flex-wrap: wrap; }
    .meta strong { color: #1A2E44; }
    .content { padding: 24px 32px 40px; background: #fff; border: 1px solid #E2E8F0; border-top: none; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    thead tr { background: #0E7C7B; }
    th { padding: 10px 12px; text-align: left; font-size: 9pt; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
    .empty { text-align: center; color: #8FA0B0; padding: 32px; }
    .footer { text-align: center; padding: 16px; font-size: 9pt; color: #94A3B8; border-top: 1px solid #E2E8F0; }
    @media print {
      body { background: white; }
      .header, thead tr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-logo">V+</div>
    <h1>Vitalis Healthcare — Assessment Calendar</h1>
    <div class="header-sub">📅 ${periodLabel}</div>
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
          <th>Client</th><th>Address</th><th>Assigned Nurse</th><th>Date</th><th>Type</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="6" class="empty">No assessments this month.</td></tr>'}
      </tbody>
    </table>
  </div>
  <div class="footer">Vitalis Healthcare Services, LLC &nbsp;&middot;&nbsp; 8757 Georgia Avenue, Suite 440 &middot; Silver Spring, MD 20910</div>
</div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=1000,height=800')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.onload = () => win.print()
  }

  return (
    <button
      onClick={handlePrint}
      style={{ padding: '7px 14px', background: '#F8FAFC', border: '1px solid #D1D9E0', borderRadius: 7, fontSize: 13, color: '#4A6070', cursor: 'pointer', fontWeight: 500 }}
    >
      🖨 Print
    </button>
  )
}
