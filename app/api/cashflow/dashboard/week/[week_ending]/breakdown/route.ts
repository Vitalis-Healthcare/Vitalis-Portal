import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// Pitfall #7 — joined cf_categories may be object OR array. Always normalize.
type CatJoin = { id: string; name: string; type: 'receipt' | 'expense' | null };
function catOf(row: any): CatJoin | null {
  const c = row?.cf_categories;
  if (!c) return null;
  const obj = Array.isArray(c) ? c[0] : c;
  return obj ?? null;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

type LineForecast = {
  id: string;
  label: string | null;
  amount: number;
  status: string;
  matched_actual_id: string | null;
};

type LineActual = {
  id: string;
  description: string | null;
  amount: number;
};

type CategoryBucket = {
  category_id: string | null;
  name: string;
  type: 'receipt' | 'expense' | 'uncategorised';
  projected: number;
  actual: number;
  variance: number;
  forecast_items: LineForecast[];
  actual_items: LineActual[];
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ week_ending: string }> }
) {
  const { week_ending } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(week_ending)) {
    return NextResponse.json({ error: 'Invalid week_ending format' }, { status: 400 });
  }

  const sb = createServiceClient();
  const weekStart = addDays(week_ending, -6);

  // PROJECTIONS — same filter as dashboard endpoint
  const { data: forecasts, error: fErr } = await sb
    .from('cf_forecast_items')
    .select('id, forecast_date, amount, label, status, matched_actual_id, cf_categories(id, name, type)')
    .neq('status', 'cancelled')
    .gte('forecast_date', weekStart)
    .lte('forecast_date', week_ending);

  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });

  // ACTUALS — same filter as dashboard endpoint (pitfall #11):
  // matched_forecast_id IS NULL AND transfer_pair_id IS NULL
  const { data: actuals, error: aErr } = await sb
    .from('cf_actual_items')
    .select('id, actual_date, amount, description, cf_categories(id, name, type)')
    .is('matched_forecast_id', null)
    .is('transfer_pair_id', null)
    .gte('actual_date', weekStart)
    .lte('actual_date', week_ending);

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  // Bucket by category_id. Uncategorised actuals go in a synthetic bucket.
  const buckets = new Map<string, CategoryBucket>();
  const UNCAT_KEY = '__uncategorised__';

  function ensure(key: string, name: string, type: CategoryBucket['type'], category_id: string | null): CategoryBucket {
    let b = buckets.get(key);
    if (!b) {
      b = {
        category_id,
        name,
        type,
        projected: 0,
        actual: 0,
        variance: 0,
        forecast_items: [],
        actual_items: [],
      };
      buckets.set(key, b);
    }
    return b;
  }

  (forecasts ?? []).forEach((f: any) => {
    const cat = catOf(f);
    if (!cat || !cat.type) return; // forecast items without a category type are skipped (shouldn't exist — category_id is NOT NULL on cf_forecast_items)
    const b = ensure(cat.id, cat.name, cat.type, cat.id);
    const amt = Math.abs(Number(f.amount));
    b.projected += amt;
    b.forecast_items.push({
      id: f.id,
      label: f.label,
      amount: amt,
      status: f.status,
      matched_actual_id: f.matched_actual_id,
    });
  });

  (actuals ?? []).forEach((a: any) => {
    const cat = catOf(a);
    const amt = Math.abs(Number(a.amount));
    if (!cat || !cat.type) {
      const b = ensure(UNCAT_KEY, 'Uncategorised', 'uncategorised', null);
      b.actual += amt; // uncategorised — no sign assumption, raw absolute
      b.actual_items.push({ id: a.id, description: a.description, amount: amt });
      return;
    }
    const b = ensure(cat.id, cat.name, cat.type, cat.id);
    b.actual += amt;
    b.actual_items.push({ id: a.id, description: a.description, amount: amt });
  });

  // Compute variance per bucket. Hide categories where both projected and actual are zero.
  const all = Array.from(buckets.values())
    .map(b => ({ ...b, variance: b.actual - b.projected }))
    .filter(b => !(b.projected === 0 && b.actual === 0));

  // Sort: income block (receipt) first, then expense, then uncategorised. Within each, abs(variance) desc.
  const order = (t: CategoryBucket['type']) => (t === 'receipt' ? 0 : t === 'expense' ? 1 : 2);
  all.sort((x, y) => {
    const o = order(x.type) - order(y.type);
    if (o !== 0) return o;
    return Math.abs(y.variance) - Math.abs(x.variance);
  });

  return NextResponse.json({
    week_ending,
    week_start: weekStart,
    categories: all,
  });
}
