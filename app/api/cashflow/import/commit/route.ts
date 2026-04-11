import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
import { randomUUID } from 'crypto';

type IncomingRow = {
  external_id: string;
  posted_date: string;
  amount: number;
  name?: string | null;
  memo?: string | null;
};

export async function POST(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden', { status: 403 }); }

  const body = await req.json();
  const bankAccountId = String(body?.bank_account_id ?? '');
  const categoryId = body?.category_id ? String(body.category_id) : null;
  const rows: IncomingRow[] = Array.isArray(body?.rows) ? body.rows : [];

  if (!bankAccountId) return NextResponse.json({ error: 'bank_account_id is required' }, { status: 400 });
  if (rows.length === 0) return NextResponse.json({ error: 'no rows to commit' }, { status: 400 });

  const batchId = randomUUID();

  // Whitelist every row — never pass through `body`.
  const inserts = rows.map(r => {
    // Compose description from name + memo, preferring memo when richer.
    const description = (r.memo && r.memo.length > (r.name?.length ?? 0)) ? r.memo : (r.name ?? r.memo ?? null);
    return {
      actual_date: String(r.posted_date),
      category_id: categoryId,
      bank_account_id: bankAccountId,
      amount: Number(r.amount),
      description,
      reference: null as string | null,
      source: 'import' as const,
      external_id: String(r.external_id),
      import_batch_id: batchId,
    };
  });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('cf_actual_items')
    .insert(inserts)
    .select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ batch_id: batchId, count: data?.length ?? 0 });
}
