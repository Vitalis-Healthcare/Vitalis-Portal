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

export default function PrintDownloadActions({
  rows,
  periodLabel,
  nurseLabel,
}: {
  rows: ReportRow[]
  periodLabel: string
  nurseLabel: string
}) {
  const handlePrint = () => window.print()

  const handleDownload = () => {
    const generated = new Date().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })

    const rowsHtml = rows.map(r => `
      <tr>
        <td>${r.clientName}</td>
        <td>${r.address}</td>
        <td>${r.nurse}</td>
        <td>${r.dueDate}</td>
        <td>${r.daysLabel}</td>
        <td style="text-transform:capitalize">${r.type}</td>
        <td style="text-transform:capitalize">${r.status}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Vitalis — Assessment Schedule</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #1A2E44; margin: 40px; }
    h1 { font-size: 18pt; margin: 0 0 4px; color: #0A5C5B; }
    .meta { font-size: 10pt; color: #4A6070; margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    th { background: #0E7C7B; color: #fff; padding: 8px 10px; text-align: left; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 7px 10px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
    tr:nth-child(even) td { background: #F8FAFC; }
    .status-scheduled { color: #1D4ED8; font-weight: 600; }
    .status-overdue   { color: #B91C1C; font-weight: 600; }
    .status-completed { color: #15803D; font-weight: 600; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>🩺 Vitalis Healthcare — Assessment Schedule</h1>
  <p class="meta">
    Period: <strong>${periodLabel}</strong> &nbsp;|&nbsp;
    Nurse: <strong>${nurseLabel}</strong> &nbsp;|&nbsp;
    Generated: ${generated} &nbsp;|&nbsp;
    ${rows.length} assessment${rows.length !== 1 ? 's' : ''}
  </p>
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
      ${rowsHtml || '<tr><td colspan="7" style="text-align:center;color:#8FA0B0;padding:24px">No assessments in this period.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`

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
      <button
        onClick={handlePrint}
        style={{
          padding: '8px 16px', background: '#F8FAFC', border: '1px solid #D1D9E0',
          borderRadius: 7, fontSize: 13, color: '#4A6070', cursor: 'pointer', fontWeight: 500,
        }}
      >
        🖨 Print
      </button>
      <button
        onClick={handleDownload}
        style={{
          padding: '8px 16px', background: '#F8FAFC', border: '1px solid #D1D9E0',
          borderRadius: 7, fontSize: 13, color: '#0E7C7B', cursor: 'pointer', fontWeight: 600,
        }}
      >
        ⬇ Download HTML
      </button>
    </div>
  )
}
