import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireCashflowAdmin } from '@/lib/cashflow/auth'

function saturdayEnding(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const add = (6 - day + 7) % 7
  d.setDate(d.getDate() + add)
  return d.toISOString().slice(0, 10)
}

function todaySaturday(): string {
  const d = new Date()
  return saturdayEnding(d.toISOString().slice(0, 10))
}

function addWeeks(yyyymmdd: string, weeks: number): string {
  const d = new Date(yyyymmdd + 'T00:00:00')
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  try {
    await requireCashflowAdmin()
    const supabase = createServiceClient()
    const horizon = Math.max(1, Math.min(52, parseInt(req.nextUrl.searchParams.get('horizon') || '26', 10)))

    const startWeek = todaySaturday()
    const endWeek = addWeeks(startWeek, horizon - 1)

    const { data: forecasts, error: fErr } = await supabase
      .from('cf_forecast_items')
      .select('id, forecast_date, amount, label, status, category_id, bank_account_id, cf_categories(id,name,type), cf_bank_accounts(id,short_code)')
      .gte('forecast_date', startWeek)
      .lte('forecast_date', endWeek)
      .neq('status', 'cancelled')
      .order('forecast_date', { ascending: true })
    if (fErr) throw fErr

    const { data: txns, error: tErr } = await supabase
      .from('cf_transactions')
      .select('id, txn_date, amount, description, category_id, cf_categories(id,name,type)')
      .gte('txn_date', startWeek)
      .lte('txn_date', endWeek)
      .is('deleted_at', null)
      .order('txn_date', { ascending: true })
    if (tErr) throw tErr

    const { data: actuals, error: aErr } = await supabase
      .from('cf_actual_items')
      .select('id, actual_date, amount, reference, category_id, bank_account_id, cf_categories(id,name,type), cf_bank_accounts(id,short_code)')
      .gte('actual_date', startWeek)
      .lte('actual_date', endWeek)
      .is('matched_forecast_id', null)
      .order('actual_date', { ascending: true })
    if (aErr) throw aErr

    const { data: accounts, error: bErr } = await supabase
      .from('cf_bank_accounts')
      .select('id, short_code, name')
      .eq('is_active', true)
      .order('short_code')
    if (bErr) throw bErr

    const groupsMap = new Map<string, any>()
    for (let i = 0; i < horizon; i++) {
      const wk = addWeeks(startWeek, i)
      groupsMap.set(wk, { week_ending: wk, planned: [], received: [], planned_in: 0, planned_out: 0, received_in: 0, received_out: 0 })
    }

    for (const f of forecasts || []) {
      const wk = saturdayEnding(f.forecast_date)
      const g = groupsMap.get(wk)
      if (!g) continue
      const catRel = (f as any).cf_categories
      const cat = Array.isArray(catRel) ? catRel[0] : catRel
      const bankRel = (f as any).cf_bank_accounts
      const bank = Array.isArray(bankRel) ? bankRel[0] : bankRel
      const item = {
        id: f.id,
        category_id: f.category_id,
        category_name: cat?.name,
        category_type: cat?.type,
        bank_account_id: f.bank_account_id,
        bank_account_code: bank?.short_code || null,
        forecast_date: f.forecast_date,
        amount: Number(f.amount),
        label: f.label,
        status: f.status,
      }
      g.planned.push(item)
      if (cat?.type === 'receipt') g.planned_in += Math.abs(item.amount)
      else g.planned_out += Math.abs(item.amount)
    }

    for (const t of txns || []) {
      const wk = saturdayEnding(t.txn_date)
      const g = groupsMap.get(wk)
      if (!g) continue
      const catRel = (t as any).cf_categories
      const cat = Array.isArray(catRel) ? catRel[0] : catRel
      const item = {
        id: t.id,
        source: 'transaction' as const,
        category_name: cat?.name,
        category_type: cat?.type,
        bank_account_code: null,
        the_date: t.txn_date,
        amount: Number(t.amount),
        description: t.description || '',
        reference: null,
      }
      g.received.push(item)
      if (cat?.type === 'receipt') g.received_in += Math.abs(item.amount)
      else g.received_out += Math.abs(item.amount)
    }

    for (const a of actuals || []) {
      const wk = saturdayEnding(a.actual_date)
      const g = groupsMap.get(wk)
      if (!g) continue
      const catRel = (a as any).cf_categories
      const cat = Array.isArray(catRel) ? catRel[0] : catRel
      const bankRel = (a as any).cf_bank_accounts
      const bank = Array.isArray(bankRel) ? bankRel[0] : bankRel
      const item = {
        id: a.id,
        source: 'actual' as const,
        category_name: cat?.name,
        category_type: cat?.type,
        bank_account_code: bank?.short_code || null,
        the_date: a.actual_date,
        amount: Number(a.amount),
        description: a.reference || '',
        reference: a.reference || null,
      }
      g.received.push(item)
      if (cat?.type === 'receipt') g.received_in += Math.abs(item.amount)
      else g.received_out += Math.abs(item.amount)
    }

    const groups = Array.from(groupsMap.values()).filter(g => g.planned.length > 0 || g.received.length > 0)

    return NextResponse.json({ groups, accounts: accounts || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to read the reckoning.' }, { status: 500 })
  }
}
