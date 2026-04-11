import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';

// v0.5.5-a — single-entry DELETE rewired from cf_transactions to cf_actual_items.
// Hard delete is fine here: no real prod data, and cf_actual_items has no
// deleted_at column (verified against information_schema).

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden', { status: 403 }); }
  const { id } = await ctx.params;
  const supabase = createServiceClient();
  const { error } = await supabase.from('cf_actual_items').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
