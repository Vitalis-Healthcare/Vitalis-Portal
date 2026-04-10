import { createClient } from '@/lib/supabase/server';
import TransactionsClient from './TransactionsClient';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase.from('cf_categories').select('*').order('kind').order('name'),
    supabase.from('cf_transactions').select('*, cf_categories(name,kind)').order('txn_date', { ascending: false }).limit(100),
  ]);
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Actual Transactions</h1>
      <p className="text-sm text-gray-500 mb-6">Record actual cash in/out to refine the forecast.</p>
      <TransactionsClient categories={categories || []} initialTransactions={transactions || []} />
    </div>
  );
}
