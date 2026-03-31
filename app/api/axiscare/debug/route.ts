// app/api/axiscare/debug/route.ts
// TEMPORARY — delete after diagnosis. Admin only.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(_req: NextRequest) {
  const token = process.env.AXISCARE_API_TOKEN
  const site  = process.env.AXISCARE_SITE_NUMBER

  if (!token || !site) {
    return NextResponse.json({ error: 'AXISCARE_API_TOKEN or AXISCARE_SITE_NUMBER missing from Vercel env vars' }, { status: 503 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  } catch {
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }

  const cleanSite = site.replace(/\.axiscare\.com.*$/i, '').replace(/\/$/, '').trim()
  const url = `https://${cleanSite}.axiscare.com/api/caregivers?limit=500`

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
    let parsed: any = null
    try { parsed = JSON.parse(text) } catch { /* not JSON */ }

    const r = parsed?.results

    return NextResponse.json({
      attempted_url: url,
      http_status: status,
      env_site_raw: site,
      env_site_cleaned: cleanSite,
      token_first8: token.slice(0, 8) + '...',
      top_level_keys: parsed ? Object.keys(parsed) : null,
      results_type: r !== undefined ? (Array.isArray(r) ? 'array' : typeof r) : 'NOT PRESENT',
      results_keys: r && typeof r === 'object' && !Array.isArray(r) ? Object.keys(r) : null,
      caregivers_value_type: r?.caregivers !== undefined
        ? (Array.isArray(r.caregivers) ? `array[${r.caregivers.length}]` : typeof r.caregivers + ' = ' + JSON.stringify(r.caregivers))
        : 'KEY NOT FOUND',
      success_field: parsed?.success,
      errors_field: parsed?.errors,
      raw_first_300: text.slice(0, 300),
      first_caregiver: Array.isArray(r?.caregivers) && r.caregivers.length > 0 ? r.caregivers[0] : null,
    })
  } catch (err: any) {
    return NextResponse.json({
      error: 'Fetch threw an exception',
      message: err?.message || String(err),
      attempted_url: url,
    }, { status: 502 })
  }
}
