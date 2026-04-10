import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// GET /api/cashflow/actuals  -> list all weekly actuals (most recent first)
export async function GET() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('cf_weekly_actuals')
    .select('*')
    .order('week_ending', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ actuals: data ?? [] });
}

// POST /api/cashflow/actuals  { week_ending: 'YYYY-MM-DD', actual_cash: number }
// Upsert by week_ending — re-entering overwrites.
//
// Back-compat: accept legacy `actual_closing` field from any cached client
// bundle until all users have reloaded.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const week_ending = String(body.week_ending || '');
  const rawAmount = body.actual_cash ?? body.actual_closing;
  const actual_cash = Number(rawAmount);
  if (!week_ending || !isFinite(actual_cash)) {
    return NextResponse.json({ error: 'week_ending and actual_cash required' }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('cf_weekly_actuals')
    .upsert(
      { week_ending, actual_cash, entered_at: new Date().toISOString() },
      { onConflict: 'week_ending' }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ actual: data });
}
