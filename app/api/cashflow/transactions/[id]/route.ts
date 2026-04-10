import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from('cf_transactions').delete().eq('id', id);
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ ok: true });
}
