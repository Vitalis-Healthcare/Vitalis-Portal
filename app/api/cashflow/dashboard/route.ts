import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// Helpers
function fridayOf(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay(); // 0=Sun..6=Sat
  const diff = (5 - day + 7) % 7; // days until Friday
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}
function iso(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

// GET /api/cashflow/dashboard?weeks=12
// Returns weeks of data with variance cascade applied.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const weeks = Math.min(Math.max(parseInt(url.searchParams.get('weeks') || '12', 10), 4), 52);
  const sb = createServiceClient();

  // Build window: 4 past + (weeks-4) future, all Fridays
  const today = new Date();
  const thisFriday = fridayOf(today);
  const start = addDays(thisFriday, -7 * 4);
  const end = addDays(thisFriday, 7 * (weeks - 4));

  // Pull settings for opening balance
  const { data: settings } = await sb.from('cf_settings').select('*').limit(1).single();
  const seedOpening = Number(settings?.opening_balance ?? 0);
  const seedDate = settings?.opening_date ? new Date(settings.opening_date) : start;

  // Pull active transactions in window
  const { data: txns } = await sb
    .from('cf_transactions')
    .select('*')
    .is('deleted_at', null)
    .gte('txn_date', iso(start))
    .lte('txn_date', iso(end));

  // Pull actuals in window
  const { data: actuals } = await sb
    .from('cf_weekly_actuals')
    .select('*')
    .gte('week_ending', iso(start))
    .lte('week_ending', iso(end));

  const actualByWeek = new Map<string, number>();
  (actuals ?? []).forEach(a => {
    if (a.actual_closing != null) actualByWeek.set(a.week_ending, Number(a.actual_closing));
  });

  // Bucket transactions by week-ending Friday
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
  const seedWeekEnding = fridayOf(seedDate);

  for (let i = 0; i < weeks; i++) {
    const we = addDays(start, 7 * i + 4); // Friday of week i (start is a Friday)
    const weStr = iso(we);
    const weekStart = addDays(we, -6);

    let income = 0, expense = 0;
    (txns ?? []).forEach(t => {
      const d = new Date(t.txn_date);
      if (d >= weekStart && d <= we) {
        const amt = Number(t.amount);
        if (t.type === 'receipt') income += amt;
        else expense += amt;
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

    // CASCADE: if this week has an actual, next week opens at the actual.
    // Otherwise next week opens at the projected closing.
    rollingOpening = actual_closing != null ? actual_closing : projected_closing;
  }

  // Find most recent week_ending without an actual (for the input default)
  const todayIso = iso(today);
  const defaultActualWeek =
    rows.filter(r => r.week_ending <= todayIso && r.actual_closing == null)
        .map(r => r.week_ending)
        .pop() || iso(thisFriday);

  return NextResponse.json({ rows, defaultActualWeek });
}
