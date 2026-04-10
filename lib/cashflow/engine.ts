import type { CfRule, CfTransaction, CfSettings, WeekRow, Forecast } from './types';

const DAY_MS = 86400000;
const toDate = (s: string) => new Date(s + 'T00:00:00Z');
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);

export function weekEnding(d: Date, weekStartDow: number): Date {
  // week_ending = last day of the week (day before next week start)
  const dow = d.getUTCDay();
  const daysUntilEnd = (weekStartDow + 6 - dow + 7) % 7;
  return addDays(d, daysUntilEnd);
}

export function generateRuleDates(rule: CfRule, from: Date, to: Date): Date[] {
  if (!rule.active) return [];
  const out: Date[] = [];
  const start = toDate(rule.start_date);
  const end = rule.end_date ? toDate(rule.end_date) : to;
  const lo = start > from ? start : from;
  const hi = end < to ? end : to;

  const pushIf = (d: Date) => { if (d >= lo && d <= hi) out.push(new Date(d)); };

  switch (rule.frequency) {
    case 'one_time': pushIf(start); break;
    case 'weekly':
      for (let d = new Date(start); d <= hi; d = addDays(d, 7)) pushIf(d); break;
    case 'biweekly':
      for (let d = new Date(start); d <= hi; d = addDays(d, 14)) pushIf(d); break;
    case 'semimonthly': {
      const d1 = rule.day_of_month || 1;
      const d2 = Math.min(d1 + 15, 28);
      for (let y = lo.getUTCFullYear(); y <= hi.getUTCFullYear(); y++)
        for (let m = 0; m < 12; m++) {
          pushIf(new Date(Date.UTC(y, m, d1)));
          pushIf(new Date(Date.UTC(y, m, d2)));
        }
      break;
    }
    case 'monthly': {
      const dom = rule.day_of_month || start.getUTCDate();
      for (let y = lo.getUTCFullYear(); y <= hi.getUTCFullYear(); y++)
        for (let m = 0; m < 12; m++) pushIf(new Date(Date.UTC(y, m, dom)));
      break;
    }
    case 'quarterly': {
      const dom = rule.day_of_month || start.getUTCDate();
      for (let d = new Date(start); d <= hi; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 3, dom))) pushIf(d);
      break;
    }
    case 'annual':
      for (let y = start.getUTCFullYear(); y <= hi.getUTCFullYear(); y++)
        pushIf(new Date(Date.UTC(y, start.getUTCMonth(), start.getUTCDate())));
      break;
  }
  return out;
}

export function buildForecast(
  settings: CfSettings,
  rules: CfRule[],
  categoriesById: Record<string, { kind: 'income' | 'expense' }>,
  transactions: CfTransaction[],
  weeks: number
): Forecast {
  const start = toDate(settings.opening_date);
  const end = addDays(start, weeks * 7 + 7);
  const rows: Record<string, WeekRow> = {};

  const keyFor = (d: Date) => iso(weekEnding(d, settings.week_start_dow));
  const ensure = (k: string): WeekRow => {
    if (!rows[k]) rows[k] = { week_ending: k, income: 0, expense: 0, net: 0, opening: 0, closing: 0, below_alert: false };
    return rows[k];
  };

  for (let i = 0; i < weeks; i++) {
    const d = addDays(start, i * 7);
    ensure(keyFor(d));
  }

  for (const r of rules) {
    const kind = categoriesById[r.category_id]?.kind;
    if (!kind) continue;
    for (const d of generateRuleDates(r, start, end)) {
      const row = ensure(keyFor(d));
      if (kind === 'income') row.income += Number(r.amount);
      else row.expense += Number(r.amount);
    }
  }

  // Overlay actual transactions (replace forecast within same week)
  for (const t of transactions) {
    const kind = categoriesById[t.category_id]?.kind;
    if (!kind) continue;
    const d = toDate(t.txn_date);
    if (d < start || d > end) continue;
    const row = ensure(keyFor(d));
    if (kind === 'income') row.income += Number(t.amount);
    else row.expense += Number(t.amount);
  }

  const sorted = Object.values(rows).sort((a, b) => a.week_ending.localeCompare(b.week_ending));
  let running = Number(settings.opening_cash);
  for (const r of sorted) {
    r.opening = running;
    r.net = r.income - r.expense;
    r.closing = r.opening + r.net;
    r.below_alert = r.closing < Number(settings.min_cash_alert);
    running = r.closing;
  }

  return { weeks: sorted.slice(0, weeks), kpis: calculateKPIs(sorted.slice(0, weeks), Number(settings.opening_cash)) };
}

export function calculateKPIs(weeks: WeekRow[], currentCash: number) {
  let lowest = Infinity, lowestWeek: string | null = null, ti = 0, te = 0;
  for (const w of weeks) {
    ti += w.income; te += w.expense;
    if (w.closing < lowest) { lowest = w.closing; lowestWeek = w.week_ending; }
  }
  return { current_cash: currentCash, total_income: ti, total_expense: te, lowest_cash: lowest === Infinity ? currentCash : lowest, lowest_week: lowestWeek };
}
