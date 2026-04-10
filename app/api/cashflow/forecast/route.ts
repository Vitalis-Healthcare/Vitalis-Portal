import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
import { buildForecast } from '@/lib/cashflow/engine';
export async function GET(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const weeks = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('weeks') || '26'), 1), 104);
  const supabase = createServiceClient();
  const [s, cats, rules, txns] = await Promise.all([
    supabase.from('cf_settings').select('*').maybeSingle(),
    supabase.from('cf_categories').select('*'),
    supabase.from('cf_recurring_rules').select('*').eq('active', true),
    supabase.from('cf_transactions').select('*'),
  ]);
  const settings = s.data || { company_name: null, opening_cash: 0, opening_date: new Date().toISOString().slice(0,10), week_start_dow: 1, min_cash_alert: 10000 };
  const catMap: Record<string,{kind:'income'|'expense'}> = {};
  for (const c of (cats.data||[])) catMap[c.id] = { kind: c.kind };
  return NextResponse.json(buildForecast(settings as any, (rules.data||[]) as any, catMap, (txns.data||[]) as any, weeks));
}
