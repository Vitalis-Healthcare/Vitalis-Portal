import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
import { generateForecastFromRule, type Rule } from '@/lib/cashflow/generate-forecast-from-rule';

export async function GET() {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden', { status: 403 }); }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('cf_recurring_rules')
    .select('*, cf_categories(name,kind,type)')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden', { status: 403 }); }
  const body = await req.json();

  // Whitelist — never pass-through arbitrary body to insert
  const insertRow = {
    category_id: body.category_id,
    name: body.name,
    amount: body.amount,
    frequency: body.frequency,
    start_date: body.start_date,
    end_date: body.end_date ?? null,
    day_of_month: body.day_of_month ?? null,
    is_active: body.is_active ?? true,
  };

  if (!insertRow.category_id || !insertRow.name || insertRow.amount == null || !insertRow.frequency || !insertRow.start_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: created, error } = await supabase
    .from('cf_recurring_rules')
    .insert(insertRow)
    .select('*, cf_categories(name,kind,type)')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-generate forecast items across the horizon
  const items = generateForecastFromRule(created as Rule);
  if (items.length > 0) {
    const { error: genErr } = await supabase.from('cf_forecast_items').insert(items);
    if (genErr) {
      return NextResponse.json({ error: `Rule saved but forecast generation failed: ${genErr.message}`, rule: created }, { status: 500 });
    }
  }

  return NextResponse.json(created);
}
