import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
export async function GET() {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('cf_settings').select('*').maybeSingle();
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
export async function PUT(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const body = await req.json();
  const supabase = createServiceClient();
  const existing = await supabase.from('cf_settings').select('id').maybeSingle();
  const payload = { ...body, updated_at: new Date().toISOString() };
  const res = existing.data?.id
    ? await supabase.from('cf_settings').update(payload).eq('id', existing.data.id).select().single()
    : await supabase.from('cf_settings').insert(payload).select().single();
  if (res.error) return NextResponse.json({error:res.error.message},{status:500});
  return NextResponse.json(res.data);
}
