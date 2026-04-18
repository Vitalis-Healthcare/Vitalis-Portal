// app/api/axiscare/clients/route.ts
// Proxy: fetches active clients from AxisCare API.
// Paginates automatically (up to 10 pages).
// Admin / supervisor only.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(_req: NextRequest) {
  const token = process.env.AXISCARE_API_TOKEN
  const site  = process.env.AXISCARE_SITE_NUMBER

  if (!token || !site) {
    return NextResponse.json({
      success: false,
      error: 'AxisCare integration not configured. Add AXISCARE_API_TOKEN and AXISCARE_SITE_NUMBER to Vercel environment variables.',
    }, { status: 503 })
  }

  // ── Auth check ─────────────────────────────────────────────────────────────
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = createServiceClient()
    const { data: profile } = await svc
      .from('profiles').select('role').eq('id', user.id).single()
    if (!['admin'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 })
  }

  // ── Fetch all pages from AxisCare ──────────────────────────────────────────
  const cleanSite = site.replace(/\.axiscare\.com.*$/i, '').replace(/\/$/, '').trim()
  const baseUrl   = `https://${cleanSite}.axiscare.com`
  const axisHeaders = {
    'Authorization':        `Bearer ${token}`,
    'X-AxisCare-Api-Version': '2023-10-01',
    'Content-Type':         'application/json',
  }

  const allClients: any[] = []
  let nextUrl: string | null = `${baseUrl}/api/clients?limit=500&statuses=Active`
  let pages = 0

  try {
    while (nextUrl && pages < 10) {
      const res: Response = await fetch(nextUrl, { headers: axisHeaders })

      if (!res.ok) {
        const errText = await res.text()
        console.error('[axiscare/clients] API error:', res.status, errText)
        return NextResponse.json({
          success: false,
          error: `AxisCare API returned ${res.status}. Check your API token and site number.`,
          debug: { status: res.status, url: nextUrl.split('?')[0] },
        }, { status: 502 })
      }

      const data: any = await res.json()
      const r: any  = data?.results
      let batch: any[] = []

      // Defensively handle both array and keyed-object shapes (same as caregivers)
      if (r?.clients !== undefined && r.clients !== null) {
        if (Array.isArray(r.clients)) {
          batch = r.clients
        } else if (typeof r.clients === 'object') {
          batch = Object.values(r.clients)
        }
      }

      if (batch.length === 0) break

      allClients.push(...batch)
      nextUrl = (r && typeof r === 'object' && !Array.isArray(r) && typeof r.nextPage === 'string')
        ? r.nextPage
        : null
      pages++
    }
  } catch (err: any) {
    console.error('[axiscare/clients] fetch error:', err)
    return NextResponse.json({
      success: false,
      error: `Could not reach AxisCare at ${baseUrl}. Verify AXISCARE_SITE_NUMBER is just the number (e.g. 14356).`,
      debug: { attempted_url: baseUrl, message: err?.message || String(err) },
    }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    clients: allClients,
    total:   allClients.length,
    pages_fetched: pages,
  })
}
