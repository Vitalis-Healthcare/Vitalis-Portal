// Generates cf_forecast_items rows for a single cf_recurring_rules row.
// Pure function — caller is responsible for the DB insert.
// Horizon: 52 weeks from today, capped by rule.end_date if set.

export type Rule = {
  id: string;
  category_id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'annual' | 'one_time';
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  day_of_month: number | null;
};

export type ForecastItemInsert = {
  category_id: string;
  rule_id: string;
  forecast_date: string;
  amount: number;
  label: string;
  status: 'planned';
};

const HORIZON_DAYS = 52 * 7;

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

// Add months but clamp the day to the target month's last day (Feb 30 -> Feb 28/29).
function addMonthsClamped(d: Date, months: number, anchorDay: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const day = Math.min(anchorDay, lastDay);
  return new Date(Date.UTC(y, m, day));
}

export function generateForecastFromRule(rule: Rule): ForecastItemInsert[] {
  const today = parseYmd(ymd(new Date()));
  const horizonEnd = addDays(today, HORIZON_DAYS);
  const ruleEnd = rule.end_date ? parseYmd(rule.end_date) : null;
  const stopAt = ruleEnd && ruleEnd < horizonEnd ? ruleEnd : horizonEnd;
  const start = parseYmd(rule.start_date);

  const items: ForecastItemInsert[] = [];
  const push = (date: Date) => {
    if (date < start) return;
    if (date > stopAt) return;
    items.push({
      category_id: rule.category_id,
      rule_id: rule.id,
      forecast_date: ymd(date),
      amount: rule.amount,
      label: rule.name,
      status: 'planned',
    });
  };

  const SAFETY = 1000; // hard cap on iterations, never reachable in 52w

  if (rule.frequency === 'one_time') {
    push(start);
    return items;
  }

  if (rule.frequency === 'weekly' || rule.frequency === 'biweekly') {
    const step = rule.frequency === 'weekly' ? 7 : 14;
    let cur = new Date(start);
    for (let i = 0; i < SAFETY && cur <= stopAt; i++) {
      push(cur);
      cur = addDays(cur, step);
    }
    return items;
  }

  if (rule.frequency === 'semimonthly') {
    // 1st and 15th of every month from start month through stopAt month
    let y = start.getUTCFullYear();
    let m = start.getUTCMonth();
    for (let i = 0; i < SAFETY; i++) {
      const d1 = new Date(Date.UTC(y, m, 1));
      const d15 = new Date(Date.UTC(y, m, 15));
      if (d1 > stopAt && d15 > stopAt) break;
      push(d1);
      push(d15);
      m++;
      if (m > 11) { m = 0; y++; }
    }
    return items;
  }

  if (rule.frequency === 'monthly') {
    const anchorDay = rule.day_of_month ?? start.getUTCDate();
    let cur = addMonthsClamped(
      new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)),
      0,
      anchorDay,
    );
    // Walk forward until we're at or after start
    for (let i = 0; i < 24 && cur < start; i++) {
      cur = addMonthsClamped(cur, 1, anchorDay);
    }
    for (let i = 0; i < SAFETY && cur <= stopAt; i++) {
      push(cur);
      cur = addMonthsClamped(cur, 1, anchorDay);
    }
    return items;
  }

  if (rule.frequency === 'quarterly') {
    const anchorDay = rule.day_of_month ?? start.getUTCDate();
    let cur = new Date(start);
    for (let i = 0; i < SAFETY && cur <= stopAt; i++) {
      push(cur);
      cur = addMonthsClamped(cur, 3, anchorDay);
    }
    return items;
  }

  if (rule.frequency === 'annual') {
    let cur = new Date(start);
    for (let i = 0; i < SAFETY && cur <= stopAt; i++) {
      push(cur);
      cur = new Date(Date.UTC(cur.getUTCFullYear() + 1, cur.getUTCMonth(), cur.getUTCDate()));
    }
    return items;
  }

  return items;
}
