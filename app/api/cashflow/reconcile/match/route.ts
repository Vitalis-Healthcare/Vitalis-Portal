import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireCashflowAdmin } from '@/lib/cashflow/auth'

export async function POST(req: NextRequest) {
  try {
    await requireCashflowAdmin()
    const body = await req.json()
    const { forecast_id, actual_date, amount, reference, bank_account_id } = body || {}

    if (!forecast_id || !actual_date || amount === undefined || amount === null || !bank_account_id) {
      return NextResponse.json({ error: 'forecast_id, actual_date, amount, and bank_account_id are required.' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: forecast, error: fErr } = await supabase
      .from('cf_forecast_items')
      .select('id, category_id, status')
      .eq('id', forecast_id)
      .single()
    if (fErr) throw fErr
    if (!forecast) return NextResponse.json({ error: 'Forecast item not found.' }, { status: 404 })
    if (forecast.status === 'matched') return NextResponse.json({ error: 'Already matched.' }, { status: 409 })
    if (forecast.status === 'cancelled') return NextResponse.json({ error: 'Cannot match a struck-out item.' }, { status: 409 })

    const { data: inserted, error: iErr } = await supabase
      .from('cf_actual_items')
      .insert({
        actual_date,
        category_id: forecast.category_id,
        amount: Number(amount),
        reference: reference || null,
        bank_account_id,
        source: 'matched',
        matched_forecast_id: forecast_id,
      })
      .select('id')
      .single()
    if (iErr) throw iErr

    const { error: uErr } = await supabase
      .from('cf_forecast_items')
      .update({ status: 'matched', matched_actual_id: inserted.id })
      .eq('id', forecast_id)
    if (uErr) {
      // Rollback the insert so the pair stays consistent.
      await supabase.from('cf_actual_items').delete().eq('id', inserted.id)
      throw uErr
    }

    return NextResponse.json({ ok: true, actual_id: inserted.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Could not enter into the book.' }, { status: 500 })
  }
}
