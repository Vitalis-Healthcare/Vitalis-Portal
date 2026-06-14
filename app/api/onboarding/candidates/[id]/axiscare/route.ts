// app/api/onboarding/candidates/[id]/axiscare/route.ts
// Staff-only: push a reviewed candidate into AxisCare as an Applicant.
//   POST https://{site}.axiscare.com/api/applicants   (structured fields)
//   POST https://{site}.axiscare.com/api/notes/applicant/{id}  ("Pushed from Vita")
//   Bearer + X-AxisCare-Api-Version: 2023-10-01
// AxisCare's Add Applicant endpoint only accepts a limited set of structured
// fields (name, ssn, dob, email, mobile, mailing address) and there is no
// update-applicant endpoint. So everything else the application captures
// (driver's license, gender, home phone, work history, references, emergency
// contacts, skills, availability, extra questions) is written into a single
// "Pushed from Vita" applicant note. The note also marks the applicant as having
// come in through Vita.
// Idempotent: won't re-push (or re-note) if axiscare_applicant_id is already set.
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
function yn(v: unknown): string | null {
  if (v === true) return 'Yes'
  if (v === false) return 'No'
  return null
}
function arr(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : []
}
function fmtDate(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
// Normalize SSN to the AxisCare example format (XXX-XX-XXXX) when it is 9 digits;
// otherwise pass the trimmed value through.
function formatSsn(v: unknown): string | null {
  const t = nonEmpty(v)
  if (!t) return null
  const d = t.replace(/\D/g, '')
  return d.length === 9 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : t
}

// Build the "Pushed from Vita" note body from the application row.
function buildVitaNote(app: Record<string, unknown> | null): string {
  const a = app || {}
  const lines: string[] = [`Pushed from Vita — ${fmtDate()}`]
  const push = (label: string, value: string | null) => { if (value) lines.push(`${label}: ${value}`) }
  const section = (title: string) => { lines.push(''); lines.push(`— ${title} —`) }

  // Identification
  const dl = yn(a.driver_license_received)
  const dlParts = [dl, nonEmpty(a.driver_license_number) ? `#${nonEmpty(a.driver_license_number)}` : null, nonEmpty(a.driver_license_state)].filter(Boolean).join(' · ')
  if (nonEmpty(a.gender) || nonEmpty(a.home_phone) || dlParts) {
    section('Identification')
    push('Gender', nonEmpty(a.gender))
    push('Home phone', nonEmpty(a.home_phone))
    push("Driver's license", dlParts || null)
  }

  // Work eligibility
  if ([a.is_18_or_older, a.work_authorized, a.requires_sponsorship, a.has_transportation].some((v) => typeof v === 'boolean')) {
    section('Work eligibility')
    push('18 or older', yn(a.is_18_or_older))
    push('Authorized to work in U.S.', yn(a.work_authorized))
    push('Requires sponsorship', yn(a.requires_sponsorship))
    push('Reliable transportation', yn(a.has_transportation))
  }

  // Professional
  if (nonEmpty(a.credential_type) || nonEmpty(a.license_number) || nonEmpty(a.years_experience) || nonEmpty(a.languages)) {
    section('Professional')
    push('Credential', nonEmpty(a.credential_type))
    push('License / cert #', nonEmpty(a.license_number))
    push('Years of experience', nonEmpty(a.years_experience))
    push('Languages', nonEmpty(a.languages))
  }

  // Previous caregiver experience
  const exps = arr(a.work_experience)
  if (exps.length) {
    section('Previous caregiver experience')
    exps.forEach((e, i) => {
      const head = [nonEmpty(e.organization), nonEmpty(e.dates_worked)].filter(Boolean).join(' — ')
      lines.push(`${i + 1}. ${head || '(no organization)'}`)
      const sub = [
        nonEmpty(e.contact_person),
        nonEmpty(e.telephone),
        yn(e.may_contact) ? `May contact: ${yn(e.may_contact)}` : null,
      ].filter(Boolean).join(' · ')
      if (sub) lines.push(`   ${sub}`)
    })
  }

  // References
  const refs = arr(a.applicant_references)
  if (refs.length) {
    section('References')
    refs.forEach((r) => {
      const kind = String(r.kind) === 'character' ? 'Character' : 'Professional'
      const detail = [nonEmpty(r.name), nonEmpty(r.title), nonEmpty(r.phone), nonEmpty(r.dates_known) ? `known ${nonEmpty(r.dates_known)}` : null].filter(Boolean).join(' · ')
      if (detail) lines.push(`${kind}: ${detail}`)
    })
  }

  // Emergency contacts
  const emg = arr(a.emergency_contacts)
  if (emg.length) {
    section('Emergency contacts')
    emg.forEach((c, i) => {
      const detail = [nonEmpty(c.name), nonEmpty(c.relationship), nonEmpty(c.phone), nonEmpty(c.phone_type) ? `(${nonEmpty(c.phone_type)})` : null].filter(Boolean).join(' · ')
      if (detail) lines.push(`${i + 1}. ${detail}`)
    })
  }

  // Skills & training
  const willing = Array.isArray(a.willing_to_work_with) ? (a.willing_to_work_with as string[]) : []
  const experience = Array.isArray(a.experience_with) ? (a.experience_with as string[]) : []
  if (willing.length || experience.length || nonEmpty(a.additional_certifications)) {
    section('Skills & training')
    if (willing.length) push('Willing to work with', willing.join(', '))
    if (experience.length) push('Experience with', experience.join(', '))
    push('Additional certifications', nonEmpty(a.additional_certifications))
  }

  // Availability
  const days = (a.availability_days && typeof a.availability_days === 'object') ? a.availability_days as Record<string, unknown> : {}
  const dayOrder: [string, string][] = [['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun']]
  const dayStr = dayOrder.filter(([k]) => nonEmpty(days[k])).map(([k, l]) => `${l}: ${nonEmpty(days[k])}`).join(' · ')
  if (typeof a.available_all_hours === 'boolean' || dayStr || typeof a.live_in_interested === 'boolean' || nonEmpty(a.availability)) {
    section('Availability')
    push('Available all hours', yn(a.available_all_hours))
    push('Day-by-day', dayStr || null)
    const liveIn = yn(a.live_in_interested)
    if (liveIn) push('Interested in live-in', a.live_in_max_days != null ? `${liveIn} (max ${a.live_in_max_days} days)` : liveIn)
    push('Notes', nonEmpty(a.availability))
  }

  // Additional questions
  if (typeof a.smoker === 'boolean' || nonEmpty(a.how_heard) || nonEmpty(a.recent_experience) || nonEmpty(a.why_caregiver)) {
    section('Additional')
    const smoker = yn(a.smoker)
    if (smoker) push('Smoker', nonEmpty(a.smoker_per_day) ? `${smoker} (${nonEmpty(a.smoker_per_day)}/day)` : smoker)
    push('How they heard about us', nonEmpty(a.how_heard))
    push('Recent caregiving experience', nonEmpty(a.recent_experience))
    push('Why caregiver with us', nonEmpty(a.why_caregiver))
  }

  return lines.join('\n')
}

async function postVitaNote(baseUrl: string, token: string, applicantId: number, note: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/notes/applicant/${applicantId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-AxisCare-Api-Version': '2023-10-01',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ note, important: false }),
    })
    if (!res.ok) {
      console.error('[axiscare-note] failed:', res.status, (await res.text()).slice(0, 400))
      return false
    }
    return true
  } catch (e) {
    console.error('[axiscare-note] network error:', e)
    return false
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const token = process.env.AXISCARE_API_TOKEN
  const site = process.env.AXISCARE_SITE_NUMBER
  if (!token || !site) {
    return NextResponse.json({
      error: 'AxisCare integration not configured. Add AXISCARE_API_TOKEN and AXISCARE_SITE_NUMBER to Vercel.',
    }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor', 'staff'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  }

  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, first_name, last_name, email, status, axiscare_applicant_id')
    .eq('id', id)
    .single()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  if (cand.axiscare_applicant_id) {
    return NextResponse.json({ already: true, axiscare_applicant_id: cand.axiscare_applicant_id })
  }
  if (!PUSHABLE_STATUSES.includes(cand.status || '')) {
    return NextResponse.json({ error: 'Push to AxisCare is available once the application is submitted or in review.' }, { status: 409 })
  }

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

  // Structured payload — omit empty optional fields (AxisCare rejects explicit null).
  const payload: Record<string, unknown> = { firstName, lastName }

  const middleInitial = nonEmpty(app?.middle_name)?.slice(0, 2)
  if (middleInitial) payload.middleInitial = middleInitial

  const dateOfBirth = nonEmpty(app?.date_of_birth)
  if (dateOfBirth) payload.dateOfBirth = dateOfBirth

  const personalEmail = nonEmpty(app?.email) || nonEmpty(cand.email)
  if (personalEmail) payload.personalEmail = personalEmail

  const mobilePhone = nonEmpty(app?.phone)
  if (mobilePhone) payload.mobilePhone = mobilePhone

  const ssn = formatSsn(app?.ssn)
  if (ssn) payload.ssn = ssn

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

  const cleanSite = site.replace(/\.axiscare\.com.*$/i, '').replace(/\/$/, '').trim()
  const baseUrl = `https://${cleanSite}.axiscare.com`
  let res: Response
  let bodyText = ''
  try {
    res = await fetch(`${baseUrl}/api/applicants`, {
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

  // Persist the link first (the applicant exists regardless of the note outcome).
  const nowIso = new Date().toISOString()
  await svc.from('onb_candidates')
    .update({ axiscare_applicant_id: applicantId, axiscare_pushed_at: nowIso, status: 'axiscare_created', updated_at: nowIso })
    .eq('id', cand.id)

  // Best-effort "Pushed from Vita" note with all the non-structured data.
  const notePosted = await postVitaNote(baseUrl, token, applicantId, buildVitaNote(app))

  return NextResponse.json({
    success: true,
    axiscare_applicant_id: applicantId,
    action: parsed?.results?.action || 'created',
    note_posted: notePosted,
  })
}
