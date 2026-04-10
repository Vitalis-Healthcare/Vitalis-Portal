import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
export async function GET() {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('cf_transactions').select('*, cf_categories(name,kind)').order('txn_date',{ascending:false}).limit(200);
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
export async function POST(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const body = await req.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('cf_transactions').insert(body).select('*, cf_categories(name,kind)').single();
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
