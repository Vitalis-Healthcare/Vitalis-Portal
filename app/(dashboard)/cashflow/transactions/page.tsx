import { createServiceClient } from '@/lib/supabase/service';
import { requireCashflowAdmin } from '@/lib/cashflow/auth';
import TransactionsClient from './TransactionsClient';

// v0.5.5-a-2 — JOINED_SELECT and source filter MUST mirror the route handler exactly (pitfall #9).
const JOINED_SELECT = '*, cf_categories(name,kind,type), cf_bank_accounts(id,short_code,name)';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireCashflowAdmin();
  const sb = createServiceClient();

  const [catsRes, txnsRes, banksRes] = await Promise.all([
    // cf_categories has NO deleted_at column — use is_active. Order by sort_order.
    sb.from('cf_categories')
      .select('id,name,kind,type')
      .eq('is_active', true)
      .order('sort_order'),
    sb.from('cf_actual_items')
      .select(JOINED_SELECT)
      .eq('source', 'manual')
      .order('actual_date', { ascending: false })
      .limit(200),
    sb.from('cf_bank_accounts')
      .select('id,short_code,name,is_active')
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  const categories = (catsRes.data ?? []) as any[];
  const initialTransactions = (txnsRes.data ?? []) as any[];
  // Hide LEGACY from new-entry dropdown — filter by short_code, the real sentinel.
  const bankAccounts = (banksRes.data ?? []).filter(
    (b: any) => b.short_code !== 'LEGACY'
  );

  return (
    <TransactionsClient
      categories={categories}
      initialTransactions={initialTransactions}
      bankAccounts={bankAccounts}
    />
  );
}
