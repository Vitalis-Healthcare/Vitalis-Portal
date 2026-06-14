// app/api/onboarding/candidates/[id]/axiscare/route.ts
// Staff-only: push a reviewed candidate into AxisCare as an Applicant.
//   POST https://{site}.axiscare.com/api/applicants
//   Bearer + X-AxisCare-Api-Version: 2023-10-01
// Idempotent (won't re-push if axiscare_applicant_id is already set). On an
// AxisCare error it surfaces AxisCare's raw status + errors so a 403 (scope) or
// 422 (validation) is visible to staff. AxisCare has no document endpoint, so
// uploaded documents stay in Vita.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const PUSHABLE_STATUSES = ['application_submitted', 'in_review']

function nonEmpty(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // ── AxisCare config ──
  const token = process.env.AXISCARE_API_TOKEN
  const site = process.env.AXISCARE_SITE_NUMBER
  if (!token || !site) {
    return NextResponse.json({
      error: 'AxisCare integration not configured. Add AXISCARE_API_TOKEN and AXISCARE_SITE_NUMBER to Vercel.',
    }, { status: 503 })
  }

  // ── Staff gate ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor', 'staff'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }

  // ── Load candidate ──
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, email, status, axiscare_applicant_id')
    .eq('id', id)
    .single()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  // Idempotent: already in AxisCare.
  if (cand.axiscare_applicant_id) {
    return NextResponse.json({ already: true, axiscare_applicant_id: cand.axiscare_applicant_id })
  }
  if (!PUSHABLE_STATUSES.includes(cand.status || '')) {
    return NextResponse.json({ error: 'Push to AxisCare is available once the application is submitted or in review.' }, { status: 409 })
  }

  // ── Load application for field mapping ──
  const { data: app } = await svc
    .from('onb_applications')
    .select('*')
    .eq('candidate_id', cand.id)
    .maybeSingle()

  const firstName = nonEmpty(app?.legal_first_name) || nonEmpty(cand.first_name) || ''
  const lastName = nonEmpty(app?.legal_last_name) || nonEmpty(cand.last_name) || ''
  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'A first and last name are required before pushing to AxisCare.' }, { status: 400 })
  }

  // Build the payload per the AxisCare Add Applicant schema.
  const payload: Record<string, unknown> = {
    firstName,
    lastName,
    middleInitial: (nonEmpty(app?.middle_name)?.slice(0, 2)) || null,
    ssn: null, // not collected in the application
    dateOfBirth: nonEmpty(app?.date_of_birth) || null,
    personalEmail: nonEmpty(app?.email) || nonEmpty(cand.email) || '',
    mobilePhone: nonEmpty(app?.phone) || null,
  }

  // mailingAddress has minProperties:5 — only include it when the core parts are
  // present, and always send all five keys (streetAddress2 defaults to "").
  const street = nonEmpty(app?.address_street)
  const city = nonEmpty(app?.address_city)
  const state = nonEmpty(app?.address_state)
  const postalCode = nonEmpty(app?.address_zip)
  if (street && city && state && postalCode) {
    payload.mailingAddress = {
      streetAddress1: street,
      streetAddress2: nonEmpty(app?.address_unit) || '',
      city,
      state,
      postalCode,
    }
  }

  // ── Call AxisCare ──
  const cleanSite = site.replace(/\.axiscare\.com.*$/i, '').replace(/\/$/, '').trim()
  const url = `https://${cleanSite}.axiscare.com/api/applicants`
  let res: Response
  let bodyText = ''
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-AxisCare-Api-Version': '2023-10-01',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    bodyText = await res.text()
  } catch (e) {
    console.error('[axiscare-push] network error:', e)
    return NextResponse.json({ error: 'Could not reach AxisCare. Please try again.' }, { status: 502 })
  }

  let parsed: { results?: { id?: number; action?: string }; errors?: unknown } | null = null
  try { parsed = bodyText ? JSON.parse(bodyText) : null } catch { parsed = null }

  if (!res.ok) {
    // Surface AxisCare's own error so a 403 (scope) or 422 (validation) is actionable.
    const errs = parsed?.errors
    const detail = Array.isArray(errs) ? errs.join('; ') : (typeof errs === 'string' ? errs : bodyText.slice(0, 500))
    console.error('[axiscare-push] API error:', res.status, detail)
    const friendly = res.status === 403
      ? 'AxisCare rejected the request (403). The API token likely needs the Applicants scope enabled — ask AxisCare to turn it on for this token.'
      : res.status === 422
        ? `AxisCare rejected the data (422): ${detail || 'validation error'}`
        : `AxisCare returned ${res.status}.`
    return NextResponse.json({ error: friendly, status: res.status, detail }, { status: 502 })
  }

  const applicantId = parsed?.results?.id
  if (typeof applicantId !== 'number') {
    console.error('[axiscare-push] no id in response:', bodyText.slice(0, 500))
    return NextResponse.json({ error: 'AxisCare accepted the request but returned no applicant id. Please check AxisCare.', detail: bodyText.slice(0, 500) }, { status: 502 })
  }

  // ── Persist ──
  const nowIso = new Date().toISOString()
  await svc.from('onb_candidates')
    .update({ axiscare_applicant_id: applicantId, axiscare_pushed_at: nowIso, status: 'axiscare_created', updated_at: nowIso })
    .eq('id', cand.id)

  return NextResponse.json({ success: true, axiscare_applicant_id: applicantId, action: parsed?.results?.action || 'created' })
}
