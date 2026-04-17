// app/api/assessments/clients/import/route.ts
// Imports AxisCare clients into assessment_clients.
// If axiscare_id already exists: UPSERT — update address/phone/payer fields.
// AxisCare is the source of truth for address data.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface AxisCareAddress {
  streetAddress1?: string | null
  city?: string | null
  state?: string | null
  region?: string | null
  postalCode?: string | null
}

interface AxisCareClient {
  id: number
  firstName: string
  lastName: string
  goesBy?: string | null
  mobilePhone?: string | null
  homePhone?: string | null
  otherPhone?: string | null
  residentialAddress?: AxisCareAddress | null
  mailingAddress?: AxisCareAddress | null
  medicaidNumber?: string | null
  status?: { active: boolean; label: string } | null
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'supervisor'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let clients: AxisCareClient[] = []
  try {
    const body = await req.json()
    clients = body.clients || []
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!clients.length) return NextResponse.json({ error: 'No clients provided' }, { status: 400 })

  // Fetch existing records keyed by axiscare_id
  const { data: existing } = await svc
    .from('assessment_clients')
    .select('id, axiscare_id')
    .not('axiscare_id', 'is', null)
  const existingMap = new Map((existing ?? []).map(r => [r.axiscare_id, r.id]))

  const imported: string[] = []
  const updated:  string[] = []
  const failed:   string[] = []

  for (const c of clients) {
    const fullName  = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
    const axisId    = String(c.id)
    const addr      = c.residentialAddress || c.mailingAddress || {}
    const phone     = c.mobilePhone || c.homePhone || c.otherPhone || null
    const payerType = c.medicaidNumber ? 'Medicaid' : null

    if (existingMap.has(axisId)) {
      // ── Upsert: update address/phone from AxisCare (source of truth) ────────
      const patch: Record<string, string> = { updated_at: new Date().toISOString() }
      if (phone)                                patch.phone      = phone
      if (addr.streetAddress1)                  patch.address    = addr.streetAddress1
      if (addr.city)                            patch.city       = addr.city
      if (addr.state || addr.region)            patch.state      = (addr.state || addr.region)!
      if (addr.postalCode)                      patch.zip        = addr.postalCode
      if (payerType)                            patch.payer_type = payerType

      try {
        const { error } = await svc
          .from('assessment_clients').update(patch).eq('axiscare_id', axisId)
        if (error) {
          failed.push(`${fullName} (update: ${error.message})`)
          continue
        }
        updated.push(fullName)
      } catch (err: any) {
        failed.push(`${fullName} (${err?.message || 'update error'})`)
      }
      continue
    }

    // ── New record: insert ────────────────────────────────────────────────────
    try {
      const { error } = await svc.from('assessment_clients').insert({
        full_name:   fullName,
        phone:       phone || null,
        address:     addr.streetAddress1 || null,
        city:        addr.city || null,
        state:       addr.state || addr.region || 'MD',
        zip:         addr.postalCode || null,
        payer_type:  payerType,
        axiscare_id: axisId,
        status:      'active',
        created_by:  user.id,
      })
      if (error) { failed.push(`${fullName} (${error.message})`); continue }
      imported.push(fullName)
    } catch (err: any) {
      failed.push(`${fullName} (${err?.message || 'unknown error'})`)
    }
  }

  return NextResponse.json({
    success: true,
    imported: imported.length,
    updated:  updated.length,
    failed:   failed.length,
    errors:   failed,
  })
}
