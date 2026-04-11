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

// v0.5.5-c — accepts transfer_pair_targets: map of external_id -> existing actual_item id.
// For each entry, after the bulk insert succeeds, we generate a fresh UUID and write it to
// transfer_pair_id on BOTH sides (the newly-inserted row AND the targeted existing row).

export async function POST(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden', { status: 403 }); }

  const body = await req.json();
  const bankAccountId = String(body?.bank_account_id ?? '');
  const categoryId = body?.category_id ? String(body.category_id) : null;
  const rows: IncomingRow[] = Array.isArray(body?.rows) ? body.rows : [];
  const transferPairTargets: Record<string, string> =
    (body?.transfer_pair_targets && typeof body.transfer_pair_targets === 'object')
      ? body.transfer_pair_targets
      : {};

  if (!bankAccountId) return NextResponse.json({ error: 'bank_account_id is required' }, { status: 400 });
  if (rows.length === 0) return NextResponse.json({ error: 'no rows to commit' }, { status: 400 });

  const batchId = randomUUID();

  // Whitelist every row — never pass through `body`.
  const inserts = rows.map(r => {
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
  const { data: inserted, error } = await supabase
    .from('cf_actual_items')
    .insert(inserts)
    .select('id, external_id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pair confirmed transfers. We do this AFTER the insert succeeds so a pairing
  // failure cannot prevent the import from landing. Any orphan-half pairs can be
  // detected later by querying transfer_pair_id IS NULL on candidate rows.
  let pairedCount = 0;
  if (inserted && inserted.length > 0 && Object.keys(transferPairTargets).length > 0) {
    // Build external_id -> inserted_id lookup.
    const insertedByExternal = new Map<string, string>();
    for (const row of inserted) {
      if (row.external_id) insertedByExternal.set(row.external_id, row.id);
    }

    for (const [externalId, targetId] of Object.entries(transferPairTargets)) {
      const newRowId = insertedByExternal.get(externalId);
      if (!newRowId || !targetId) continue;
      const pairId = randomUUID();
      // Set transfer_pair_id on the new row.
      const { error: e1 } = await supabase
        .from('cf_actual_items')
        .update({ transfer_pair_id: pairId })
        .eq('id', newRowId);
      if (e1) continue;
      // Set transfer_pair_id on the target row, only if it's still unpaired
      // (defensive — prevents stomping a pair created by a concurrent import).
      const { error: e2 } = await supabase
        .from('cf_actual_items')
        .update({ transfer_pair_id: pairId })
        .eq('id', targetId)
        .is('transfer_pair_id', null);
      if (e2) continue;
      pairedCount += 1;
    }
  }

  return NextResponse.json({
    batch_id: batchId,
    count: inserted?.length ?? 0,
    paired: pairedCount,
  });
}
