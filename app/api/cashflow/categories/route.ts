import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
export async function GET() {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const supabase = await createClient();
  const { data, error } = await supabase.from('cf_categories').select('*').order('kind').order('sort_order');
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
