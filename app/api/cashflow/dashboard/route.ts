import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

function weekEndDow(startDow: number): number {
  return (startDow + 6) % 7;
}
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function weekEndingOf(d: Date, endDow: number): Date {
  const out = new Date(d);
  const day = out.getDay();
  const diff = (endDow - day + 7) % 7;
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}
function iso(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawWeeks = parseInt(url.searchParams.get('weeks') || '12', 10);
  const weeks = [6, 12, 24].includes(rawWeeks) ? rawWeeks : 12;
  const sb = createServiceClient();

  const { data: settings } = await sb
    .from('cf_settings')
    .select('opening_cash, opening_date, week_start_dow')
    .limit(1)
    .single();

  const seedOpening = Number(settings?.opening_cash ?? 0);
  const startDow = settings?.week_start_dow ?? 6;
  const endDow = weekEndDow(startDow);
  const endDayName = DAY_NAMES[endDow];

  const today = new Date();
  const currentWeekEnd = weekEndingOf(today, endDow);

  let startAnchor = currentWeekEnd;
  if (settings?.opening_date) {
    const od = new Date(settings.opening_date + 'T00:00:00');
    const openingWeekEnd = weekEndingOf(od, endDow);
    if (openingWeekEnd > currentWeekEnd) {
      startAnchor = openingWeekEnd;
    }
  }

  const start = startAnchor;
  const end = addDays(start, 7 * (weeks - 1));
  const weekWindowStart = addDays(start, -6);

  // PROJECTIONS — from cf_forecast_items
  const { data: forecasts, error: fErr } = await sb
    .from('cf_forecast_items')
    .select('forecast_date, amount, cf_categories(type)')
    .neq('status', 'cancelled')
    .gte('forecast_date', iso(weekWindowStart))
    .lte('forecast_date', iso(end));

  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });

  // ACTUALS — from cf_transactions (signed by category type)
  const { data: txns, error: tErr } = await sb
    .from('cf_transactions')
    .select('txn_date, amount, cf_categories(type)')
    .is('deleted_at', null)
    .gte('txn_date', iso(weekWindowStart))
    .lte('txn_date', iso(end));

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  // BANK BALANCE ANCHORS — cf_weekly_actuals ground truth
  const { data: actuals } = await sb
    .from('cf_weekly_actuals')
    .select('week_ending, actual_cash')
    .gte('week_ending', iso(start))
    .lte('week_ending', iso(end));

  const actualByWeek = new Map<string, number>();
  (actuals ?? []).forEach(a => {
    if (a.actual_cash != null) actualByWeek.set(a.week_ending, Number(a.actual_cash));
  });

  const rows: Array<{
    week_ending: string;
    opening: number;
    income: number;
    expense: number;
    net: number;
    projected_closing: number;
    actual_closing: number | null;
    variance: number | null;
  }> = [];

  let rollingOpening = seedOpening;

  for (let i = 0; i < weeks; i++) {
    const we = addDays(start, 7 * i);
    const weStr = iso(we);
    const weekStart = addDays(we, -6);

    // Projections from forecast items
    let income = 0, expense = 0;
    (forecasts ?? []).forEach((f: any) => {
      const d = new Date(f.forecast_date + 'T00:00:00');
      if (d >= weekStart && d <= we) {
        const amt = Math.abs(Number(f.amount));
        const type = f.cf_categories?.type;
        if (type === 'receipt') income += amt;
        else if (type === 'expense') expense += amt;
      }
    });

    const net = income - expense;
    const projected_closing = rollingOpening + net;

    // Signed txn sum for this week (for synthetic actual fallback)
    let txnNet = 0;
    let hasTxns = false;
    (txns ?? []).forEach((t: any) => {
      const d = new Date(t.txn_date + 'T00:00:00');
      if (d >= weekStart && d <= we) {
        hasTxns = true;
        const amt = Math.abs(Number(t.amount));
        const type = t.cf_categories?.type;
        if (type === 'receipt') txnNet += amt;
        else if (type === 'expense') txnNet -= amt;
      }
    });

    // Actual closing: (a) bank anchor wins, (b) else synthesize from txns, (c) else null
    let actual_closing: number | null;
    if (actualByWeek.has(weStr)) {
      actual_closing = actualByWeek.get(weStr)!;
    } else if (hasTxns) {
      actual_closing = rollingOpening + txnNet;
    } else {
      actual_closing = null;
    }

    const variance = actual_closing != null ? actual_closing - projected_closing : null;

    rows.push({
      week_ending: weStr,
      opening: rollingOpening,
      income, expense, net,
      projected_closing,
      actual_closing,
      variance,
    });

    rollingOpening = actual_closing != null ? actual_closing : projected_closing;
  }

  const todayIso = iso(today);
  const defaultActualWeek =
    rows.filter(r => r.week_ending <= todayIso && !actualByWeek.has(r.week_ending))
        .map(r => r.week_ending)
        .pop() || iso(currentWeekEnd);

  return NextResponse.json({
    rows,
    defaultActualWeek,
    weekEndDayName: endDayName,
    openingCash: seedOpening,
    horizonWeeks: weeks,
  });
}
