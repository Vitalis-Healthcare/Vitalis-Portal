// app/api/appraisals/print/route.ts
// Returns a fully self-contained printable HTML document for an HHA appraisal.
// Admin/supervisor only. Shows all scores, electronic sign-off evidence, timestamps.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const CLINICAL_ITEMS = [
  { key: 's_patient_care_duties',        label: 'Assists professional staff by performing patient care duties in the home' },
  { key: 's_medications',                label: 'Assists with medications that are ordinarily self-administered' },
  { key: 's_care_conferences',           label: 'Attends and participates in patient care conferences as specified in Agency policy' },
  { key: 's_personal_care',              label: 'Provides personal care and bath as assigned' },
  { key: 's_shampoo',                    label: 'Shampoos hair as ordered/directed as assigned' },
  { key: 's_bed_linen',                  label: 'Bed linen change as needed/patient/family requests and/or is RN directed' },
  { key: 's_vitals',                     label: 'Takes accurate temperature, pulse, respiration, blood pressure' },
  { key: 's_reports_changes',            label: 'Reports any unusual findings, changes in patient\'s condition to RN' },
  { key: 's_height_weight',              label: 'Takes accurate height and weight as assigned. Records on medical record' },
  { key: 's_bedpan',                     label: 'Assists with placement of bedpan and urinal' },
  { key: 's_enemas',                     label: 'Administers enemas as assigned by the RN' },
  { key: 's_specimens',                  label: 'Collects specimen as directed by RN; reports immediately any unusual specimens' },
  { key: 's_room_order',                 label: 'Leaves patient\'s room in order, disposing of papers, cups and other items in trash' },
  { key: 's_household_services',         label: 'Performs household services essential to health care in the home as RN assigned' },
  { key: 's_safety_devices',             label: 'Uses safety rules and regulations regarding assistive ambulatory devices' },
  { key: 's_body_mechanics',             label: 'When assisting patients, uses good body mechanics' },
  { key: 's_therapy_extension',          label: 'Performs simple procedures as an extension of therapy or nursing service as assigned' },
  { key: 's_equipment_cleaning',         label: 'Follows Agency policy for cleaning equipment between patient use' },
  { key: 's_documentation',             label: 'Carries out, reports and documents care given in an effective, timely manner' },
  { key: 's_asks_for_help',              label: 'Realizes when help is needed and asks RN for assistance when appropriate' },
  { key: 's_own_actions',               label: 'Understands responsibility for own actions and omissions' },
  { key: 's_completes_work',             label: 'Completes all work assigned' },
  { key: 's_no_unqualified_assignments', label: 'Does not accept assignments without appropriate training' },
  { key: 's_confidentiality',            label: 'Observes confidentiality and safeguards all patient related information' },
  { key: 's_meetings',                   label: 'Attends staff meetings and patient care conferences as scheduled' },
  { key: 's_chart_documentation',        label: 'Maintains current documentation of status on chart and gives proper report to RN' },
]

const PROFESSIONAL_ITEMS = [
  { key: 's_variance_reporting',         label: 'Any variance, accident or unusual occurrence is reported to the RN' },
  { key: 's_qapi',                       label: 'Participates in QAPI activities as requested' },
  { key: 's_policies_adherence',         label: 'Understands and adheres to established policies/procedures' },
  { key: 's_agency_standards',           label: 'Adheres to Agency standards and consistently performs all assigned responsibilities' },
  { key: 's_attendance',                 label: 'Maintains acceptable attendance status, per Agency policy' },
  { key: 's_tardiness',                  label: 'Maintains acceptable level of tardiness, per Agency policy' },
  { key: 's_reports_incomplete',         label: 'Reports incomplete work assignments to RN' },
  { key: 's_appearance',                 label: 'Appearance is always within Agency standard; is clean and well groomed' },
  { key: 's_time_management',            label: 'Demonstrates effective time management skills' },
  { key: 's_inservices',                 label: 'Attends all mandatory inservice programs as scheduled: minimally 12 hours/year' },
  { key: 's_clean_environment',          label: 'Maintains clean and neat work environment' },
  { key: 's_judgment',                   label: 'Demonstrates sound judgment and decision making' },
  { key: 's_cpr_certification',          label: 'Maintains current CPR certification, if required' },
  { key: 's_other_duties',              label: 'Performs other duties as assigned' },
]

