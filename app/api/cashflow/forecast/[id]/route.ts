import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const body = await req.json()

  const patch: any = {}
  if (body.forecast_date !== undefined) patch.forecast_date = body.forecast_date
  if (body.category_id !== undefined) patch.category_id = body.category_id
  if (body.amount !== undefined) patch.amount = Math.abs(Number(body.amount))
  if (body.label !== undefined) patch.label = body.label || null
  if (body.bank_account_id !== undefined) patch.bank_account_id = body.bank_account_id || null

  const { data, error } = await supabase
    .from('cf_forecast_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  // Check status: matched items must be unmatched first (per amendment §1)
  const { data: existing, error: fetchErr } = await supabase
    .from('cf_forecast_items')
    .select('status, matched_actual_id')
    .eq('id', id)
    .single()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (existing.status === 'matched') {
    return NextResponse.json(
      { error: 'Cannot strike out a matched item. Unmatch it from the actual first.' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('cf_forecast_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
