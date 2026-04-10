import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
export async function GET() {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const supabase = await createClient();
  const { data, error } = await supabase.from('cf_recurring_rules').select('*, cf_categories(name,kind)').order('created_at',{ascending:false});
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
export async function POST(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const body = await req.json();
  const supabase = await createClient();
  const { data, error } = await supabase.from('cf_recurring_rules').insert(body).select().single();
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
