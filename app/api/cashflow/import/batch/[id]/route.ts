import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden', { status: 403 }); }
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'batch id required' }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('cf_actual_items')
    .delete()
    .eq('import_batch_id', id)
    .select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: data?.length ?? 0 });
}
