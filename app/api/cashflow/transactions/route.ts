import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';

// v0.5.5-a — daybook now reads/writes cf_actual_items.
// cf_transactions is no longer touched here. It will be dropped in v0.5.7.

const JOINED_SELECT = '*, cf_categories(name,kind,type)';

export async function GET() {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden', { status: 403 }); }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('cf_actual_items')
    .select(JOINED_SELECT)
    .order('actual_date', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden', { status: 403 }); }
  const body = await req.json();

  // Whitelist — never pass-through `body`.
  const insert = {
    actual_date: body.actual_date,
    category_id: body.category_id ?? null,
    bank_account_id: body.bank_account_id,
    amount: Number(body.amount),
    description: body.description ?? null,
    reference: body.reference ?? null,
    source: 'manual' as const,
  };

  if (!insert.actual_date || !insert.bank_account_id || !Number.isFinite(insert.amount)) {
    return NextResponse.json({ error: 'actual_date, bank_account_id and amount are required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('cf_actual_items')
    .insert(insert)
    .select(JOINED_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
