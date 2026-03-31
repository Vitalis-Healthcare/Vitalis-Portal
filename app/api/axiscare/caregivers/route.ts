// app/api/axiscare/caregivers/route.ts
// Proxy route: fetches all caregivers from AxisCare API.
// Paginates automatically (up to 10 pages / 2000 caregivers).
// Admin / supervisor / staff only.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(_req: NextRequest) {
  const token = process.env.AXISCARE_API_TOKEN
  const site  = process.env.AXISCARE_SITE_NUMBER

  if (!token || !site) {
    return NextResponse.json({
      success: false,
      error:
        'AxisCare integration not configured. Please add AXISCARE_API_TOKEN and AXISCARE_SITE_NUMBER to your Vercel environment variables.',
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

    if (!['admin', 'supervisor', 'staff'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch (err) {
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 })
  }

  // ── Fetch all pages from AxisCare ──────────────────────────────────────────
  // Strip any accidental trailing slashes or .axiscare.com suffix from the site number
  const cleanSite = site.replace(/\.axiscare\.com.*$/i, '').replace(/\/$/, '').trim()
  const baseUrl = `https://${cleanSite}.axiscare.com`
  const axisHeaders = {
    'Authorization': `Bearer ${token}`,
    'X-AxisCare-Api-Version': '2023-10-01',
    'Content-Type': 'application/json',
  }

  const allCaregivers: any[] = []
  let nextUrl: string | null = `${baseUrl}/api/caregivers?limit=200`
  let pages = 0

  try {
    while (nextUrl && pages < 10) {
      const res: Response = await fetch(nextUrl, { headers: axisHeaders })

      if (!res.ok) {
        const errText = await res.text()
        console.error('[axiscare/caregivers] API error:', res.status, errText)
        return NextResponse.json({
          success: false,
          error: `AxisCare API returned ${res.status}. Check your API token and site number.`,
          debug: { status: res.status, url: nextUrl.split('?')[0] },
        }, { status: 502 })
      }

      const data = await res.json()
      const batch: any[] = data?.results?.caregivers || []
      allCaregivers.push(...batch)
      nextUrl = data?.results?.nextPage || null
      pages++
    }
  } catch (err: any) {
    console.error('[axiscare/caregivers] Fetch error:', err)
    return NextResponse.json({
      success: false,
      error: `Could not reach AxisCare at ${baseUrl}. Verify AXISCARE_SITE_NUMBER is just the number (e.g. 14356), not the full domain.`,
      debug: { attempted_url: baseUrl, message: err?.message || String(err) },
    }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    caregivers: allCaregivers,
    total: allCaregivers.length,
    pages_fetched: pages,
  })
}
