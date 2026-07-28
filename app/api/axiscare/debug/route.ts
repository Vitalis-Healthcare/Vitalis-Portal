// app/api/axiscare/debug/route.ts
//
// Server-side AxisCare probe. Admin only.
//
// The AXISCARE_API_TOKEN lives in Vercel, not on anyone's laptop, so probing
// AxisCare from a local terminal fails with a 401 that says nothing about the
// endpoint. This route runs the same request from the server, where the token
// exists, and reports exactly what came back.
//
//   /api/axiscare/debug                      -> caregivers (default)
//   /api/axiscare/debug?target=clients       -> clients
//   /api/axiscare/debug?target=applicants    -> applicants  (v0.6.16)
//
// The target is an allow-list, not a free-form path: this must never become an
// open proxy that an admin session can point anywhere.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const TARGETS: Record<string, string> = {
  caregivers: '/api/caregivers',
  clients: '/api/clients',
  applicants: '/api/applicants',
}

export async function GET(req: NextRequest) {
  const token = process.env.AXISCARE_API_TOKEN
  const site = process.env.AXISCARE_SITE_NUMBER

  if (!token || !site) {
    return NextResponse.json(
      { error: 'AXISCARE_API_TOKEN or AXISCARE_SITE_NUMBER missing from Vercel env vars' },
      { status: 503 },
    )
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const svc = createServiceClient()
    const { data: profile } = await svc
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }

  const requested = (req.nextUrl.searchParams.get('target') || 'caregivers').toLowerCase()
  const path = TARGETS[requested]
  if (!path) {
    return NextResponse.json(
      { error: `Unknown target "${requested}". Allowed: ${Object.keys(TARGETS).join(', ')}` },
      { status: 400 },
    )
  }

  const cleanSite = site.replace(/\.axiscare\.com.*$/i, '').replace(/\/$/, '').trim()
  const url = `https://${cleanSite}.axiscare.com${path}?limit=500`

  try {
    const res: Response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-AxisCare-Api-Version': '2023-10-01',
        'Content-Type': 'application/json',
      },
    })

    const status = res.status
    const text = await res.text()
    let parsed: unknown = null
    try { parsed = JSON.parse(text) } catch { /* not JSON */ }

    const obj = (parsed && typeof parsed === 'object') ? parsed as Record<string, unknown> : null
    const r = obj?.results
    const rObj = (r && typeof r === 'object' && !Array.isArray(r)) ? r as Record<string, unknown> : null

    // AxisCare returns collections as a keyed object ({"1":{...}}) rather than
    // an array on some endpoints — report the shape so callers know which.
    const collectionKey = requested
    const collection = rObj?.[collectionKey]

    return NextResponse.json({
      target: requested,
      attempted_url: url,
      http_status: status,
      reachable: status >= 200 && status < 300,
      env_site_cleaned: cleanSite,
      token_first8: token.slice(0, 8) + '...',
      top_level_keys: obj ? Object.keys(obj) : null,
      results_type: r !== undefined ? (Array.isArray(r) ? 'array' : typeof r) : 'NOT PRESENT',
      results_keys: rObj ? Object.keys(rObj) : null,
      collection_shape: collection !== undefined
        ? (Array.isArray(collection)
          ? `array[${collection.length}]`
          : `${typeof collection} with ${Object.keys(collection as object).length} key(s)`)
        : 'KEY NOT FOUND',
      // Field NAMES of the first record only — never values, so no applicant
      // PII leaves the server. This is what decides the match key for the
      // AxisCare confirmation cron.
      sample_keys: (() => {
        if (Array.isArray(collection)) {
          const first = collection[0]
          return first && typeof first === 'object' ? Object.keys(first as object) : null
        }
        if (collection && typeof collection === 'object') {
          const values = Object.values(collection as Record<string, unknown>)
          const first = values[0]
          return first && typeof first === 'object' ? Object.keys(first as object) : null
        }
        return null
      })(),
      success_field: obj?.success,
      errors_field: obj?.errors,
      raw_first_300: text.slice(0, 300),
    })
  } catch (err) {
    return NextResponse.json({
      target: requested,
      error: 'Fetch threw an exception',
      message: err instanceof Error ? err.message : String(err),
      attempted_url: url,
    }, { status: 502 })
  }
}
