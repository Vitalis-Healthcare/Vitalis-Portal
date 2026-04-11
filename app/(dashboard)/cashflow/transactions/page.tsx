import { createServiceClient } from '@/lib/supabase/service';
import { requireCashflowAdmin } from '@/lib/cashflow/auth';
import TransactionsClient from './TransactionsClient';

// v0.5.5-a — server-side fetch rewired to cf_actual_items.
// JOINED_SELECT must match the route handler's select shape (pitfall #9).
const JOINED_SELECT = '*, cf_categories(name,kind,type)';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireCashflowAdmin();
  const sb = createServiceClient();

  const [catsRes, txnsRes, banksRes] = await Promise.all([
    sb.from('cf_categories').select('id,name,kind,type').is('deleted_at', null).order('name'),
    sb.from('cf_actual_items').select(JOINED_SELECT).order('actual_date', { ascending: false }).limit(200),
    sb.from('cf_bank_accounts').select('id,name,is_active').eq('is_active', true).order('name'),
  ]);

  const categories = (catsRes.data ?? []) as any[];
  const initialTransactions = (txnsRes.data ?? []) as any[];
  // Hide "Legacy (pre-v0.5)" buckets from new-entry dropdown — keep them in the DB for old data.
  const bankAccounts = (banksRes.data ?? []).filter(
    (b: any) => !String(b.name).toLowerCase().startsWith('legacy')
  );

  return (
    <TransactionsClient
      categories={categories}
      initialTransactions={initialTransactions}
      bankAccounts={bankAccounts}
    />
  );
}