const ALL_ITEMS = [...CLINICAL_ITEMS, ...PROFESSIONAL_ITEMS]

const SCORE_LABELS: Record<number, string> = { 1: 'Does Not Meet Standards', 2: 'Needs Improvement', 3: 'Meets Standards', 4: 'Exceeds Standards' }
const SCORE_COLORS: Record<number, string> = { 1: '#E63946', 2: '#F4A261', 3: '#457B9D', 4: '#2A9D8F' }

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const svc = createServiceClient()
  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor', 'staff'].includes(viewer?.role || '')) {
    return new Response('Forbidden', { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const appraisalId = searchParams.get('appraisalId')
  if (!appraisalId) return new Response('appraisalId required', { status: 400 })

  const { data: a } = await svc
    .from('appraisals')
    .select('*, caregiver:caregiver_id(full_name), appraiser:appraiser_id(full_name)')
    .eq('id', appraisalId)
    .single()

  if (!a) return new Response('Not found', { status: 404 })

  const caregiverName = (a.caregiver as any)?.full_name || 'Unknown'
  const appraiserName = (a.appraiser as any)?.full_name || 'Supervisor'
  const printedAt     = new Date()

  const scoredItems = ALL_ITEMS.filter(i => a[i.key])
  const totalScore  = scoredItems.reduce((sum, i) => sum + a[i.key], 0)
  const avgScore    = scoredItems.length > 0 ? (totalScore / scoredItems.length).toFixed(2) : '—'

  const scoreRow = (item: { key: string; label: string }, score: number) => {
    const filled = [1,2,3,4].map(s =>
      `<td style="text-align:center;padding:7px 4px;border-bottom:1px solid #F3F4F6;">
        ${score === s
          ? `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${SCORE_COLORS[s]};"></span>`
          : `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;border:2px solid #CBD5E0;"></span>`
        }
      </td>`).join('')
    return `<tr>
      <td style="padding:7px 12px;font-size:12px;color:#1A2E44;border-bottom:1px solid #F3F4F6;line-height:1.5;">${item.label}</td>
      ${filled}
      <td style="padding:7px 8px;border-bottom:1px solid #F3F4F6;">
        ${score ? `<span style="font-size:11px;font-weight:700;color:${SCORE_COLORS[score]};white-space:nowrap;">${score} — ${SCORE_LABELS[score]}</span>` : '<span style="color:#CBD5E0;font-size:11px;">—</span>'}
      </td>
    </tr>`
  }

  const sectionTable = (items: typeof CLINICAL_ITEMS, sectionName: string) => `
    <div style="margin-bottom:24px;">
      <h3 style="font-size:13px;font-weight:800;color:#1A2E44;text-transform:uppercase;letter-spacing:0.5px;padding:10px 14px;background:#F8FAFB;border:1px solid #E2E8F0;border-radius:6px 6px 0 0;margin:0;">${sectionName}</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 6px 6px;overflow:hidden;">
        <thead>
          <tr style="background:#F8FAFB;">
            <th style="text-align:left;padding:8px 12px;font-size:11px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.5px;width:50%;border-bottom:1px solid #E2E8F0;">Competency</th>
            <th style="text-align:center;padding:8px 4px;font-size:10px;font-weight:700;color:#E63946;border-bottom:1px solid #E2E8F0;">1</th>
            <th style="text-align:center;padding:8px 4px;font-size:10px;font-weight:700;color:#F4A261;border-bottom:1px solid #E2E8F0;">2</th>
            <th style="text-align:center;padding:8px 4px;font-size:10px;font-weight:700;color:#457B9D;border-bottom:1px solid #E2E8F0;">3</th>
            <th style="text-align:center;padding:8px 4px;font-size:10px;font-weight:700;color:#2A9D8F;border-bottom:1px solid #E2E8F0;">4</th>
            <th style="text-align:left;padding:8px 8px;font-size:11px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #E2E8F0;">Rating</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => scoreRow(item, a[item.key])).join('')}
        </tbody>
      </table>
    </div>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Performance Appraisal — ${caregiverName} — ${a.appraisal_period || 'Annual'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1A2E44; font-size: 13px; line-height: 1.5; }
    .page { max-width: 820px; margin: 0 auto; padding: 40px 48px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 20px; border-bottom: 3px solid #0E7C7B; margin-bottom: 24px; }
    .logo-block { display: flex; align-items: center; gap: 14px; }
    .logo-badge { width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(135deg, #0E7C7B, #F4A261); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 900; flex-shrink: 0; }
    .logo-text h1 { font-size: 17px; font-weight: 800; color: #1A2E44; }
    .logo-text p { font-size: 10px; color: #8FA0B0; margin-top: 2px; }
    .doc-title { text-align: right; }
    .doc-title h2 { font-size: 15px; font-weight: 800; color: #0E7C7B; }
    .doc-title p { font-size: 10px; color: #8FA0B0; margin-top: 3px; }
    .evidence { background: #F0FDF9; border: 1.5px solid #0E7C7B; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; }
    .evidence h3 { font-size: 11px; font-weight: 700; color: #0E7C7B; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
    .evidence-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .ev-label { display: block; font-size: 10px; color: #6B7280; font-weight: 600; margin-bottom: 2px; }
    .ev-value { font-size: 12px; font-weight: 700; color: #1A2E44; }
    .parties { background: #F8FAFB; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .party-label { font-size: 10px; color: #8FA0B0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 3px; }
    .party-value { font-size: 14px; font-weight: 800; color: #1A2E44; }
    .score-summary { display: flex; gap: 20px; padding: 14px 18px; background: #F8FAFB; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 20px; align-items: center; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .sign-block { margin-top: 28px; }
    .sign-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 20px; }
    .sign-line { border-bottom: 1px solid #1A2E44; padding-bottom: 4px; margin-bottom: 4px; min-height: 28px; font-size: 13px; font-style: italic; color: #1A2E44; }
    .sign-label { font-size: 10px; color: #8FA0B0; }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-left { font-size: 10px; color: #9CA3AF; line-height: 1.6; }
    .badge { display: inline-block; padding: 3px 10px; background: #E6F6F4; border-radius: 20px; font-size: 10px; font-weight: 700; color: #0E7C7B; }
    @media print { body { background: #fff; } .no-print { display: none; } .page { padding: 20px; } }
  </style>
</head>
<body>
  <div class="no-print" style="position:fixed;top:16px;right:16px;display:flex;gap:10px;z-index:100;">
    <button onclick="window.print()" style="padding:10px 22px;background:#0E7C7B;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🖨 Print / Save as PDF</button>
    <button onclick="window.close()" style="padding:10px 18px;background:#EFF2F5;color:#4A6070;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Close</button>
  </div>

  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-block">
        <div class="logo-badge">V+</div>
        <div class="logo-text">
          <h1>Vitalis Healthcare Services</h1>
          <p>8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br>Tel: 267.474.8578 · Fax: 240.266.0650</p>
        </div>
      </div>
      <div class="doc-title">
        <h2>Performance Appraisal / Evaluation</h2>
        <p>Home Health Aide (HHA)<br>
        Appraisal ID: ${appraisalId.substring(0, 8).toUpperCase()}<br>
        Document No: VHS-APR-${new Date(a.created_at).getFullYear()}-${appraisalId.substring(0, 4).toUpperCase()}</p>
      </div>
    </div>

    <!-- Electronic Evidence -->
    <div class="evidence">
      <h3>✓ Electronic Record — Timestamps & Audit Trail</h3>
      <div class="evidence-grid">
        <div>
          <span class="ev-label">Appraisal Created</span>
          <span class="ev-value">${new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div>
          <span class="ev-label">Sent to Caregiver</span>
          <span class="ev-value">${a.sent_at ? new Date(a.sent_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not yet sent'}</span>
        </div>
        <div>
          <span class="ev-label">Caregiver Sign-Off</span>
          <span class="ev-value">${a.signed_at ? new Date(a.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : a.status === 'sent' ? 'Awaiting signature' : 'Not yet signed'}</span>
        </div>
        <div>
          <span class="ev-label">Sign-Off Time (UTC)</span>
          <span class="ev-value">${a.signed_at ? new Date(a.signed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }) + ' UTC' : '—'}</span>
        </div>
        <div>
          <span class="ev-label">Signature Method</span>
          <span class="ev-value">Electronic — Typed Name</span>
        </div>
        <div>
          <span class="ev-label">Document Status</span>
          <span class="ev-value" style="color:${a.status === 'signed' ? '#2A9D8F' : a.status === 'sent' ? '#F4A261' : '#8FA0B0'}">
            ${a.status === 'signed' ? '✓ Signed & Complete' : a.status === 'sent' ? '⏳ Awaiting Sign-Off' : '📝 Draft'}
          </span>
        </div>
        <div>
          <span class="ev-label">Document Printed</span>
          <span class="ev-value">${printedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div>
          <span class="ev-label">Average Score</span>
          <span class="ev-value" style="color:#0E7C7B;">${avgScore}${avgScore !== '—' ? ' / 4.0' : ''} (${scoredItems.length}/${ALL_ITEMS.length} rated)</span>
        </div>
        <div>
          <span class="ev-label">Appraisal Period</span>
          <span class="ev-value">${a.appraisal_period || '—'}</span>
        </div>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div>
        <span class="party-label">Employee (Caregiver)</span>
        <span class="party-value">${caregiverName}</span>
      </div>
      <div>
        <span class="party-label">Appraiser / Supervisor</span>
        <span class="party-value">${appraiserName}</span>
      </div>
      <div>
        <span class="party-label">Appraisal Period</span>
        <span class="party-value">${a.appraisal_period || '—'}</span>
      </div>
      <div>
        <span class="party-label">Total Scored Items</span>
        <span class="party-value">${scoredItems.length} / ${ALL_ITEMS.length}</span>
      </div>
    </div>

    <!-- Score legend -->
    <div class="score-summary">
      <span style="font-size:11px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.5px;">Rating Scale:</span>
      ${[1,2,3,4].map(s => `
        <div class="legend-item">
          <div class="dot" style="background:${SCORE_COLORS[s]};"></div>
          <span style="color:${SCORE_COLORS[s]};font-weight:700;">${s}</span>
          <span style="color:#6B7280;">— ${SCORE_LABELS[s]}</span>
        </div>`).join('')}
      ${avgScore !== '—' ? `<div style="margin-left:auto;font-size:13px;font-weight:800;color:#0E7C7B;">Avg: ${avgScore} / 4.0</div>` : ''}
    </div>

    <!-- Clinical Duties -->
    ${sectionTable(CLINICAL_ITEMS, 'Clinical Duties')}

    <!-- Professional Conduct -->
    ${sectionTable(PROFESSIONAL_ITEMS, 'Professional Conduct')}

    <!-- Comments -->
    ${a.comments ? `
    <div style="margin-bottom:24px;">
      <h3 style="font-size:13px;font-weight:800;color:#1A2E44;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Supervisor Comments</h3>
      <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:14px 16px;font-size:13px;color:#1A2E44;line-height:1.7;">${a.comments}</div>
    </div>` : ''}

    <!-- Signatures -->
    <div class="sign-block">
      <h3 style="font-size:12px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;">Signatures</h3>
      <div class="sign-grid">
        <div>
          <div class="sign-line">${a.caregiver_signature || ''}</div>
          <div class="sign-label">Employee Signature (Electronic) — ${caregiverName}</div>
        </div>
        <div>
          <div class="sign-line">${a.signed_at ? new Date(a.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</div>
          <div class="sign-label">Date Signed</div>
        </div>
        <div>
          <div class="sign-line">&nbsp;</div>
          <div class="sign-label">Supervisor Signature — ${appraiserName}</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br>
        Tel: 267.474.8578 · Fax: 240.266.0650 · team@vitalishealthcare.com<br>
        This appraisal was completed electronically via the Vitalis Staff Compliance Portal.<br>
        Appraisal ID: ${appraisalId} · Printed: ${printedAt.toISOString()}
      </div>
      <div style="text-align:right;">
        <span class="badge">${a.status === 'signed' ? '✓ Electronically Signed' : a.status === 'sent' ? '⏳ Pending Sign-Off' : '📝 Draft'}</span><br>
        <span style="font-size:10px;color:#9CA3AF;margin-top:4px;display:block;">CONFIDENTIAL</span>
      </div>
    </div>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
