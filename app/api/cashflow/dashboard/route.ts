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

// Pitfall #7 — joined cf_categories may be object OR array. Always normalize.
type CatJoin = { type: 'receipt' | 'expense' | null };
function catTypeOf(row: any): 'receipt' | 'expense' | null {
  const c = row?.cf_categories;
  if (!c) return null;
  const obj: CatJoin | undefined = Array.isArray(c) ? c[0] : c;
  return obj?.type ?? null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawWeeks = parseInt(url.searchParams.get('weeks') || '26', 10);
  const weeks = [12, 26, 52].includes(rawWeeks) ? rawWeeks : 26;
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

  // ACTUALS — v0.5.5-c — adds transfer_pair_id IS NULL filter so paired transfers
  // (which net to zero across two bank accounts) don't count as income or expense.
  // matched_forecast_id IS NULL filter still applies — matched items are already
  // represented by their planned forecast row.
  const { data: actualItems, error: tErr } = await sb
    .from('cf_actual_items')
    .select('actual_date, amount, cf_categories(type)')
    .is('matched_forecast_id', null)
    .is('transfer_pair_id', null)
    .gte('actual_date', iso(weekWindowStart))
    .lte('actual_date', iso(end));

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  // BANK BALANCE ANCHORS — cf_weekly_actuals ground truth
  //
  // v0.5.7 — Filter out literal-zero anchors. A real bank balance of exactly $0
  // is vanishingly rare; in practice a 0.00 row is a half-saved Friday
  // reconciliation that never got a real number typed in. Letting those rows
  // win the priority order causes Actual to render $0 for the affected week,
  // which then poisons variance and the rolling opening for every later week.
  // The txn-net branch handles the rare legitimate-zero case correctly.
  const { data: actuals } = await sb
    .from('cf_weekly_actuals')
    .select('week_ending, actual_cash')
    .gte('week_ending', iso(start))
    .lte('week_ending', iso(end));

  const actualByWeek = new Map<string, number>();
  (actuals ?? []).forEach(a => {
    if (a.actual_cash != null && Number(a.actual_cash) !== 0) {
      actualByWeek.set(a.week_ending, Number(a.actual_cash));
    }
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

    let income = 0, expense = 0;
    (forecasts ?? []).forEach((f: any) => {
      const d = new Date(f.forecast_date + 'T00:00:00');
      if (d >= weekStart && d <= we) {
        const amt = Math.abs(Number(f.amount));
        const type = catTypeOf(f);
        if (type === 'receipt') income += amt;
        else if (type === 'expense') expense += amt;
      }
    });

    const net = income - expense;
    const projected_closing = rollingOpening + net;

    // v0.5.7 — hasTxns is only flipped when the row actually contributes to
    // txnNet (i.e. its category type resolved to receipt or expense). An
    // uncategorised row (category_id NULL, allowed by schema for QBO imports)
    // used to flip hasTxns true while contributing 0 to txnNet, which made
    // branch #2 fire and produce a misleading rollingOpening + 0 actual.
    let txnNet = 0;
    let hasTxns = false;
    (actualItems ?? []).forEach((t: any) => {
      const d = new Date(t.actual_date + 'T00:00:00');
      if (d >= weekStart && d <= we) {
        const amt = Math.abs(Number(t.amount));
        const type = catTypeOf(t);
        if (type === 'receipt') {
          txnNet += amt;
          hasTxns = true;
        } else if (type === 'expense') {
          txnNet -= amt;
          hasTxns = true;
        }
      }
    });

    // Actual priority: (1) bank-balance anchor from cf_weekly_actuals,
    // (2) rolling opening + txn net for the week, (3) null (renders as —).
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
