import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// Postgres dow: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// If week_start_dow = 6 (Saturday), then week ends on Friday (dow=5).
// week_end_dow = (week_start_dow + 6) % 7
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
  const weeks = Math.min(Math.max(parseInt(url.searchParams.get('weeks') || '12', 10), 4), 52);
  const sb = createServiceClient();

  // Settings — use correct column names
  const { data: settings } = await sb
    .from('cf_settings')
    .select('opening_cash, opening_date, week_start_dow')
    .limit(1)
    .single();

  const seedOpening = Number(settings?.opening_cash ?? 0);
  const startDow = settings?.week_start_dow ?? 6; // default Saturday → Friday end
  const endDow = weekEndDow(startDow);
  const endDayName = DAY_NAMES[endDow];

  // Build window: 4 past + (weeks-4) future, all ending on endDow
  const today = new Date();
  const thisWeekEnd = weekEndingOf(today, endDow);
  const start = addDays(thisWeekEnd, -7 * 4);
  const end = addDays(thisWeekEnd, 7 * (weeks - 4));

  // Transactions with category joined for type (receipt/expense)
  const { data: txns, error: txnErr } = await sb
    .from('cf_transactions')
    .select('txn_date, amount, category_id, cf_categories(type, kind)')
    .is('deleted_at', null)
    .gte('txn_date', iso(start))
    .lte('txn_date', iso(end));

  if (txnErr) {
    return NextResponse.json({ error: txnErr.message }, { status: 500 });
  }

  // Actuals
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

    let income = 0, expense = 0;
    (txns ?? []).forEach((t: any) => {
      const d = new Date(t.txn_date);
      if (d >= weekStart && d <= we) {
        const amt = Number(t.amount);
        const type = t.cf_categories?.type;
        if (type === 'receipt') income += amt;
        else if (type === 'expense') expense += amt;
      }
    });

    const net = income - expense;
    const projected_closing = rollingOpening + net;
    const actual_closing = actualByWeek.has(weStr) ? actualByWeek.get(weStr)! : null;
    const variance = actual_closing != null ? actual_closing - projected_closing : null;

    rows.push({
      week_ending: weStr,
      opening: rollingOpening,
      income, expense, net,
      projected_closing,
      actual_closing,
      variance,
    });

    // Cascade: actual re-anchors next opening
    rollingOpening = actual_closing != null ? actual_closing : projected_closing;
  }

  const todayIso = iso(today);
  const defaultActualWeek =
    rows.filter(r => r.week_ending <= todayIso && r.actual_closing == null)
        .map(r => r.week_ending)
        .pop() || iso(thisWeekEnd);

  return NextResponse.json({
    rows,
    defaultActualWeek,
    weekEndDayName: endDayName,
    openingCash: seedOpening,
  });
}
