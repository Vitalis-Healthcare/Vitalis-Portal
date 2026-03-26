// app/api/references/print/route.ts
// Returns a fully self-contained printable HTML document for a reference submission.
// Admin/supervisor/staff only. Includes timestamp and electronic receipt evidence.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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
  const referenceId = searchParams.get('referenceId')
  if (!referenceId) return new Response('referenceId required', { status: 400 })

  const { data: ref } = await svc
    .from('caregiver_references')
    .select('*, caregiver:caregiver_id(full_name)')
    .eq('id', referenceId)
    .single()

  const { data: sub } = await svc
    .from('reference_submissions')
    .select('*')
    .eq('reference_id', referenceId)
    .single()

  if (!ref || !sub) return new Response('Not found', { status: 404 })

  const caregiverName = (ref.caregiver as any)?.full_name || 'Unknown'
  const isPro = ref.reference_type === 'professional'
  const slotLabel = ref.slot === 3 ? 'Character Reference Verification' : `Employment Reference Form (Professional Reference ${ref.slot})`
  const receivedAt = new Date(sub.submitted_at)
  const printedAt  = new Date()

  const RATING_LABELS: Record<string, string> = {
    very_good: 'Very Good', satisfactory: 'Satisfactory', fair: 'Fair', poor: 'Poor'
  }
  const YN_LABELS: Record<string, string> = {
    yes: 'Yes', no: 'No', dont_know: "Don't know"
  }
  const REC_LABELS: Record<string, string> = {
    highly_recommended: 'Highly Recommended',
    recommended: 'Recommended',
    reservations: 'Recommended, but with reservations',
    not_recommended: 'Not Recommended',
  }

  const ratingCell = (val: string) => {
    const ratings = ['very_good', 'satisfactory', 'fair', 'poor']
    return ratings.map(r => `
      <td style="text-align:center;padding:6px 4px;">
        ${val === r
          ? `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#0E7C7B;"></span>`
          : `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;border:2px solid #CBD5E0;"></span>`
        }
      </td>`).join('')
  }

  const proContent = isPro ? `
    <section class="section">
      <h2 class="section-title">Employment Details</h2>
      <table class="detail-table">
        <tbody>
          ${sub.employer_name ? `<tr><td class="label">Name of Employer</td><td>${sub.employer_name}</td></tr>` : ''}
          ${sub.employer_address ? `<tr><td class="label">Address</td><td>${sub.employer_address}</td></tr>` : ''}
          ${sub.supervisor_name ? `<tr><td class="label">Supervisor</td><td>${sub.supervisor_name}</td></tr>` : ''}
          ${sub.supervisor_phone ? `<tr><td class="label">Phone</td><td>${sub.supervisor_phone}</td></tr>` : ''}
          ${sub.supervisor_email ? `<tr><td class="label">Email</td><td>${sub.supervisor_email}</td></tr>` : ''}
          ${sub.position_held ? `<tr><td class="label">Position Held</td><td>${sub.position_held}</td></tr>` : ''}
          ${sub.area_worked ? `<tr><td class="label">Area Worked</td><td>${sub.area_worked}</td></tr>` : ''}
          ${sub.employment_from ? `<tr><td class="label">Employment From</td><td>${new Date(sub.employment_from).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>` : ''}
          ${sub.employment_to ? `<tr><td class="label">Employment To</td><td>${new Date(sub.employment_to).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>` : ''}
          ${sub.resigned_or_terminated ? `<tr><td class="label">Resigned / Terminated</td><td>${sub.resigned_or_terminated}</td></tr>` : ''}
          ${sub.eligible_for_rehire ? `<tr><td class="label">Eligible for Rehire</td><td>${sub.eligible_for_rehire === 'yes' ? 'Yes' : 'No'}</td></tr>` : ''}
          ${sub.reason_for_leaving ? `<tr><td class="label">Reason for Leaving</td><td>${sub.reason_for_leaving}</td></tr>` : ''}
          ${sub.travel_assignment !== null ? `<tr><td class="label">Travel Assignment</td><td>${sub.travel_assignment ? 'Yes' : 'No'}</td></tr>` : ''}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title">Personal Evaluation</h2>
      <table class="rating-table">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 12px;width:50%;">Category</th>
            <th style="text-align:center;padding:8px 4px;">Very Good</th>
            <th style="text-align:center;padding:8px 4px;">Satisfactory</th>
            <th style="text-align:center;padding:8px 4px;">Fair</th>
            <th style="text-align:center;padding:8px 4px;">Poor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:6px 12px;">Quality of Work</td>${ratingCell(sub.rating_quality)}</tr>
          <tr><td style="padding:6px 12px;">Flexibility</td>${ratingCell(sub.rating_flexibility)}</tr>
          <tr><td style="padding:6px 12px;">Attitude</td>${ratingCell(sub.rating_attitude)}</tr>
          <tr><td style="padding:6px 12px;">Emotional Stability</td>${ratingCell(sub.rating_stability)}</tr>
          <tr><td style="padding:6px 12px;">Adaptability to Work Under Pressure</td>${ratingCell(sub.rating_pressure)}</tr>
          <tr><td style="padding:6px 12px;">Dependability / Attendance / Punctuality</td>${ratingCell(sub.rating_dependability)}</tr>
          <tr><td style="padding:6px 12px;">Cooperation / Ability to Get Along with Others</td>${ratingCell(sub.rating_cooperation)}</tr>
        </tbody>
      </table>
    </section>` : ''

  const charContent = !isPro ? `
    <section class="section">
      <h2 class="section-title">About the Referee</h2>
      <table class="detail-table">
        <tbody>
          ${sub.years_known ? `<tr><td class="label">Years Known</td><td>${sub.years_known}</td></tr>` : ''}
          ${sub.context_known ? `<tr><td class="label">Context Known</td><td>${sub.context_known}</td></tr>` : ''}
          ${sub.related_to_applicant !== null ? `<tr><td class="label">Related to Applicant</td><td>${sub.related_to_applicant ? 'Yes' : 'No'}</td></tr>` : ''}
          ${sub.relation_explanation ? `<tr><td class="label">Relation</td><td>${sub.relation_explanation}</td></tr>` : ''}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title">Character Assessment</h2>
      <p style="font-size:12px;color:#6B7280;margin-bottom:12px;">Have you ever had to question the applicant's reputation for:</p>
      <table class="detail-table">
        <tbody>
          ${sub.questioned_honesty ? `<tr><td class="label">Honesty</td><td>${YN_LABELS[sub.questioned_honesty] || sub.questioned_honesty}</td></tr>` : ''}
          ${sub.questioned_trustworthy ? `<tr><td class="label">Trustworthiness</td><td>${YN_LABELS[sub.questioned_trustworthy] || sub.questioned_trustworthy}</td></tr>` : ''}
          ${sub.questioned_diligence ? `<tr><td class="label">Diligence</td><td>${YN_LABELS[sub.questioned_diligence] || sub.questioned_diligence}</td></tr>` : ''}
          ${sub.questioned_reliability ? `<tr><td class="label">Reliability</td><td>${YN_LABELS[sub.questioned_reliability] || sub.questioned_reliability}</td></tr>` : ''}
          ${sub.questioned_character ? `<tr><td class="label">Good Character</td><td>${YN_LABELS[sub.questioned_character] || sub.questioned_character}</td></tr>` : ''}
          ${sub.questioned_maturity ? `<tr><td class="label">Maturity</td><td>${YN_LABELS[sub.questioned_maturity] || sub.questioned_maturity}</td></tr>` : ''}
        </tbody>
      </table>
    </section>

    ${sub.overall_recommendation ? `
    <section class="section">
      <h2 class="section-title">Overall Recommendation</h2>
      <div style="padding:14px 20px;border-radius:8px;border:2px solid #0E7C7B;background:#E6F6F4;font-size:15px;font-weight:700;color:#0E7C7B;">
        ${REC_LABELS[sub.overall_recommendation] || sub.overall_recommendation}
      </div>
    </section>` : ''}` : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${slotLabel} — ${caregiverName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1A2E44; font-size: 13px; line-height: 1.5; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 48px; }

    /* Header */
    .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 24px; border-bottom: 3px solid #0E7C7B; margin-bottom: 24px; }
    .logo-block { display: flex; align-items: center; gap: 14px; }
    .logo-badge { width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(135deg, #0E7C7B, #F4A261); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 900; flex-shrink: 0; }
    .logo-text h1 { font-size: 18px; font-weight: 800; color: #1A2E44; }
    .logo-text p { font-size: 11px; color: #8FA0B0; margin-top: 2px; }
    .doc-title { text-align: right; }
    .doc-title h2 { font-size: 16px; font-weight: 800; color: #0E7C7B; }
    .doc-title p { font-size: 11px; color: #8FA0B0; margin-top: 3px; }

    /* Evidence block */
    .evidence { background: #F0FDF9; border: 1.5px solid #0E7C7B; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
    .evidence h3 { font-size: 11px; font-weight: 700; color: #0E7C7B; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
    .evidence-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .evidence-item { font-size: 12px; }
    .evidence-item .ev-label { color: #6B7280; font-weight: 600; display: block; margin-bottom: 1px; }
    .evidence-item .ev-value { color: #1A2E44; font-weight: 700; }

    /* Applicant block */
    .applicant-block { background: #F8FAFB; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; border: 1px solid #E2E8F0; }
    .applicant-block h3 { font-size: 11px; font-weight: 700; color: #8FA0B0; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
    .applicant-row { display: flex; gap: 32px; }
    .applicant-item .a-label { font-size: 11px; color: #8FA0B0; }
    .applicant-item .a-value { font-size: 14px; font-weight: 700; color: #1A2E44; }

    /* Sections */
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 700; color: #1A2E44; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px; border-bottom: 1px solid #EFF2F5; margin-bottom: 12px; }

    /* Tables */
    .detail-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .detail-table tr { border-bottom: 1px solid #F3F4F6; }
    .detail-table td { padding: 7px 10px; vertical-align: top; }
    .detail-table td.label { width: 40%; color: #6B7280; font-weight: 600; }
    .rating-table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; }
    .rating-table thead tr { background: #F8FAFB; }
    .rating-table th, .rating-table td { border-bottom: 1px solid #F3F4F6; font-size: 12px; }

    /* Comments */
    .comments-box { background: #F8FAFB; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; font-size: 13px; line-height: 1.6; color: #374151; }

    /* Footer */
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-left { font-size: 10px; color: #9CA3AF; line-height: 1.6; }
    .footer-right { text-align: right; font-size: 10px; color: #9CA3AF; }
    .page-badge { display: inline-block; padding: 3px 10px; background: #E6F6F4; border-radius: 20px; font-size: 10px; font-weight: 700; color: #0E7C7B; }

    @media print {
      body { background: #fff; }
      .no-print { display: none; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
  <!-- Print button (hidden on print) -->
  <div class="no-print" style="position:fixed;top:16px;right:16px;display:flex;gap:10px;z-index:100;">
    <button onclick="window.print()" style="padding:10px 22px;background:#0E7C7B;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
      🖨 Print / Save as PDF
    </button>
    <button onclick="window.close()" style="padding:10px 18px;background:#EFF2F5;color:#4A6070;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">
      Close
    </button>
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
        <h2>${isPro ? 'Employment Reference Form' : 'Character Reference Verification'}</h2>
        <p>Reference ID: ${referenceId.substring(0, 8).toUpperCase()}<br>Document No: VHS-REF-${receivedAt.getFullYear()}-${String(ref.slot).padStart(2, '0')}</p>
      </div>
    </div>

    <!-- Electronic Receipt Evidence -->
    <div class="evidence">
      <h3>✓ Electronic Receipt — Evidence of Submission</h3>
      <div class="evidence-grid">
        <div class="evidence-item">
          <span class="ev-label">Date Submitted</span>
          <span class="ev-value">${receivedAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="evidence-item">
          <span class="ev-label">Time Submitted (UTC)</span>
          <span class="ev-value">${receivedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' })} UTC</span>
        </div>
        <div class="evidence-item">
          <span class="ev-label">Submission Method</span>
          <span class="ev-value">Electronic — Secure Web Form</span>
        </div>
        <div class="evidence-item">
          <span class="ev-label">IP Address</span>
          <span class="ev-value">${sub.ip_address || 'Recorded at submission'}</span>
        </div>
        <div class="evidence-item">
          <span class="ev-label">Referee Email</span>
          <span class="ev-value">${ref.referee_email}</span>
        </div>
        <div class="evidence-item">
          <span class="ev-label">Reference Type</span>
          <span class="ev-value">${isPro ? 'Professional Employment Reference' : 'Character Reference'} (Slot ${ref.slot})</span>
        </div>
        <div class="evidence-item">
          <span class="ev-label">Reference Link Sent</span>
          <span class="ev-value">${ref.sent_at ? new Date(ref.sent_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
        </div>
        <div class="evidence-item">
          <span class="ev-label">Document Printed</span>
          <span class="ev-value">${printedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>

    <!-- Applicant & Referee -->
    <div class="applicant-block">
      <h3>Parties</h3>
      <div class="applicant-row">
        <div class="applicant-item">
          <div class="a-label">Applicant (Caregiver)</div>
          <div class="a-value">${caregiverName}</div>
        </div>
        <div class="applicant-item">
          <div class="a-label">Referee Name</div>
          <div class="a-value">${sub.referee_name || ref.referee_name || '—'}</div>
        </div>
        ${sub.referee_title ? `<div class="applicant-item"><div class="a-label">Referee Title</div><div class="a-value">${sub.referee_title}</div></div>` : ''}
        <div class="applicant-item">
          <div class="a-label">Referee Email</div>
          <div class="a-value">${ref.referee_email}</div>
        </div>
      </div>
    </div>

    ${proContent}
    ${charContent}

    ${sub.comments ? `
    <section class="section">
      <h2 class="section-title">Comments</h2>
      <div class="comments-box">${sub.comments}</div>
    </section>` : ''}

    <!-- Signature area -->
    <section class="section" style="margin-top:32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:45%;padding-right:20px;">
            <div style="border-bottom:1px solid #1A2E44;padding-bottom:4px;margin-bottom:4px;">${sub.referee_name || ref.referee_name || ''}</div>
            <div style="font-size:11px;color:#8FA0B0;">Referee Signature (Electronic)</div>
          </td>
          <td style="width:25%;padding-right:20px;">
            <div style="border-bottom:1px solid #1A2E44;padding-bottom:4px;margin-bottom:4px;">
              ${sub.referee_date ? new Date(sub.referee_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : receivedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div style="font-size:11px;color:#8FA0B0;">Date</div>
          </td>
          <td style="width:30%;">
            <div style="border-bottom:1px solid #1A2E44;padding-bottom:4px;margin-bottom:4px;">&nbsp;</div>
            <div style="font-size:11px;color:#8FA0B0;">For Office Use Only — Reviewed By</div>
          </td>
        </tr>
      </table>
    </section>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910<br>
        Tel: 267.474.8578 · Fax: 240.266.0650 · team@vitalishealthcare.com<br>
        This document was electronically submitted and is maintained in the Vitalis Staff Compliance Portal.<br>
        Reference ID: ${referenceId} · Printed: ${printedAt.toISOString()}
      </div>
      <div class="footer-right">
        <span class="page-badge">✓ Electronically Received</span><br>
        <span style="margin-top:4px;display:block;">CONFIDENTIAL</span>
      </div>
    </div>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
