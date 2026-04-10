import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
export async function GET() {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('cf_weekly_actuals').select('*').order('week_ending');
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
export async function POST(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const body = await req.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('cf_weekly_actuals').upsert(body, { onConflict: 'week_ending' }).select().single();
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
