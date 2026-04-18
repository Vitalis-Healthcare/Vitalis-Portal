// app/api/assessments/clients/import/route.ts
// Imports selected AxisCare clients into assessment_clients.
// Skips records whose axiscare_id already exists.
// Sets status = 'active' (unlike caregiver import which sets inactive).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface AxisCareClient {
  id: number
  firstName: string
  lastName: string
  goesBy?: string | null
  mobilePhone?: string | null
  homePhone?: string | null
  otherPhone?: string | null
  residentialAddress?: {
    address1?: string | null
    city?: string | null
    state?: string | null
    region?: string | null
    zip?: string | null
  } | null
  mailingAddress?: {
    address1?: string | null
    city?: string | null
    state?: string | null
    region?: string | null
    zip?: string | null
  } | null
  medicaidNumber?: string | null
  status?: { active: boolean; label: string } | null
}

export async function POST(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles').select('role').eq('id', user.id).single()
  if (!['admin'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let clients: AxisCareClient[] = []
  try {
    const body = await req.json()
    clients = body.clients || []
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!clients.length) {
    return NextResponse.json({ error: 'No clients provided' }, { status: 400 })
  }

  // ── Fetch existing axiscare_ids in one query ───────────────────────────────
  const { data: existing } = await svc
    .from('assessment_clients')
    .select('axiscare_id')
    .not('axiscare_id', 'is', null)
  const existingIds = new Set((existing ?? []).map(r => r.axiscare_id))

  const imported: string[] = []
  const skipped:  string[] = []
  const failed:   string[] = []

  for (const c of clients) {
    const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
    const axisId   = String(c.id)

    if (existingIds.has(axisId)) {
      skipped.push(fullName)
      continue
    }

    const addr      = c.residentialAddress || c.mailingAddress || {}
    const phone     = c.mobilePhone || c.homePhone || c.otherPhone || null
    const payerType = c.medicaidNumber ? 'Medicaid' : null

    try {
      const { error } = await svc.from('assessment_clients').insert({
        full_name:   fullName,
        phone:       phone || null,
        address:     addr.address1 || null,
        city:        addr.city || null,
        state:       addr.state || addr.region || 'MD',
        zip:         (addr as any).zip || null,
        payer_type:  payerType,
        axiscare_id: axisId,
        status:      'active',
        created_by:  user.id,
      })

      if (error) {
        console.error('[assessments/clients/import] insert error:', fullName, error.message)
        failed.push(`${fullName} (${error.message})`)
        continue
      }
      imported.push(fullName)
    } catch (err: any) {
      failed.push(`${fullName} (${err?.message || 'unknown error'})`)
    }
  }

  return NextResponse.json({
    success: true,
    imported: imported.length,
    skipped:  skipped.length,
    failed:   failed.length,
    errors:   failed,
  })
}
