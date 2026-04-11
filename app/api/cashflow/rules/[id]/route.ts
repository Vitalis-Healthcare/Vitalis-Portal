import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
import { generateForecastFromRule, type Rule } from '@/lib/cashflow/generate-forecast-from-rule';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden', { status: 403 }); }
  const { id } = await params;
  const body = await req.json();

  const updateRow: Record<string, unknown> = {};
  for (const k of ['category_id', 'name', 'amount', 'frequency', 'start_date', 'end_date', 'day_of_month', 'is_active'] as const) {
    if (k in body) updateRow[k] = body[k];
  }
  updateRow.updated_at = new Date().toISOString();

  const supabase = createServiceClient();
  const { data: updated, error } = await supabase
    .from('cf_recurring_rules')
    .update(updateRow)
    .eq('id', id)
    .select('*, cf_categories(name,kind,type)')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Regenerate: delete future un-matched forecast items for this rule, then re-insert
  const today = new Date().toISOString().slice(0, 10);
  const { error: delErr } = await supabase
    .from('cf_forecast_items')
    .delete()
    .eq('rule_id', id)
    .gte('forecast_date', today)
    .neq('status', 'matched');
  if (delErr) return NextResponse.json({ error: `Update saved but cleanup failed: ${delErr.message}` }, { status: 500 });

  const items = generateForecastFromRule(updated as Rule).filter(i => i.forecast_date >= today);
  if (items.length > 0) {
    const { error: genErr } = await supabase.from('cf_forecast_items').insert(items);
    if (genErr) return NextResponse.json({ error: `Update saved but regeneration failed: ${genErr.message}` }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden', { status: 403 }); }
  const { id } = await params;
  const supabase = createServiceClient();

  // Delete future un-matched forecast items first (preserves matched history)
  const today = new Date().toISOString().slice(0, 10);
  await supabase
    .from('cf_forecast_items')
    .delete()
    .eq('rule_id', id)
    .gte('forecast_date', today)
    .neq('status', 'matched');

  const { error } = await supabase.from('cf_recurring_rules').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
