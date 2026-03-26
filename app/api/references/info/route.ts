// app/api/references/info/route.ts
// Public — returns minimal info needed to render the reference form.
// Does NOT expose sensitive data.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const svc = createServiceClient()

  const { data: ref } = await svc
    .from('caregiver_references')
    .select('reference_type, referee_name, status, caregiver:caregiver_id(full_name)')
    .eq('token', token)
    .single()

  if (!ref) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  return NextResponse.json({
    reference_type: ref.reference_type,
    referee_name:   ref.referee_name,
    caregiver_name: (ref.caregiver as any)?.full_name || 'the applicant',
    status:         ref.status,
  })
}
