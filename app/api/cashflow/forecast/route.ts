import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

function weekEndingFor(dateStr: string): string {
  // Saturday-ending week to match existing cashflow convention
  const d = new Date(dateStr + 'T00:00:00')
  const dow = d.getDay() // 0=Sun..6=Sat
  const daysToSat = (6 - dow + 7) % 7
  d.setDate(d.getDate() + daysToSat)
  return d.toISOString().slice(0, 10)
}

const isReceipt = (t?: string | null) => t === 'receipt'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const horizonRaw = req.nextUrl.searchParams.get('horizon') || '26'
  const horizon = [12, 26, 52].includes(parseInt(horizonRaw)) ? parseInt(horizonRaw) : 26

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const horizonEnd = new Date(today)
  horizonEnd.setDate(horizonEnd.getDate() + horizon * 7)

  const { data: items, error } = await supabase
    .from('cf_forecast_items')
    .select(`
      id, category_id, bank_account_id, forecast_date, amount, label, status, rule_id,
      cf_categories ( name, type ),
      cf_bank_accounts ( short_code )
    `)
    .gte('forecast_date', today.toISOString().slice(0, 10))
    .lte('forecast_date', horizonEnd.toISOString().slice(0, 10))
    .neq('status', 'cancelled')
    .order('forecast_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: categories } = await supabase
    .from('cf_categories')
    .select('id, name, type')
    .order('name')

  const { data: accounts } = await supabase
    .from('cf_bank_accounts')
    .select('id, short_code, name')
    .eq('is_active', true)
    .neq('short_code', 'LEGACY')
    .order('sort_order')

  const groupMap = new Map<string, any>()
  for (const it of items || []) {
    const cat = (it as any).cf_categories
    const acct = (it as any).cf_bank_accounts
    const wk = weekEndingFor(it.forecast_date)
    if (!groupMap.has(wk)) {
      groupMap.set(wk, { week_ending: wk, items: [], subtotal_in: 0, subtotal_out: 0, net: 0 })
    }
    const g = groupMap.get(wk)
    const amt = Math.abs(Number(it.amount))
    const flat = {
      id: it.id,
      category_id: it.category_id,
      category_name: cat?.name,
      category_type: cat?.type, // 'receipt' or 'payment'
      bank_account_id: it.bank_account_id,
      bank_account_code: acct?.short_code || null,
      forecast_date: it.forecast_date,
      amount: amt,
      label: it.label,
      status: it.status,
      rule_id: it.rule_id,
    }
    g.items.push(flat)
    if (isReceipt(cat?.type)) {
      g.subtotal_in += amt
      g.net += amt
    } else {
      g.subtotal_out += amt
      g.net -= amt
    }
  }

  const groups = Array.from(groupMap.values()).sort((a, b) => a.week_ending.localeCompare(b.week_ending))

  return NextResponse.json({ groups, categories: categories || [], accounts: accounts || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { forecast_date, category_id, amount, label, bank_account_id } = body

  if (!forecast_date || !category_id || amount == null) {
    return NextResponse.json({ error: 'forecast_date, category_id, and amount are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cf_forecast_items')
    .insert({
      forecast_date,
      category_id,
      amount: Math.abs(Number(amount)),
      label: label || null,
      bank_account_id: bank_account_id || null,
      rule_id: null,
      status: 'planned',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}
