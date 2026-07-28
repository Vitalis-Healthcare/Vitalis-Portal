// app/api/assessments/clients/import/route.ts
//
// GET  — returns what the import screen needs to classify AxisCare clients:
//        which axiscare_ids we already hold (with their status) and which have
//        been permanently ignored. One round trip instead of two.
//
// POST — imports the selected AxisCare clients into assessment_clients.
//        New axiscare_id      -> insert.
//        Existing axiscare_id -> update address/phone/payer (AxisCare is the
//                                source of truth for address data).
//        Ignored axiscare_id  -> refused server-side, never touched. The UI
//                                hides them, but hiding is not enforcement.
//
// Admin / supervisor only.

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

type Gate =
  | { ok: false; res: NextResponse }
  | { ok: true; userId: string }

// Shared in-handler gate. There is no middleware in this repo, so every route
// gates itself (see pitfalls #4 / #25).
async function gate(): Promise<Gate> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }
    const svc = createServiceClient()
    const { data: profile } = await svc
      .from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'supervisor'].includes(profile?.role || '')) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    }
    return { ok: true, userId: user.id }
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Auth check failed' }, { status: 500 }) }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET — classification data for the import screen
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  const g = await gate()
  if (!g.ok) return g.res

  const svc = createServiceClient()

  let existing: { axiscare_id: string; full_name: string; status: string }[] = []
  let ignored: {
    axiscare_id: string; full_name: string | null
    reason: string | null; ignored_at: string
  }[] = []

  try {
    const { data, error } = await svc
      .from('assessment_clients')
      .select('axiscare_id, full_name, status')
      .not('axiscare_id', 'is', null)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    existing = (data ?? []) as typeof existing
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  try {
    const { data, error } = await svc
      .from('assessment_client_ignores')
      .select('axiscare_id, full_name, reason, ignored_at')
      .order('ignored_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    ignored = (data ?? []) as typeof ignored
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true, existing, ignored })
}

// ═══════════════════════════════════════════════════════════════════════════
// POST — import / refresh selected clients
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const g = await gate()
  if (!g.ok) return g.res
  const userId = g.userId

  const svc = createServiceClient()

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

  // Existing records keyed by axiscare_id
  const existingMap = new Map<string, string>()
  try {
    const { data } = await svc
      .from('assessment_clients')
      .select('id, axiscare_id')
      .not('axiscare_id', 'is', null)
    for (const r of data ?? []) {
      if (r.axiscare_id) existingMap.set(String(r.axiscare_id), r.id)
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  // Ignore list — enforced here, not just in the UI.
  const ignoredSet = new Set<string>()
  try {
    const { data } = await svc
      .from('assessment_client_ignores')
      .select('axiscare_id')
    for (const r of data ?? []) {
      if (r.axiscare_id) ignoredSet.add(String(r.axiscare_id))
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  const imported: string[] = []
  const updated: string[] = []
  const failed: string[] = []
  const skippedIgnored: string[] = []

  for (const c of clients) {
    const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
    const axisId = String(c.id)

    if (ignoredSet.has(axisId)) {
      skippedIgnored.push(fullName || axisId)
      continue
    }

    const addr = c.residentialAddress || c.mailingAddress || {}
    const phone = c.mobilePhone || c.homePhone || c.otherPhone || null
    const payerType = c.medicaidNumber ? 'Medicaid' : null

    if (existingMap.has(axisId)) {
      // ── Refresh: AxisCare is source of truth for address/phone ─────────────
      const patch: Record<string, string> = { updated_at: new Date().toISOString() }
      if (phone) patch.phone = phone
      if (addr.streetAddress1) patch.address = addr.streetAddress1
      if (addr.city) patch.city = addr.city
      if (addr.state || addr.region) patch.state = (addr.state || addr.region)!
      if (addr.postalCode) patch.zip = addr.postalCode
      if (payerType) patch.payer_type = payerType

      try {
        const { error } = await svc
          .from('assessment_clients').update(patch).eq('axiscare_id', axisId)
        if (error) {
          failed.push(`${fullName} (update: ${error.message})`)
          continue
        }
        updated.push(fullName)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'update error'
        failed.push(`${fullName} (${msg})`)
      }
      continue
    }

    // ── New record ───────────────────────────────────────────────────────────
    try {
      const { error } = await svc.from('assessment_clients').insert({
        full_name: fullName,
        phone: phone || null,
        address: addr.streetAddress1 || null,
        city: addr.city || null,
        state: addr.state || addr.region || 'MD',
        zip: addr.postalCode || null,
        payer_type: payerType,
        axiscare_id: axisId,
        status: 'active',
        created_by: userId,
      })
      if (error) { failed.push(`${fullName} (${error.message})`); continue }
      imported.push(fullName)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error'
      failed.push(`${fullName} (${msg})`)
    }
  }

  return NextResponse.json({
    success: true,
    imported: imported.length,
    updated: updated.length,
    failed: failed.length,
    skipped_ignored: skippedIgnored.length,
    errors: failed,
  })
}
