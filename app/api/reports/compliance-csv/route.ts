// app/api/reports/compliance-csv/route.ts
// Returns a downloadable CSV of the full compliance matrix.
// Columns: Caregiver, [each required credential type], Training%, Refs, Policies, Appraisal, Score, Cred%
// Admin/supervisor only.

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getComplianceData } from '@/lib/reports'
import type { CredStatus } from '@/lib/reports'

// ── Helpers ──────────────────────────────────────────────────────────────────

function csvCell(value: string): string {
  // RFC 4180: wrap in quotes if contains comma, quote, or newline
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatCredCell(status: CredStatus, expiryDate?: string | null, doesNotExpire?: boolean): string {
  switch (status) {
    case 'current':
      return doesNotExpire
        ? 'Current (No Expiry)'
        : expiryDate
          ? `Current (${new Date(expiryDate).toLocaleDateString('en-US')})`
          : 'Current'
    case 'expiring':
      return expiryDate
        ? `EXPIRING (${new Date(expiryDate).toLocaleDateString('en-US')})`
        : 'Expiring'
    case 'expired':
      return expiryDate
        ? `EXPIRED (${new Date(expiryDate).toLocaleDateString('en-US')})`
        : 'Expired'
    case 'missing':
      return 'MISSING'
    case 'na':
      return 'N/A'
    case 'not_required':
      return 'Not Required'
    default:
      return ''
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

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
  const { matrixRows, caregiverCredTypes, generatedAt } = await getComplianceData()

  // ── Build CSV ─────────────────────────────────────────────────────────────
  const lines: string[] = []

  // Metadata header
  lines.push(`# Vitalis Healthcare Services — Compliance Matrix Report`)
  lines.push(`# Generated: ${new Date(generatedAt).toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`)
  lines.push(`# CONFIDENTIAL — For BCHD compliance use only`)
  lines.push(``)

  // Column headers
  const headers = [
    'Caregiver',
    'Position',
    'Hire Date',
    ...caregiverCredTypes.map((ct) => ct.name),
    'Training %',
    'References (of 3)',
    'Policies Signed',
    'Appraisal Status',
    'Appraisal Score',
    'Credential Compliance %',
  ]
  lines.push(headers.map(csvCell).join(','))

  // Data rows
  for (const row of matrixRows) {
    const credValues = caregiverCredTypes.map((ct) => {
      const cell = row.credentials[ct.id] || { status: 'missing' as CredStatus }
      return formatCredCell(cell.status, cell.expiry_date, cell.does_not_expire)
    })

    const appraisalStatus =
      row.latest_appraisal?.status === 'signed' ? 'Signed' :
      row.latest_appraisal?.status === 'sent'   ? 'Sent (Awaiting Sign-off)' :
      row.latest_appraisal                       ? 'Draft' : 'None'

    const appraisalScore =
      row.latest_appraisal?.avg_score
        ? row.latest_appraisal.avg_score.toFixed(1)
        : ''

    const hireDate = row.hire_date
      ? new Date(row.hire_date).toLocaleDateString('en-US')
      : ''

    const dataRow = [
      row.full_name,
      row.position_name || '',
      hireDate,
      ...credValues,
      `${row.training_pct}%`,
      `${row.refs_received}/3`,
      String(row.policies_signed),
      appraisalStatus,
      appraisalScore,
      `${row.credential_compliance_pct}%`,
    ]
    lines.push(dataRow.map(csvCell).join(','))
  }

  // Summary footer
  lines.push(``)
  const avgCompliance =
    matrixRows.length > 0
      ? Math.round(matrixRows.reduce((s, r) => s + r.credential_compliance_pct, 0) / matrixRows.length)
      : 0
  lines.push(`"SUMMARY","","","${caregiverCredTypes.map(() => '').join('","')}","",""," Fleet Avg","","","${avgCompliance}%"`)

  const csv = lines.join('\r\n')  // RFC 4180 uses CRLF

  const dateStr = new Date(generatedAt)
    .toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '-')
  const filename = `vitalis-compliance-matrix-${dateStr}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
