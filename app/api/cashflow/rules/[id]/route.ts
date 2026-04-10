import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const { id } = await params;
  const body = await req.json();
  const supabase = await createClient();
  const { data, error } = await supabase.from('cf_recurring_rules').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from('cf_recurring_rules').delete().eq('id', id);
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ ok: true });
}
