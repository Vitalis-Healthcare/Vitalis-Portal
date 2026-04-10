import { createServiceClient } from '@/lib/supabase/service';
import TransactionsClient from './TransactionsClient';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const supabase = createServiceClient();
  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase.from('cf_categories').select('*').order('kind').order('name'),
    supabase.from('cf_transactions').select('*, cf_categories(name,kind)').is('deleted_at', null).order('txn_date', { ascending: false }).limit(100),
  ]);
  return <TransactionsClient categories={categories || []} initialTransactions={transactions || []} />;
}
