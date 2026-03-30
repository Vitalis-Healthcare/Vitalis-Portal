// app/api/axiscare/import/route.ts
// Imports selected AxisCare caregivers into Vitalis Portal.
//
// Key rules:
//   - Status is set to 'inactive' — no notifications sent to caregiver
//   - No invite email — staff will onboard the caregiver manually
//   - axiscare_id stored on profiles for future sync
//
// Flow per caregiver:
//   1. Check email not already in profiles
//   2. svc.auth.admin.createUser() — creates auth user (no email sent)
//   3. handle_new_user trigger fires — creates profiles row with default status
//   4. UPDATE profiles — override status to 'inactive', set all AxisCare fields

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface AxisCareCaregiver {
  id: number
  firstName: string
  lastName: string
  personalEmail: string | null
  mobilePhone: string | null
  homePhone: string | null
  hireDate: string | null
  status: { active: boolean; label: string } | string | null
  classes: { code: string; label: string }[] | null
}

export async function POST(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()
  const { data: adminProfile } = await svc
    .from('profiles').select('role, full_name').eq('id', user.id).single()

  if (!['admin', 'supervisor', 'staff'].includes(adminProfile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let caregivers: AxisCareCaregiver[] = []
  try {
    const body = await req.json()
    caregivers = body.caregivers || []
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!caregivers.length) {
    return NextResponse.json({ error: 'No caregivers provided' }, { status: 400 })
  }

  const imported: string[] = []
  const skipped: string[] = []
  const failed: string[] = []

  for (const cg of caregivers) {
    const fullName = `${cg.firstName} ${cg.lastName}`.trim()
    const email = cg.personalEmail?.trim().toLowerCase() || null

    // Skip if no email — can't create a Supabase auth user without one
    if (!email) {
      failed.push(`${fullName} (no email in AxisCare)`)
      continue
    }

    // Skip if email already in portal (double-check server-side)
    try {
      const { data: existing } = await svc
        .from('profiles').select('id').eq('email', email).maybeSingle()
      if (existing) {
        skipped.push(fullName)
        continue
      }
    } catch (err) {
      failed.push(`${fullName} (database lookup error)`)
      continue
    }

    // Resolve fields
    const phone     = cg.mobilePhone || cg.homePhone || null
    const hireDate  = cg.hireDate || null
    const axisId    = String(cg.id)
    const now       = new Date().toISOString()

    // ── Step 1: Create auth user (email_confirm: true = no confirmation email) ─
    let authUserId: string | null = null
    try {
      const { data: authData, error: createError } = await svc.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'caregiver',
          phone,
          department: 'Home Care',
        },
      })

      if (createError) {
        const alreadyExists =
          createError.message?.toLowerCase().includes('already') ||
          createError.message?.toLowerCase().includes('exists')
        if (alreadyExists) {
          skipped.push(fullName)
          continue
        }
        console.error('[axiscare/import] createUser error for', email, createError.message)
        failed.push(`${fullName} (${createError.message})`)
        continue
      }

      authUserId = authData?.user?.id || null
    } catch (err: any) {
      failed.push(`${fullName} (unexpected auth error)`)
      continue
    }

    if (!authUserId) {
      failed.push(`${fullName} (no user ID returned)`)
      continue
    }

    // ── Step 2: Override profile with AxisCare data + force status = inactive ─
    // The handle_new_user trigger already created a profiles row.
    // We UPDATE (not upsert) to ensure our values win regardless of trigger defaults.
    try {
      const { error: updateError } = await svc
        .from('profiles')
        .update({
          full_name:            fullName,
          role:                 'caregiver',
          department:           'Home Care',
          phone:                phone,
          hire_date:            hireDate,
          status:               'inactive',   // ← ALWAYS inactive on import
          axiscare_id:          axisId,
          axiscare_synced_at:   now,
        })
        .eq('id', authUserId)

      if (updateError) {
        console.error('[axiscare/import] profile update error for', email, updateError.message)
        // Auth user created but profile update failed — still counts as imported
        // so they can be manually corrected. Log and continue.
        imported.push(`${fullName} ⚠ (profile update failed — check manually)`)
        continue
      }
    } catch (err: any) {
      imported.push(`${fullName} ⚠ (profile update failed — check manually)`)
      continue
    }

    imported.push(fullName)
  }

  return NextResponse.json({
    success: true,
    results: { imported, skipped, failed },
    summary: {
      total:    caregivers.length,
      imported: imported.length,
      skipped:  skipped.length,
      failed:   failed.length,
    },
  })
}
